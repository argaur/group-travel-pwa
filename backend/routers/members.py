import base64
import hmac
import json
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from config import get_settings
from database import get_db
from models.db import Trip, TripMember, User
from routers.stream import publish

router = APIRouter()
settings = get_settings()


class JoinRequest(BaseModel):
    invite_token: str


@router.post("/{trip_id}/invite", status_code=201)
async def generate_invite(
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
    if member is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    payload = {"trip_id": trip_id, "exp": int(time.time()) + 7 * 24 * 60 * 60}
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    signature = hmac.new(
        settings.secret_key.encode("utf-8"),
        payload_json.encode("utf-8"),
        "sha256",
    ).hexdigest()
    token = base64.urlsafe_b64encode(payload_json.encode("utf-8")).decode("utf-8").rstrip("=")
    invite_token = f"{token}.{signature}"

    return {"invite_token": invite_token}


@router.post("/{trip_id}/join")
async def join_trip(
    trip_id: str,
    body: JoinRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        token_part, signature = body.invite_token.split(".")
        padded = token_part + "=" * (-len(token_part) % 4)
        payload_json = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
        expected = hmac.new(
            settings.secret_key.encode("utf-8"),
            payload_json.encode("utf-8"),
            "sha256",
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise ValueError("Invalid signature")
        payload = json.loads(payload_json)
        if payload.get("trip_id") != trip_id:
            raise ValueError("Trip mismatch")
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("Expired")
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid invite token")

    trip_uuid = uuid.UUID(trip_id)
    result = await db.execute(select(Trip).where(Trip.id == trip_uuid))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    existing = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    member = existing.scalar_one_or_none()
    if member is None:
        member = TripMember(trip_id=trip_uuid, user_id=user.id, role="member")
        db.add(member)
        await publish(trip_id, "member_joined", {"user_id": str(user.id), "name": user.name})

    return {"status": "joined"}


@router.get("/{trip_id}/members")
async def list_members(
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

    result = await db.execute(
        select(TripMember, User).join(User, TripMember.user_id == User.id).where(TripMember.trip_id == trip_uuid)
    )
    rows = result.all()
    return [
        {
            "user": {
                "id": str(user_row.id),
                "name": user_row.name,
                "avatar_url": user_row.avatar_url,
            },
            "role": member.role,
            "joined_at": member.joined_at,
            "preference_submitted": member.preference_submitted,
        }
        for member, user_row in rows
    ]
