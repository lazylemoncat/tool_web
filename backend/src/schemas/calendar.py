"""Calendar module Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator

SourceType = Literal[
    "manual",
    "todo",
    "finance_income",
    "finance_expense",
    "finance_event",
    "holiday",
    "subscription",
]
RepeatRule = Literal["none", "daily", "weekly", "monthly", "yearly"]
ReminderOffset = Literal["none", "at_time", "5m", "15m", "1h", "1d"]
EventStatus = Literal["pending", "completed", "overdue", "cancelled"]
LinkedModule = Literal["todo", "finance", "calendar"]
Direction = Literal["income", "expense"]


def _parse_calendar_datetime(value):
    if value == "":
        return None
    if isinstance(value, str) and len(value) == 10:
        return f"{value}T00:00:00"
    return value


class CalendarSourceOut(BaseModel):
    id: str
    name: str
    type: SourceType
    color: str
    visible: bool = True
    readonly: bool = True
    icon: str
    sync_url: str | None = None
    last_synced_at: str | None = None


class CalendarSubscriptionOut(BaseModel):
    id: str
    name: str
    url: str
    color: str
    enabled: bool
    last_synced_at: str | None = None
    sync_error: str | None = None


class CalendarEventBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    start_at: datetime
    all_day: bool = True
    source_id: str = "src-manual"
    repeat_rule: RepeatRule = "none"
    reminder: ReminderOffset = "none"
    description: str | None = Field(None, max_length=10000)
    end_at: datetime | None = None
    location: str | None = Field(None, max_length=200)
    color: str | None = None

    @field_validator("start_at", "end_at", mode="before")
    @classmethod
    def parse_date_only_datetime(cls, value):
        return _parse_calendar_datetime(value)


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    start_at: datetime | None = None
    all_day: bool | None = None
    source_id: str | None = None
    repeat_rule: RepeatRule | None = None
    reminder: ReminderOffset | None = None
    description: str | None = Field(None, max_length=10000)
    end_at: datetime | None = None
    location: str | None = Field(None, max_length=200)
    color: str | None = None

    @field_validator("start_at", "end_at", mode="before")
    @classmethod
    def parse_date_only_datetime(cls, value):
        return _parse_calendar_datetime(value)


class CalendarEventOut(BaseModel):
    id: str
    title: str
    start_at: str
    all_day: bool
    source_id: str
    source_type: SourceType
    color: str
    icon: str
    repeat_rule: RepeatRule
    reminder: ReminderOffset
    readonly: bool
    created_at: str
    updated_at: str
    description: str | None = None
    end_at: str | None = None
    location: str | None = None
    linked_module: LinkedModule | None = None
    linked_object_id: str | None = None
    status: EventStatus | None = None
    amount: Decimal | None = None
    direction: Direction | None = None
