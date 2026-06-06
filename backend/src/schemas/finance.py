"""Finance module Pydantic schemas."""
from __future__ import annotations
from datetime import date, datetime
from decimal import Decimal
from typing import Generic, Optional, TypeVar
from pydantic import BaseModel, Field
from dateutil.rrule import rrulestr
from pydantic import field_validator

T = TypeVar("T")


class ReorderItem(BaseModel):
    id: int
    sort_order: int


class ReorderBatch(BaseModel):
    items: list[ReorderItem]


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    skip: int
    limit: int


class LedgerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    icon: str = "\U0001f4b0"
    currency: str = Field(default="CNY", min_length=1, max_length=10)


class LedgerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    icon: Optional[str] = None
    currency: Optional[str] = Field(None, min_length=1, max_length=10)


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
    initial_balance: Decimal = Field(default=0, ge=0)


class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    type: Optional[str] = None
    currency: Optional[str] = Field(None, min_length=1, max_length=10)
    initial_balance: Optional[Decimal] = None
    archived: Optional[bool] = None


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
    parent_id: Optional[int] = None
    name: str = Field(min_length=1, max_length=50)
    icon: str = "\U0001f4c2"


class CategoryUpdate(BaseModel):
    parent_id: Optional[int] = None
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    icon: Optional[str] = None


class CategoryOut(BaseModel):
    id: int
    ledger_id: int
    parent_id: Optional[int] = None
    name: str
    icon: str
    created_at: datetime
    children: list["CategoryOut"] = []
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
    category_id: Optional[int] = None
    note: Optional[str] = Field(None, max_length=500)


class SplitItemOut(BaseModel):
    id: int
    transaction_id: int
    amount: Decimal
    category_id: Optional[int] = None
    note: Optional[str] = None
    category: Optional[CategoryOut] = None
    model_config = {"from_attributes": True}


class TransactionCreate(BaseModel):
    ledger_id: int
    account_id: int
    type: str = Field(pattern="^(expense|income|transfer)$")
    amount: Decimal = Field(gt=0)
    currency: str = Field(default="CNY")
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    category_id: Optional[int] = None
    note: Optional[str] = Field(None, max_length=2000)
    event_id: Optional[int] = None
    parent_transaction_id: Optional[int] = None
    sort_order: int = 0
    tag_ids: list[int] = []
    split_items: list[SplitItemCreate] = []
    attachment_ids: list[int] = []
    linked_todo_ids: list[int] = []


class TransactionUpdate(BaseModel):
    account_id: Optional[int] = None
    type: Optional[str] = Field(None, pattern="^(expense|income|transfer)$")
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = None
    occurred_at: Optional[datetime] = None
    category_id: Optional[int] = None
    note: Optional[str] = None
    event_id: Optional[int] = None
    parent_transaction_id: Optional[int] = None
    sort_order: Optional[int] = None
    tag_ids: Optional[list[int]] = None
    split_items: Optional[list[SplitItemCreate]] = None
    attachment_ids: Optional[list[int]] = None
    linked_todo_ids: Optional[list[int]] = None


class TransactionOut(BaseModel):
    id: int
    ledger_id: int
    account_id: int
    type: str
    amount: Decimal
    currency: str
    occurred_at: datetime
    recorded_at: datetime
    category_id: Optional[int] = None
    note: Optional[str] = None
    event_id: Optional[int] = None
    parent_transaction_id: Optional[int] = None
    sort_order: int
    created_at: datetime
    updated_at: datetime
    account: Optional[AccountOut] = None
    category: Optional[CategoryOut] = None
    event: Optional["EventOut"] = None
    tags: list[FinanceTagOut] = []
    split_items: list[SplitItemOut] = []
    attachments: list[AttachmentOut] = []
    linked_todos: list[dict] = []
    children: list["TransactionOut"] = []
    model_config = {"from_attributes": True}


class TransactionFilter(BaseModel):
    ledger_id: Optional[int] = None
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    tag_id: Optional[int] = None
    event_id: Optional[int] = None
    type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    search: Optional[str] = None


class TransactionListResponse(BaseModel):
    items: list[TransactionOut]
    total: int
    skip: int
    limit: int


class EventCreate(BaseModel):
    ledger_id: int
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=5000)
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    color: str = "#6366f1"


class EventUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    color: Optional[str] = None


class EventOut(BaseModel):
    id: int
    ledger_id: int
    name: str
    description: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
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
    rrule: Optional[str] = None
    filters: Optional[dict] = None
    rollover: bool = False
    alert_threshold: int = Field(default=80, ge=1, le=100)

    @field_validator("rrule")
    @classmethod
    def validate_rrule(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            try:
                rrulestr(v)
            except (ValueError, TypeError):
                raise ValueError(f"Invalid RRULE: {v}")
        return v


class BudgetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = None
    rrule: Optional[str] = None
    filters: Optional[dict] = None
    rollover: Optional[bool] = None
    alert_threshold: Optional[int] = Field(None, ge=1, le=100)


class BudgetOut(BaseModel):
    id: int
    ledger_id: int
    name: str
    amount: Decimal
    currency: str
    rrule: Optional[str] = None
    filters: Optional[dict] = None
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
