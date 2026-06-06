"""KanbanTask Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class KanbanTaskCreate(BaseModel):
    folder_id: int
    sprint_id: int | None = None
    column_id: int | None = None
    title: str = Field(min_length=1, max_length=500)
    version: str | None = Field(None, max_length=100)
    task_type: str | None = Field(None, max_length=50)
    priority: str | None = Field(None, max_length=10)
    requirement_desc: str | None = None
    technical_desc: str | None = None
    acceptance_criteria: str | None = None
    custom_fields: dict | None = None
    sort_order: int = 0


class KanbanTaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    sprint_id: int | None = None
    column_id: int | None = None
    version: str | None = None
    task_type: str | None = None
    priority: str | None = None
    requirement_desc: str | None = None
    technical_desc: str | None = None
    acceptance_criteria: str | None = None
    custom_fields: dict | None = None
    sort_order: int | None = None


class KanbanTaskOut(BaseModel):
    id: int
    folder_id: int
    sprint_id: int | None = None
    column_id: int | None = None
    title: str
    version: str | None = None
    task_type: str | None = None
    priority: str | None = None
    requirement_desc: str | None = None
    technical_desc: str | None = None
    acceptance_criteria: str | None = None
    custom_fields: dict | None = None
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MoveKanbanTaskRequest(BaseModel):
    target_column_id: int
    target_sprint_id: int | None = None
    sort_order: int | None = None
