import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.db import DateBlock, TripMember, User
from routers.stream import publish

router = APIRouter()

VALID_RSVP = {"going", "maybe", "declined"}


class RSVPUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_RSVP:
            raise ValueError(f"status must be one of {VALID_RSVP}")
        return v


class AvailabilityUpdate(BaseModel):
    blocked_dates: list[str]  # ISO date strings "YYYY-MM-DD"


# ── RSVP ──────────────────────────────────────────────────────────────────────

@router.put("/{trip_id}/rsvp")
async def update_rsvp(
    trip_id: str,
    body: RSVPUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    result = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    member.rsvp_status = body.status
    member.rsvp_updated_at = datetime.now(timezone.utc)

    await publish(
        trip_id,
        "rsvp_updated",
        {"user_id": str(user.id), "name": user.name, "status": body.status},
    )

    return {
        "rsvp_status": member.rsvp_status,
        "updated_at": member.rsvp_updated_at.isoformat(),
    }


@router.get("/{trip_id}/rsvp")
async def list_rsvp(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    # Verify current user is a member
    check = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    if check.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    result = await db.execute(
        select(TripMember, User)
        .join(User, TripMember.user_id == User.id)
        .where(TripMember.trip_id == trip_uuid)
    )
    rows = result.all()
    return [
        {
            "user_id": str(u.id),
            "name": u.name,
            "avatar_url": u.avatar_url,
            "role": m.role,
            "preference_submitted": m.preference_submitted,
            "rsvp_status": m.rsvp_status,
            "rsvp_updated_at": m.rsvp_updated_at.isoformat() if m.rsvp_updated_at else None,
        }
        for m, u in rows
    ]


# ── Date availability ─────────────────────────────────────────────────────────

@router.post("/{trip_id}/availability")
async def save_availability(
    trip_id: str,
    body: AvailabilityUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    check = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    if check.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    # Full replace: delete existing, insert new
    await db.execute(
        delete(DateBlock).where(
            DateBlock.trip_id == trip_uuid,
            DateBlock.user_id == user.id,
        )
    )

    from datetime import date as date_type
    new_blocks = []
    for ds in body.blocked_dates:
        try:
            d = date_type.fromisoformat(ds)
        except ValueError:
            continue
        new_blocks.append(DateBlock(trip_id=trip_uuid, user_id=user.id, blocked_date=d))

    if new_blocks:
        db.add_all(new_blocks)

    return {"saved": len(new_blocks)}


@router.get("/{trip_id}/availability")
async def get_availability(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    check = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    if check.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    # Fetch all blocks for this trip with user names
    result = await db.execute(
        select(DateBlock, User)
        .join(User, DateBlock.user_id == User.id)
        .where(DateBlock.trip_id == trip_uuid)
        .order_by(DateBlock.blocked_date)
    )
    rows = result.all()

    # Build heatmap
    heatmap_dict: dict[str, dict] = {}
    my_blocks: list[str] = []

    for block, blocker in rows:
        ds = block.blocked_date.isoformat()
        if ds not in heatmap_dict:
            heatmap_dict[ds] = {"date": ds, "blocked_count": 0, "blocked_by": []}
        heatmap_dict[ds]["blocked_count"] += 1
        heatmap_dict[ds]["blocked_by"].append(blocker.name)
        if block.user_id == user.id:
            my_blocks.append(ds)

    # Total members in trip
    members_result = await db.execute(
        select(TripMember).where(TripMember.trip_id == trip_uuid)
    )
    total_members = len(members_result.scalars().all())

    return {
        "heatmap": list(heatmap_dict.values()),
        "my_blocks": sorted(my_blocks),
        "total_members": total_members,
    }
