"""Labeled synthetic scenarios for the Silent Conflict Surfacer.

Each scenario is built from realistic per-member preferences, run through the
*deterministic* aggregator (services.preference_summary.aggregate_preferences),
and paired with the invariants the surfacer must satisfy for that input. Building
the aggregate from real preferences (rather than hand-writing gap_flags) means the
eval exercises the whole deterministic -> LLM pipeline, and each scenario's
`expect_flags` is asserted against the aggregator as a self-check.

Design note — grounding: the deterministic layer only emits *budget* gap flags
(`budget_gap`, `no_budget_overlap`). A silent conflict is valid only if it cites
one of those flags. So dietary/style splits with no budget flag must NOT produce a
silent conflict — the surfacer must not fabricate tension the math didn't find.
That anti-hallucination property is exactly what several scenarios below assert.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Pref:
    """Stand-in for an ORM Preference row (attribute-compatible)."""
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    dietary: list[str] = field(default_factory=list)
    trip_style: Optional[str] = None
    constraints: list[str] = field(default_factory=list)


@dataclass
class EvalScenario:
    name: str
    category: str
    description: str
    prefs: list[Pref]
    trip_meta: dict
    # Deterministic gap flags this scenario is expected to produce (self-check
    # against the aggregator).
    expect_flags: set[str]
    # True => surfacer must return zero silent_conflicts (must-not-flag).
    expect_no_conflicts: bool
    # Flags that MUST appear grounded in at least one silent_conflict
    # (must-flag). Empty for must-not-flag scenarios.
    must_flag: set[str] = field(default_factory=set)


_META = {"origin": "Bengaluru", "trip_type": "leisure", "duration": "a long weekend"}


SCENARIOS: list[EvalScenario] = [
    EvalScenario(
        name="clear_consensus",
        category="clear consensus",
        description="Everyone within a tight budget band, same trip style.",
        prefs=[
            Pref(5000, 8000, ["vegetarian"], "relaxed"),
            Pref(6000, 7000, ["vegetarian"], "relaxed"),
            Pref(5500, 7500, [], "relaxed"),
        ],
        trip_meta={**_META, "size": 3},
        expect_flags=set(),
        expect_no_conflicts=True,
    ),
    EvalScenario(
        name="hidden_budget_split",
        category="hidden budget split",
        description="Two sub-groups with non-overlapping budgets nobody voiced.",
        prefs=[
            Pref(1000, 3000, [], "relaxed"),
            Pref(8000, 12000, [], "adventure"),
        ],
        trip_meta={**_META, "size": 2},
        expect_flags={"no_budget_overlap", "budget_gap"},
        expect_no_conflicts=False,
        must_flag={"no_budget_overlap"},
    ),
    EvalScenario(
        name="wide_budget_gap_with_overlap",
        category="hidden budget split",
        description="Budgets technically overlap but the spread is very wide.",
        prefs=[
            Pref(1000, 9000, [], "relaxed"),
            Pref(2000, 10000, [], "relaxed"),
        ],
        trip_meta={**_META, "size": 2},
        expect_flags={"budget_gap"},
        expect_no_conflicts=False,
        must_flag={"budget_gap"},
    ),
    EvalScenario(
        name="extreme_budget_split",
        category="hidden budget split",
        description="Backpacker vs luxury — no overlap and a huge spread.",
        prefs=[
            Pref(1000, 2000, [], "relaxed"),
            Pref(20000, 30000, [], "luxury"),
        ],
        trip_meta={**_META, "size": 2},
        expect_flags={"no_budget_overlap", "budget_gap"},
        expect_no_conflicts=False,
        must_flag={"no_budget_overlap", "budget_gap"},
    ),
    EvalScenario(
        name="dietary_split_budget_aligned",
        category="dietary conflict",
        description="Real dietary split but aligned budgets — no budget flag, so "
        "the surfacer must NOT manufacture a silent conflict.",
        prefs=[
            Pref(5000, 8000, ["vegan"], "relaxed"),
            Pref(6000, 7000, ["non_vegetarian"], "relaxed"),
        ],
        trip_meta={**_META, "size": 2},
        expect_flags=set(),
        expect_no_conflicts=True,
    ),
    EvalScenario(
        name="dietary_and_budget_split",
        category="dietary conflict",
        description="Dietary split AND a budget split — budget is grounded and "
        "must flag; dietary alone must not spawn its own silent conflict.",
        prefs=[
            Pref(1000, 3000, ["vegan"], "relaxed"),
            Pref(9000, 12000, ["non_vegetarian"], "luxury"),
        ],
        trip_meta={**_META, "size": 2},
        expect_flags={"no_budget_overlap", "budget_gap"},
        expect_no_conflicts=False,
        must_flag={"no_budget_overlap"},
    ),
    EvalScenario(
        name="too_few_responses",
        category="too few responses",
        description="A single response — no basis for surfacing group tension.",
        prefs=[
            Pref(5000, 8000, ["vegetarian"], "relaxed"),
        ],
        trip_meta={**_META, "size": 1},
        expect_flags=set(),
        expect_no_conflicts=True,
    ),
    EvalScenario(
        name="mixed_styles_budget_aligned",
        category="no real conflict",
        description="Trip-style spread but aligned budgets — style is not a "
        "deterministic flag, so no silent conflict.",
        prefs=[
            Pref(6000, 8000, [], "relaxed"),
            Pref(6500, 7500, [], "adventure"),
            Pref(6000, 7800, [], "party"),
        ],
        trip_meta={**_META, "size": 3},
        expect_flags=set(),
        expect_no_conflicts=True,
    ),
    EvalScenario(
        name="large_group_consensus",
        category="no real conflict",
        description="Five members, tightly aligned budgets.",
        prefs=[Pref(6000, 8000, [], "relaxed") for _ in range(5)],
        trip_meta={**_META, "size": 5},
        expect_flags=set(),
        expect_no_conflicts=True,
    ),
    EvalScenario(
        name="narrow_spread_no_flag",
        category="no real conflict",
        description="Spread just under the 40% budget-gap threshold.",
        prefs=[
            Pref(5000, 7000, [], "relaxed"),
            Pref(5500, 7500, [], "relaxed"),
        ],
        trip_meta={**_META, "size": 2},
        expect_flags=set(),
        expect_no_conflicts=True,
    ),
]
