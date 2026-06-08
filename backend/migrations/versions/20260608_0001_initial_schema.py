"""Initial backend schema."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

from src.models.todo import Base

import src.models.finance  # noqa: F401
import src.models.kanban  # noqa: F401
import src.models.kanban_task  # noqa: F401
import src.models.tag  # noqa: F401
import src.models.theme  # noqa: F401
import src.models.user  # noqa: F401

revision: str = "20260608_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _column_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table(table_name):
        return set()
    return {column["name"] for column in inspector.get_columns(table_name)}


def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    if column.name not in _column_names(table_name):
        op.add_column(table_name, column)


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)

    _add_column_if_missing(
        "folders",
        sa.Column("mode", sa.String(length=10), server_default="todo"),
    )
    _add_column_if_missing(
        "folders",
        sa.Column("icon_type", sa.String(length=10), server_default="color"),
    )
    _add_column_if_missing(
        "folders",
        sa.Column(
            "icon_value", sa.String(length=20), server_default="#6366f1"
        ),
    )
    _add_column_if_missing(
        "folders",
        sa.Column("kanban_config", sa.JSON(), nullable=True),
    )
    _add_column_if_missing(
        "finance_categories",
        sa.Column("icon_type", sa.String(length=10), server_default="emoji"),
    )
    _add_column_if_missing(
        "finance_categories",
        sa.Column(
            "icon_value", sa.String(length=20), server_default="\U0001f4c2"
        ),
    )


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
