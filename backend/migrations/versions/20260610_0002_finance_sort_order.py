"""Add finance management sort order columns."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "20260610_0002"
down_revision: str | None = "20260608_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _column_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table(table_name):
        return set()
    return {column["name"] for column in inspector.get_columns(table_name)}


def _add_sort_order_if_missing(table_name: str) -> None:
    if "sort_order" not in _column_names(table_name):
        op.add_column(
            table_name,
            sa.Column("sort_order", sa.Integer(), server_default="0", nullable=True),
        )


def upgrade() -> None:
    for table_name in (
        "ledgers",
        "accounts",
        "finance_categories",
        "finance_tags",
        "budgets",
    ):
        _add_sort_order_if_missing(table_name)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    for table_name in (
        "budgets",
        "finance_tags",
        "finance_categories",
        "accounts",
        "ledgers",
    ):
        if inspector.has_table(table_name) and "sort_order" in {
            column["name"] for column in inspector.get_columns(table_name)
        }:
            op.drop_column(table_name, "sort_order")
