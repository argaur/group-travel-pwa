"""Deterministic stand-ins for the Anthropic client.

The surfacer calls ``client.messages.parse(...)`` and reads ``.parsed_output``.
These fakes reproduce that surface so the eval harness can exercise the full
``surface_group_consensus`` code path — including the grounding guardrail —
without an API key or network call. The stub *reasons deterministically from the
aggregate*, so it stands in for a well-behaved model; the adversarial fake
deliberately misbehaves so we can prove the guardrail strips ungrounded output.
"""
from __future__ import annotations

import json
from typing import Callable

from services.ai import ConsensusReport, SilentConflict, TripDirection


class _FakeMessage:
    def __init__(self, report: ConsensusReport):
        self.parsed_output = report


class _FakeMessages:
    def __init__(self, builder: Callable[[dict, dict], ConsensusReport]):
        self._builder = builder

    def parse(self, *, model, max_tokens, system, messages, output_format, **_):
        payload = json.loads(messages[0]["content"])
        aggregate = payload.get("aggregate", {})
        trip = payload.get("trip", {})
        return _FakeMessage(self._builder(aggregate, trip))


class FakeClient:
    """Drop-in for ``services.ai.client`` (only ``.messages.parse`` is used)."""

    def __init__(self, builder: Callable[[dict, dict], ConsensusReport]):
        self.messages = _FakeMessages(builder)


_FLAG_NARRATIVE = {
    "no_budget_overlap": (
        "Budget",
        "high",
        "The stated budgets don't overlap at all — two sub-groups are quietly "
        "assuming very different price points.",
        "The budget-conscious travellers and the higher-spend travellers should "
        "align on a nightly ceiling before anything is booked.",
    ),
    "budget_gap": (
        "Budget",
        "medium",
        "Budgets technically overlap but stretch across a wide band, so a single "
        "plan will feel cheap to some and pricey to others.",
        "Those wanting to keep costs down and those comfortable spending more "
        "should agree on a shared per-day range.",
    ),
}


def honest_builder(aggregate: dict, trip: dict) -> ConsensusReport:
    """A well-behaved model: grounds every conflict in a real gap flag, never
    names an individual, and stays quiet when the math shows no tension."""
    flags = [str(f) for f in (aggregate.get("gap_flags") or [])]

    conflicts: list[SilentConflict] = []
    for flag in flags:
        topic, severity, desc, who = _FLAG_NARRATIVE.get(
            flag,
            ("Preferences", "low", f"Signal from {flag}.", "The group should discuss."),
        )
        conflicts.append(
            SilentConflict(
                topic=topic,
                severity=severity,
                description=desc,
                who_should_talk=who,
                grounded_in=[flag],
            )
        )

    agreement: list[str] = []
    styles = aggregate.get("style_distribution") or {}
    if styles:
        top = max(styles, key=styles.get)
        agreement.append(f"A shared lean toward a {top} pace.")
    if aggregate.get("dietary_union"):
        agreement.append("Dietary needs are known and easy to plan around.")
    if not agreement:
        agreement.append("The group is broadly aligned on the essentials.")

    directions = [
        TripDirection(
            title="Balanced group plan",
            tradeoffs="Covers the common ground; may not thrill the outliers.",
            serves_subgroup="the majority",
            confidence="medium",
        ),
        TripDirection(
            title="Split-track days",
            tradeoffs="More coordination, but each sub-group gets a signature day.",
            serves_subgroup="both sub-groups",
            confidence="medium",
        ),
    ]

    return ConsensusReport(
        headline="Where the group agrees and where it quietly doesn't.",
        agreement=agreement,
        silent_conflicts=conflicts,
        directions=directions,
    )


def adversarial_builder(aggregate: dict, trip: dict) -> ConsensusReport:
    """A misbehaving model: invents an ungrounded conflict (and one grounded in
    a fabricated flag) on top of any legitimate one. The code-level guardrail in
    ``surface_group_consensus`` must strip everything not grounded in a real flag."""
    flags = [str(f) for f in (aggregate.get("gap_flags") or [])]
    conflicts = [
        SilentConflict(
            topic="Vibes",
            severity="high",
            description="Invented tension with no deterministic basis.",
            who_should_talk="everyone",
            grounded_in=[],  # ungrounded -> must be stripped
        ),
        SilentConflict(
            topic="Ghost",
            severity="high",
            description="Grounded in a flag that doesn't exist for this group.",
            who_should_talk="everyone",
            grounded_in=["totally_made_up_flag"],  # must be stripped
        ),
    ]
    for flag in flags:  # one legitimately grounded conflict, must survive
        conflicts.append(
            SilentConflict(
                topic="Budget",
                severity="medium",
                description="Legit grounded conflict.",
                who_should_talk="the two budget sub-groups",
                grounded_in=[flag],
            )
        )
    return ConsensusReport(
        headline="Adversarial output.",
        agreement=["ok"],
        silent_conflicts=conflicts,
        directions=[
            TripDirection(title="A", tradeoffs="-", serves_subgroup="-", confidence="low"),
            TripDirection(title="B", tradeoffs="-", serves_subgroup="-", confidence="low"),
        ],
    )
