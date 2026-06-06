"""Finance module Pydantic schemas."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from dateutil.rrule import rrulestr
from pydantic import BaseModel, Field, field_validator


class ReorderItem(BaseModel):
    id: int
    sort_order: int


class ReorderBatch(BaseModel):
    items: list[ReorderItem]


class PaginatedResponse[T](BaseModel):
    items: list[T]
    total: int
    skip: int
    limit: int


class LedgerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    icon: str = "\U0001f4b0"
    currency: str = Field(default="CNY", min_length=1, max_length=10)


class LedgerUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    icon: str | None = None
    currency: str | None = Field(None, min_length=1, max_length=10)


class LedgerOut(BaseModel):
    id: int
    name: str
    icon: str
    currency: str
    created_at: datetime
    model_config = {"from_attributes": True}


class AccountCreate(BaseModel):
    ledger_id: int
    name: str = Field(min_length=1, max_length=50)
    type: str = "cash"
    currency: str = Field(default="CNY", min_length=1, max_length=10)
    initial_balance: Decimal = Field(default=Decimal("0"), ge=0)


class AccountUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    type: str | None = None
    currency: str | None = Field(None, min_length=1, max_length=10)
    initial_balance: Decimal | None = None
    archived: bool | None = None


class AccountOut(BaseModel):
    id: int
    ledger_id: int
    name: str
    type: str
    currency: str
    initial_balance: Decimal
    archived: bool
    created_at: datetime
    updated_at: datetime
    current_balance: Decimal = Decimal("0")
    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    ledger_id: int
    parent_id: int | None = None
    name: str = Field(min_length=1, max_length=50)
    icon: str = "\U0001f4c2"


class CategoryUpdate(BaseModel):
    parent_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=50)
    icon: str | None = None


class CategoryOut(BaseModel):
    id: int
    ledger_id: int
    parent_id: int | None = None
    name: str
    icon: str
    created_at: datetime
    children: list[CategoryOut] = []
    model_config = {"from_attributes": True}


class FinanceTagCreate(BaseModel):
    ledger_id: int
    name: str = Field(min_length=1, max_length=50)


class FinanceTagOut(BaseModel):
    id: int
    ledger_id: int
    name: str
    model_config = {"from_attributes": True}


class SplitItemCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    category_id: int | None = None
    note: str | None = Field(None, max_length=500)


class SplitItemOut(BaseModel):
    id: int
    transaction_id: int
    amount: Decimal
    category_id: int | None = None
    note: str | None = None
    category: CategoryOut | None = None
    model_config = {"from_attributes": True}


class TransactionCreate(BaseModel):
    ledger_id: int
    account_id: int
    type: str = Field(pattern="^(expense|income|transfer)$")
    amount: Decimal = Field(gt=0)
    currency: str = Field(default="CNY")
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    category_id: int | None = None
    note: str | None = Field(None, max_length=2000)
    event_id: int | None = None
    parent_transaction_id: int | None = None
    sort_order: int = 0
    tag_ids: list[int] = []
    split_items: list[SplitItemCreate] = []
    attachment_ids: list[int] = []
    linked_todo_ids: list[int] = []


class TransactionUpdate(BaseModel):
    account_id: int | None = None
    type: str | None = Field(None, pattern="^(expense|income|transfer)$")
    amount: Decimal | None = Field(None, gt=0)
    currency: str | None = None
    occurred_at: datetime | None = None
    category_id: int | None = None
    note: str | None = None
    event_id: int | None = None
    parent_transaction_id: int | None = None
    sort_order: int | None = None
    tag_ids: list[int] | None = None
    split_items: list[SplitItemCreate] | None = None
    attachment_ids: list[int] | None = None
    linked_todo_ids: list[int] | None = None


class TransactionOut(BaseModel):
    id: int
    ledger_id: int
    account_id: int
    type: str
    amount: Decimal
    currency: str
    occurred_at: datetime
    recorded_at: datetime
    category_id: int | None = None
    note: str | None = None
    event_id: int | None = None
    parent_transaction_id: int | None = None
    sort_order: int
    created_at: datetime
    updated_at: datetime
    account: AccountOut | None = None
    category: CategoryOut | None = None
    event: EventOut | None = None
    tags: list[FinanceTagOut] = []
    split_items: list[SplitItemOut] = []
    attachments: list[AttachmentOut] = []
    linked_todos: list[dict] = []
    children: list[TransactionOut] = []
    model_config = {"from_attributes": True}


class TransactionFilter(BaseModel):
    ledger_id: int | None = None
    account_id: int | None = None
    category_id: int | None = None
    tag_id: int | None = None
    event_id: int | None = None
    type: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    min_amount: Decimal | None = None
    max_amount: Decimal | None = None
    search: str | None = None


class TransactionListResponse(BaseModel):
    items: list[TransactionOut]
    total: int
    skip: int
    limit: int


class EventCreate(BaseModel):
    ledger_id: int
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(None, max_length=5000)
    start_at: datetime | None = None
    end_at: datetime | None = None
    color: str = "#6366f1"


class EventUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    color: str | None = None


class EventOut(BaseModel):
    id: int
    ledger_id: int
    name: str
    description: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    color: str
    created_at: datetime
    updated_at: datetime
    transaction_count: int = 0
    total_amount: Decimal = Decimal("0")
    model_config = {"from_attributes": True}


class EventSummary(BaseModel):
    event: EventOut
    transactions: list[TransactionOut] = []
    total_expense: Decimal = Decimal("0")
    total_income: Decimal = Decimal("0")


class BudgetCreate(BaseModel):
    ledger_id: int
    name: str = Field(min_length=1, max_length=100)
    amount: Decimal = Field(gt=0)
    currency: str = Field(default="CNY")
    rrule: str | None = None
    filters: dict | None = None
    rollover: bool = False
    alert_threshold: int = Field(default=80, ge=1, le=100)

    @field_validator("rrule")
    @classmethod
    def validate_rrule(cls, v: str | None) -> str | None:
        if v is not None:
            try:
                rrulestr(v)
            except (ValueError, TypeError):
                raise ValueError(f"Invalid RRULE: {v}")
        return v


class BudgetUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    amount: Decimal | None = Field(None, gt=0)
    currency: str | None = None
    rrule: str | None = None
    filters: dict | None = None
    rollover: bool | None = None
    alert_threshold: int | None = Field(None, ge=1, le=100)


class BudgetOut(BaseModel):
    id: int
    ledger_id: int
    name: str
    amount: Decimal
    currency: str
    rrule: str | None = None
    filters: dict | None = None
    rollover: bool
    alert_threshold: int
    created_at: datetime
    updated_at: datetime
    current_spent: Decimal = Decimal("0")
    progress_pct: float = 0.0
    model_config = {"from_attributes": True}


class AttachmentOut(BaseModel):
    id: int
    url: str
    mime_type: str
    size: int
    created_at: datetime
    model_config = {"from_attributes": True}


class DashboardSummary(BaseModel):
    total_assets: Decimal = Decimal("0")
    month_income: Decimal = Decimal("0")
    month_expense: Decimal = Decimal("0")
    budget_usage_pct: float = 0.0
    recent_transactions: list[TransactionOut] = []
    budgets: list[BudgetOut] = []


class CategoryStatsItem(BaseModel):
    category_name: str
    category_icon: str
    total: Decimal
    color: str


class TrendStatsItem(BaseModel):
    month: str
    income: Decimal
    expense: Decimal


class StatsResponse(BaseModel):
    category_data: list[CategoryStatsItem] = []
    trend_data: list[TrendStatsItem] = []


class RelationCreate(BaseModel):
    from_type: str
    from_id: int
    relation_type: str
    to_type: str
    to_id: int


class RelationOut(BaseModel):
    id: int
    from_type: str
    from_id: int
    relation_type: str
    to_type: str
    to_id: int
    created_at: datetime
    model_config = {"from_attributes": True}
