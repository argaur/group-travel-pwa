import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.db import PushSubscription, TripMember

router = APIRouter()


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscribeRequest(BaseModel):
    trip_id: str
    endpoint: str
    keys: PushKeys


@router.post("/push/subscribe", status_code=204)
async def subscribe_push(
    body: PushSubscribeRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(body.trip_id)
    membership = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    if membership.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    result = await db.execute(
        select(PushSubscription).where(
            PushSubscription.trip_id == trip_uuid,
            PushSubscription.user_id == user.id,
        )
    )
    sub = result.scalar_one_or_none()
    payload = {
        "endpoint": body.endpoint,
        "keys": {"p256dh": body.keys.p256dh, "auth": body.keys.auth},
    }
    if sub is None:
        sub = PushSubscription(
            trip_id=trip_uuid,
            user_id=user.id,
            endpoint=body.endpoint,
            p256dh=body.keys.p256dh,
            auth=body.keys.auth,
            raw=payload,
        )
        db.add(sub)
    else:
        sub.endpoint = body.endpoint
        sub.p256dh = body.keys.p256dh
        sub.auth = body.keys.auth
        sub.raw = payload


@router.delete("/push/subscribe", status_code=204)
async def unsubscribe_push(
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
        select(PushSubscription).where(
            PushSubscription.trip_id == trip_uuid,
            PushSubscription.user_id == user.id,
        )
    )
    sub = result.scalar_one_or_none()
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    await db.delete(sub)
