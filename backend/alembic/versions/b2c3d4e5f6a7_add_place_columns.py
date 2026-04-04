"""add place columns to trips and itinerary_items

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-04 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Place columns on trips
    op.add_column("trips", sa.Column("place_id", sa.String(255), nullable=True))
    op.add_column("trips", sa.Column("place_name", sa.String(500), nullable=True))
    op.add_column("trips", sa.Column("place_photo_url", sa.Text(), nullable=True))
    op.add_column("trips", sa.Column("place_rating", sa.Numeric(3, 1), nullable=True))

    # Place columns on itinerary_items
    op.add_column("itinerary_items", sa.Column("place_id", sa.String(255), nullable=True))
    op.add_column("itinerary_items", sa.Column("place_name", sa.String(500), nullable=True))
    op.add_column("itinerary_items", sa.Column("place_photo_url", sa.Text(), nullable=True))
    op.add_column("itinerary_items", sa.Column("place_rating", sa.Numeric(3, 1), nullable=True))


def downgrade() -> None:
    op.drop_column("itinerary_items", "place_rating")
    op.drop_column("itinerary_items", "place_photo_url")
    op.drop_column("itinerary_items", "place_name")
    op.drop_column("itinerary_items", "place_id")
    op.drop_column("trips", "place_rating")
    op.drop_column("trips", "place_photo_url")
    op.drop_column("trips", "place_name")
    op.drop_column("trips", "place_id")
