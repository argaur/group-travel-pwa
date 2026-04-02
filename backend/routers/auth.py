import hmac
import json
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth import create_access_token, get_or_create_user
from config import get_settings
from database import get_db

router = APIRouter()
settings = get_settings()


class AuthPayload(BaseModel):
    sub: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    iat: int


class AuthExchangeRequest(BaseModel):
    payload: AuthPayload
    signature: str


class AuthExchangeResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str


def _canonical_payload(payload: dict) -> str:
    return json.dumps(payload, separators=(",", ":"), sort_keys=True)


@router.post("/auth/token", response_model=AuthExchangeResponse)
async def exchange_token(body: AuthExchangeRequest, db: AsyncSession = Depends(get_db)):
    if not settings.nextauth_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Missing NEXTAUTH_SECRET")
    payload_dict = body.payload.model_dump()
    canonical = _canonical_payload(payload_dict)
    expected = hmac.new(
        settings.nextauth_secret.encode("utf-8"),
        canonical.encode("utf-8"),
        "sha256",
    ).hexdigest()

    if not hmac.compare_digest(expected, body.signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    now = int(time.time())
    if abs(now - body.payload.iat) > 600:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired auth payload")

    user = await get_or_create_user(
        email=body.payload.email,
        name=body.payload.name or body.payload.email.split("@")[0],
        google_id=body.payload.sub,
        avatar_url=body.payload.avatar_url,
        db=db,
    )

    token = create_access_token(user.id, body.payload.email)
    return AuthExchangeResponse(access_token=token, user_id=str(user.id))
