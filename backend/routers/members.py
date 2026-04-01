from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class JoinRequest(BaseModel):
    invite_token: str


@router.post("/{trip_id}/invite", status_code=201)
async def generate_invite(trip_id: str):
    # TODO: create signed invite token, return WhatsApp deep link
    # Format: https://wa.me/?text=<encoded message with app URL>
    raise NotImplementedError


@router.post("/{trip_id}/join")
async def join_trip(trip_id: str, body: JoinRequest):
    # TODO: verify token, add user as member, publish member_joined SSE event
    raise NotImplementedError


@router.get("/{trip_id}/members")
async def list_members(trip_id: str):
    # TODO: return members with roles, join status, preference submitted flag
    raise NotImplementedError
