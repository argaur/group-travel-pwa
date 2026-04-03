import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Any, Optional
from datetime import time
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.db import ItineraryComment, ItineraryItem, User
from routers.guards import require_organizer, require_preferences_submitted, require_user_is_trip_member_user
from services.ai import suggest_itinerary

router = APIRouter()

# Demo fallback when AI is unavailable
SAMPLE_AI_ITINERARY: dict[str, Any] = {
    "day_summary": "A relaxed pace balancing one cultural block and downtime.",
    "blocks": [
        {
            "slot": "morning",
            "title": "Local breakfast + waterfront walk",
            "location": "Old quarter",
            "estimated_duration": "2h",
            "cost_estimate_inr": 400,
            "why_it_fits": "Easy start; works for mixed energy levels.",
        },
        {
            "slot": "afternoon",
            "title": "Museum or café hop (pick one)",
            "location": "Central district",
            "estimated_duration": "3h",
            "cost_estimate_inr": 800,
            "why_it_fits": "Optional split without losing the group thread.",
        },
        {
            "slot": "evening",
            "title": "Shared dinner — veg-forward options nearby",
            "location": "Market street",
            "estimated_duration": "2h",
            "cost_estimate_inr": 1200,
            "why_it_fits": "Aligns with typical dietary spread in group polls.",
        },
    ],
    "source": "sample",
}


class ItineraryItemCreate(BaseModel):
    title: str
    location: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    cost_estimate: Optional[int] = None  # in paise
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    sub_group: Optional[str] = None


class AISuggestRequest(BaseModel):
    day_number: int
    destination: str
    context: Optional[str] = None


class CommentCreate(BaseModel):
    body: str


@router.get("/{trip_id}/itinerary")
async def get_itinerary(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    await require_preferences_submitted(db, trip_uuid, user.id)

    result = await db.execute(select(ItineraryItem).where(ItineraryItem.trip_id == trip_uuid))
    items = result.scalars().all()
    return [
        {
            "id": str(item.id),
            "day_number": item.day_number,
            "title": item.title,
            "location": item.location,
            "start_time": item.start_time,
            "end_time": item.end_time,
            "cost_estimate": item.cost_estimate,
            "notes": item.notes,
            "assigned_to": str(item.assigned_to) if item.assigned_to else None,
            "sub_group": item.sub_group,
        }
        for item in items
    ]


@router.post("/{trip_id}/itinerary/days/{day}/items", status_code=201)
async def add_itinerary_item(
    trip_id: str,
    day: int,
    body: ItineraryItemCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    await require_preferences_submitted(db, trip_uuid, user.id)
    await require_organizer(db, trip_uuid, user.id)

    if body.assigned_to:
        await require_user_is_trip_member_user(db, trip_uuid, uuid.UUID(body.assigned_to))

    item = ItineraryItem(
        trip_id=trip_uuid,
        day_number=day,
        title=body.title,
        location=body.location,
        start_time=body.start_time,
        end_time=body.end_time,
        cost_estimate=body.cost_estimate,
        notes=body.notes,
        assigned_to=uuid.UUID(body.assigned_to) if body.assigned_to else None,
        sub_group=body.sub_group,
    )
    db.add(item)
    await db.flush()
    return {"id": str(item.id)}


@router.put("/{trip_id}/itinerary/days/{day}/items/{item_id}")
async def update_itinerary_item(
    trip_id: str,
    day: int,
    item_id: str,
    body: ItineraryItemCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    await require_preferences_submitted(db, trip_uuid, user.id)
    await require_organizer(db, trip_uuid, user.id)

    if body.assigned_to:
        await require_user_is_trip_member_user(db, trip_uuid, uuid.UUID(body.assigned_to))

    item_uuid = uuid.UUID(item_id)
    result = await db.execute(
        select(ItineraryItem).where(
            ItineraryItem.id == item_uuid,
            ItineraryItem.trip_id == trip_uuid,
            ItineraryItem.day_number == day,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    item.title = body.title
    item.location = body.location
    item.start_time = body.start_time
    item.end_time = body.end_time
    item.cost_estimate = body.cost_estimate
    item.notes = body.notes
    item.assigned_to = uuid.UUID(body.assigned_to) if body.assigned_to else None
    item.sub_group = body.sub_group

    return {"status": "updated"}


@router.post("/{trip_id}/itinerary/ai-suggest")
async def ai_suggest_itinerary(
    trip_id: str,
    body: AISuggestRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    await require_organizer(db, trip_uuid, user.id)
    await require_preferences_submitted(db, trip_uuid, user.id)

    ctx = body.context or "Group leisure trip; balance food sensitivities and downtime."
    try:
        raw = await suggest_itinerary(body.day_number, body.destination, ctx)
        if isinstance(raw, dict) and raw.get("raw"):
            out = {**SAMPLE_AI_ITINERARY, "note": "AI returned unstructured text; showing sample layout."}
            out["source"] = "sample"
            return {"suggested": out, "source": "sample_fallback"}
        if isinstance(raw, dict):
            raw["source"] = "ai"
            return {"suggested": raw, "source": "ai"}
    except Exception:
        pass
    return {"suggested": SAMPLE_AI_ITINERARY, "source": "sample"}


@router.get("/{trip_id}/itinerary/items/{item_id}/comments")
async def list_itinerary_comments(
    trip_id: str,
    item_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    await require_preferences_submitted(db, trip_uuid, user.id)

    item_uuid = uuid.UUID(item_id)
    item_row = await db.execute(
        select(ItineraryItem).where(ItineraryItem.id == item_uuid, ItineraryItem.trip_id == trip_uuid)
    )
    if item_row.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    q = await db.execute(
        select(ItineraryComment, User)
        .join(User, ItineraryComment.user_id == User.id)
        .where(ItineraryComment.itinerary_item_id == item_uuid)
        .order_by(ItineraryComment.created_at)
    )
    rows = q.all()
    return [
        {
            "id": str(c.id),
            "body": c.body,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "user": {"id": str(u.id), "name": u.name, "avatar_url": u.avatar_url},
        }
        for c, u in rows
    ]


@router.post("/{trip_id}/itinerary/items/{item_id}/comments", status_code=201)
async def add_itinerary_comment(
    trip_id: str,
    item_id: str,
    body: CommentCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    await require_preferences_submitted(db, trip_uuid, user.id)

    item_uuid = uuid.UUID(item_id)
    item_row = await db.execute(
        select(ItineraryItem).where(ItineraryItem.id == item_uuid, ItineraryItem.trip_id == trip_uuid)
    )
    if item_row.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    c = ItineraryComment(
        trip_id=trip_uuid,
        itinerary_item_id=item_uuid,
        user_id=user.id,
        body=body.body.strip(),
    )
    if not c.body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty comment")
    db.add(c)
    await db.flush()
    return {"id": str(c.id)}
