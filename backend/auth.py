"""
JWT utilities and FastAPI auth dependency.

Flow:
  1. Frontend authenticates with Google via Auth.js.
  2. Frontend POSTs to POST /api/v1/auth/token with the Auth.js session token.
  3. This module creates a backend-signed JWT (SECRET_KEY / HS256).
  4. Frontend stores the backend JWT and sends it as: Authorization: Bearer <token>
  5. Protected routes use `Depends(get_current_user)` to resolve the User from DB.
"""
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import get_db
from models.db import User

settings = get_settings()
bearer_scheme = HTTPBearer()


# ── Token creation ─────────────────────────────────────────────────────────────

def create_access_token(user_id: uuid.UUID, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


# ── User upsert (called on first token exchange) ───────────────────────────────

async def get_or_create_user(
    email: str,
    name: str,
    google_id: str,
    avatar_url: str | None,
    db: AsyncSession,
) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(name=name, email=email, google_id=google_id, avatar_url=avatar_url)
        db.add(user)
        await db.flush()
    return user


# ── FastAPI dependency ─────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user
