"""Add focus timer sessions."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "20260622_0003"
down_revision: str | None = "20260610_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _has_table(table_name: str) -> bool:
    bind = op.get_bind()
    return inspect(bind).has_table(table_name)


def upgrade() -> None:
    if not _has_table("focus_sessions"):
        op.create_table(
            "focus_sessions",
            sa.Column(
                "id", sa.Integer(), primary_key=True, autoincrement=True
            ),
            sa.Column(
                "user_id",
                sa.Integer(),
                sa.ForeignKey("auth_users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "folder_id",
                sa.Integer(),
                sa.ForeignKey("folders.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("name", sa.String(length=120), nullable=False),
            sa.Column(
                "mode",
                sa.String(length=20),
                nullable=False,
                server_default="pomodoro",
            ),
            sa.Column("planned_seconds", sa.Integer(), nullable=True),
            sa.Column(
                "focus_seconds",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
            sa.Column(
                "pause_count",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
            sa.Column(
                "pause_seconds",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
            sa.Column(
                "rest_seconds",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
            sa.Column("started_at", sa.DateTime(), nullable=False),
            sa.Column("ended_at", sa.DateTime(), nullable=True),
            sa.Column(
                "abandoned",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
            sa.Column("summary", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=True,
                server_default=sa.func.now(),
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=True,
                server_default=sa.func.now(),
            ),
        )
        op.create_index(
            "ix_focus_sessions_user_id", "focus_sessions", ["user_id"]
        )
        op.create_index(
            "idx_focus_sessions_user_started",
            "focus_sessions",
            ["user_id", "started_at"],
        )
        op.create_index(
            "idx_focus_sessions_user_folder",
            "focus_sessions",
            ["user_id", "folder_id"],
        )
        op.create_index(
            "idx_focus_sessions_user_abandoned",
            "focus_sessions",
            ["user_id", "abandoned"],
        )

    if not _has_table("focus_session_tags"):
        op.create_table(
            "focus_session_tags",
            sa.Column(
                "focus_session_id",
                sa.Integer(),
                sa.ForeignKey("focus_sessions.id", ondelete="CASCADE"),
                primary_key=True,
            ),
            sa.Column(
                "tag_id",
                sa.Integer(),
                sa.ForeignKey("tags.id", ondelete="CASCADE"),
                primary_key=True,
            ),
        )


def downgrade() -> None:
    if _has_table("focus_session_tags"):
        op.drop_table("focus_session_tags")
    if _has_table("focus_sessions"):
        op.drop_index(
            "idx_focus_sessions_user_abandoned",
            table_name="focus_sessions",
        )
        op.drop_index(
            "idx_focus_sessions_user_folder",
            table_name="focus_sessions",
        )
        op.drop_index(
            "idx_focus_sessions_user_started",
            table_name="focus_sessions",
        )
        op.drop_index("ix_focus_sessions_user_id", table_name="focus_sessions")
        op.drop_table("focus_sessions")
