from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class LocationHelperRequest(BaseModel):
    lat: float
    lng: float
    query: str
    trip_context: Optional[dict] = None  # dietary constraints, trip tags (kid-friendly etc.)


class TripOptimizerRequest(BaseModel):
    trip_id: str
    anonymous_profile: dict  # solo interests, energy level, budget flexibility, etc.


@router.post("/location-helper")
async def location_helper(body: LocationHelperRequest):
    # TODO: call services/ai.py location_helper() — Claude with tool use
    # Tools: get_weather, search_nearby_eateries, get_road_conditions, find_nearest
    # V3 feature — stub only
    raise NotImplementedError


@router.post("/trip-optimizer")
async def trip_optimizer(body: TripOptimizerRequest):
    # TODO: call services/ai.py trip_optimizer() — individual anonymous suggestions
    # V3 feature — stub only
    raise NotImplementedError
