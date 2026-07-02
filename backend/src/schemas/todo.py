"""
Pydantic schemas: 请求/响应数据验证.
"""

from datetime import date, datetime, time
from enum import StrEnum

from dateutil.rrule import rrulestr
from pydantic import BaseModel, Field, field_validator

from .tag import TagOut

# ─── Reorder (shared) ─────────────────────────────────


class ReorderItem(BaseModel):
    id: int
    sort_order: int


class ReorderBatch(BaseModel):
    items: list[ReorderItem]


# ─── Pagination ────────────────────────────────────────


class PaginatedResponse[T](BaseModel):
    items: list[T]
    total: int
    skip: int
    limit: int


# ─── Folder ──────────────────────────────────────────


class FolderCreate(BaseModel):
    parent_id: int | None = None
    name: str = Field(min_length=1, max_length=50)
    color: str = "#6366f1"
    icon_type: str = Field(default="color", pattern="^(color|emoji)$")
    icon_value: str = Field(default="#6366f1", min_length=1, max_length=20)
    sort_order: int = 0
    mode: str = "todo"  # new
    kanban_config: dict | None = None


class FolderUpdate(BaseModel):
    parent_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=50)
    color: str | None = None
    icon_type: str | None = Field(None, pattern="^(color|emoji)$")
    icon_value: str | None = Field(None, min_length=1, max_length=20)
    sort_order: int | None = None
    mode: str | None = None  # new
    kanban_config: dict | None = None


class FolderOut(BaseModel):
    id: int
    parent_id: int | None = None
    name: str
    color: str
    icon_type: str
    icon_value: str
    mode: str = "todo"  # new
    kanban_config: dict | None = None
    sort_order: int
    created_at: datetime
    updated_at: datetime
    todo_count: int = 0
    children: list["FolderOut"] = []

    model_config = {"from_attributes": True}


# ─── Todo ────────────────────────────────────────────


class TodoCreate(BaseModel):
    folder_id: int | None = None
    parent_id: int | None = None
    title: str = Field(min_length=1, max_length=500)
    note: str | None = Field(None, max_length=10000)
    priority: int = Field(default=2, ge=1, le=3)
    due_date: date | None = None
    due_time: time | None = None
    sort_order: int = 0
    tag_ids: list[int] = []
    recurrence_rules: list[str] = []

    @field_validator("due_date", "due_time", mode="before")
    @classmethod
    def empty_due_value_to_none(cls, v):
        return None if v == "" else v

    @field_validator("recurrence_rules")
    @classmethod
    def validate_rrules(cls, v: list[str]) -> list[str]:
        for r in v:
            try:
                rrulestr(r)
            except (ValueError, TypeError):
                raise ValueError(f"Invalid RRULE: {r}")
        return v


class TodoUpdate(BaseModel):
    folder_id: int | None = None
    parent_id: int | None = None
    title: str | None = Field(None, min_length=1, max_length=500)
    note: str | None = None
    priority: int | None = Field(None, ge=1, le=3)
    due_date: date | None = None
    due_time: time | None = None
    is_completed: bool | None = None
    sort_order: int | None = None
    tag_ids: list[int] | None = None
    recurrence_rules: list[str] | None = None

    @field_validator("due_date", "due_time", mode="before")
    @classmethod
    def empty_due_value_to_none(cls, v):
        return None if v == "" else v

    @field_validator("recurrence_rules")
    @classmethod
    def validate_rrules(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        for r in v:
            try:
                rrulestr(r)
            except (ValueError, TypeError):
                raise ValueError(f"Invalid RRULE: {r}")
        return v


class TodoReorder(BaseModel):
    target_index: int


class RecurrenceRuleOut(BaseModel):
    id: int
    rrule_string: str

    model_config = {"from_attributes": True}


class TodoOut(BaseModel):
    id: int
    folder_id: int | None = None
    sprint_id: int | None = None  # new
    column_id: int | None = None  # new
    parent_id: int | None = None
    title: str
    note: str | None = None
    priority: int
    due_date: date | None = None
    due_time: time | None = None
    is_completed: bool
    completed_at: datetime | None = None
    sort_order: int
    created_at: datetime
    updated_at: datetime
    children: list["TodoOut"] = []
    tags: list["TagOut"] = []
    recurrence_rules: list["RecurrenceRuleOut"] = []

    model_config = {"from_attributes": True}


# ─── Paginated Todo response ─────────────────────────


class TodoListResponse(BaseModel):
    items: list[TodoOut]
    total: int
    skip: int
    limit: int


# ─── Bulk operations ─────────────────────────────────


class BulkAction(StrEnum):
    complete = "complete"
    delete = "delete"
    move = "move"


class BulkTodoRequest(BaseModel):
    ids: list[int] = Field(min_length=1)
    action: BulkAction
    folder_id: int | None = None  # only for "move" action
