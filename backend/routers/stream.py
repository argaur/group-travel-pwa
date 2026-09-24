from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select

from auth import decode_user_id
from database import AsyncSessionLocal
from models.db import User
from routers.guards import get_trip_membership, parse_uuid
from services.realtime import get_bus, publish  # noqa: F401  (publish is re-exported for the write routers)

router = APIRouter()

# Vercel Hobby kills a function at 300s. End the stream first so the client resumes from its last id.
STREAM_MAX_SECONDS = 280.0

_optional_bearer = HTTPBearer(auto_error=False)


@router.get("/{trip_id}/stream")
async def trip_stream(
    trip_id: str,
    token: Optional[str] = Query(None, description="JWT for EventSource clients (no Auth header support)"),
    last_id: Optional[str] = Query(None, description="Resume after this event id (sent by the client on reconnect)"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
):
    """
    SSE endpoint — yields JSON events for live dashboard updates.
    Events: task_completed | member_joined | vote_cast | expense_added | preference_submitted | leader_transferred
    Auth: Authorization Bearer or ?token= (required for browser EventSource).

    Authorisation uses its own short-lived session and releases the database connection
    before streaming starts. A request-scoped session would hold one pooled connection
    for as long as the stream stays open.
    """
    user_id = decode_user_id(credentials.credentials if credentials else token)
    trip_uuid = parse_uuid(trip_id, "trip_id")

    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token",
                                headers={"WWW-Authenticate": "Bearer"})
        if await get_trip_membership(db, trip_uuid, user.id) is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    return StreamingResponse(
        get_bus().subscribe(trip_id, last_id=last_id, max_seconds=STREAM_MAX_SECONDS),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable proxy buffering
        },
    )
