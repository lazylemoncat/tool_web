"""Focus timer API routes."""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload, selectinload

from ..database import get_db
from ..middleware.auth import get_current_user
from ..models.focus import FocusFolder, FocusSession, FocusTag
from ..models.user import User
from ..schemas.focus import (
    FocusDistributionItem,
    FocusFolderCreate,
    FocusFolderOut,
    FocusFolderUpdate,
    FocusHeatmapItem,
    FocusReorderBatch,
    FocusSessionCreate,
    FocusSessionListResponse,
    FocusSessionOut,
    FocusSessionUpdate,
    FocusSummaryResponse,
    FocusTagCreate,
    FocusTagOut,
    FocusTrendItem,
)

router = APIRouter(prefix="/api/v1/focus", tags=["focus"])


def _build_tag_out(tag: FocusTag) -> FocusTagOut:
    return FocusTagOut.model_validate(tag)


def _count_folder_sessions(folder: FocusFolder, db: Session) -> int:
    return (
        db.query(func.count(FocusSession.id))
        .filter(
            FocusSession.folder_id == folder.id,
            FocusSession.user_id == folder.user_id,
        )
        .scalar()
        or 0
    )


def _build_folder_out(folder: FocusFolder, db: Session) -> FocusFolderOut:
    children = sorted(
        folder.children or [], key=lambda item: (item.sort_order, item.id)
    )
    return FocusFolderOut(
        id=folder.id,
        parent_id=folder.parent_id,
        name=folder.name,
        color=folder.color,
        icon_type=folder.icon_type,
        icon_value=folder.icon_value,
        sort_order=folder.sort_order,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        session_count=_count_folder_sessions(folder, db),
        children=[_build_folder_out(child, db) for child in children],
    )


def _build_session_out(session: FocusSession) -> FocusSessionOut:
    return FocusSessionOut(
        id=session.id,
        folder_id=session.folder_id,
        folder_name=session.folder.name if session.folder else None,
        name=session.name,
        mode=session.mode,
        planned_seconds=session.planned_seconds,
        focus_seconds=session.focus_seconds,
        pause_count=session.pause_count,
        pause_seconds=session.pause_seconds,
        rest_seconds=session.rest_seconds,
        started_at=session.started_at,
        ended_at=session.ended_at,
        abandoned=session.abandoned,
        summary=session.summary,
        tags=[_build_tag_out(tag) for tag in (session.tags or [])],
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


def _session_query(db: Session, user_id: int):
    return (
        db.query(FocusSession)
        .options(
            joinedload(FocusSession.folder),
            joinedload(FocusSession.tags),
        )
        .filter(FocusSession.user_id == user_id)
    )


def _date_bounds(
    range_key: str,
    start_date: date | None,
    end_date: date | None,
) -> tuple[datetime | None, datetime | None, date | None, date | None]:
    today = date.today()
    if start_date or end_date:
        start = start_date or today
        end = end_date or start
    elif range_key == "today":
        start = end = today
    elif range_key == "week":
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
    elif range_key == "month":
        start = today.replace(day=1)
        next_month = (
            today.replace(year=today.year + 1, month=1, day=1)
            if today.month == 12
            else today.replace(month=today.month + 1, day=1)
        )
        end = next_month - timedelta(days=1)
    elif range_key == "30d":
        start = today - timedelta(days=29)
        end = today
    elif range_key == "all":
        return None, None, None, None
    else:
        start = today - timedelta(days=6)
        end = today

    start_dt = datetime.combine(start, time.min)
    end_dt = datetime.combine(end + timedelta(days=1), time.min)
    return start_dt, end_dt, start, end


def _get_folder(
    db: Session,
    user_id: int,
    folder_id: int,
) -> FocusFolder:
    folder = (
        db.query(FocusFolder)
        .filter(FocusFolder.id == folder_id, FocusFolder.user_id == user_id)
        .first()
    )
    if not folder:
        raise HTTPException(404, "focus folder not found")
    return folder


def _validate_parent_folder(
    db: Session,
    user_id: int,
    parent_id: int | None,
) -> None:
    if parent_id is None:
        return
    _get_folder(db, user_id, parent_id)


def _validate_folder(
    db: Session, user_id: int, folder_id: int | None
) -> None:
    if folder_id is None:
        return
    _get_folder(db, user_id, folder_id)


def _load_tags(
    db: Session, user_id: int, tag_ids: list[int]
) -> list[FocusTag]:
    if not tag_ids:
        return []
    unique_ids = list(dict.fromkeys(tag_ids))
    tags = (
        db.query(FocusTag)
        .filter(FocusTag.id.in_(unique_ids), FocusTag.user_id == user_id)
        .all()
    )
    if len(tags) != len(unique_ids):
        raise HTTPException(404, "focus tag not found")
    tags_by_id = {tag.id: tag for tag in tags}
    return [tags_by_id[tag_id] for tag_id in unique_ids]


def _apply_filters(
    query,
    *,
    search: str | None,
    mode: str | None,
    abandoned: bool | None,
    folder_id: int | None,
    tag_id: int | None,
    started_from: date | None,
    started_to: date | None,
):
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                FocusSession.name.ilike(pattern),
                FocusSession.summary.ilike(pattern),
            )
        )
    if mode:
        query = query.filter(FocusSession.mode == mode)
    if abandoned is not None:
        query = query.filter(FocusSession.abandoned.is_(abandoned))
    if folder_id is not None:
        query = query.filter(FocusSession.folder_id == folder_id)
    if tag_id is not None:
        query = query.filter(FocusSession.tags.any(FocusTag.id == tag_id))
    if started_from is not None:
        query = query.filter(
            FocusSession.started_at >= datetime.combine(started_from, time.min)
        )
    if started_to is not None:
        query = query.filter(
            FocusSession.started_at
            < datetime.combine(started_to + timedelta(days=1), time.min)
        )
    return query


@router.get("/folders", response_model=list[FocusFolderOut])
def list_folders(
    parent_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(FocusFolder).filter(FocusFolder.user_id == current_user.id)
    if parent_id is not None:
        query = query.filter(FocusFolder.parent_id == parent_id)
    else:
        query = query.filter(FocusFolder.parent_id.is_(None))
    folders = (
        query.order_by(FocusFolder.sort_order, FocusFolder.id)
        .options(selectinload(FocusFolder.children))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_build_folder_out(folder, db) for folder in folders]


@router.post("/folders", response_model=FocusFolderOut, status_code=201)
def create_folder(
    body: FocusFolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_parent_folder(db, current_user.id, body.parent_id)
    folder = FocusFolder(**body.model_dump(), user_id=current_user.id)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return _build_folder_out(folder, db)


@router.put("/folders/{folder_id}", response_model=FocusFolderOut)
def update_folder(
    folder_id: int,
    body: FocusFolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = _get_folder(db, current_user.id, folder_id)
    data = body.model_dump(exclude_unset=True)
    parent_id = data.get("parent_id")
    if parent_id == folder_id:
        raise HTTPException(400, "folder cannot be its own parent")
    if "parent_id" in data:
        _validate_parent_folder(db, current_user.id, parent_id)
    for key, value in data.items():
        setattr(folder, key, value)
    db.commit()
    db.refresh(folder)
    return _build_folder_out(folder, db)


@router.delete("/folders/{folder_id}", status_code=204)
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = _get_folder(db, current_user.id, folder_id)
    (
        db.query(FocusSession)
        .filter(
            FocusSession.folder_id == folder.id,
            FocusSession.user_id == current_user.id,
        )
        .update({"folder_id": None})
    )
    db.delete(folder)
    db.commit()


@router.post("/folders/reorder", status_code=204)
def reorder_folders(
    body: FocusReorderBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ids = [item.id for item in body.items]
    if not ids:
        return
    folders = (
        db.query(FocusFolder)
        .filter(FocusFolder.id.in_(ids), FocusFolder.user_id == current_user.id)
        .all()
    )
    if len(folders) != len(set(ids)):
        raise HTTPException(404, "focus folder not found")
    parent_ids = {folder.parent_id for folder in folders}
    if len(parent_ids) > 1:
        raise HTTPException(
            400,
            "folders can only be reordered within the same parent",
        )
    folder_map = {folder.id: folder for folder in folders}
    for item in body.items:
        folder_map[item.id].sort_order = item.sort_order
    db.commit()


@router.get("/tags", response_model=list[FocusTagOut])
def list_tags(
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(FocusTag).filter(FocusTag.user_id == current_user.id)
    if search:
        query = query.filter(FocusTag.name.ilike(f"%{search}%"))
    return query.order_by(FocusTag.name).all()


@router.post("/tags", response_model=FocusTagOut, status_code=201)
def create_tag(
    body: FocusTagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    name = body.name.strip()
    existing = (
        db.query(FocusTag)
        .filter(FocusTag.user_id == current_user.id, FocusTag.name == name)
        .first()
    )
    if existing:
        return existing
    tag = FocusTag(user_id=current_user.id, name=name)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/tags/{tag_id}", status_code=204)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tag = (
        db.query(FocusTag)
        .filter(FocusTag.id == tag_id, FocusTag.user_id == current_user.id)
        .first()
    )
    if not tag:
        raise HTTPException(404, "focus tag not found")
    db.delete(tag)
    db.commit()


@router.get("/sessions", response_model=FocusSessionListResponse)
def list_sessions(
    search: str | None = Query(None),
    mode: str | None = Query(None, pattern="^(pomodoro|free)$"),
    abandoned: bool | None = Query(None),
    folder_id: int | None = Query(None),
    tag_id: int | None = Query(None),
    started_from: date | None = Query(None),
    started_to: date | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if folder_id is not None:
        _validate_folder(db, current_user.id, folder_id)
    if tag_id is not None:
        _load_tags(db, current_user.id, [tag_id])
    query = _apply_filters(
        _session_query(db, current_user.id),
        search=search,
        mode=mode,
        abandoned=abandoned,
        folder_id=folder_id,
        tag_id=tag_id,
        started_from=started_from,
        started_to=started_to,
    )
    total = query.count()
    sessions = (
        query.order_by(FocusSession.started_at.desc(), FocusSession.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return FocusSessionListResponse(
        items=[_build_session_out(session) for session in sessions],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("/sessions", response_model=FocusSessionOut, status_code=201)
def create_session(
    body: FocusSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_folder(db, current_user.id, body.folder_id)
    tags = _load_tags(db, current_user.id, body.tag_ids)
    data = body.model_dump(exclude={"tag_ids"})
    session = FocusSession(**data, user_id=current_user.id)
    session.tags = tags
    db.add(session)
    db.commit()
    db.refresh(session)
    return _build_session_out(session)


@router.put("/sessions/{session_id}", response_model=FocusSessionOut)
def update_session(
    session_id: int,
    body: FocusSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        _session_query(db, current_user.id)
        .filter(FocusSession.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(404, "focus session not found")

    data = body.model_dump(exclude_unset=True)
    tag_ids = data.pop("tag_ids", None)
    if "folder_id" in data:
        _validate_folder(db, current_user.id, data["folder_id"])
    for key, value in data.items():
        setattr(session, key, value)
    if tag_ids is not None:
        session.tags = _load_tags(db, current_user.id, tag_ids)
    db.commit()
    db.refresh(session)
    return _build_session_out(session)


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(FocusSession)
        .filter(
            FocusSession.id == session_id,
            FocusSession.user_id == current_user.id,
        )
        .first()
    )
    if not session:
        raise HTTPException(404, "focus session not found")
    db.delete(session)
    db.commit()


def _streaks(sessions: list[FocusSession]) -> tuple[int, int]:
    active_dates = sorted(
        {
            session.started_at.date()
            for session in sessions
            if not session.abandoned and session.focus_seconds > 0
        }
    )
    if not active_dates:
        return 0, 0

    longest = current = 1
    for previous, current_day in zip(active_dates, active_dates[1:]):
        if current_day == previous + timedelta(days=1):
            current += 1
        else:
            longest = max(longest, current)
            current = 1
    longest = max(longest, current)

    today = date.today()
    streak = 0
    cursor = today
    active_set = set(active_dates)
    while cursor in active_set:
        streak += 1
        cursor -= timedelta(days=1)
    return streak, longest


def _heatmap_items(sessions: list[FocusSession]) -> list[FocusHeatmapItem]:
    today = date.today()
    start = today - timedelta(days=90)
    seconds_by_date: dict[date, int] = defaultdict(int)
    for session in sessions:
        if session.abandoned:
            continue
        day = session.started_at.date()
        if start <= day <= today:
            seconds_by_date[day] += session.focus_seconds

    items = []
    for offset in range(91):
        day = start + timedelta(days=offset)
        seconds = seconds_by_date[day]
        minutes = seconds // 60
        if minutes == 0:
            level = 0
        elif minutes < 30:
            level = 1
        elif minutes < 60:
            level = 2
        elif minutes < 90:
            level = 3
        else:
            level = 4
        items.append(
            FocusHeatmapItem(
                date=day,
                focus_seconds=seconds,
                level=level,
            )
        )
    return items


def _trend_items(
    sessions: list[FocusSession],
    start: date | None,
    end: date | None,
) -> list[FocusTrendItem]:
    today = date.today()
    trend_start = start or today - timedelta(days=6)
    trend_end = end or today
    if (trend_end - trend_start).days > 30:
        trend_start = trend_end - timedelta(days=29)

    seconds_by_date: dict[date, int] = defaultdict(int)
    count_by_date: dict[date, int] = defaultdict(int)
    for session in sessions:
        if session.abandoned:
            continue
        day = session.started_at.date()
        if trend_start <= day <= trend_end:
            seconds_by_date[day] += session.focus_seconds
            count_by_date[day] += 1

    return [
        FocusTrendItem(
            date=day,
            focus_seconds=seconds_by_date[day],
            session_count=count_by_date[day],
        )
        for day in (
            trend_start + timedelta(days=offset)
            for offset in range((trend_end - trend_start).days + 1)
        )
    ]


def _distribution_items(
    sessions: list[FocusSession],
    by: str,
) -> list[FocusDistributionItem]:
    buckets: dict[tuple[int | None, str], dict[str, int]] = defaultdict(
        lambda: {"focus_seconds": 0, "session_count": 0}
    )
    for session in sessions:
        if session.abandoned:
            continue
        entries: list[tuple[int | None, str]]
        if by == "tag":
            entries = [(tag.id, tag.name) for tag in session.tags]
            if not entries:
                entries = [(None, "Untagged")]
        else:
            entries = [
                (
                    session.folder_id,
                    session.folder.name if session.folder else "Unfiled",
                )
            ]
        for key in entries:
            buckets[key]["focus_seconds"] += session.focus_seconds
            buckets[key]["session_count"] += 1

    items = [
        FocusDistributionItem(
            id=key[0],
            name=key[1],
            focus_seconds=value["focus_seconds"],
            session_count=value["session_count"],
        )
        for key, value in buckets.items()
    ]
    return sorted(items, key=lambda item: item.focus_seconds, reverse=True)


@router.get("/summary", response_model=FocusSummaryResponse)
def get_summary(
    range: str = Query("7d", pattern="^(today|week|month|7d|30d|all)$"),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_dt, end_dt, start, end = _date_bounds(range, start_date, end_date)
    scoped_query = _session_query(db, current_user.id)
    if start_dt is not None:
        scoped_query = scoped_query.filter(FocusSession.started_at >= start_dt)
    if end_dt is not None:
        scoped_query = scoped_query.filter(FocusSession.started_at < end_dt)

    sessions = scoped_query.order_by(FocusSession.started_at.desc()).all()
    completed = [session for session in sessions if not session.abandoned]
    all_user_sessions = _session_query(db, current_user.id).all()
    streak_days, longest_streak_days = _streaks(all_user_sessions)

    total_focus_seconds = sum(session.focus_seconds for session in completed)
    completed_count = len(completed)
    recent = sorted(
        sessions,
        key=lambda session: (session.started_at, session.id),
        reverse=True,
    )[:12]

    return FocusSummaryResponse(
        range=range,
        start_date=start,
        end_date=end,
        total_focus_seconds=total_focus_seconds,
        rest_seconds=sum(session.rest_seconds for session in completed),
        pause_seconds=sum(session.pause_seconds for session in completed),
        session_count=len(sessions),
        completed_count=completed_count,
        abandoned_count=len(
            [session for session in sessions if session.abandoned]
        ),
        average_focus_seconds=(
            total_focus_seconds // completed_count if completed_count else 0
        ),
        streak_days=streak_days,
        longest_streak_days=longest_streak_days,
        trend=_trend_items(sessions, start, end),
        heatmap=_heatmap_items(all_user_sessions),
        tag_distribution=_distribution_items(sessions, "tag"),
        folder_distribution=_distribution_items(sessions, "folder"),
        recent_sessions=[_build_session_out(session) for session in recent],
    )
