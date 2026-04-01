"""
Shared Pydantic response models used across routers.
Database ORM models (SQLAlchemy) will live in models/db.py once Neon is wired up.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class UserPublic(BaseModel):
    id: str
    name: str
    avatar_url: Optional[str]


class TripMember(BaseModel):
    user: UserPublic
    role: str  # organizer | member
    joined_at: datetime
    preference_submitted: bool


class PreferenceSummary(BaseModel):
    total_members: int
    responded: int
    budget_overlap: Optional[dict]  # {min, max} or None if no overlap
    dietary_union: list[str]
    style_distribution: dict[str, int]
    gap_flags: list[str]
    ai_summary: Optional[str]


class TaskPublic(BaseModel):
    id: str
    title: str
    category: str
    assigned_to: Optional[UserPublic]
    status: str
    due_date: Optional[date]


class ExpenseSplit(BaseModel):
    user: UserPublic
    amount_owed: int
    settled: bool


class ExpensePublic(BaseModel):
    id: str
    amount: int
    category: str
    paid_by: UserPublic
    split_type: str
    description: Optional[str]
    splits: list[ExpenseSplit]
    created_at: datetime


class SettlementEntry(BaseModel):
    from_user: UserPublic
    to_user: UserPublic
    amount: int  # in paise
    settled: bool
