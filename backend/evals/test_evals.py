"""Pytest entrypoint for the eval suite (CI-safe by default).

`pytest evals` runs every labeled scenario through the deterministic stub model
plus explicit guardrail tests. Live model runs are opt-in via RUN_LIVE_EVALS=1.
"""
import os

import pytest

from evals.fakes import adversarial_builder
from evals.harness import build_aggregate, check_report, run_scenario
from evals.scenarios import SCENARIOS


@pytest.mark.parametrize("scenario", SCENARIOS, ids=lambda s: s.name)
def test_scenario_invariants_with_stub_model(scenario):
    result = run_scenario(scenario, live=False)
    assert result.passed, f"{scenario.name}: {result.failures}"


@pytest.mark.parametrize(
    "scenario",
    [s for s in SCENARIOS if s.must_flag],
    ids=lambda s: s.name,
)
def test_guardrail_strips_ungrounded_conflicts(scenario):
    """Even when the model invents ungrounded conflicts, surface_group_consensus
    must keep only conflicts grounded in a real deterministic flag."""
    aggregate = build_aggregate(scenario)
    from evals.harness import _patched_client, run_surfacer

    with _patched_client(adversarial_builder):
        report = run_surfacer(aggregate, scenario.trip_meta)

    allowed = set(aggregate.get("gap_flags") or [])
    # The invented "Vibes"/"Ghost" conflicts must be gone.
    topics = {c.topic for c in report.silent_conflicts}
    assert "Vibes" not in topics
    assert "Ghost" not in topics
    # Everything that survives is grounded, and the legit one survived.
    for c in report.silent_conflicts:
        assert set(c.grounded_in) & allowed
    assert report.silent_conflicts, "the grounded conflict should survive"


def test_guardrail_forces_empty_conflicts_when_no_flags():
    """With no deterministic flags, an adversarial model's conflicts are all dropped."""
    clean = next(s for s in SCENARIOS if s.expect_no_conflicts and not s.expect_flags)
    aggregate = build_aggregate(clean)
    from evals.harness import _patched_client, run_surfacer

    with _patched_client(adversarial_builder):
        report = run_surfacer(aggregate, clean.trip_meta)
    assert report.silent_conflicts == []


@pytest.mark.skipif(
    os.getenv("RUN_LIVE_EVALS") != "1",
    reason="live model eval — set RUN_LIVE_EVALS=1 and a real ANTHROPIC_API_KEY",
)
@pytest.mark.parametrize("scenario", SCENARIOS, ids=lambda s: s.name)
def test_scenario_invariants_live_model(scenario):
    result = run_scenario(scenario, live=True)
    assert result.passed, f"{scenario.name}: {result.failures}"
