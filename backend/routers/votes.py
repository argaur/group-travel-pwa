import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Literal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.db import Vote, VoteResponse
from routers.guards import require_preferences_submitted
from routers.stream import publish

router = APIRouter()


class VoteCast(BaseModel):
    vote_type: str  # destination | date | accommodation
    option_id: str
    value: Literal["up", "neutral", "down"]


class AIGenerateOptions(BaseModel):
    vote_type: str
    context: dict  # preference synthesis summary passed from frontend


@router.post("/{trip_id}/votes", status_code=201)
async def cast_vote(
    trip_id: str,
    body: VoteCast,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    await require_preferences_submitted(db, trip_uuid, user.id)

    vote_result = await db.execute(
        select(Vote).where(Vote.trip_id == trip_uuid, Vote.topic == body.vote_type)
    )
    vote = vote_result.scalar_one_or_none()
    if vote is None:
        vote = Vote(
            trip_id=trip_uuid,
            topic=body.vote_type,
            options={"options": []},
            created_by=user.id,
        )
        db.add(vote)
        await db.flush()

    resp_result = await db.execute(
        select(VoteResponse).where(
            VoteResponse.vote_id == vote.id,
            VoteResponse.user_id == user.id,
        )
    )
    response = resp_result.scalar_one_or_none()
    if response is None:
        response = VoteResponse(vote_id=vote.id, user_id=user.id, selected=body.option_id)
        db.add(response)
    else:
        response.selected = body.option_id

    tally = await get_vote_tally(trip_id, body.vote_type, db=db, user=user)
    await publish(trip_id, "vote_cast", {"vote_type": body.vote_type, "tally": tally})
    return {"status": "cast"}


@router.get("/{trip_id}/votes/{vote_type}")
async def get_vote_tally(
    trip_id: str,
    vote_type: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    await require_preferences_submitted(db, trip_uuid, user.id)

    vote_result = await db.execute(
        select(Vote).where(Vote.trip_id == trip_uuid, Vote.topic == vote_type)
    )
    vote = vote_result.scalar_one_or_none()
    if vote is None:
        return {}

    resp_result = await db.execute(
        select(VoteResponse).where(VoteResponse.vote_id == vote.id)
    )
    responses = resp_result.scalars().all()
    tally: dict[str, int] = {}
    for resp in responses:
        tally[resp.selected] = tally.get(resp.selected, 0) + 1
    return tally


@router.post("/{trip_id}/vote-options/ai-generate")
async def ai_generate_options(trip_id: str, body: AIGenerateOptions):
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="V2 feature")
