"""Unit tests for aggregate_preferences (services.preference_summary).

The function reads ORM Preference rows by attribute, so a lightweight stub with
the same attributes stands in for the DB rows.
"""
from dataclasses import dataclass, field

from services.preference_summary import aggregate_preferences


@dataclass
class Pref:
    budget_min: int | None = None
    budget_max: int | None = None
    dietary: list[str] = field(default_factory=list)
    trip_style: str | None = None
    constraints: list[str] = field(default_factory=list)


def test_empty_preferences():
    agg = aggregate_preferences([])
    assert agg["budget_overlap"] is None
    assert agg["gap_flags"] == []
    assert agg["dietary_union"] == []
    assert agg["style_distribution"] == {}


def test_overlapping_budgets_no_gap_flags():
    prefs = [Pref(budget_min=5000, budget_max=8000), Pref(budget_min=6000, budget_max=7000)]
    agg = aggregate_preferences(prefs)
    assert agg["budget_overlap"] == {"min": 6000, "max": 7000}
    assert "no_budget_overlap" not in agg["gap_flags"]
    assert "budget_gap" not in agg["gap_flags"]


def test_non_overlapping_budgets_flag_no_overlap():
    # Hidden budget split: ranges don't intersect at all.
    prefs = [Pref(budget_min=1000, budget_max=3000), Pref(budget_min=8000, budget_max=12000)]
    agg = aggregate_preferences(prefs)
    assert agg["budget_overlap"] is None
    assert "no_budget_overlap" in agg["gap_flags"]


def test_wide_spread_flags_budget_gap_even_with_overlap():
    # Overlap exists (2000..9000) but the spread is large -> budget_gap only.
    prefs = [Pref(budget_min=1000, budget_max=9000), Pref(budget_min=2000, budget_max=10000)]
    agg = aggregate_preferences(prefs)
    assert agg["budget_overlap"] == {"min": 2000, "max": 9000}
    assert "budget_gap" in agg["gap_flags"]
    assert "no_budget_overlap" not in agg["gap_flags"]


def test_narrow_spread_has_no_budget_gap():
    prefs = [Pref(budget_min=5000, budget_max=8000), Pref(budget_min=6000, budget_max=7000)]
    agg = aggregate_preferences(prefs)
    # spread 3000 / max 8000 = 0.375 < 0.4 threshold
    assert "budget_gap" not in agg["gap_flags"]


def test_dietary_union_and_distribution():
    prefs = [
        Pref(dietary=["vegetarian", "no_pork"]),
        Pref(dietary=["vegetarian"]),
        Pref(dietary=["vegan"]),
    ]
    agg = aggregate_preferences(prefs)
    assert agg["dietary_union"] == ["no_pork", "vegan", "vegetarian"]  # sorted
    assert agg["dietary_distribution"]["vegetarian"] == 2
    assert agg["dietary_distribution"]["vegan"] == 1


def test_style_distribution():
    prefs = [Pref(trip_style="relaxed"), Pref(trip_style="relaxed"), Pref(trip_style="adventure")]
    agg = aggregate_preferences(prefs)
    assert agg["style_distribution"] == {"relaxed": 2, "adventure": 1}


def test_constraint_distribution():
    prefs = [Pref(constraints=["no_flights"]), Pref(constraints=["no_flights", "weekend_only"])]
    agg = aggregate_preferences(prefs)
    assert agg["constraint_distribution"]["no_flights"] == 2
    assert agg["constraint_distribution"]["weekend_only"] == 1


def test_budget_band_distribution():
    prefs = [
        Pref(budget_min=2000, budget_max=4000),   # mid 3000 -> ₹0 – ₹5k / day
        Pref(budget_min=6000, budget_max=8000),   # mid 7000 -> ₹5k – ₹10k / day
    ]
    agg = aggregate_preferences(prefs)
    assert agg["budget_band_distribution"]["₹0 – ₹5k / day"] == 1
    assert agg["budget_band_distribution"]["₹5k – ₹10k / day"] == 1


def test_preferences_with_missing_budget_are_skipped():
    prefs = [Pref(budget_min=5000, budget_max=8000), Pref(trip_style="relaxed")]
    agg = aggregate_preferences(prefs)
    # Only one row contributes a budget range; still computes cleanly.
    assert agg["budget_overlap"] == {"min": 5000, "max": 8000}
    assert agg["style_distribution"] == {"relaxed": 1}
