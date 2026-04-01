from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import time

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
async def get_itinerary(trip_id: str):
    raise NotImplementedError


@router.post("/{trip_id}/itinerary/days/{day}/items", status_code=201)
async def add_itinerary_item(trip_id: str, day: int, body: ItineraryItemCreate):
    raise NotImplementedError


@router.put("/{trip_id}/itinerary/days/{day}/items/{item_id}")
async def update_itinerary_item(trip_id: str, day: int, item_id: str, body: ItineraryItemCreate):
    raise NotImplementedError


@router.post("/{trip_id}/itinerary/ai-suggest")
async def ai_suggest_itinerary(trip_id: str, body: AISuggestRequest):
    # TODO: call services/ai.py suggest_itinerary()
    raise NotImplementedError
