"""Kanban 模块 Pydantic schemas."""

from datetime import date, datetime

from pydantic import BaseModel, Field

# ─── Sprint ───────────────────


class SprintCreate(BaseModel):
    folder_id: int
    name: str = Field(min_length=1, max_length=100)
    goal: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str = "active"  # active | planned | completed
    sort_order: int = 0


class SprintUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    goal: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None  # active | planned | completed
    sort_order: int | None = None


class SprintOut(BaseModel):
    id: int
    folder_id: int
    name: str
    goal: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── KanbanColumn ─────────────


class KanbanColumnCreate(BaseModel):
    sprint_id: int
    name: str = Field(min_length=1, max_length=50)
    color: str | None = None
    capacity: int | None = None
    sort_order: int = 0
    is_archived: bool = False


class KanbanColumnUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    color: str | None = None
    capacity: int | None = None
    sort_order: int | None = None
    is_archived: bool | None = None


class KanbanColumnOut(BaseModel):
    id: int
    sprint_id: int
    name: str
    color: str | None = None
    capacity: int | None = None
    sort_order: int
    is_archived: bool
    task_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Move Task ────────────────


class MoveTaskRequest(BaseModel):
    target_column_id: int
