import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.db import Trip, TripMember

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
async def create_trip(
    body: TripCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip = Trip(
        title=body.name,
        destination=body.destination,
        start_date=body.start_date,
        end_date=body.end_date,
        trip_type=body.trip_type,
        group_size_estimate=body.group_size_estimate,
        created_by=user.id,
    )
    db.add(trip)
    await db.flush()

    member = TripMember(trip_id=trip.id, user_id=user.id, role="organizer")
    db.add(member)

    return TripResponse(
        id=str(trip.id),
        name=trip.title,
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        trip_type=trip.trip_type,
        status=trip.status,
        created_by=str(trip.created_by),
    )


@router.get("", response_model=list[TripResponse])
async def list_trips(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(Trip).join(TripMember).where(TripMember.user_id == user.id)
    )
    trips = result.scalars().unique().all()
    return [
        TripResponse(
            id=str(trip.id),
            name=trip.title,
            destination=trip.destination,
            start_date=trip.start_date,
            end_date=trip.end_date,
            trip_type=trip.trip_type,
            status=trip.status,
            created_by=str(trip.created_by),
        )
        for trip in trips
    ]


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    result = await db.execute(select(Trip).where(Trip.id == trip_uuid))
    trip = result.scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    membership = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    if membership.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    return TripResponse(
        id=str(trip.id),
        name=trip.title,
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        trip_type=trip.trip_type,
        status=trip.status,
        created_by=str(trip.created_by),
    )


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: str,
    body: TripCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    result = await db.execute(select(Trip).where(Trip.id == trip_uuid))
    trip = result.scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    membership = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    member = membership.scalar_one_or_none()
    if member is None or member.role != "organizer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organizer only")

    trip.title = body.name
    trip.destination = body.destination
    trip.start_date = body.start_date
    trip.end_date = body.end_date
    trip.trip_type = body.trip_type
    trip.group_size_estimate = body.group_size_estimate

    return TripResponse(
        id=str(trip.id),
        name=trip.title,
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        trip_type=trip.trip_type,
        status=trip.status,
        created_by=str(trip.created_by),
    )


@router.delete("/{trip_id}", status_code=204)
async def archive_trip(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    result = await db.execute(select(Trip).where(Trip.id == trip_uuid))
    trip = result.scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    membership = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    member = membership.scalar_one_or_none()
    if member is None or member.role != "organizer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organizer only")

    trip.status = "cancelled"
