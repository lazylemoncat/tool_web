"""Add persisted calendar events."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "20260617_0003"
down_revision: str | None = "20260610_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if inspector.has_table("calendar_events"):
        return

    op.create_table(
        "calendar_events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("auth_users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_at", sa.DateTime(), nullable=False),
        sa.Column("end_at", sa.DateTime(), nullable=True),
        sa.Column("all_day", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column(
            "source_id",
            sa.String(length=50),
            nullable=False,
            server_default="src-manual",
        ),
        sa.Column(
            "source_type",
            sa.String(length=32),
            nullable=False,
            server_default="manual",
        ),
        sa.Column("color", sa.String(length=9), nullable=True),
        sa.Column("icon", sa.String(length=32), nullable=True),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column(
            "repeat_rule",
            sa.String(length=16),
            nullable=False,
            server_default="none",
        ),
        sa.Column(
            "reminder",
            sa.String(length=16),
            nullable=False,
            server_default="none",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "idx_calendar_events_user_start",
        "calendar_events",
        ["user_id", "start_at"],
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if inspector.has_table("calendar_events"):
        op.drop_index(
            "idx_calendar_events_user_start",
            table_name="calendar_events",
        )
        op.drop_table("calendar_events")
