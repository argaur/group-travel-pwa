"""Runner + invariant checks shared by the CLI (`run.py`) and pytest."""
from __future__ import annotations

import asyncio
import json
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Callable, Optional

import services.ai as ai
from services.ai import ConsensusReport
from services.preference_summary import aggregate_preferences

from evals.fakes import FakeClient, honest_builder
from evals.scenarios import EvalScenario

# Attribution phrases a properly anonymized report must never contain.
FORBIDDEN_ATTRIBUTION = [
    "one person",
    "someone said",
    "a member said",
    "one member said",
    "individual named",
    "this person",
]


@dataclass
class CheckResult:
    scenario: str
    passed: bool
    failures: list[str]


@contextmanager
def _patched_client(builder: Callable[[dict, dict], ConsensusReport]):
    """Swap ai.client for a deterministic fake for the duration of the block."""
    original = ai.client
    ai.client = FakeClient(builder)
    try:
        yield
    finally:
        ai.client = original


def build_aggregate(scenario: EvalScenario) -> dict:
    return aggregate_preferences(scenario.prefs)


def run_surfacer(aggregate: dict, trip_meta: dict) -> ConsensusReport:
    return asyncio.run(ai.surface_group_consensus(aggregate, trip_meta))


def check_report(scenario: EvalScenario, aggregate: dict, report: ConsensusReport) -> CheckResult:
    """Assert every invariant for one scenario against a produced report."""
    failures: list[str] = []
    allowed = set(aggregate.get("gap_flags") or [])

    # 0. Self-check: the deterministic layer produced the flags this scenario expects.
    if allowed != scenario.expect_flags:
        failures.append(
            f"aggregator flags {allowed} != expected {scenario.expect_flags}"
        )

    # 1. Valid structured output.
    if not isinstance(report, ConsensusReport):
        failures.append("report is not a ConsensusReport")
        return CheckResult(scenario.name, False, failures)

    # 2. Grounding invariant: every silent conflict cites a real deterministic flag.
    for c in report.silent_conflicts:
        if not (set(c.grounded_in) & allowed):
            failures.append(
                f"silent conflict '{c.topic}' not grounded in {allowed}: {c.grounded_in}"
            )

    # 3. must-flag / must-not-flag.
    if scenario.expect_no_conflicts and report.silent_conflicts:
        failures.append(
            f"expected no conflicts, got {len(report.silent_conflicts)}"
        )
    if scenario.must_flag:
        grounded_flags = {f for c in report.silent_conflicts for f in c.grounded_in}
        missing = scenario.must_flag - grounded_flags
        if missing:
            failures.append(f"expected a grounded conflict for {missing}")

    # 4. Anonymity invariant: never surfaces an individual.
    blob = json.dumps(report.model_dump(), default=str).lower()
    for phrase in FORBIDDEN_ATTRIBUTION:
        if phrase in blob:
            failures.append(f"anonymity breach: report contains '{phrase}'")

    # 5. Structural sanity on directions.
    if not report.directions:
        failures.append("report has no directions")

    return CheckResult(scenario.name, not failures, failures)


def run_scenario(
    scenario: EvalScenario,
    builder: Optional[Callable[[dict, dict], ConsensusReport]] = None,
    live: bool = False,
) -> CheckResult:
    """Run one scenario and return its check result.

    live=False (default): uses the deterministic stub model (CI-safe).
    live=True: hits the real Anthropic model via the unpatched client.
    """
    aggregate = build_aggregate(scenario)
    try:
        if live:
            report = run_surfacer(aggregate, scenario.trip_meta)
        else:
            with _patched_client(builder or honest_builder):
                report = run_surfacer(aggregate, scenario.trip_meta)
    except ai.InsufficientResponsesError:
        # The model was never called — correct behaviour whenever the scenario
        # itself expects no basis for surfacing tension (see routers/preferences.py's
        # identical gate). Any scenario that *does* expect a report is a real failure.
        if scenario.expect_no_conflicts and not scenario.must_flag:
            return CheckResult(scenario.name, True, [])
        return CheckResult(
            scenario.name,
            False,
            ["InsufficientResponsesError raised but this scenario expects a report"],
        )
    return check_report(scenario, aggregate, report)
