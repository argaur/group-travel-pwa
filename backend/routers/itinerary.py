import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import time
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.db import ItineraryItem, TripMember

router = APIRouter()


class ItineraryItemCreate(BaseModel):
    title: str
    location: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    cost_estimate: Optional[int] = None  # in paise
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    sub_group: Optional[str] = None  # for V2 sub-group planning


class AISuggestRequest(BaseModel):
    day_number: int
    destination: str
    context: Optional[str] = None  # e.g. "family with 2 kids, prefer relaxed pace"


@router.get("/{trip_id}/itinerary")
async def get_itinerary(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    membership = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    if membership.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

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
    membership = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    if membership.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

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
    membership = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    if membership.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

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
async def ai_suggest_itinerary(trip_id: str, body: AISuggestRequest):
    # TODO: call services/ai.py suggest_itinerary()
    raise NotImplementedError
