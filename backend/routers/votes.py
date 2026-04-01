from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal

router = APIRouter()


class VoteCast(BaseModel):
    vote_type: str  # destination | date | accommodation
    option_id: str
    value: Literal["up", "neutral", "down"]


class AIGenerateOptions(BaseModel):
    vote_type: str
    context: dict  # preference synthesis summary passed from frontend


@router.post("/{trip_id}/votes", status_code=201)
async def cast_vote(trip_id: str, body: VoteCast):
    # TODO: upsert vote, publish vote_cast SSE event
    raise NotImplementedError


@router.get("/{trip_id}/votes/{vote_type}")
async def get_vote_tally(trip_id: str, vote_type: str):
    raise NotImplementedError


@router.post("/{trip_id}/vote-options/ai-generate")
async def ai_generate_options(trip_id: str, body: AIGenerateOptions):
    # TODO: call services/ai.py suggest_destinations()
    raise NotImplementedError
