"""
Calendar routes: persisted user events and read-only module event aggregation.
"""

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal
from typing import cast

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..middleware.auth import get_current_user
from ..models.calendar import CalendarEvent as CalendarEventModel
from ..models.finance import Event, FinanceCategory, Transaction
from ..models.todo import Todo
from ..models.user import User
from ..schemas.calendar import (
    CalendarEventCreate,
    CalendarEventOut,
    CalendarEventUpdate,
    CalendarSourceOut,
    CalendarSubscriptionOut,
    EventStatus,
    ReminderOffset,
    RepeatRule,
    SourceType,
)
from ..utils.errors import BadRequestError

router = APIRouter(prefix="/api/v1/calendar", tags=["calendar"])

CALENDAR_SOURCES = (
    CalendarSourceOut(
        id="src-manual",
        name="我的日历",
        type="manual",
        color="#6C5CE7",
        visible=True,
        readonly=False,
        icon="calendar",
    ),
    CalendarSourceOut(
        id="src-todo",
        name="任务",
        type="todo",
        color="#3B82F6",
        visible=True,
        readonly=True,
        icon="task",
    ),
    CalendarSourceOut(
        id="src-income",
        name="收入",
        type="finance_income",
        color="#10B981",
        visible=True,
        readonly=True,
        icon="income",
    ),
    CalendarSourceOut(
        id="src-expense",
        name="支出",
        type="finance_expense",
        color="#EF4444",
        visible=True,
        readonly=True,
        icon="expense",
    ),
    CalendarSourceOut(
        id="src-finance-event",
        name="记账事件",
        type="finance_event",
        color="#F59E0B",
        visible=True,
        readonly=True,
        icon="finance-event",
    ),
    CalendarSourceOut(
        id="src-holiday",
        name="节假日",
        type="holiday",
        color="#EF4444",
        visible=True,
        readonly=True,
        icon="holiday",
    ),
    CalendarSourceOut(
        id="src-sub",
        name="订阅日历",
        type="subscription",
        color="#8B5CF6",
        visible=True,
        readonly=True,
        icon="subscription",
    ),
)
SOURCE_BY_ID = {source.id: source for source in CALENDAR_SOURCES}
SOURCE_BY_TYPE = {source.type: source for source in CALENDAR_SOURCES}


@router.get("/sources", response_model=list[CalendarSourceOut])
def list_sources():
    return list(CALENDAR_SOURCES)


@router.get("/subscriptions", response_model=list[CalendarSubscriptionOut])
def list_subscriptions():
    return []


@router.post(
    "/subscriptions/{subscription_id}/sync",
    response_model=CalendarSubscriptionOut,
)
def sync_subscription(subscription_id: str):
    raise HTTPException(404, f"subscription {subscription_id} not found")


@router.get("/events", response_model=list[CalendarEventOut])
def list_events(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_dt, end_dt = _range_to_datetimes(start, end)
    events = [
        *_list_persisted_events(db, current_user.id, start_dt, end_dt),
        *_list_todo_events(db, current_user.id, start, end),
        *_list_finance_transaction_events(
            db, current_user.id, start_dt, end_dt
        ),
        *_list_finance_events(db, current_user.id, start_dt, end_dt),
    ]
    return sorted(events, key=lambda item: (item.start_at, item.title))


@router.post("/events", response_model=CalendarEventOut, status_code=201)
def create_event(
    body: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    source = _editable_source(body.source_id)
    event = CalendarEventModel(
        user_id=current_user.id,
        title=body.title,
        description=body.description,
        start_at=body.start_at,
        end_at=body.end_at,
        all_day=body.all_day,
        source_id=source.id,
        source_type=source.type,
        color=body.color or source.color,
        icon=source.icon,
        location=body.location,
        repeat_rule=body.repeat_rule,
        reminder=body.reminder,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return _build_persisted_event(event)


@router.put("/events/{event_id}", response_model=CalendarEventOut)
def update_event(
    event_id: str,
    body: CalendarEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = _get_persisted_event(db, current_user.id, event_id)
    data = body.model_dump(exclude_unset=True)
    if "source_id" in data:
        source = _editable_source(data.pop("source_id"))
        event.source_id = source.id
        event.source_type = source.type
        event.icon = source.icon
        event.color = data.get("color") or source.color
    for key, value in data.items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return _build_persisted_event(event)


@router.delete("/events/{event_id}", status_code=204)
def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = _get_persisted_event(db, current_user.id, event_id)
    db.delete(event)
    db.commit()


def _range_to_datetimes(start: date, end: date) -> tuple[datetime, datetime]:
    if start > end:
        raise BadRequestError("start date must be before end date")
    return datetime.combine(start, time.min), datetime.combine(end, time.max)


def _editable_source(source_id: str) -> CalendarSourceOut:
    source = SOURCE_BY_ID.get(source_id)
    if source is None:
        raise BadRequestError("calendar source not found")
    if source.readonly:
        raise BadRequestError("calendar source is readonly")
    return source


def _get_persisted_event(
    db: Session, user_id: int, event_id: str
) -> CalendarEventModel:
    parsed_id = _parse_persisted_event_id(event_id)
    event = (
        db.query(CalendarEventModel)
        .filter(
            CalendarEventModel.id == parsed_id,
            CalendarEventModel.user_id == user_id,
        )
        .first()
    )
    if not event:
        raise HTTPException(404, "calendar event not found")
    return event


def _parse_persisted_event_id(event_id: str) -> int:
    value = event_id.removeprefix("cal-")
    try:
        return int(value)
    except ValueError:
        raise HTTPException(404, "calendar event not found") from None


def _list_persisted_events(
    db: Session,
    user_id: int,
    start_dt: datetime,
    end_dt: datetime,
) -> list[CalendarEventOut]:
    rows = (
        db.query(CalendarEventModel)
        .filter(
            CalendarEventModel.user_id == user_id,
            CalendarEventModel.start_at <= end_dt,
            or_(
                CalendarEventModel.end_at.is_(None),
                CalendarEventModel.end_at >= start_dt,
            ),
        )
        .all()
    )
    return [_build_persisted_event(row) for row in rows]


def _list_todo_events(
    db: Session,
    user_id: int,
    start: date,
    end: date,
) -> list[CalendarEventOut]:
    todos = (
        db.query(Todo)
        .filter(
            Todo.user_id == user_id,
            Todo.due_date.is_not(None),
            Todo.due_date >= start,
            Todo.due_date <= end,
        )
        .all()
    )
    source = SOURCE_BY_TYPE["todo"]
    events: list[CalendarEventOut] = []
    for todo in todos:
        if todo.due_date is None:
            continue
        start_at, all_day = _format_todo_due_at(
            todo.due_date, todo.due_time
        )
        events.append(
            CalendarEventOut(
                id=f"todo-{todo.id}",
                title=todo.title,
                description=todo.note,
                start_at=start_at,
                all_day=all_day,
                source_id=source.id,
                source_type=source.type,
                color=source.color,
                icon=source.icon,
                repeat_rule="none",
                reminder="none",
                readonly=True,
                created_at=_iso(todo.created_at),
                updated_at=_iso(todo.updated_at),
                linked_module="todo",
                linked_object_id=str(todo.id),
                status=_todo_status(todo),
            )
        )
    return events


def _list_finance_transaction_events(
    db: Session,
    user_id: int,
    start_dt: datetime,
    end_dt: datetime,
) -> list[CalendarEventOut]:
    transactions = (
        db.query(Transaction)
        .options(joinedload(Transaction.category))
        .filter(
            Transaction.user_id == user_id,
            Transaction.parent_transaction_id.is_(None),
            Transaction.type.in_(("income", "expense")),
            Transaction.occurred_at >= start_dt,
            Transaction.occurred_at <= end_dt,
        )
        .all()
    )
    return [_build_finance_transaction_event(tx) for tx in transactions]


def _list_finance_events(
    db: Session,
    user_id: int,
    start_dt: datetime,
    end_dt: datetime,
) -> list[CalendarEventOut]:
    finance_events = (
        db.query(Event)
        .filter(
            Event.user_id == user_id,
            Event.start_at.is_not(None),
            Event.start_at <= end_dt,
            or_(Event.end_at.is_(None), Event.end_at >= start_dt),
        )
        .all()
    )
    return [_build_finance_event(db, event) for event in finance_events]


def _build_persisted_event(event: CalendarEventModel) -> CalendarEventOut:
    source = SOURCE_BY_ID.get(event.source_id) or SOURCE_BY_TYPE["manual"]
    return CalendarEventOut(
        id=f"cal-{event.id}",
        title=event.title,
        description=event.description,
        start_at=_format_datetime(event.start_at, event.all_day),
        end_at=(
            _format_datetime(event.end_at, event.all_day)
            if event.end_at
            else None
        ),
        all_day=event.all_day,
        source_id=source.id,
        source_type=source.type,
        color=event.color or source.color,
        icon=event.icon or source.icon,
        location=event.location,
        repeat_rule=cast(RepeatRule, event.repeat_rule),
        reminder=cast(ReminderOffset, event.reminder),
        readonly=False,
        created_at=_iso(event.created_at),
        updated_at=_iso(event.updated_at),
        linked_module="calendar",
        linked_object_id=str(event.id),
    )


def _build_finance_transaction_event(tx: Transaction) -> CalendarEventOut:
    tx_type = str(tx.type)
    source_type: SourceType = (
        "finance_income" if tx_type == "income" else "finance_expense"
    )
    source = SOURCE_BY_TYPE[source_type]
    title = _transaction_title(tx, source.name)
    return CalendarEventOut(
        id=f"finance-tx-{tx.id}",
        title=title,
        description=tx.note,
        start_at=_format_datetime(tx.occurred_at, False),
        all_day=False,
        source_id=source.id,
        source_type=source.type,
        color=source.color,
        icon=source.icon,
        repeat_rule="none",
        reminder="none",
        readonly=True,
        created_at=_iso(tx.created_at),
        updated_at=_iso(tx.updated_at),
        linked_module="finance",
        linked_object_id=str(tx.id),
        amount=tx.amount,
        direction="income" if tx_type == "income" else "expense",
    )


def _build_finance_event(db: Session, event: Event) -> CalendarEventOut:
    source = SOURCE_BY_TYPE["finance_event"]
    start_at = event.start_at
    if start_at is None:
        raise HTTPException(404, "finance event start time not found")
    total = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.event_id == event.id)
        .scalar()
        or Decimal("0")
    )
    return CalendarEventOut(
        id=f"finance-event-{event.id}",
        title=event.name,
        description=event.description,
        start_at=_format_datetime(start_at, False),
        end_at=(
            _format_datetime(event.end_at, False) if event.end_at else None
        ),
        all_day=False,
        source_id=source.id,
        source_type=source.type,
        color=event.color or source.color,
        icon=source.icon,
        repeat_rule="none",
        reminder="none",
        readonly=True,
        created_at=_iso(event.created_at),
        updated_at=_iso(event.updated_at),
        linked_module="finance",
        linked_object_id=str(event.id),
        amount=total,
    )


def _transaction_title(tx: Transaction, fallback: str) -> str:
    category = tx.category
    if isinstance(category, FinanceCategory) and category.name:
        return category.name
    if tx.note:
        return tx.note
    return fallback


def _todo_status(todo: Todo) -> EventStatus:
    if todo.is_completed:
        return "completed"
    if not todo.due_date:
        return "pending"
    if todo.due_time:
        due_at = datetime.combine(todo.due_date, todo.due_time)
        if due_at < datetime.now():
            return "overdue"
        return "pending"
    if todo.due_date < date.today():
        return "overdue"
    return "pending"


def _format_todo_due_at(
    due_date: date, due_time: time | None
) -> tuple[str, bool]:
    if due_time is None:
        return due_date.isoformat(), True
    return datetime.combine(due_date, due_time).isoformat(), False


def _format_datetime(value: datetime, all_day: bool) -> str:
    if all_day:
        return value.date().isoformat()
    return value.isoformat()


def _iso(value: datetime | None) -> str:
    return (value or datetime.utcnow()).isoformat()
