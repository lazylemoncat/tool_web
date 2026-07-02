"""
Focus timer Pydantic schemas for module-owned metadata, persisted sessions,
list responses, and dashboard summaries.
"""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator


class FocusReorderItem(BaseModel):
    id: int
    sort_order: int


class FocusReorderBatch(BaseModel):
    items: list[FocusReorderItem]


class FocusFolderCreate(BaseModel):
    parent_id: int | None = None
    name: str = Field(min_length=1, max_length=50)
    color: str = "#6366f1"
    icon_type: str = Field(default="color", pattern="^(color|emoji)$")
    icon_value: str = Field(default="#6366f1", min_length=1, max_length=20)
    sort_order: int = 0


class FocusFolderUpdate(BaseModel):
    parent_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=50)
    color: str | None = None
    icon_type: str | None = Field(None, pattern="^(color|emoji)$")
    icon_value: str | None = Field(None, min_length=1, max_length=20)
    sort_order: int | None = None


class FocusFolderOut(BaseModel):
    id: int
    parent_id: int | None = None
    name: str
    color: str
    icon_type: str
    icon_value: str
    sort_order: int
    created_at: datetime
    updated_at: datetime
    session_count: int = 0
    children: list["FocusFolderOut"] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class FocusTagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class FocusTagOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class FocusSessionCreate(BaseModel):
    name: str = Field(default="Untitled focus", min_length=1, max_length=120)
    mode: str = Field(default="pomodoro", pattern="^(pomodoro|free)$")
    planned_seconds: int | None = Field(None, ge=0, le=86_400)
    focus_seconds: int = Field(ge=0, le=86_400)
    pause_count: int = Field(default=0, ge=0, le=10_000)
    pause_seconds: int = Field(default=0, ge=0, le=86_400)
    rest_seconds: int = Field(default=0, ge=0, le=86_400)
    folder_id: int | None = None
    tag_ids: list[int] = Field(default_factory=list)
    summary: str | None = Field(None, max_length=5000)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: datetime | None = None
    abandoned: bool = False

    @model_validator(mode="after")
    def validate_time_order(self) -> "FocusSessionCreate":
        if self.ended_at and self.ended_at < self.started_at:
            raise ValueError("ended_at must be after started_at")
        return self


class FocusSessionUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=120)
    mode: str | None = Field(None, pattern="^(pomodoro|free)$")
    planned_seconds: int | None = Field(None, ge=0, le=86_400)
    focus_seconds: int | None = Field(None, ge=0, le=86_400)
    pause_count: int | None = Field(None, ge=0, le=10_000)
    pause_seconds: int | None = Field(None, ge=0, le=86_400)
    rest_seconds: int | None = Field(None, ge=0, le=86_400)
    folder_id: int | None = None
    tag_ids: list[int] | None = None
    summary: str | None = Field(None, max_length=5000)
    started_at: datetime | None = None
    ended_at: datetime | None = None
    abandoned: bool | None = None

    @model_validator(mode="after")
    def validate_time_order(self) -> "FocusSessionUpdate":
        if (
            self.started_at
            and self.ended_at
            and self.ended_at < self.started_at
        ):
            raise ValueError("ended_at must be after started_at")
        return self


class FocusSessionOut(BaseModel):
    id: int
    folder_id: int | None = None
    folder_name: str | None = None
    name: str
    mode: str
    planned_seconds: int | None = None
    focus_seconds: int
    pause_count: int
    pause_seconds: int
    rest_seconds: int
    started_at: datetime
    ended_at: datetime | None = None
    abandoned: bool
    summary: str | None = None
    tags: list[FocusTagOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class FocusSessionListResponse(BaseModel):
    items: list[FocusSessionOut]
    total: int
    skip: int
    limit: int


class FocusTrendItem(BaseModel):
    date: date
    focus_seconds: int
    session_count: int


class FocusHeatmapItem(BaseModel):
    date: date
    focus_seconds: int
    level: int


class FocusDistributionItem(BaseModel):
    id: int | None = None
    name: str
    focus_seconds: int
    session_count: int


class FocusSummaryResponse(BaseModel):
    range: str
    start_date: date | None = None
    end_date: date | None = None
    total_focus_seconds: int
    rest_seconds: int
    pause_seconds: int
    session_count: int
    completed_count: int
    abandoned_count: int
    average_focus_seconds: int
    streak_days: int
    longest_streak_days: int
    trend: list[FocusTrendItem]
    heatmap: list[FocusHeatmapItem]
    tag_distribution: list[FocusDistributionItem]
    folder_distribution: list[FocusDistributionItem]
    recent_sessions: list[FocusSessionOut]
