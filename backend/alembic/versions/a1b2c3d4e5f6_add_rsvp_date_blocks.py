"""add rsvp status to trip_members and date_blocks table

Revision ID: a1b2c3d4e5f6
Revises: 8d9e1fcb2a44
Create Date: 2026-04-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "8d9e1fcb2a44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add RSVP columns to trip_members
    op.add_column(
        "trip_members",
        sa.Column("rsvp_status", sa.String(length=20), nullable=False, server_default="pending"),
    )
    op.add_column(
        "trip_members",
        sa.Column("rsvp_updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Create date_blocks table
    op.create_table(
        "date_blocks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("trip_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("blocked_date", sa.Date(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("trip_id", "user_id", "blocked_date", name="uq_date_block"),
    )


def downgrade() -> None:
    op.drop_table("date_blocks")
    op.drop_column("trip_members", "rsvp_updated_at")
    op.drop_column("trip_members", "rsvp_status")
