import json

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pywebpush import webpush, WebPushException

from auth import get_current_user
from config import get_settings
from database import get_db
from models.db import PushSubscription, Task, TripMember
from routers.guards import parse_uuid, require_preferences_submitted, require_user_is_trip_member_user
from routers.stream import publish

router = APIRouter()
settings = get_settings()


class TaskCreate(BaseModel):
    title: str
    category: str  # flights | accommodation | food | transport | activities | documents | other
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[str] = None  # todo | in_progress | done
    due_date: Optional[date] = None


@router.post("/{trip_id}/tasks", status_code=201)
async def create_task(
    trip_id: str,
    body: TaskCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = parse_uuid(trip_id, "trip_id")
    await require_preferences_submitted(db, trip_uuid, user.id)

    if body.assigned_to:
        await require_user_is_trip_member_user(db, trip_uuid, parse_uuid(body.assigned_to, "assigned_to"))

    task = Task(
        trip_id=trip_uuid,
        title=body.title,
        category=body.category,
        assigned_to=parse_uuid(body.assigned_to, "assigned_to") if body.assigned_to else None,
        due_date=body.due_date,
    )
    db.add(task)
    await db.flush()
    return {"id": str(task.id)}


@router.get("/{trip_id}/tasks")
async def list_tasks(
    trip_id: str,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = parse_uuid(trip_id, "trip_id")
    await require_preferences_submitted(db, trip_uuid, user.id)

    query = select(Task).where(Task.trip_id == trip_uuid)
    if status:
        query = query.where(Task.status == status)
    if assigned_to:
        query = query.where(Task.assigned_to == parse_uuid(assigned_to, "assigned_to"))
    result = await db.execute(query)
    tasks = result.scalars().all()
    return [
        {
            "id": str(task.id),
            "title": task.title,
            "category": task.category,
            "assigned_to": str(task.assigned_to) if task.assigned_to else None,
            "status": task.status,
            "due_date": task.due_date,
        }
        for task in tasks
    ]


@router.put("/{trip_id}/tasks/{task_id}")
async def update_task(
    trip_id: str,
    task_id: str,
    body: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = parse_uuid(trip_id, "trip_id")
    await require_preferences_submitted(db, trip_uuid, user.id)

    task_uuid = parse_uuid(task_id, "task_id")
    result = await db.execute(select(Task).where(Task.id == task_uuid, Task.trip_id == trip_uuid))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if body.assigned_to is not None:
        await require_user_is_trip_member_user(db, trip_uuid, parse_uuid(body.assigned_to, "assigned_to"))

    if body.title is not None:
        task.title = body.title
    if body.category is not None:
        task.category = body.category
    if body.assigned_to is not None:
        task.assigned_to = parse_uuid(body.assigned_to, "assigned_to")
    if body.status is not None:
        task.status = body.status
        if body.status == "done":
            await publish(trip_id, "task_completed", {"task_id": str(task.id), "title": task.title, "completed_by": str(user.id)})
    if body.due_date is not None:
        task.due_date = body.due_date

    return {"status": "updated"}


@router.post("/{trip_id}/tasks/{task_id}/nudge", status_code=204)
async def nudge_assignee(
    trip_id: str,
    task_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = parse_uuid(trip_id, "trip_id")
    await require_preferences_submitted(db, trip_uuid, user.id)

    task_uuid = parse_uuid(task_id, "task_id")
    result = await db.execute(select(Task).where(Task.id == task_uuid, Task.trip_id == trip_uuid))
    task = result.scalar_one_or_none()
    if task is None or task.assigned_to is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task or assignee not found")

    subs_result = await db.execute(
        select(PushSubscription).where(
            PushSubscription.trip_id == trip_uuid,
            PushSubscription.user_id == task.assigned_to,
        )
    )
    sub = subs_result.scalar_one_or_none()
    if sub is None:
        return

    if not settings.vapid_private_key or not settings.vapid_claims_email:
        return

    payload = json.dumps({"title": "Task Reminder", "body": task.title})
    try:
        webpush(
            subscription_info=sub.raw,
            data=payload,
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": f"mailto:{settings.vapid_claims_email}"},
        )
    except WebPushException:
        pass
