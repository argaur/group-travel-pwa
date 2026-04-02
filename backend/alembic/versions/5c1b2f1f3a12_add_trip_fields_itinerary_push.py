"""add trip fields, itinerary, push subscriptions

Revision ID: 5c1b2f1f3a12
Revises: 3af7e7feae4d
Create Date: 2026-04-02 21:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "5c1b2f1f3a12"
down_revision: Union[str, None] = "3af7e7feae4d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Trips: add trip_type + group_size_estimate
    op.add_column("trips", sa.Column("trip_type", sa.String(length=50), nullable=False, server_default="leisure"))
    op.add_column("trips", sa.Column("group_size_estimate", sa.Integer(), nullable=True))

    # Preferences: add constraints + notes
    op.add_column("preferences", sa.Column("constraints", postgresql.ARRAY(sa.String()), nullable=True))
    op.add_column("preferences", sa.Column("notes", sa.Text(), nullable=True))

    # Expenses: add enum value for category_owner
    op.execute("ALTER TYPE split_type ADD VALUE IF NOT EXISTS 'category_owner'")

    # Itinerary items
    op.create_table(
        "itinerary_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("trip_id", sa.UUID(), nullable=False),
        sa.Column("day_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("cost_estimate", sa.BigInteger(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("assigned_to", sa.UUID(), nullable=True),
        sa.Column("sub_group", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assigned_to"], ["users.id"]),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Push subscriptions
    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("trip_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False),
        sa.Column("p256dh", sa.Text(), nullable=False),
        sa.Column("auth", sa.Text(), nullable=False),
        sa.Column("raw", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("trip_id", "user_id", name="uq_push_trip_user"),
    )


def downgrade() -> None:
    op.drop_table("push_subscriptions")
    op.drop_table("itinerary_items")
    op.drop_column("preferences", "notes")
    op.drop_column("preferences", "constraints")
    op.drop_column("trips", "group_size_estimate")
    op.drop_column("trips", "trip_type")
