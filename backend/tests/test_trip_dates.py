"""Trip dates: an end date before the start date is rejected."""
from datetime import date

import pytest
from pydantic import ValidationError

from routers.trips import TripCreate


def test_end_before_start_is_rejected():
    with pytest.raises(ValidationError, match="end_date"):
        TripCreate(name="x", start_date=date(2026, 8, 13), end_date=date(2026, 7, 26))


def test_same_day_trip_is_allowed():
    TripCreate(name="x", start_date=date(2026, 8, 13), end_date=date(2026, 8, 13))


def test_open_ended_dates_are_allowed():
    TripCreate(name="x", start_date=date(2026, 8, 13))
    TripCreate(name="x", end_date=date(2026, 8, 13))
    TripCreate(name="x")
