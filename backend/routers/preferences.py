from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class PreferenceSubmit(BaseModel):
    budget_min: int
    budget_max: int
    dietary: list[str]
    trip_style: str
    constraints: list[str] = []
    notes: Optional[str] = None
    is_anonymous: bool = True


@router.post("/{trip_id}/preferences", status_code=201)
async def submit_preferences(trip_id: str, body: PreferenceSubmit):
    # TODO: upsert preference row, trigger AI synthesis if all members responded
    raise NotImplementedError


@router.get("/{trip_id}/preferences/summary")
async def get_preference_summary(trip_id: str):
    # TODO: return aggregated (anonymized) group summary
    # budget overlap range, dietary union, style distribution, gap flags
    raise NotImplementedError


@router.get("/{trip_id}/preferences/ai-synthesis")
async def get_ai_synthesis(trip_id: str):
    # TODO: call services/ai.py synthesize_preferences(), cache result
    raise NotImplementedError
