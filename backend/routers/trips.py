from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import date
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.db import ItineraryItem, Preference, Task, Trip, TripMember
from routers.guards import parse_uuid, require_trip_member
from services.preference_summary import aggregate_preferences

router = APIRouter()


class TripCreate(BaseModel):
    name: str
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    trip_type: str = "leisure"
    group_size_estimate: Optional[int] = None


class PlaceUpdate(BaseModel):
    place_id: str
    place_name: str
    place_photo_url: Optional[str] = None
    place_rating: Optional[float] = None


class TripResponse(BaseModel):
    id: str
    name: str
    destination: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    trip_type: str
    status: str
    created_by: str
    place_id: Optional[str] = None
    place_name: Optional[str] = None
    place_photo_url: Optional[str] = None
    place_rating: Optional[float] = None


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
        place_id=trip.place_id,
        place_name=trip.place_name,
        place_photo_url=trip.place_photo_url,
        place_rating=float(trip.place_rating) if trip.place_rating is not None else None,
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
    trip_uuid = parse_uuid(trip_id, "trip_id")
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
        place_id=trip.place_id,
        place_name=trip.place_name,
        place_photo_url=trip.place_photo_url,
        place_rating=float(trip.place_rating) if trip.place_rating is not None else None,
    )


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: str,
    body: TripCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = parse_uuid(trip_id, "trip_id")
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
        place_id=trip.place_id,
        place_name=trip.place_name,
        place_photo_url=trip.place_photo_url,
        place_rating=float(trip.place_rating) if trip.place_rating is not None else None,
    )


@router.delete("/{trip_id}", status_code=204)
async def archive_trip(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = parse_uuid(trip_id, "trip_id")
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


@router.get("/{trip_id}/dashboard-summary")
async def trip_dashboard_summary(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Aggregates trip hub data for a single-screen dashboard (member may view before prefs done)."""
    trip_uuid = parse_uuid(trip_id, "trip_id")
    await require_trip_member(db, trip_uuid, user.id)

    trip_row = await db.execute(select(Trip).where(Trip.id == trip_uuid))
    trip = trip_row.scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    prefs_result = await db.execute(select(Preference).where(Preference.trip_id == trip_uuid))
    preferences = prefs_result.scalars().all()
    pref_agg = aggregate_preferences(preferences)

    members_result = await db.execute(select(TripMember).where(TripMember.trip_id == trip_uuid))
    members = members_result.scalars().all()
    responded = sum(1 for m in members if m.preference_submitted)

    task_counts = await db.execute(
        select(Task.status, func.count(Task.id)).where(Task.trip_id == trip_uuid).group_by(Task.status)
    )
    task_by_status = {row[0]: row[1] for row in task_counts.all()}

    itin_result = await db.execute(
        select(ItineraryItem)
        .where(ItineraryItem.trip_id == trip_uuid, ItineraryItem.day_number.in_([1, 2]))
        .order_by(ItineraryItem.day_number, ItineraryItem.start_time)
        .limit(12)
    )
    itinerary_preview = [
        {
            "id": str(item.id),
            "day_number": item.day_number,
            "title": item.title,
            "location": item.location,
            "start_time": str(item.start_time) if item.start_time else None,
        }
        for item in itin_result.scalars().all()
    ]

    return {
        "trip": {
            "id": str(trip.id),
            "name": trip.title,
            "destination": trip.destination,
            "start_date": trip.start_date.isoformat() if trip.start_date else None,
            "end_date": trip.end_date.isoformat() if trip.end_date else None,
            "trip_type": trip.trip_type,
            "status": trip.status,
        },
        "members_total": len(members),
        "preferences_responded": responded,
        "preference_snapshot": {
            "budget_overlap": pref_agg["budget_overlap"],
            "dietary_union": pref_agg["dietary_union"],
            "gap_flags": pref_agg["gap_flags"],
        },
        "tasks": {
            "by_status": task_by_status,
            "total": sum(task_by_status.values()) if task_by_status else 0,
        },
        "itinerary_preview": itinerary_preview,
    }


@router.put("/{trip_id}/place")
async def set_trip_place(
    trip_id: str,
    body: PlaceUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = parse_uuid(trip_id, "trip_id")
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

    trip.place_id = body.place_id
    trip.place_name = body.place_name
    trip.place_photo_url = body.place_photo_url
    trip.place_rating = body.place_rating

    return TripResponse(
        id=str(trip.id),
        name=trip.title,
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date,
        trip_type=trip.trip_type,
        status=trip.status,
        created_by=str(trip.created_by),
        place_id=trip.place_id,
        place_name=trip.place_name,
        place_photo_url=trip.place_photo_url,
        place_rating=float(trip.place_rating) if trip.place_rating is not None else None,
    )
