"""
AI service — all Claude API calls live here.
Model: claude-sonnet-4-6
"""
from dotenv import load_dotenv
load_dotenv()

import asyncio
import hashlib
import json
import os
import anthropic
from pydantic import BaseModel

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
MODEL = "claude-sonnet-4-6"

# The Silent Conflict Surfacer is the flagship reasoning feature — use the
# strongest model. Per the claude-api skill, the current default id is
# claude-opus-4-8. Structured outputs (client.messages.parse + output_format)
# guarantee the response validates against ConsensusReport, so parsing can
# never silently fall through to {"raw": ...}.
CONSENSUS_MODEL = "claude-opus-4-8"


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

    message = await asyncio.to_thread(
        client.messages.create,
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

    message = await asyncio.to_thread(
        client.messages.create,
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

    message = await asyncio.to_thread(
        client.messages.create,
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text
    try:
        return json.loads(raw)
    except Exception:
        return {"raw": raw}


async def suggest_vote_options(vote_type: str, context: dict) -> list[dict]:
    """
    Generate 3–5 concrete voting options for a given vote_type
    (destination | dates | accommodation) based on group preference context.
    Returns list of {id, label, description} dicts.
    """
    type_prompts = {
        "destination": "Generate 4 destination options for this group trip.",
        "dates": "Generate 4 date-range options (weekend getaway, week-long, etc.) for this group trip.",
        "accommodation": "Generate 4 accommodation style options (e.g. Airbnb villa, beach resort, boutique hotel, hostel) for this group trip.",
    }
    task = type_prompts.get(vote_type, f"Generate 4 options for a group vote on {vote_type}.")

    prompt = f"""You are a group travel coordinator.

Group preference context:
{json.dumps(context, indent=2)}

Task: {task}

Each option should be specific and actionable — not generic.
Respond as a JSON array of objects with keys: id (snake_case string), label (short, <30 chars), description (<80 chars).
Only return the JSON array, no other text."""

    message = await asyncio.to_thread(
        client.messages.create,
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    # Strip markdown code blocks if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw)
    except Exception:
        return [{"id": "option_1", "label": "Option A", "description": raw[:80]}]


# ── Silent Conflict Surfacer (flagship AI) ────────────────────────────────────

class SilentConflict(BaseModel):
    topic: str            # e.g. "Budget", "Pace"
    severity: str         # "high" | "medium" | "low"
    description: str      # anonymized narrative of the unvoiced tension
    who_should_talk: str  # anonymized framing (sub-groups, never individuals)
    grounded_in: list[str]  # deterministic gap_flags that support this conflict


class TripDirection(BaseModel):
    title: str
    tradeoffs: str        # explicit tradeoffs of this direction
    serves_subgroup: str  # which sub-group it serves best
    confidence: str       # "high" | "medium" | "low"


class ConsensusReport(BaseModel):
    headline: str
    agreement: list[str]                    # what the group clearly aligns on
    silent_conflicts: list[SilentConflict]  # tensions nobody voiced
    directions: list[TripDirection]         # 2-3 trip directions with tradeoffs


def aggregate_input_hash(aggregate: dict) -> str:
    """Stable SHA-256 of the deterministic aggregate — the persistence key."""
    canonical = json.dumps(aggregate, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


async def surface_group_consensus(aggregate: dict, trip_meta: dict) -> ConsensusReport:
    """
    Reason over the *computed* preference aggregate (never raw per-user prefs)
    and surface silent conflicts the group hasn't voiced.

    Design invariants (interview talking points):
      - Deterministic math stays deterministic. The LLM does NOT compute budget
        overlap or distributions — those arrive pre-computed in ``aggregate``.
        The LLM only reasons and narrates.
      - Anonymity: the aggregate contains no user identity; the model is told to
        reason only over sub-groups, never individuals.
      - Grounded conflicts only: a silent conflict is valid only if it cites one
        of the deterministic ``gap_flags``. We enforce this in code after the
        call (belt-and-suspenders on top of the prompt rule).

    Raises on API/parse failure so the caller can fall back to a *labeled*
    deterministic summary — never a silent canned response.
    """
    gap_flags = [str(f) for f in (aggregate.get("gap_flags") or [])]
    allowed_flags = set(gap_flags)

    system = (
        "You are Trivo's Silent Conflict Surfacer — the AI that reads a group's "
        "anonymous travel preferences and names the tensions nobody has said out "
        "loud yet (especially quiet budget misalignment), so the organizer can "
        "raise them before they derail the trip.\n\n"
        "HARD RULES:\n"
        "1. The numbers are already computed for you. NEVER do arithmetic and "
        "never restate raw figures as if you derived them — reason and narrate "
        "over the provided aggregate.\n"
        "2. Anonymity is absolute. You only ever see aggregates, never people. "
        "Refer to sub-groups ('the budget-conscious travellers', 'those wanting "
        "a faster pace') — never an individual, never 'one person said'.\n"
        "3. Only report a silent conflict that is supported by the deterministic "
        f"gap flags for THIS group: {gap_flags or 'none'}. Each silent_conflict's "
        "'grounded_in' must contain at least one of those flag ids. If the list "
        "is empty, 'silent_conflicts' MUST be an empty array — do NOT invent "
        "tension where the math shows none.\n"
        "4. 'directions' are 2-3 concrete trip directions, each with explicit "
        "tradeoffs, the sub-group it serves best, and a confidence signal.\n"
        "5. Be warm, specific, and honest. If the group broadly agrees, say so "
        "plainly in 'agreement' and keep conflicts empty."
    )
    user_payload = json.dumps({"aggregate": aggregate, "trip": trip_meta}, indent=2, default=str)

    message = await asyncio.to_thread(
        client.messages.parse,
        model=CONSENSUS_MODEL,
        max_tokens=4000,
        system=system,
        messages=[{"role": "user", "content": user_payload}],
        output_format=ConsensusReport,
    )
    report = message.parsed_output
    if report is None:
        raise ValueError("Consensus model returned no parseable output")

    # Deterministic guardrail: drop any conflict not grounded in a real gap flag.
    if allowed_flags:
        report.silent_conflicts = [
            c for c in report.silent_conflicts if set(c.grounded_in) & allowed_flags
        ]
    else:
        report.silent_conflicts = []

    return report


# V3 stubs
async def location_helper(lat: float, lng: float, query: str, trip_context: dict) -> dict:
    """GPS-aware Claude bot with tool use. V3 feature — not yet implemented."""
    raise NotImplementedError("Location helper is a V3 feature")


async def trip_optimizer(trip_id: str, anonymous_profile: dict) -> dict:
    """Individual personalized suggestions. V3 feature — not yet implemented."""
    raise NotImplementedError("Trip optimizer is a V3 feature")
