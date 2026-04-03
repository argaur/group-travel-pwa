import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.db import Preference, TripMember
from routers.stream import publish
from services.ai import synthesize_preferences
from services.preference_summary import aggregate_preferences

router = APIRouter()


class PreferenceSubmit(BaseModel):
    budget_min: int
    budget_max: int
    dietary: list[str]
    trip_style: str
    constraints: list[str] = []
    notes: Optional[str] = None
    is_anonymous: bool = True


@router.post("/{trip_id}/preferences", status_code=201)
async def submit_preferences(
    trip_id: str,
    body: PreferenceSubmit,
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
    member = membership.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    existing = await db.execute(
        select(Preference).where(
            Preference.trip_id == trip_uuid,
            Preference.user_id == user.id,
        )
    )
    pref = existing.scalar_one_or_none()
    if pref is None:
        pref = Preference(
            trip_id=trip_uuid,
            user_id=user.id,
            budget_min=body.budget_min,
            budget_max=body.budget_max,
            dietary=body.dietary,
            trip_style=body.trip_style,
            constraints=body.constraints,
            notes=body.notes,
        )
        db.add(pref)
    else:
        pref.budget_min = body.budget_min
        pref.budget_max = body.budget_max
        pref.dietary = body.dietary
        pref.trip_style = body.trip_style
        pref.constraints = body.constraints
        pref.notes = body.notes

    member.preference_submitted = True

    total_members = await db.execute(
        select(TripMember).where(TripMember.trip_id == trip_uuid)
    )
    total_count = len(total_members.scalars().all())

    responded = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.preference_submitted.is_(True),
        )
    )
    responded_count = len(responded.scalars().all())

    await publish(
        trip_id,
        "preference_submitted",
        {"count_responded": responded_count, "count_total": total_count},
    )

    return {"status": "submitted"}


@router.get("/{trip_id}/preferences/summary")
async def get_preference_summary(
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

    prefs_result = await db.execute(select(Preference).where(Preference.trip_id == trip_uuid))
    preferences = prefs_result.scalars().all()
    summary = aggregate_preferences(preferences)

    total_members = await db.execute(select(TripMember).where(TripMember.trip_id == trip_uuid))
    total_count = len(total_members.scalars().all())

    show_demo_hint = len(preferences) < 2 and total_count >= 1

    return {
        "total_members": total_count,
        "responded": len(preferences),
        "show_demo_hint": show_demo_hint,
        **summary,
        "ai_summary": None,
    }


@router.get("/{trip_id}/preferences/ai-synthesis")
async def get_ai_synthesis(
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

    prefs_result = await db.execute(select(Preference).where(Preference.trip_id == trip_uuid))
    preferences = prefs_result.scalars().all()

    total_members = await db.execute(select(TripMember).where(TripMember.trip_id == trip_uuid))
    total_count = len(total_members.scalars().all())
    if total_count == 0 or (len(preferences) / total_count) < 0.6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough responses yet")

    payload = [
        {
            "budget_min": p.budget_min,
            "budget_max": p.budget_max,
            "dietary": p.dietary or [],
            "trip_style": p.trip_style,
            "constraints": p.constraints or [],
        }
        for p in preferences
    ]
    try:
        result = await synthesize_preferences(payload)
        return result
    except Exception:
        return aggregate_preferences(preferences)
