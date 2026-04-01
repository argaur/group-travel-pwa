from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter()


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
async def create_task(trip_id: str, body: TaskCreate):
    raise NotImplementedError


@router.get("/{trip_id}/tasks")
async def list_tasks(trip_id: str, status: Optional[str] = None, assigned_to: Optional[str] = None):
    raise NotImplementedError


@router.put("/{trip_id}/tasks/{task_id}")
async def update_task(trip_id: str, task_id: str, body: TaskUpdate):
    raise NotImplementedError


@router.post("/{trip_id}/tasks/{task_id}/nudge", status_code=204)
async def nudge_assignee(trip_id: str, task_id: str):
    # TODO: send Web Push notification to assigned member via pywebpush
    raise NotImplementedError
