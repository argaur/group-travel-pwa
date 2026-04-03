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
from routers.guards import require_organizer
from routers.stream import publish

router = APIRouter()
settings = get_settings()


class JoinRequest(BaseModel):
    invite_token: str


class TransferOrganizerRequest(BaseModel):
    to_user_id: str


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


@router.post("/{trip_id}/members/transfer-organizer", status_code=200)
async def transfer_organizer(
    trip_id: str,
    body: TransferOrganizerRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    current = await require_organizer(db, trip_uuid, user.id)

    target_id = uuid.UUID(body.to_user_id)
    if target_id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already organizer")

    target_result = await db.execute(
        select(TripMember, User).join(User, TripMember.user_id == User.id).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == target_id,
        )
    )
    row = target_result.first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target is not a member")
    target_member, target_user = row

    current.role = "member"
    target_member.role = "organizer"

    await publish(
        trip_id,
        "leader_transferred",
        {
            "previous_leader_id": str(user.id),
            "previous_leader_name": user.name,
            "new_leader_id": str(target_id),
            "new_leader_name": target_user.name,
        },
    )

    return {"status": "transferred", "new_organizer_id": str(target_id)}


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

    trip_row = await db.execute(select(Trip).where(Trip.id == trip_uuid))
    trip = trip_row.scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

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
            "is_creator": user_row.id == trip.created_by,
            "joined_at": member.joined_at,
            "preference_submitted": member.preference_submitted,
        }
        for member, user_row in rows
    ]
