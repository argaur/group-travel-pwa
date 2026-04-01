from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter()


class TripCreate(BaseModel):
    name: str
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    trip_type: str = "leisure"
    group_size_estimate: Optional[int] = None


class TripResponse(BaseModel):
    id: str
    name: str
    destination: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    trip_type: str
    status: str
    created_by: str


@router.post("", response_model=TripResponse, status_code=201)
async def create_trip(body: TripCreate):
    # TODO: persist to Neon, return created trip
    raise NotImplementedError


@router.get("", response_model=list[TripResponse])
async def list_trips():
    # TODO: return trips for authenticated user
    raise NotImplementedError


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str):
    # TODO: fetch trip by id, check membership
    raise NotImplementedError


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(trip_id: str, body: TripCreate):
    raise NotImplementedError


@router.delete("/{trip_id}", status_code=204)
async def archive_trip(trip_id: str):
    raise NotImplementedError
