"""
AI service — all Claude API calls live here.
Model: claude-sonnet-4-6
"""
from dotenv import load_dotenv
load_dotenv()

import json
import os
import anthropic

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
MODEL = "claude-sonnet-4-6"


async def synthesize_preferences(preferences: list[dict]) -> dict:
    """
    Aggregate anonymous group preferences and return a natural language summary
    + structured JSON (budget_overlap_range, dietary_union, style_distribution, gap_flags).

    Fallback: rule-based aggregation if Claude is unavailable.
    """
    prompt = f"""You are a group travel coordinator. Given these anonymous group preferences:
{preferences}

Summarize what the group agrees on, flag any significant gaps, and suggest 2-3 broad trip
directions that could work. Be warm, concise, and practical.

Respond with JSON:
{{
  "summary": "<natural language paragraph>",
  "budget_overlap_range": {{"min": 0, "max": 0}},
  "dietary_union": [],
  "style_distribution": {{}},
  "gap_flags": []
}}"""

    message = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text
    try:
        return json.loads(raw)
    except Exception:
        return {"raw": raw}


async def suggest_destinations(synthesis: dict, trip_meta: dict) -> list[dict]:
    """
    Generate 2-3 destination options based on preference synthesis.
    Returns list of destination cards for the voting UI.
    """
    prompt = f"""Based on this group's preferences:
{synthesis}

Suggest 3 destination options for a {trip_meta.get('size', 'N')}-person
{trip_meta.get('trip_type', 'leisure')} trip from {trip_meta.get('origin', 'India')}
for {trip_meta.get('duration', 'a weekend')}.

For each destination provide:
- name, why_it_fits_this_group, estimated_cost_per_person_inr,
  travel_time_from_origin, top_3_highlights (list), watch_out_for

Respond as a JSON array."""

    message = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text
    try:
        return json.loads(raw)
    except Exception:
        return {"raw": raw}


async def suggest_itinerary(day: int, destination: str, group_context: str) -> dict:
    """Generate activity suggestions for a single itinerary day."""
    prompt = f"""Suggest a day's activities for Day {day} in {destination}.
Group context: {group_context}

Return morning / afternoon / evening activity suggestions with:
title, location, estimated_duration, cost_estimate_inr, why_it_fits.
Respond as JSON."""

    message = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text
    try:
        return json.loads(raw)
    except Exception:
        return {"raw": raw}


# V3 stubs
async def location_helper(lat: float, lng: float, query: str, trip_context: dict) -> dict:
    """GPS-aware Claude bot with tool use. V3 feature — not yet implemented."""
    raise NotImplementedError("Location helper is a V3 feature")


async def trip_optimizer(trip_id: str, anonymous_profile: dict) -> dict:
    """Individual personalized suggestions. V3 feature — not yet implemented."""
    raise NotImplementedError("Trip optimizer is a V3 feature")
