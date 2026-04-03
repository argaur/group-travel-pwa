"""Shared authorization helpers for trip routes."""
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.db import TripMember


async def get_trip_membership(
    db: AsyncSession,
    trip_id: uuid.UUID,
    user_id: uuid.UUID,
) -> TripMember | None:
    result = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_id,
            TripMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def require_trip_member(
    db: AsyncSession,
    trip_id: uuid.UUID,
    user_id: uuid.UUID,
) -> TripMember:
    member = await get_trip_membership(db, trip_id, user_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")
    return member


async def require_preferences_submitted(
    db: AsyncSession,
    trip_id: uuid.UUID,
    user_id: uuid.UUID,
) -> TripMember:
    """Block planning surfaces until the member has submitted preferences (PRD onboarding)."""
    member = await require_trip_member(db, trip_id, user_id)
    if not member.preference_submitted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="preferences_required",
        )
    return member


async def require_organizer(
    db: AsyncSession,
    trip_id: uuid.UUID,
    user_id: uuid.UUID,
) -> TripMember:
    member = await require_trip_member(db, trip_id, user_id)
    if member.role != "organizer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organizer only")
    return member


async def require_user_is_trip_member_user(
    db: AsyncSession,
    trip_id: uuid.UUID,
    assignee_id: uuid.UUID,
) -> None:
    result = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_id,
            TripMember.user_id == assignee_id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignee is not a trip member",
        )
