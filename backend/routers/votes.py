import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.db import Vote, VoteResponse
from routers.guards import parse_uuid, require_organizer, require_preferences_submitted
from routers.stream import publish
from services.ai import suggest_vote_options

router = APIRouter()


class VoteCast(BaseModel):
    vote_type: str  # destination | dates | accommodation
    option_id: str


class SetOptions(BaseModel):
    options: list[str]


class AIGenerateOptions(BaseModel):
    vote_type: str
    context: dict  # preference synthesis summary passed from frontend


async def _get_vote(db: AsyncSession, trip_uuid: uuid.UUID, vote_type: str) -> Vote | None:
    result = await db.execute(
        select(Vote).where(Vote.trip_id == trip_uuid, Vote.topic == vote_type)
    )
    return result.scalar_one_or_none()


async def _vote_state(db: AsyncSession, vote: Vote, user_id: uuid.UUID) -> dict:
    """Return the persisted options, the tally, total responses, and the caller's own selection."""
    resp_result = await db.execute(
        select(VoteResponse).where(VoteResponse.vote_id == vote.id)
    )
    responses = resp_result.scalars().all()
    tally: dict[str, int] = {}
    my_vote: str | None = None
    for resp in responses:
        tally[resp.selected] = tally.get(resp.selected, 0) + 1
        if resp.user_id == user_id:
            my_vote = resp.selected
    return {
        "options": (vote.options or {}).get("options", []),
        "tally": tally,
        "total": len(responses),
        "my_vote": my_vote,
    }


def _clean_options(raw: list[str]) -> list[str]:
    """Trim, drop blanks, de-duplicate while preserving order."""
    seen: set[str] = set()
    cleaned: list[str] = []
    for opt in raw:
        val = opt.strip()
        if val and val not in seen:
            seen.add(val)
            cleaned.append(val)
    return cleaned


@router.get("/{trip_id}/votes/{vote_type}")
async def get_vote(
    trip_id: str,
    vote_type: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Return the persisted options + tally for a vote topic (empty shell if not created yet)."""
    trip_uuid = parse_uuid(trip_id, "trip_id")
    await require_preferences_submitted(db, trip_uuid, user.id)

    vote = await _get_vote(db, trip_uuid, vote_type)
    if vote is None:
        return {"options": [], "tally": {}, "total": 0, "my_vote": None}
    return await _vote_state(db, vote, user.id)


@router.post("/{trip_id}/votes/{vote_type}/options")
async def set_vote_options(
    trip_id: str,
    vote_type: str,
    body: SetOptions,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Organizer publishes the ballot. Persists options WITHOUT casting any vote."""
    trip_uuid = parse_uuid(trip_id, "trip_id")
    await require_organizer(db, trip_uuid, user.id)

    cleaned = _clean_options(body.options)
    if len(cleaned) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 options")

    vote = await _get_vote(db, trip_uuid, vote_type)
    if vote is None:
        vote = Vote(
            trip_id=trip_uuid,
            topic=vote_type,
            options={"options": cleaned},
            created_by=user.id,
        )
        db.add(vote)
        await db.flush()
    else:
        # Preserve options that already carry votes; append newly added ones.
        existing = (vote.options or {}).get("options", [])
        vote.options = {"options": existing + [o for o in cleaned if o not in existing]}

    state = await _vote_state(db, vote, user.id)
    await publish(trip_id, "vote_cast", {"vote_type": vote_type, "tally": state["tally"]})
    return state


@router.post("/{trip_id}/votes", status_code=201)
async def cast_vote(
    trip_id: str,
    body: VoteCast,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Cast (or change) the caller's single vote on an already-published ballot."""
    trip_uuid = parse_uuid(trip_id, "trip_id")
    await require_preferences_submitted(db, trip_uuid, user.id)

    vote = await _get_vote(db, trip_uuid, body.vote_type)
    if vote is None:
        raise HTTPException(status_code=404, detail="No ballot published for this topic yet")

    options = (vote.options or {}).get("options", [])
    if body.option_id not in options:
        raise HTTPException(status_code=400, detail="Invalid option")

    resp_result = await db.execute(
        select(VoteResponse).where(
            VoteResponse.vote_id == vote.id,
            VoteResponse.user_id == user.id,
        )
    )
    response = resp_result.scalar_one_or_none()
    if response is None:
        db.add(VoteResponse(vote_id=vote.id, user_id=user.id, selected=body.option_id))
    else:
        response.selected = body.option_id
    await db.flush()

    state = await _vote_state(db, vote, user.id)
    await publish(trip_id, "vote_cast", {"vote_type": body.vote_type, "tally": state["tally"]})
    return {"status": "cast", **state}


@router.post("/{trip_id}/vote-options/ai-generate")
async def ai_generate_options(
    trip_id: str,
    body: AIGenerateOptions,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Organizer-only: draft ballot options with AI. Does NOT persist — organizer reviews then publishes."""
    trip_uuid = parse_uuid(trip_id, "trip_id")
    await require_organizer(db, trip_uuid, user.id)

    try:
        options = await suggest_vote_options(body.vote_type, body.context)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {str(e)}")

    return {"vote_type": body.vote_type, "options": options}
