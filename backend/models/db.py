"""
SQLAlchemy ORM models — all V1 domains.
Response shapes (Pydantic) live in models/schemas.py.
"""
import uuid
from datetime import date, datetime, time

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base


# ── Users ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    trips_created: Mapped[list["Trip"]] = relationship("Trip", back_populates="creator", foreign_keys="Trip.created_by")
    memberships: Mapped[list["TripMember"]] = relationship("TripMember", back_populates="user")
    preferences: Mapped[list["Preference"]] = relationship("Preference", back_populates="user")
    tasks_assigned: Mapped[list["Task"]] = relationship("Task", back_populates="assignee")
    expenses_paid: Mapped[list["Expense"]] = relationship("Expense", back_populates="paid_by_user")
    expense_splits: Mapped[list["ExpenseSplit"]] = relationship("ExpenseSplit", back_populates="user")
    votes_created: Mapped[list["Vote"]] = relationship("Vote", back_populates="creator")
    vote_responses: Mapped[list["VoteResponse"]] = relationship("VoteResponse", back_populates="user")
    push_subscriptions: Mapped[list["PushSubscription"]] = relationship("PushSubscription", back_populates="user")
    itinerary_comments: Mapped[list["ItineraryComment"]] = relationship(
        "ItineraryComment", back_populates="user"
    )


# ── Trips ─────────────────────────────────────────────────────────────────────

class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    trip_type: Mapped[str] = mapped_column(String(50), default="leisure", nullable=False)
    group_size_estimate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("planning", "confirmed", "completed", "cancelled", name="trip_status"),
        default="planning",
        nullable=False,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    creator: Mapped["User"] = relationship("User", back_populates="trips_created", foreign_keys=[created_by])
    members: Mapped[list["TripMember"]] = relationship("TripMember", back_populates="trip", cascade="all, delete-orphan")
    preferences: Mapped[list["Preference"]] = relationship("Preference", back_populates="trip", cascade="all, delete-orphan")
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="trip", cascade="all, delete-orphan")
    expenses: Mapped[list["Expense"]] = relationship("Expense", back_populates="trip", cascade="all, delete-orphan")
    votes: Mapped[list["Vote"]] = relationship("Vote", back_populates="trip", cascade="all, delete-orphan")
    itinerary_items: Mapped[list["ItineraryItem"]] = relationship("ItineraryItem", back_populates="trip", cascade="all, delete-orphan")
    push_subscriptions: Mapped[list["PushSubscription"]] = relationship("PushSubscription", back_populates="trip", cascade="all, delete-orphan")


# ── Trip Members ──────────────────────────────────────────────────────────────

class TripMember(Base):
    __tablename__ = "trip_members"
    __table_args__ = (UniqueConstraint("trip_id", "user_id", name="uq_trip_member"),)

    trip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role: Mapped[str] = mapped_column(
        Enum("organizer", "member", name="member_role"),
        default="member",
        nullable=False,
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    preference_submitted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    trip: Mapped["Trip"] = relationship("Trip", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="memberships")


# ── Preferences ───────────────────────────────────────────────────────────────

class Preference(Base):
    __tablename__ = "preferences"
    __table_args__ = (UniqueConstraint("trip_id", "user_id", name="uq_trip_user_preference"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    budget_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    budget_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dietary: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    trip_style: Mapped[str | None] = mapped_column(String(100), nullable=True)
    constraints: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    trip: Mapped["Trip"] = relationship("Trip", back_populates="preferences")
    user: Mapped["User"] = relationship("User", back_populates="preferences")


# ── Tasks ─────────────────────────────────────────────────────────────────────

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("todo", "in_progress", "done", name="task_status"),
        default="todo",
        nullable=False,
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    trip: Mapped["Trip"] = relationship("Trip", back_populates="tasks")
    assignee: Mapped["User | None"] = relationship("User", back_populates="tasks_assigned", foreign_keys=[assigned_to])


# ── Expenses ──────────────────────────────────────────────────────────────────

class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)  # stored in paise
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    paid_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    split_type: Mapped[str] = mapped_column(
        Enum("equal", "custom", "category_owner", name="split_type"),
        default="equal",
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    trip: Mapped["Trip"] = relationship("Trip", back_populates="expenses")
    paid_by_user: Mapped["User"] = relationship("User", back_populates="expenses_paid", foreign_keys=[paid_by])
    splits: Mapped[list["ExpenseSplit"]] = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount_owed: Mapped[int] = mapped_column(BigInteger, nullable=False)  # in paise
    settled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    expense: Mapped["Expense"] = relationship("Expense", back_populates="splits")
    user: Mapped["User"] = relationship("User", back_populates="expense_splits")


# ── Votes ─────────────────────────────────────────────────────────────────────

class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    topic: Mapped[str] = mapped_column(String(500), nullable=False)
    options: Mapped[dict] = mapped_column(JSONB, nullable=False)  # {"options": ["Option A", "Option B"]}
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    trip: Mapped["Trip"] = relationship("Trip", back_populates="votes")
    creator: Mapped["User"] = relationship("User", back_populates="votes_created", foreign_keys=[created_by])
    responses: Mapped[list["VoteResponse"]] = relationship("VoteResponse", back_populates="vote", cascade="all, delete-orphan")


class VoteResponse(Base):
    __tablename__ = "vote_responses"
    __table_args__ = (UniqueConstraint("vote_id", "user_id", name="uq_vote_user"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vote_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("votes.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    selected: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vote: Mapped["Vote"] = relationship("Vote", back_populates="responses")
    user: Mapped["User"] = relationship("User", back_populates="vote_responses")


# ── Itinerary ─────────────────────────────────────────────────────────────────

class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    cost_estimate: Mapped[int | None] = mapped_column(BigInteger, nullable=True)  # paise
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    sub_group: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    trip: Mapped["Trip"] = relationship("Trip", back_populates="itinerary_items")
    comments: Mapped[list["ItineraryComment"]] = relationship(
        "ItineraryComment", back_populates="itinerary_item", cascade="all, delete-orphan"
    )


class ItineraryComment(Base):
    __tablename__ = "itinerary_comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    itinerary_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("itinerary_items.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    itinerary_item: Mapped["ItineraryItem"] = relationship("ItineraryItem", back_populates="comments")
    user: Mapped["User"] = relationship("User", back_populates="itinerary_comments")


# ── Push Subscriptions ────────────────────────────────────────────────────────

class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    __table_args__ = (UniqueConstraint("trip_id", "user_id", name="uq_push_trip_user"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    endpoint: Mapped[str] = mapped_column(Text, nullable=False)
    p256dh: Mapped[str] = mapped_column(Text, nullable=False)
    auth: Mapped[str] = mapped_column(Text, nullable=False)
    raw: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    trip: Mapped["Trip"] = relationship("Trip", back_populates="push_subscriptions")
    user: Mapped["User"] = relationship("User", back_populates="push_subscriptions")
