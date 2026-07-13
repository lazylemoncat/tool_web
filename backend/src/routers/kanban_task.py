"""
KanbanTask CRUD 路由: /api/v1/kanban/tasks
含文件夹模板校验逻辑.
"""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..middleware.auth import get_current_user
from ..models.kanban import KanbanColumn, Sprint
from ..models.kanban_task import KanbanTask
from ..models.todo import Folder
from ..models.user import User
from ..schemas.kanban_task import (
    KanbanTaskCreate,
    KanbanTaskOut,
    KanbanTaskUpdate,
    MoveKanbanTaskRequest,
)
from ..utils.errors import BadRequestError, NotFoundError

router = APIRouter(prefix="/api/v1/kanban/tasks", tags=["kanban-tasks"])


SYSTEM_FIELDS = {
    "title",
    "version",
    "task_type",
    "priority",
    "requirement_desc",
    "technical_desc",
    "acceptance_criteria",
}


def _validate_against_template(fields_config: list[dict], data: dict) -> dict:
    """Validate task payload against the folder's Kanban template."""
    system_fields = {}
    custom_fields = {}
    incoming_custom_fields = data.get("custom_fields") or {}
    if not isinstance(incoming_custom_fields, dict):
        raise BadRequestError("custom_fields must be an object")

    config_map = {f["key"]: f for f in (fields_config or [])}

    for key, value in data.items():
        if key == "custom_fields":
            continue
        if key in SYSTEM_FIELDS:
            system_fields[key] = value
        elif key in config_map and not config_map[key].get("system", True):
            custom_fields[key] = value

    for key, value in incoming_custom_fields.items():
        field_config = config_map.get(key)
        # "__" 前缀为内部字段 (如 __subtasks), 不受模板约束, 始终保留
        if (
            key.startswith("__")
            or not fields_config
            or (field_config and not field_config.get("system", True))
        ):
            custom_fields[key] = value

    # Validate required fields
    for f in fields_config or []:
        key = f["key"]
        if f.get("required"):
            if key in SYSTEM_FIELDS:
                val = system_fields.get(key)
            else:
                val = custom_fields.get(key)
            if val is None or (isinstance(val, str) and not val.strip()):
                raise BadRequestError(f"Field '{f['label']}' is required")

    # Validate types
    for f in fields_config or []:
        key = f["key"]
        if key in SYSTEM_FIELDS:
            val = system_fields.get(key)
        else:
            val = custom_fields.get(key)
        if val is None:
            continue

        field_type = f.get("type", "text")
        if field_type == "select":
            options = f.get("options", [])
            if val not in options:
                raise BadRequestError(
                    f"Field '{f['label']}': '{val}' "
                    f"is not a valid option ({options})"
                )
        elif field_type == "number":
            try:
                float(val)
            except (TypeError, ValueError):
                raise BadRequestError(
                    f"Field '{f['label']}': must be a number"
                )
        elif field_type == "date":
            try:
                date.fromisoformat(str(val))
            except (ValueError, TypeError):
                raise BadRequestError(
                    f"Field '{f['label']}': must be a valid date (YYYY-MM-DD)"
                )

    return {"system_fields": system_fields, "custom_fields": custom_fields}


def _get_folder(
    folder_id: int,
    db: Session,
    current_user: User,
) -> Folder:
    folder = (
        db.query(Folder)
        .filter(
            Folder.id == folder_id,
            Folder.user_id == current_user.id,
        )
        .first()
    )
    if not folder:
        raise BadRequestError("Folder not found")
    return folder


def _get_sprint(
    sprint_id: int,
    folder_id: int,
    db: Session,
    current_user: User,
) -> Sprint:
    sprint = (
        db.query(Sprint)
        .filter(
            Sprint.id == sprint_id,
            Sprint.folder_id == folder_id,
            Sprint.user_id == current_user.id,
        )
        .first()
    )
    if not sprint:
        raise BadRequestError("Sprint not found in this folder")
    return sprint


def _get_column(
    column_id: int,
    folder_id: int,
    db: Session,
    current_user: User,
) -> KanbanColumn:
    col = (
        db.query(KanbanColumn)
        .filter(
            KanbanColumn.id == column_id,
            KanbanColumn.user_id == current_user.id,
        )
        .first()
    )
    if not col:
        raise BadRequestError("Column not found")
    _get_sprint(col.sprint_id, folder_id, db, current_user)
    return col


def _ensure_column_capacity(
    col: KanbanColumn,
    db: Session,
    current_user: User,
    exclude_task_id: int | None = None,
) -> None:
    if not col.capacity or col.capacity <= 0:
        return

    q = db.query(KanbanTask).filter(
        KanbanTask.column_id == col.id,
        KanbanTask.user_id == current_user.id,
    )
    if exclude_task_id is not None:
        q = q.filter(KanbanTask.id != exclude_task_id)
    if q.count() >= col.capacity:
        raise BadRequestError(
            f"Column '{col.name}' has reached its capacity limit"
        )


def _next_sort_order(
    db: Session,
    current_user: User,
    column_id: int,
    exclude_task_id: int | None = None,
) -> int:
    """目标列末尾的下一个 sort_order."""
    q = db.query(func.max(KanbanTask.sort_order)).filter(
        KanbanTask.column_id == column_id,
        KanbanTask.user_id == current_user.id,
    )
    if exclude_task_id is not None:
        q = q.filter(KanbanTask.id != exclude_task_id)
    max_sort = q.scalar()
    return (max_sort or 0) + 1


def _build_out(task: KanbanTask) -> KanbanTaskOut:
    return KanbanTaskOut(
        id=task.id,
        folder_id=task.folder_id,
        sprint_id=task.sprint_id,
        column_id=task.column_id,
        title=task.title,
        version=task.version,
        task_type=task.task_type,
        priority=task.priority,
        requirement_desc=task.requirement_desc,
        technical_desc=task.technical_desc,
        acceptance_criteria=task.acceptance_criteria,
        custom_fields=task.custom_fields,
        sort_order=task.sort_order or 0,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.get("", response_model=list[KanbanTaskOut])
def list_kanban_tasks(
    folder_id: int = Query(...),
    sprint_id: int | None = Query(None),
    column_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(KanbanTask).filter(
        KanbanTask.folder_id == folder_id,
        KanbanTask.user_id == current_user.id,
    )
    if sprint_id is not None:
        q = q.filter(KanbanTask.sprint_id == sprint_id)
    if column_id is not None:
        q = q.filter(KanbanTask.column_id == column_id)
    tasks = q.order_by(KanbanTask.sort_order, KanbanTask.id).all()
    return [_build_out(t) for t in tasks]


@router.get("/{task_id}", response_model=KanbanTaskOut)
def get_kanban_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(KanbanTask)
        .filter(
            KanbanTask.id == task_id,
            KanbanTask.user_id == current_user.id,
        )
        .first()
    )
    if not task:
        raise NotFoundError("KanbanTask")
    return _build_out(task)


@router.post("", response_model=KanbanTaskOut, status_code=201)
def create_kanban_task(
    body: KanbanTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = _get_folder(body.folder_id, db, current_user)

    target_sprint_id = body.sprint_id
    if target_sprint_id is not None:
        _get_sprint(target_sprint_id, body.folder_id, db, current_user)

    if body.column_id is not None:
        col = _get_column(body.column_id, body.folder_id, db, current_user)
        if target_sprint_id is not None and target_sprint_id != col.sprint_id:
            raise BadRequestError(
                "Column does not belong to the selected sprint"
            )
        target_sprint_id = col.sprint_id
        _ensure_column_capacity(col, db, current_user)

    config = folder.kanban_config or {}
    fields_config = config.get("kanban_template", {}).get("fields", [])
    body_data = body.model_dump(exclude_unset=True)
    validated = _validate_against_template(fields_config, body_data)
    sys_fields = validated["system_fields"]

    task = KanbanTask(
        user_id=current_user.id,
        folder_id=body.folder_id,
        sprint_id=target_sprint_id,
        column_id=body.column_id,
        title=sys_fields.get("title", body.title),
        version=sys_fields.get("version"),
        task_type=sys_fields.get("task_type"),
        priority=sys_fields.get("priority"),
        requirement_desc=sys_fields.get("requirement_desc"),
        technical_desc=sys_fields.get("technical_desc"),
        acceptance_criteria=sys_fields.get("acceptance_criteria"),
        custom_fields=validated["custom_fields"] or None,
        sort_order=body.sort_order,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _build_out(task)


@router.put("/{task_id}", response_model=KanbanTaskOut)
def update_kanban_task(
    task_id: int,
    body: KanbanTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(KanbanTask)
        .filter(
            KanbanTask.id == task_id,
            KanbanTask.user_id == current_user.id,
        )
        .first()
    )
    if not task:
        raise NotFoundError("KanbanTask")

    folder = _get_folder(task.folder_id, db, current_user)
    body_data = body.model_dump(exclude_unset=True)
    if body_data:
        config = folder.kanban_config or {}
        fields_config = config.get("kanban_template", {}).get("fields", [])
        # 部分更新按"更新后的完整状态"校验: 只更新 custom_fields 时
        # 不应误触系统必填项校验, 也不应丢失既有字段
        incoming_custom = body_data.get("custom_fields") or {}
        if not isinstance(incoming_custom, dict):
            raise BadRequestError("custom_fields must be an object")
        merged_custom = dict(task.custom_fields or {})
        merged_custom.update(incoming_custom)
        effective_data = {
            key: body_data.get(key, getattr(task, key))
            for key in SYSTEM_FIELDS
        }
        effective_data["custom_fields"] = merged_custom
        validated = _validate_against_template(fields_config, effective_data)
        sys_fields = validated["system_fields"]

        for key, val in sys_fields.items():
            if key == "title" and val is None:
                continue
            setattr(task, key, val)
        if validated["custom_fields"]:
            merged = dict(task.custom_fields or {})
            merged.update(validated["custom_fields"])
            task.custom_fields = merged

    target_sprint_id = body_data.get("sprint_id", task.sprint_id)
    target_column_id = body_data.get("column_id", task.column_id)

    if "column_id" in body_data and target_column_id is not None:
        col = _get_column(target_column_id, task.folder_id, db, current_user)
        if target_sprint_id is not None and target_sprint_id != col.sprint_id:
            raise BadRequestError(
                "Column does not belong to the selected sprint"
            )
        target_sprint_id = col.sprint_id
        _ensure_column_capacity(col, db, current_user, exclude_task_id=task_id)
    elif "sprint_id" in body_data and target_sprint_id is not None:
        _get_sprint(target_sprint_id, task.folder_id, db, current_user)

    column_changed = (
        "column_id" in body_data and target_column_id != task.column_id
    )
    if "sprint_id" in body_data or "column_id" in body_data:
        task.sprint_id = target_sprint_id
    if "column_id" in body_data:
        task.column_id = target_column_id
    if "sort_order" in body_data:
        task.sort_order = body_data["sort_order"]
    elif column_changed and target_column_id is not None:
        # 换列且未指定位置时排到目标列末尾
        task.sort_order = _next_sort_order(
            db, current_user, target_column_id, exclude_task_id=task_id
        )

    db.commit()
    db.refresh(task)
    return _build_out(task)


@router.delete("/{task_id}", status_code=204)
def delete_kanban_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(KanbanTask)
        .filter(
            KanbanTask.id == task_id,
            KanbanTask.user_id == current_user.id,
        )
        .first()
    )
    if not task:
        raise NotFoundError("KanbanTask")
    db.delete(task)
    db.commit()


@router.put("/{task_id}/move", response_model=KanbanTaskOut)
def move_kanban_task(
    task_id: int,
    body: MoveKanbanTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(KanbanTask)
        .filter(
            KanbanTask.id == task_id,
            KanbanTask.user_id == current_user.id,
        )
        .first()
    )
    if not task:
        raise NotFoundError("KanbanTask")

    target_col = _get_column(
        body.target_column_id,
        task.folder_id,
        db,
        current_user,
    )
    if (
        body.target_sprint_id is not None
        and body.target_sprint_id != target_col.sprint_id
    ):
        raise BadRequestError("Target sprint does not match target column")
    _ensure_column_capacity(
        target_col,
        db,
        current_user,
        exclude_task_id=task_id,
    )

    column_changed = body.target_column_id != task.column_id
    task.column_id = body.target_column_id
    task.sprint_id = target_col.sprint_id
    if body.sort_order is not None:
        task.sort_order = body.sort_order
    elif column_changed:
        # 未指定位置时排到目标列末尾, 避免沿用旧列的 sort_order 与
        # 目标列既有任务冲突导致顺序退化
        task.sort_order = _next_sort_order(
            db, current_user, body.target_column_id, exclude_task_id=task_id
        )

    db.commit()
    db.refresh(task)
    return _build_out(task)
