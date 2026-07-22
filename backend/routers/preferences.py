import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.db import GroupConsensusReport, Preference, Trip, TripMember
from routers.guards import parse_uuid
from routers.stream import publish
from services.ai import aggregate_input_hash, surface_group_consensus, synthesize_preferences
from services.preference_summary import aggregate_preferences

logger = logging.getLogger(__name__)

router = APIRouter()

# The surfacer needs enough responses to reason about a *group* without any
# chance of exposing an individual. Below this it declines honestly.
MIN_CONSENSUS_RESPONSES = 2


def _deterministic_consensus(aggregate: dict) -> dict:
    """
    Labeled fallback when the LLM is unavailable — built purely from the
    deterministic aggregate. Honest, never canned sample data.
    """
    agreement: list[str] = []
    overlap = aggregate.get("budget_overlap")
    if overlap and overlap.get("min") is not None and overlap.get("max") is not None:
        agreement.append(
            f"Daily budgets overlap in the ₹{overlap['min']:,}–₹{overlap['max']:,} range."
        )
    style_dist = aggregate.get("style_distribution") or {}
    if style_dist:
        top_style = max(style_dist, key=style_dist.get)
        agreement.append(f"Most travellers lean toward a '{top_style}' trip style.")
    dietary = aggregate.get("dietary_union") or []
    if dietary:
        agreement.append("The plan must accommodate: " + ", ".join(dietary) + ".")

    conflict_templates = {
        "budget_gap": {
            "topic": "Budget",
            "severity": "medium",
            "description": (
                "Daily-budget expectations vary widely across the group — a gap "
                "nobody has raised out loud yet."
            ),
            "who_should_talk": "the higher-budget and lower-budget sub-groups",
            "grounded_in": ["budget_gap"],
        },
        "no_budget_overlap": {
            "topic": "Budget",
            "severity": "high",
            "description": (
                "There is no single daily budget that works for everyone — the "
                "ranges do not overlap at all. Worth surfacing before booking."
            ),
            "who_should_talk": "the highest-budget and lowest-budget sub-groups",
            "grounded_in": ["no_budget_overlap"],
        },
    }
    gap_flags = aggregate.get("gap_flags") or []
    silent_conflicts = [conflict_templates[f] for f in gap_flags if f in conflict_templates]

    return {
        "headline": "Deterministic preference summary (AI reasoning unavailable).",
        "agreement": agreement,
        "silent_conflicts": silent_conflicts,
        "directions": [],
    }


class PreferenceSubmit(BaseModel):
    budget_min: int
    budget_max: int
    dietary: list[str]
    trip_style: str
    constraints: list[str] = []
    notes: Optional[str] = None
    is_anonymous: bool = True


@router.post("/{trip_id}/preferences", status_code=201)
async def submit_preferences(
    trip_id: str,
    body: PreferenceSubmit,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = parse_uuid(trip_id, "trip_id")
    membership = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    member = membership.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    existing = await db.execute(
        select(Preference).where(
            Preference.trip_id == trip_uuid,
            Preference.user_id == user.id,
        )
    )
    pref = existing.scalar_one_or_none()
    if pref is None:
        pref = Preference(
            trip_id=trip_uuid,
            user_id=user.id,
            budget_min=body.budget_min,
            budget_max=body.budget_max,
            dietary=body.dietary,
            trip_style=body.trip_style,
            constraints=body.constraints,
            notes=body.notes,
        )
        db.add(pref)
    else:
        pref.budget_min = body.budget_min
        pref.budget_max = body.budget_max
        pref.dietary = body.dietary
        pref.trip_style = body.trip_style
        pref.constraints = body.constraints
        pref.notes = body.notes

    member.preference_submitted = True

    total_members = await db.execute(
        select(TripMember).where(TripMember.trip_id == trip_uuid)
    )
    total_count = len(total_members.scalars().all())

    responded = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.preference_submitted.is_(True),
        )
    )
    responded_count = len(responded.scalars().all())

    await publish(
        trip_id,
        "preference_submitted",
        {"count_responded": responded_count, "count_total": total_count},
    )

    return {"status": "submitted"}


@router.get("/{trip_id}/preferences/summary")
async def get_preference_summary(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = parse_uuid(trip_id, "trip_id")
    membership = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    if membership.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    prefs_result = await db.execute(select(Preference).where(Preference.trip_id == trip_uuid))
    preferences = prefs_result.scalars().all()
    summary = aggregate_preferences(preferences)

    total_members = await db.execute(select(TripMember).where(TripMember.trip_id == trip_uuid))
    total_count = len(total_members.scalars().all())

    show_demo_hint = len(preferences) < 2 and total_count >= 1

    return {
        "total_members": total_count,
        "responded": len(preferences),
        "show_demo_hint": show_demo_hint,
        **summary,
        "ai_summary": None,
    }


@router.get("/{trip_id}/preferences/ai-synthesis")
async def get_ai_synthesis(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = parse_uuid(trip_id, "trip_id")
    membership = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    if membership.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    prefs_result = await db.execute(select(Preference).where(Preference.trip_id == trip_uuid))
    preferences = prefs_result.scalars().all()

    total_members = await db.execute(select(TripMember).where(TripMember.trip_id == trip_uuid))
    total_count = len(total_members.scalars().all())
    if total_count == 0 or (len(preferences) / total_count) < 0.6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough responses yet")

    payload = [
        {
            "budget_min": p.budget_min,
            "budget_max": p.budget_max,
            "dietary": p.dietary or [],
            "trip_style": p.trip_style,
            "constraints": p.constraints or [],
        }
        for p in preferences
    ]
    try:
        result = await synthesize_preferences(payload)
        return result
    except Exception:
        return aggregate_preferences(preferences)


@router.get("/{trip_id}/preferences/consensus")
async def get_group_consensus(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Silent Conflict Surfacer (flagship AI).

    Deterministic math (aggregate_preferences) → LLM reasoning (surface_group_consensus).
    Persisted per trip and reused until a new preference changes the aggregate hash.
    """
    trip_uuid = parse_uuid(trip_id, "trip_id")
    membership = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == user.id,
        )
    )
    if membership.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    prefs_result = await db.execute(select(Preference).where(Preference.trip_id == trip_uuid))
    preferences = prefs_result.scalars().all()
    responded = len(preferences)

    total_members_result = await db.execute(
        select(TripMember).where(TripMember.trip_id == trip_uuid)
    )
    total_count = len(total_members_result.scalars().all())

    base = {"responded": responded, "total_members": total_count}

    # Guardrail: minimum-response threshold — decline honestly, never guess.
    if responded < MIN_CONSENSUS_RESPONSES:
        return {
            **base,
            "status": "insufficient_responses",
            "min_required": MIN_CONSENSUS_RESPONSES,
            "message": (
                f"The Silent Conflict Surfacer needs at least {MIN_CONSENSUS_RESPONSES} "
                f"preference responses before it can reason about the group without "
                f"risking exposing any individual. {responded} in so far."
            ),
        }

    aggregate = aggregate_preferences(preferences)
    agg_hash = aggregate_input_hash(aggregate)

    existing_result = await db.execute(
        select(GroupConsensusReport).where(GroupConsensusReport.trip_id == trip_uuid)
    )
    cached = existing_result.scalar_one_or_none()
    if cached is not None and cached.aggregate_hash == agg_hash:
        return {
            **base,
            "status": "ok",
            "source": cached.source,
            "cached": True,
            "aggregate": aggregate,
            "report": cached.report,
        }

    trip_row = await db.execute(select(Trip).where(Trip.id == trip_uuid))
    trip = trip_row.scalar_one_or_none()
    trip_meta = {
        "title": trip.title if trip else None,
        "destination": trip.destination if trip else None,
        "trip_type": trip.trip_type if trip else None,
        "group_size_estimate": trip.group_size_estimate if trip else None,
        "responded": responded,
        "total_members": total_count,
    }

    try:
        report = await surface_group_consensus(aggregate, trip_meta)
        report_dict = report.model_dump()
    except Exception as exc:
        # Labeled deterministic fallback — surfaced in logs, never silently canned.
        # Not persisted, so the next request retries the LLM.
        logger.warning("Silent Conflict Surfacer LLM call failed for trip %s: %s", trip_id, exc)
        return {
            **base,
            "status": "ok",
            "source": "deterministic_fallback",
            "cached": False,
            "aggregate": aggregate,
            "report": _deterministic_consensus(aggregate),
            "message": (
                "AI reasoning is temporarily unavailable — showing the deterministic "
                "preference summary instead."
            ),
        }

    if cached is not None:
        cached.aggregate_hash = agg_hash
        cached.responded_count = responded
        cached.report = report_dict
        cached.source = "ai"
    else:
        db.add(
            GroupConsensusReport(
                trip_id=trip_uuid,
                aggregate_hash=agg_hash,
                responded_count=responded,
                report=report_dict,
                source="ai",
            )
        )

    return {
        **base,
        "status": "ok",
        "source": "ai",
        "cached": False,
        "aggregate": aggregate,
        "report": report_dict,
    }
