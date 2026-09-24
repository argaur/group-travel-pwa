"""Aggregate anonymous preference statistics (no per-user exposure)."""
from collections import Counter
from typing import Any


def _budget_band(midpoint: float) -> str:
    if midpoint <= 5000:
        return "₹0 – ₹5k / day"
    if midpoint <= 10000:
        return "₹5k – ₹10k / day"
    if midpoint <= 20000:
        return "₹10k – ₹20k / day"
    return "₹20k+ / day"


def aggregate_preferences(preferences: list[Any]) -> dict:
    """
    preferences: ORM Preference rows with budget_min/max, dietary, trip_style, constraints.
    """
    budget_ranges = [
        (p.budget_min, p.budget_max)
        for p in preferences
        if p.budget_min is not None and p.budget_max is not None
    ]
    if budget_ranges:
        overlap_min = max(b[0] for b in budget_ranges)
        overlap_max = min(b[1] for b in budget_ranges)
        budget_overlap = {"min": overlap_min, "max": overlap_max} if overlap_min <= overlap_max else None
        global_min = min(b[0] for b in budget_ranges)
        global_max = max(b[1] for b in budget_ranges)
    else:
        budget_overlap = None
        global_min = global_max = None

    dietary_union = sorted({d for p in preferences for d in (p.dietary or [])})
    dietary_distribution = dict(
        Counter(tag for p in preferences for tag in (p.dietary or []) if tag)
    )
    styles = [p.trip_style for p in preferences if p.trip_style]
    style_distribution = dict(Counter(styles))

    constraint_distribution: dict[str, int] = {}
    for p in preferences:
        for c in p.constraints or []:
            constraint_distribution[c] = constraint_distribution.get(c, 0) + 1

    budget_band_distribution: dict[str, int] = {}
    for p in preferences:
        if p.budget_min is not None and p.budget_max is not None:
            mid = (p.budget_min + p.budget_max) / 2
            band = _budget_band(mid)
            budget_band_distribution[band] = budget_band_distribution.get(band, 0) + 1

    gap_flags: list[str] = []
    if budget_ranges and global_min is not None and global_max is not None:
        spread = global_max - global_min
        if global_max > 0 and (spread / global_max) > 0.4:
            gap_flags.append("budget_gap")
        if budget_overlap is None:
            gap_flags.append("no_budget_overlap")

    summary = "Group preference summary is based on current responses."
    return {
        "summary": summary,
        "respondent_count": len(preferences),
        "budget_overlap": budget_overlap,
        "dietary_union": dietary_union,
        "dietary_distribution": dietary_distribution,
        "style_distribution": style_distribution,
        "constraint_distribution": constraint_distribution,
        "budget_band_distribution": budget_band_distribution,
        "gap_flags": gap_flags,
    }
