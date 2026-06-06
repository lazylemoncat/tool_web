# Kanban 任务模板 + 设置功能 · 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Todo 页面的 Kanban 模式中实现独立 KanbanTask 表、文件夹级模板配置、Sprint 编辑入口、Kanban 统一设置面板

**Architecture:** 后端新建 `kanban_tasks` 表（独立于 Todo）+ Folder 模型增加 `kanban_config` JSON 字段存储模板定义；前端新建 KanbanSettingsDialog（4 标签页）+ 按模板动态渲染卡片/表单 + 改造 SprintTabs 入口

**Tech Stack:** FastAPI + SQLAlchemy + SQLite, React/Next.js + MUI + TypeScript

---

### Task 1: 后端 — KanbanTask 模型 + Folder.kanban_config

**Files:**
- Create: `backend/src/models/kanban_task.py`
- Modify: `backend/src/models/__init__.py`
- Modify: `backend/src/models/todo.py` (Folder 增加 kanban_config)
- Modify: `backend/src/models/kanban.py` (KanbanColumn 增加 kanban_tasks 关系)

- [ ] **Step 1: Create KanbanTask model**

```python
"""KanbanTask 独立模型 — 与 Todo 表分离."""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .folders import Folder
    from .kanban import KanbanColumn, Sprint
    from .user import User

from .todo import Base


class KanbanTask(Base):
    __tablename__ = "kanban_tasks"
    __table_args__ = (
        Index("idx_kt_board", "user_id", "folder_id", "sprint_id", "column_id", "sort_order"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    folder_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("folders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sprint_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True
    )
    column_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("kanban_columns.id", ondelete="SET NULL"), nullable=True
    )

    # System fields (mapped to real columns)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    task_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    priority: Mapped[str | None] = mapped_column(String(10), nullable=True)  # P0/P1/P2/P3
    requirement_desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    technical_desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    acceptance_criteria: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Custom fields (user-defined)
    custom_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True
    )

    user: Mapped[User] = relationship("User")
    folder: Mapped[Folder] = relationship("Folder", back_populates="kanban_tasks")
    sprint: Mapped[Sprint | None] = relationship("Sprint")
    kanban_column: Mapped[KanbanColumn | None] = relationship("KanbanColumn", back_populates="kanban_tasks")
```

- [ ] **Step 2: Add `kanban_config` to Folder model**

Edit `backend/src/models/todo.py`:
- Import `JSON` from `sqlalchemy.dialects.sqlite`
- Add column to Folder class after line 51 (`mode` column):
```python
kanban_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
```
- Add relationship to Folder class:
```python
kanban_tasks: Mapped[list[KanbanTask]] = relationship(
    "KanbanTask", back_populates="folder", cascade="all, delete-orphan"
)
```
- Add `KanbanTask` to the TYPE_CHECKING import block: `from .kanban_task import KanbanTask` (conditional on TYPE_CHECKING)

- [ ] **Step 3: Add `kanban_tasks` relationship to KanbanColumn**

Edit `backend/src/models/kanban.py`:
- Add to KanbanColumn class after `todos` relationship:
```python
kanban_tasks: Mapped[list[KanbanTask]] = relationship(
    "KanbanTask", back_populates="kanban_column"
)
```
- Add to TYPE_CHECKING import: `from .kanban_task import KanbanTask`

- [ ] **Step 4: Update `__init__.py`**

Edit `backend/src/models/__init__.py` — add:
```python
from .kanban_task import KanbanTask
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/kanban_task.py backend/src/models/todo.py backend/src/models/kanban.py backend/src/models/__init__.py
git commit -m "feat: add KanbanTask model and Folder.kanban_config column"
```

---

### Task 2: 后端 — KanbanTask Pydantic schemas

**Files:**
- Create: `backend/src/schemas/kanban_task.py`

- [ ] **Step 1: Write schemas**

```python
"""KanbanTask Pydantic schemas."""

from datetime import date, datetime

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
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/schemas/kanban_task.py
git commit -m "feat: add KanbanTask Pydantic schemas"
```

---

### Task 3: 后端 — KanbanTask CRUD 路由（含模板校验）

**Files:**
- Create: `backend/src/routers/kanban_task.py`

- [ ] **Step 1: Write the router**

```python
"""
KanbanTask CRUD 路由: /api/v1/kanban/tasks
含文件夹模板校验逻辑.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
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


SYSTEM_FIELDS = {"title", "version", "task_type", "priority",
                 "requirement_desc", "technical_desc", "acceptance_criteria"}


def _validate_against_template(fields_config: list[dict], data: dict) -> dict:
    """Validate and split data into system_fields and custom_fields against template config."""
    system_fields = {}
    custom_fields = {}

    # Build lookup by key
    config_map = {f["key"]: f for f in (fields_config or [])}

    for key, value in data.items():
        if key == "custom_fields":
            continue
        if key in SYSTEM_FIELDS:
            system_fields[key] = value
        elif key in config_map and not config_map[key].get("system", True):
            custom_fields[key] = value

    # Validate required fields
    for f in (fields_config or []):
        key = f["key"]
        if f.get("required"):
            if key in SYSTEM_FIELDS:
                val = system_fields.get(key)
            else:
                val = custom_fields.get(key)
            if val is None or (isinstance(val, str) and not val.strip()):
                raise BadRequestError(f"Field '{f['label']}' is required")

    # Validate types
    for f in (fields_config or []):
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
                raise BadRequestError(f"Field '{f['label']}': '{val}' is not a valid option ({options})")
        elif field_type == "number":
            try:
                float(val)
            except (TypeError, ValueError):
                raise BadRequestError(f"Field '{f['label']}': must be a number")
        elif field_type == "date":
            from datetime import date
            try:
                date.fromisoformat(str(val))
            except (ValueError, TypeError):
                raise BadRequestError(f"Field '{f['label']}': must be a valid date (YYYY-MM-DD)")

    return {"system_fields": system_fields, "custom_fields": custom_fields}


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
    task = db.query(KanbanTask).filter(
        KanbanTask.id == task_id,
        KanbanTask.user_id == current_user.id,
    ).first()
    if not task:
        raise NotFoundError("KanbanTask")
    return _build_out(task)


@router.post("", response_model=KanbanTaskOut, status_code=201)
def create_kanban_task(
    body: KanbanTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate folder exists and belongs to user
    folder = db.query(Folder).filter(
        Folder.id == body.folder_id,
        Folder.user_id == current_user.id,
    ).first()
    if not folder:
        raise BadRequestError("Folder not found")

    # Validate column belongs to folder's sprints
    if body.column_id is not None:
        col = db.query(KanbanColumn).filter(
            KanbanColumn.id == body.column_id,
            KanbanColumn.user_id == current_user.id,
        ).first()
        if not col:
            raise BadRequestError("Column not found")
        # Check capacity
        if col.capacity and col.capacity > 0:
            count = db.query(KanbanTask).filter(
                KanbanTask.column_id == col.id,
                KanbanTask.user_id == current_user.id,
            ).count()
            if count >= col.capacity:
                raise BadRequestError(f"Column '{col.name}' has reached its capacity limit")

    # Validate sprint belongs to folder
    if body.sprint_id is not None:
        sprint = db.query(Sprint).filter(
            Sprint.id == body.sprint_id,
            Sprint.folder_id == body.folder_id,
            Sprint.user_id == current_user.id,
        ).first()
        if not sprint:
            raise BadRequestError("Sprint not found in this folder")

    # Validate against folder's kanban_config template
    config = folder.kanban_config or {}
    fields_config = config.get("kanban_template", {}).get("fields", [])
    body_data = body.model_dump(exclude_unset=True)
    validated = _validate_against_template(fields_config, body_data)
    sys_fields = validated["system_fields"]

    task = KanbanTask(
        user_id=current_user.id,
        folder_id=body.folder_id,
        sprint_id=body.sprint_id,
        column_id=body.column_id,
        title=sys_fields.get("title", body.title),
        version=sys_fields.get("version"),
        task_type=sys_fields.get("task_type"),
        priority=sys_fields.get("priority"),
        requirement_desc=sys_fields.get("requirement_desc"),
        technical_desc=sys_fields.get("technical_desc"),
        acceptance_criteria=sys_fields.get("acceptance_criteria"),
        custom_fields=validated["custom_fields"] or body.custom_fields,
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
    task = db.query(KanbanTask).filter(
        KanbanTask.id == task_id,
        KanbanTask.user_id == current_user.id,
    ).first()
    if not task:
        raise NotFoundError("KanbanTask")

    # Load folder config for validation
    folder = db.query(Folder).filter(
        Folder.id == task.folder_id,
        Folder.user_id == current_user.id,
    ).first()
    if folder and body.model_dump(exclude_unset=True):
        config = folder.kanban_config or {}
        fields_config = config.get("kanban_template", {}).get("fields", [])
        body_data = body.model_dump(exclude_unset=True)
        validated = _validate_against_template(fields_config, body_data)
        sys_fields = validated["system_fields"]

        for key, val in sys_fields.items():
            if val is not None:
                setattr(task, key, val)
        if validated["custom_fields"]:
            merged = dict(task.custom_fields or {})
            merged.update(validated["custom_fields"])
            task.custom_fields = merged

    # update non-template fields
    for key in ("sprint_id", "column_id", "sort_order"):
        val = getattr(body, key, None)
        if val is not None:
            setattr(task, key, val)

    db.commit()
    db.refresh(task)
    return _build_out(task)


@router.delete("/{task_id}", status_code=204)
def delete_kanban_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(KanbanTask).filter(
        KanbanTask.id == task_id,
        KanbanTask.user_id == current_user.id,
    ).first()
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
    task = db.query(KanbanTask).filter(
        KanbanTask.id == task_id,
        KanbanTask.user_id == current_user.id,
    ).first()
    if not task:
        raise NotFoundError("KanbanTask")

    # Validate target column
    target_col = db.query(KanbanColumn).filter(
        KanbanColumn.id == body.target_column_id,
        KanbanColumn.user_id == current_user.id,
    ).first()
    if not target_col:
        raise BadRequestError("Target column not found")

    # Check capacity
    if target_col.capacity and target_col.capacity > 0:
        count = db.query(KanbanTask).filter(
            KanbanTask.column_id == target_col.id,
            KanbanTask.user_id == current_user.id,
            KanbanTask.id != task_id,
        ).count()
        if count >= target_col.capacity:
            raise BadRequestError(f"Column '{target_col.name}' has reached its capacity limit")

    task.column_id = body.target_column_id
    if body.target_sprint_id is not None:
        task.sprint_id = body.target_sprint_id
    if body.sort_order is not None:
        task.sort_order = body.sort_order

    db.commit()
    db.refresh(task)
    return _build_out(task)
```

- [ ] **Step 2: Register the router in main app**

Read `backend/src/main.py` and add:
```python
from .routers import kanban_task as kanban_task_router
app.include_router(kanban_task_router.router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routers/kanban_task.py backend/src/main.py
git commit -m "feat: add KanbanTask CRUD router with template validation"
```

---

### Task 4: 后端 — 扩展 Folder schemas + 自动初始化默认列

**Files:**
- Modify: `backend/src/schemas/todo.py`
- Modify: `backend/src/routers/folder.py`

- [ ] **Step 1: Add kanban_config to Folder schemas**

Edit `backend/src/schemas/todo.py`:
```python
class FolderCreate(BaseModel):
    parent_id: int | None = None
    name: str = Field(min_length=1, max_length=50)
    color: str = "#6366f1"
    sort_order: int = 0
    mode: str = "todo"
    kanban_config: dict | None = None  # NEW


class FolderUpdate(BaseModel):
    parent_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=50)
    color: str | None = None
    sort_order: int | None = None
    mode: str | None = None
    kanban_config: dict | None = None  # NEW


class FolderOut(BaseModel):
    id: int
    parent_id: int | None = None
    name: str
    color: str
    mode: str = "todo"
    kanban_config: dict | None = None  # NEW
    sort_order: int
    created_at: datetime
    updated_at: datetime
    todo_count: int = 0
    children: list["FolderOut"] = []

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Add default kanban_config when creating kanban folder**

Edit `backend/src/routers/folder.py` — in the create_folder endpoint, after setting `folder = Folder(...)`:

```python
# If kanban mode, set default kanban_config template
if body.mode == "kanban":
    folder.kanban_config = {
        "kanban_template": {
            "fields": [
                {"key": "title", "label": "任务名称", "type": "text", "show_on_card": True, "show_in_detail": True, "required": True, "order": 1, "system": True, "editable": True, "default_value": ""},
                {"key": "version", "label": "所属版本", "type": "text", "show_on_card": True, "show_in_detail": True, "required": False, "order": 2, "system": True, "editable": True, "default_value": ""},
                {"key": "task_type", "label": "任务类型", "type": "select", "show_on_card": True, "show_in_detail": True, "required": True, "order": 3, "system": True, "editable": True, "default_value": "feature", "options": ["feature", "bug", "chore", "refactor", "docs", "test"]},
                {"key": "priority", "label": "优先级", "type": "select", "show_on_card": True, "show_in_detail": True, "required": True, "order": 4, "system": True, "editable": True, "default_value": "P2", "options": ["P0", "P1", "P2", "P3"]},
                {"key": "requirement_desc", "label": "需求说明", "type": "textarea", "show_on_card": False, "show_in_detail": True, "required": False, "order": 5, "system": True, "editable": True, "default_value": ""},
                {"key": "technical_desc", "label": "技术说明", "type": "textarea", "show_on_card": False, "show_in_detail": True, "required": False, "order": 6, "system": True, "editable": True, "default_value": ""},
                {"key": "acceptance_criteria", "label": "验收标准", "type": "textarea", "show_on_card": False, "show_in_detail": True, "required": False, "order": 7, "system": True, "editable": True, "default_value": ""},
            ]
        }
    }
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/schemas/todo.py backend/src/routers/folder.py
git commit -m "feat: extend Folder schemas with kanban_config, add default template"
```

---

### Task 5: 后端 — 数据库迁移

**Files:**
- Modify: `backend/src/database.py`

- [ ] **Step 1: Add migration logic**

Read `backend/src/database.py` and add migration steps to create the kanban_tasks table and add kanban_config column to folders:

```python
# In the migration/init_db function, after existing tables:

# Create kanban_tasks table
if not engine.dialect.has_table(connection, "kanban_tasks"):
    KanbanTask.__table__.create(engine)

# Add kanban_config column to folders (if not exists)
from sqlalchemy import inspect
inspector = inspect(engine)
columns = [c["name"] for c in inspector.get_columns("folders")]
if "kanban_config" not in columns:
    from sqlalchemy import Text
    connection.execute(text("ALTER TABLE folders ADD COLUMN kanban_config TEXT"))

# Add indexes
from sqlalchemy import Index
idx_kt_board = Index("idx_kt_board", "user_id", "folder_id", "sprint_id", "column_id", "sort_order")
idx_kt_board.create(bind=engine)
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/database.py
git commit -m "feat: add kanban_tasks table migration and folder.kanban_config column"
```

---

### Task 6: 后端 — 测试 KanbanTask CRUD + 模板校验

**Files:**
- Create: `backend/tests/test_kanban_task.py`

- [ ] **Step 1: Write tests**

```python
"""Tests for KanbanTask CRUD and template validation."""

import json
import pytest
from fastapi.testclient import TestClient

from src.database import get_db
from src.main import app
from src.models.kanban_task import KanbanTask


def test_create_kanban_task(client, db_session, test_user, test_folder, test_sprint):
    """Test creating a kanban task with valid fields."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = test_kanban_column(sprint_id=sprint.id, name="Backlog", capacity=None)
    db_session.commit()

    resp = client.post("/api/v1/kanban/tasks", json={
        "folder_id": folder.id,
        "sprint_id": sprint.id,
        "column_id": col.id,
        "title": "Test task",
        "priority": "P1",
        "task_type": "feature",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test task"
    assert data["priority"] == "P1"


def test_create_kanban_task_required_field(client, db_session, test_user, test_folder, test_sprint):
    """Test that required 'title' field validation works."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = test_kanban_column(sprint_id=sprint.id, name="Backlog")
    db_session.commit()

    resp = client.post("/api/v1/kanban/tasks", json={
        "folder_id": folder.id,
        "sprint_id": sprint.id,
        "column_id": col.id,
        "title": "",  # empty, title is required in template
    })
    assert resp.status_code == 400


def test_create_kanban_task_invalid_select(client, db_session, test_user, test_folder, test_sprint):
    """Test that invalid select option is rejected."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = test_kanban_column(sprint_id=sprint.id, name="Backlog")
    db_session.commit()

    resp = client.post("/api/v1/kanban/tasks", json={
        "folder_id": folder.id,
        "sprint_id": sprint.id,
        "column_id": col.id,
        "title": "Test",
        "priority": "P99",  # not in options: P0-P3
    })
    assert resp.status_code == 400


def test_create_kanban_task_capacity_full(client, db_session, test_user, test_folder, test_sprint):
    """Test that task creation is rejected when column is at capacity."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = test_kanban_column(sprint_id=sprint.id, name="Doing", capacity=1)
    db_session.commit()

    # First task — should succeed
    resp = client.post("/api/v1/kanban/tasks", json={
        "folder_id": folder.id, "sprint_id": sprint.id, "column_id": col.id,
        "title": "Task 1", "priority": "P2",
    })
    assert resp.status_code == 201

    # Second task — should fail (capacity 1)
    resp = client.post("/api/v1/kanban/tasks", json={
        "folder_id": folder.id, "sprint_id": sprint.id, "column_id": col.id,
        "title": "Task 2", "priority": "P2",
    })
    assert resp.status_code == 400
    assert "capacity" in resp.text.lower()


def test_move_kanban_task(client, db_session, test_user, test_folder, test_sprint):
    """Test moving a task between columns."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col1 = test_kanban_column(sprint_id=sprint.id, name="Backlog", sort_order=0)
    col2 = test_kanban_column(sprint_id=sprint.id, name="Ready", sort_order=1, capacity=None)
    db_session.commit()

    resp = client.post("/api/v1/kanban/tasks", json={
        "folder_id": folder.id, "sprint_id": sprint.id, "column_id": col1.id,
        "title": "Movable task", "priority": "P2",
    })
    task_id = resp.json()["id"]

    resp = client.put(f"/api/v1/kanban/tasks/{task_id}/move", json={
        "target_column_id": col2.id,
    })
    assert resp.status_code == 200
    assert resp.json()["column_id"] == col2.id


def test_list_kanban_tasks(client, db_session, test_user, test_folder, test_sprint):
    """Test listing tasks by folder and sprint."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = test_kanban_column(sprint_id=sprint.id, name="Backlog")
    db_session.commit()

    for i in range(3):
        client.post("/api/v1/kanban/tasks", json={
            "folder_id": folder.id, "sprint_id": sprint.id, "column_id": col.id,
            "title": f"Task {i}", "priority": "P2",
        })

    resp = client.get(f"/api/v1/kanban/tasks?folder_id={folder.id}&sprint_id={sprint.id}")
    assert resp.status_code == 200
    assert len(resp.json()) == 3


def test_delete_kanban_task(client, db_session, test_user, test_folder, test_sprint):
    """Test deleting a kanban task."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = test_kanban_column(sprint_id=sprint.id, name="Backlog")
    db_session.commit()

    resp = client.post("/api/v1/kanban/tasks", json={
        "folder_id": folder.id, "sprint_id": sprint.id, "column_id": col.id,
        "title": "To delete", "priority": "P2",
    })
    task_id = resp.json()["id"]

    resp = client.delete(f"/api/v1/kanban/tasks/{task_id}")
    assert resp.status_code == 204

    resp = client.get(f"/api/v1/kanban/tasks/{task_id}")
    assert resp.status_code == 404
```

- [ ] **Step 2: Run tests to verify**

```bash
cd backend && pytest tests/test_kanban_task.py -v
```

Expected: All 7 tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_kanban_task.py
git commit -m "test: add KanbanTask CRUD and validation tests"
```

---

### Task 7: 前端 — TypeScript 类型定义

**Files:**
- Modify: `frontend/src/lib/types.ts`

- [ ] **Step 1: Add KanbanTask types + KanbanConfig types**

```typescript
// ===== KanbanTask (independent from Todo) =====
export interface KanbanTaskOut {
  id: number;
  folder_id: number;
  sprint_id: number | null;
  column_id: number | null;
  title: string;
  version: string | null;
  task_type: string | null;
  priority: string | null;  // P0/P1/P2/P3
  requirement_desc: string | null;
  technical_desc: string | null;
  acceptance_criteria: string | null;
  custom_fields: Record<string, unknown> | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface KanbanTaskCreate {
  folder_id: number;
  sprint_id?: number | null;
  column_id?: number | null;
  title: string;
  version?: string | null;
  task_type?: string | null;
  priority?: string | null;
  requirement_desc?: string | null;
  technical_desc?: string | null;
  acceptance_criteria?: string | null;
  custom_fields?: Record<string, unknown> | null;
  sort_order?: number;
}

export interface KanbanTaskUpdate {
  title?: string;
  sprint_id?: number | null;
  column_id?: number | null;
  version?: string | null;
  task_type?: string | null;
  priority?: string | null;
  requirement_desc?: string | null;
  technical_desc?: string | null;
  acceptance_criteria?: string | null;
  custom_fields?: Record<string, unknown> | null;
  sort_order?: number;
}

export interface MoveKanbanTaskRequest {
  target_column_id: number;
  target_sprint_id?: number | null;
  sort_order?: number;
}

// ===== Field definition (for kanban_config template) =====
export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date';
  show_on_card: boolean;
  show_in_detail: boolean;
  required: boolean;
  order: number;
  system: boolean;
  editable?: boolean;
  default_value?: string;
  options?: string[];
}

export interface KanbanTemplate {
  fields: FieldDef[];
}

export interface KanbanConfig {
  kanban_template: KanbanTemplate;
}
```

- [ ] **Step 2: Update FolderOut to include kanban_config**

```typescript
export interface FolderOut {
  id: number;
  parent_id: number | null;
  name: string;
  color: string;
  mode: string;
  kanban_config: KanbanConfig | null;  // NEW
  sort_order: number;
  created_at: string;
  updated_at: string;
  todo_count: number;
  children: FolderOut[];
}

export interface FolderUpdate {
  parent_id?: number | null;
  name?: string;
  color?: string;
  sort_order?: number;
  mode?: string;
  kanban_config?: KanbanConfig | null;  // NEW
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/types.ts
git commit -m "feat: add KanbanTask and KanbanConfig TypeScript types"
```

---

### Task 8: 前端 — KanbanTask API 模块

**Files:**
- Create: `frontend/src/lib/api/kanbanTask.ts`

- [ ] **Step 1: Write API functions**

```typescript
import { apiFetch } from './api';
import type {
  KanbanTaskOut, KanbanTaskCreate, KanbanTaskUpdate, MoveKanbanTaskRequest,
} from '@/lib/types';

export async function listKanbanTasks(
  folderId: number,
  sprintId?: number | null,
  columnId?: number | null,
): Promise<KanbanTaskOut[]> {
  const params = new URLSearchParams({ folder_id: String(folderId) });
  if (sprintId != null) params.set('sprint_id', String(sprintId));
  if (columnId != null) params.set('column_id', String(columnId));
  return apiFetch<KanbanTaskOut[]>('GET', `/api/v1/kanban/tasks?${params}`);
}

export async function getKanbanTask(id: number): Promise<KanbanTaskOut> {
  return apiFetch<KanbanTaskOut>('GET', `/api/v1/kanban/tasks/${id}`);
}

export async function createKanbanTask(body: KanbanTaskCreate): Promise<KanbanTaskOut> {
  return apiFetch<KanbanTaskOut>('POST', '/api/v1/kanban/tasks', body);
}

export async function updateKanbanTask(id: number, body: KanbanTaskUpdate): Promise<KanbanTaskOut> {
  return apiFetch<KanbanTaskOut>('PUT', `/api/v1/kanban/tasks/${id}`, body);
}

export async function deleteKanbanTask(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/kanban/tasks/${id}`);
}

export async function moveKanbanTask(id: number, body: MoveKanbanTaskRequest): Promise<KanbanTaskOut> {
  return apiFetch<KanbanTaskOut>('PUT', `/api/v1/kanban/tasks/${id}/move`, body);
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/api/kanbanTask.ts
git commit -m "feat: add KanbanTask API functions"
```

---

### Task 9: 前端 — KanbanSettingsDialog（4 标签页 + 子组件）

**Files:**
- Create: `frontend/src/components/todo/kanban/KanbanSettingsDialog.tsx`
- Create: `frontend/src/components/todo/kanban/ColumnListEditor.tsx`
- Create: `frontend/src/components/todo/kanban/FieldTemplateEditor.tsx`
- Create: `frontend/src/components/todo/kanban/SprintListEditor.tsx`
- Create: `frontend/src/components/todo/kanban/KanbanPreferences.tsx`
- Create: `frontend/src/components/todo/kanban/CustomFieldDialog.tsx`
- Modify: `frontend/src/components/todo/kanban/index.ts`

**KanbanSettingsDialog.tsx** — 主对话框组件，4 Tab 容器：

```tsx
'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import type { Sprint, KanbanColumnData, FieldDef, KanbanConfig } from '@/lib/types';
import ColumnListEditor from './ColumnListEditor';
import FieldTemplateEditor from './FieldTemplateEditor';
import SprintListEditor from './SprintListEditor';
import KanbanPreferences from './KanbanPreferences';

interface KanbanSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  columns: KanbanColumnData[];
  sprints: Sprint[];
  fields: FieldDef[];
  kanbanConfig: KanbanConfig | null;
  onSaveColumns: (columns: KanbanColumnData[]) => void;
  onSaveFields: (fields: FieldDef[]) => void;
  onSaveSprints: (sprints: Sprint[]) => void;
  onSavePreferences: (prefs: Record<string, unknown>) => void;
}

export default function KanbanSettingsDialog({
  open, onClose, columns, sprints, fields, kanbanConfig,
  onSaveColumns, onSaveFields, onSaveSprints, onSavePreferences,
}: KanbanSettingsDialogProps) {
  const [tab, setTab] = useState(0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Kanban 设置
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
        <Tab label="列配置" />
        <Tab label="任务卡模板" />
        <Tab label="Sprint 管理" />
        <Tab label="偏好设置" />
      </Tabs>
      <DialogContent sx={{ minHeight: 320 }}>
        {tab === 0 && (
          <ColumnListEditor
            columns={columns}
            onSave={onSaveColumns}
          />
        )}
        {tab === 1 && (
          <FieldTemplateEditor
            fields={fields}
            onSave={onSaveFields}
          />
        )}
        {tab === 2 && (
          <SprintListEditor
            sprints={sprints}
            onSave={onSaveSprints}
          />
        )}
        {tab === 3 && (
          <KanbanPreferences onSave={onSavePreferences} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>完成</Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 1: Write ColumnListEditor.tsx**

```tsx
'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import type { KanbanColumnData } from '@/lib/types';

interface ColumnListEditorProps {
  columns: KanbanColumnData[];
  onSave: (columns: KanbanColumnData[]) => void;
}

export default function ColumnListEditor({ columns, onSave }: ColumnListEditorProps) {
  const [editCol, setEditCol] = useState<KanbanColumnData | null>(null);
  const [localCols, setLocalCols] = useState(() => [...columns].sort((a, b) => a.sort_order - b.sort_order));

  const handleEdit = (col: KanbanColumnData) => setEditCol({ ...col });
  const handleSaveCol = () => {
    if (!editCol) return;
    const updated = localCols.map(c => c.id === editCol.id ? editCol : c);
    setLocalCols(updated);
    setEditCol(null);
  };
  const handleDelete = (id: number) => {
    const updated = localCols.filter(c => c.id !== id);
    setLocalCols(updated);
    onSave(updated);
  };

  return (
    <Box>
      {localCols.map(col => (
        <Box key={col.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={600}>{col.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              容量: {col.capacity || '不限'} · {col.task_count} 项任务{col.is_archived ? ' · 归档列' : ''}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => handleEdit(col)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => handleDelete(col.id)}><DeleteIcon fontSize="small" color="error" /></IconButton>
        </Box>
      ))}
      <Button size="small" sx={{ mt: 1 }} onClick={() => onSave(localCols)}>保存列配置</Button>

      {/* Edit dialog */}
      <Dialog open={!!editCol} onClose={() => setEditCol(null)} maxWidth="xs" fullWidth>
        <DialogTitle>编辑列</DialogTitle>
        <DialogContent>
          <TextField label="列名称" fullWidth size="small" sx={{ mt: 1 }}
            value={editCol?.name || ''} onChange={e => setEditCol(prev => prev ? { ...prev, name: e.target.value } : null)} />
          <TextField label="容量上限" type="number" fullWidth size="small" sx={{ mt: 1 }}
            value={editCol?.capacity || ''} onChange={e => setEditCol(prev => prev ? { ...prev, capacity: parseInt(e.target.value) || 0 } : null)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCol(null)}>取消</Button>
          <Button onClick={handleSaveCol} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
```

- [ ] **Step 2: Write FieldTemplateEditor.tsx**

```tsx
'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import type { FieldDef } from '@/lib/types';
import CustomFieldDialog from './CustomFieldDialog';

interface FieldTemplateEditorProps {
  fields: FieldDef[];
  onSave: (fields: FieldDef[]) => void;
}

export default function FieldTemplateEditor({ fields, onSave }: FieldTemplateEditorProps) {
  const [localFields, setLocalFields] = useState(() => [...fields].sort((a, b) => a.order - b.order));
  const [editingField, setEditingField] = useState<{ index: number; field: FieldDef } | null>(null);
  const [addingField, setAddingField] = useState(false);

  const handleEdit = (index: number) => setEditingField({ index, field: { ...localFields[index] } });
  const handleDelete = (index: number) => setLocalFields(prev => prev.filter((_, i) => i !== index));
  const handleSaveField = (field: FieldDef) => {
    if (editingField) {
      setLocalFields(prev => prev.map((f, i) => i === editingField.index ? { ...f, ...field } : f));
      setEditingField(null);
    } else {
      setLocalFields(prev => [...prev, { ...field, order: prev.length + 1 }]);
      setAddingField(false);
    }
  };
  const handleReset = () => {
    if (confirm('恢复默认模板将重置所有自定义字段，确认？')) {
      // Default 7 system fields
      onSave([
        { key: 'title', label: '任务名称', type: 'text', show_on_card: true, show_in_detail: true, required: true, order: 1, system: true, editable: true, default_value: '' },
        { key: 'version', label: '所属版本', type: 'text', show_on_card: true, show_in_detail: true, required: false, order: 2, system: true, editable: true, default_value: '' },
        { key: 'task_type', label: '任务类型', type: 'select', show_on_card: true, show_in_detail: true, required: true, order: 3, system: true, editable: true, default_value: 'feature', options: ['feature', 'bug', 'chore', 'refactor', 'docs', 'test'] },
        { key: 'priority', label: '优先级', type: 'select', show_on_card: true, show_in_detail: true, required: true, order: 4, system: true, editable: true, default_value: 'P2', options: ['P0', 'P1', 'P2', 'P3'] },
        { key: 'requirement_desc', label: '需求说明', type: 'textarea', show_on_card: false, show_in_detail: true, required: false, order: 5, system: true, editable: true, default_value: '' },
        { key: 'technical_desc', label: '技术说明', type: 'textarea', show_on_card: false, show_in_detail: true, required: false, order: 6, system: true, editable: true, default_value: '' },
        { key: 'acceptance_criteria', label: '验收标准', type: 'textarea', show_on_card: false, show_in_detail: true, required: false, order: 7, system: true, editable: true, default_value: '' },
      ]);
      setLocalFields([]);
    }
  };

  return (
    <Box>
      {localFields.map((f, i) => (
        <Box key={f.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={500}>
              {f.label}
              {f.required && <Chip label="必填" size="small" color="error" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {f.type}{f.system ? ' · 系统字段' : ' · 自定义'}
              {f.options?.length ? ` · [${f.options.join(', ')}]` : ''}
            </Typography>
          </Box>
          {!f.system && (
            <>
              <IconButton size="small" onClick={() => handleEdit(i)}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleDelete(i)}><DeleteIcon fontSize="small" color="error" /></IconButton>
            </>
          )}
        </Box>
      ))}
      <Button size="small" sx={{ mt: 1 }} onClick={() => setAddingField(true)}>+ 新增字段</Button>
      <Button size="small" sx={{ mt: 1, ml: 1, color: 'warning.main' }} onClick={handleReset}>恢复默认模板</Button>
      <Button size="small" sx={{ mt: 1, ml: 1 }} onClick={() => onSave(localFields)} variant="outlined">保存模板</Button>

      <CustomFieldDialog
        open={addingField || !!editingField}
        field={editingField?.field || null}
        onSave={handleSaveField}
        onClose={() => { setAddingField(false); setEditingField(null); }}
      />
    </Box>
  );
}
```

- [ ] **Step 3: Write SprintListEditor.tsx**

```tsx
'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import type { Sprint } from '@/lib/types';
import dayjs from 'dayjs';

interface SprintListEditorProps {
  sprints: Sprint[];
  onSave: (sprints: Sprint[]) => void;
}

export default function SprintListEditor({ sprints, onSave }: SprintListEditorProps) {
  const [local, setLocal] = useState(() => [...sprints]);
  const [editSprint, setEditSprint] = useState<Partial<Sprint> & { idx: number } | null>(null);

  const handleEdit = (idx: number) => setEditSprint({ ...local[idx], idx });
  const handleDelete = (idx: number) => setLocal(prev => prev.filter((_, i) => i !== idx));
  const handleSave = () => {
    if (!editSprint) return;
    setLocal(prev => prev.map((s, i) => i === editSprint.idx ? { ...s, ...editSprint, idx: undefined } : s));
    setEditSprint(null);
  };
  const handleNew = () => {
    const newSprint: Sprint = {
      id: 0, folder_id: 0, name: '新 Sprint', goal: '',
      start_date: null, end_date: null, status: 'planned',
      sort_order: local.length, created_at: '', updated_at: '',
    };
    setLocal(prev => [...prev, newSprint]);
    setEditSprint({ ...newSprint, idx: local.length });
  };

  const statusLabel: Record<string, string> = { active: '进行中', planned: '未开始', completed: '已完成' };
  const statusColor: Record<string, 'success' | 'default' | 'info'> = { active: 'success', planned: 'default', completed: 'info' };

  return (
    <Box>
      {local.map((s, i) => (
        <Box key={s.id || i} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {s.name}
              <Chip label={statusLabel[s.status] || s.status} size="small"
                color={statusColor[s.status] || 'default'}
                sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {s.goal || '无目标'}
              {s.start_date ? ` · ${s.start_date} → ${s.end_date || ''}` : ''}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => handleEdit(i)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => handleDelete(i)}><DeleteIcon fontSize="small" color="error" /></IconButton>
        </Box>
      ))}
      <Button size="small" sx={{ mt: 1 }} onClick={handleNew}>+ 新建 Sprint</Button>
      <Button size="small" sx={{ mt: 1, ml: 1 }} onClick={() => onSave(local)} variant="outlined">保存 Sprint</Button>

      <Dialog open={!!editSprint} onClose={() => setEditSprint(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{editSprint && editSprint.idx >= 0 && local[editSprint.idx]?.id ? '编辑 Sprint' : '新建 Sprint'}</DialogTitle>
        <DialogContent>
          <TextField label="名称" fullWidth size="small" sx={{ mt: 1 }}
            value={editSprint?.name || ''} onChange={e => setEditSprint(prev => prev ? { ...prev, name: e.target.value } : null)} />
          <TextField label="目标" fullWidth size="small" sx={{ mt: 1 }}
            value={editSprint?.goal || ''} onChange={e => setEditSprint(prev => prev ? { ...prev, goal: e.target.value } : null)} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField label="开始日期" type="date" size="small" fullWidth
              InputLabelProps={{ shrink: true }}
              value={editSprint?.start_date || ''} onChange={e => setEditSprint(prev => prev ? { ...prev, start_date: e.target.value } : null)} />
            <TextField label="结束日期" type="date" size="small" fullWidth
              InputLabelProps={{ shrink: true }}
              value={editSprint?.end_date || ''} onChange={e => setEditSprint(prev => prev ? { ...prev, end_date: e.target.value } : null)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSprint(null)}>取消</Button>
          <Button onClick={handleSave} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
```

- [ ] **Step 4: Write KanbanPreferences.tsx**

```tsx
'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';

interface KanbanPreferencesProps {
  onSave: (prefs: Record<string, unknown>) => void;
}

export default function KanbanPreferences({ onSave }: KanbanPreferencesProps) {
  const [showArchived, setShowArchived] = useState(true);
  const [allowDrag, setAllowDrag] = useState(true);
  const [rememberView, setRememberView] = useState(true);

  return (
    <Box>
      <FormControlLabel control={<Checkbox checked={showArchived} onChange={(_, v) => setShowArchived(v)} />}
        label="显示归档任务" />
      <FormControlLabel control={<Checkbox checked={allowDrag} onChange={(_, v) => setAllowDrag(v)} />}
        label="允许拖拽移动" />
      <FormControlLabel control={<Checkbox checked={rememberView} onChange={(_, v) => setRememberView(v)} />}
        label="记住该文件夹的最后筛选状态" />
      <Box sx={{ mt: 2 }}>
        <Button variant="outlined" size="small" onClick={() => onSave({ show_archived: showArchived, allow_drag: allowDrag, remember_view: rememberView })}>
          保存偏好设置
        </Button>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 5: Write CustomFieldDialog.tsx**

```tsx
'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import type { FieldDef } from '@/lib/types';

interface CustomFieldDialogProps {
  open: boolean;
  field: FieldDef | null;
  onSave: (field: FieldDef) => void;
  onClose: () => void;
}

export default function CustomFieldDialog({ open, field, onSave, onClose }: CustomFieldDialogProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldDef['type']>('text');
  const [options, setOptions] = useState('');

  useEffect(() => {
    if (field) {
      setLabel(field.label);
      setType(field.type);
      setOptions(field.options?.join(', ') || '');
    } else {
      setLabel('');
      setType('text');
      setOptions('');
    }
  }, [field, open]);

  const handleSave = () => {
    if (!label.trim()) return;
    const key = field?.key || `fld_${label.toLowerCase().replace(/\s+/g, '_')}`;
    onSave({
      key,
      label: label.trim(),
      type,
      show_on_card: true,
      show_in_detail: true,
      required: false,
      order: field?.order || 0,
      system: false,
      editable: true,
      default_value: '',
      options: type === 'select' ? options.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{field ? '编辑字段' : '新增字段'}</DialogTitle>
      <DialogContent>
        <TextField label="字段名称" fullWidth size="small" sx={{ mt: 1 }}
          value={label} onChange={e => setLabel(e.target.value)} />
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel>字段类型</InputLabel>
          <Select value={type} label="字段类型" onChange={e => setType(e.target.value as FieldDef['type'])}>
            <MenuItem value="text">文本</MenuItem>
            <MenuItem value="textarea">多行文本</MenuItem>
            <MenuItem value="select">下拉选择</MenuItem>
            <MenuItem value="number">数字</MenuItem>
            <MenuItem value="date">日期</MenuItem>
          </Select>
        </FormControl>
        {type === 'select' && (
          <TextField label="选项（逗号分隔）" fullWidth size="small" sx={{ mt: 1 }}
            value={options} onChange={e => setOptions(e.target.value)} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained">保存</Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 6: Update index.ts to export new components**

Edit `frontend/src/components/todo/kanban/index.ts`:
```typescript
export { default as KanbanSettingsDialog } from './KanbanSettingsDialog';
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/todo/kanban/
git commit -m "feat: add KanbanSettingsDialog with column, field, sprint and preference editors"
```

---

### Task 10: 前端 — 改造 SprintTabs（增加 ⚙️ 按钮，去掉右键菜单）

**Files:**
- Modify: `frontend/src/components/todo/kanban/SprintTabs.tsx`

- [ ] **Step 1: Rewrite SprintTabs**

```tsx
'use client';

import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import type { Sprint } from '@/lib/types';

interface SprintTabsProps {
  sprints: Sprint[];
  activeSprintId: number | null;
  onSprintChange: (sprintId: number) => void;
  onNewSprint: () => void;
  onOpenSettings: () => void;
}

export default function SprintTabs({
  sprints, activeSprintId, onSprintChange, onNewSprint, onOpenSettings,
}: SprintTabsProps) {
  const activeSprint = sprints.find(s => s.id === activeSprintId);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
      <Tabs
        value={activeSprintId ?? false}
        onChange={(_, value) => onSprintChange(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ flex: 1, minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0.75, fontSize: '0.8rem' } }}
      >
        {sprints.map((s) => (
          <Tab key={s.id} label={s.name} value={s.id} />
        ))}
      </Tabs>

      <IconButton size="small" onClick={onOpenSettings} title="Kanban 设置" sx={{ flexShrink: 0 }}>
        <SettingsIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={onNewSprint} title="新建 Sprint" sx={{ flexShrink: 0 }}>
        <AddCircleIcon fontSize="small" />
      </IconButton>

      {activeSprint && (
        <Box sx={{
          display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1.5,
          fontSize: '0.75rem', color: 'text.secondary', flexShrink: 0, mr: 1,
        }}>
          {activeSprint.goal && (
            <>
              <Box component="span">🎯 {activeSprint.goal}</Box>
              <Box component="span" sx={{ color: 'divider' }}>|</Box>
            </>
          )}
          {activeSprint.start_date && (
            <Box component="span">📅 {activeSprint.start_date} ~ {activeSprint.end_date || ''}</Box>
          )}
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/todo/kanban/SprintTabs.tsx
git commit -m "refactor: SprintTabs replace context menu with settings gear icon"
```

---

### Task 11: 前端 — 改造 KanbanCard（按模板动态渲染，去掉 Back 按钮）

**Files:**
- Modify: `frontend/src/components/todo/kanban/KanbanCard.tsx`

- [ ] **Step 1: Rewrite KanbanCard**

```tsx
'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import type { KanbanTaskOut, FieldDef } from '@/lib/types';

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#FFDAD6', P1: '#FFE0B2', P2: '#FFF8E1', P3: '#F3EDF7',
};
const PRIORITY_TEXT: Record<string, string> = {
  P0: '#410002', P1: '#5E3C00', P2: '#5E5200', P3: '#49454F',
};
const TYPE_COLORS: Record<string, string> = {
  feature: '#DCE8FF', bug: '#FFDAD6', chore: '#F3EDF7',
  refactor: '#E8DEF8', docs: '#D9F2DA', test: '#C6F0F0',
};

interface KanbanCardProps {
  task: KanbanTaskOut;
  fields: FieldDef[];
  isLastColumn: boolean;
  onClick: () => void;
  onConfirm: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isDraggable?: boolean;
}

export default function KanbanCard({
  task, fields, isLastColumn, onClick, onConfirm,
  onDragStart, isDraggable = true,
}: KanbanCardProps) {
  // Fields visible on card, sorted by order
  const cardFields = fields
    .filter(f => f.show_on_card && f.key !== 'title')
    .sort((a, b) => a.order - b.order);

  const getFieldValue = (field: FieldDef): string | null => {
    if (field.system) {
      return (task as Record<string, unknown>)[field.key] as string ?? null;
    }
    return (task.custom_fields as Record<string, unknown>)?.[field.key] as string ?? null;
  };

  return (
    <Box
      draggable={isDraggable}
      onDragStart={onDragStart}
      onClick={onClick}
      sx={{
        background: '#fff', borderRadius: 2, border: '1px solid',
        borderColor: 'divider', p: 1.5, cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        '&:hover': { boxShadow: 1, transform: 'translateY(-1px)' },
        '&:active': { cursor: 'grabbing' },
      }}
    >
      {/* Chip row: priority + type + version */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.75, flexWrap: 'wrap' }}>
        {(task.priority) && (
          <Chip label={task.priority} size="small" sx={{
            height: 20, fontSize: '0.65rem', fontWeight: 600,
            bgcolor: PRIORITY_COLORS[task.priority] || '#F3EDF7',
            color: PRIORITY_TEXT[task.priority] || '#49454F',
            '& .MuiChip-label': { px: 0.75 },
          }} />
        )}
        {task.task_type && (
          <Chip label={task.task_type} size="small" sx={{
            height: 20, fontSize: '0.65rem', fontWeight: 500,
            bgcolor: TYPE_COLORS[task.task_type] || '#F3EDF7',
            color: '#1D1B20', '& .MuiChip-label': { px: 0.75 },
          }} />
        )}
        {task.version && (
          <Chip label={task.version} size="small" sx={{
            height: 20, fontSize: '0.6rem', fontWeight: 500,
            bgcolor: '#EDE7F0', fontFamily: 'monospace',
            '& .MuiChip-label': { px: 0.5 },
          }} />
        )}
      </Box>

      {/* Title */}
      <Typography variant="body2" sx={{
        fontWeight: 500, fontSize: '0.8125rem', mb: 0.5,
        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {task.title}
      </Typography>

      {/* Other card fields (e.g., story_point, module) */}
      {cardFields.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
          {cardFields.map(f => {
            const val = getFieldValue(f);
            return val ? (
              <Chip key={f.key} label={`${f.label}: ${val}`} size="small" variant="outlined"
                sx={{ height: 18, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }} />
            ) : null;
          })}
        </Box>
      )}

      {/* Confirm button */}
      {!isLastColumn && (
        <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            size="small" variant="contained" fullWidth
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            sx={{
              height: 28, fontSize: '0.7rem', fontWeight: 600,
              borderRadius: 2, bgcolor: '#6750A4',
              '&:hover': { bgcolor: '#5A4292' },
            }}
          >
            确认 →
          </Button>
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/todo/kanban/KanbanCard.tsx
git commit -m "refactor: KanbanCard dynamic template rendering, remove back button"
```

---

### Task 12: 前端 — 改造 KanbanTaskDrawer（显示模板字段 + 状态列切换）

**Files:**
- Modify: `frontend/src/components/todo/kanban/KanbanTaskDrawer.tsx`

- [ ] **Step 1: Rewrite KanbanTaskDrawer**

```tsx
'use client';

import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import type { KanbanTaskOut, KanbanColumnData, FieldDef } from '@/lib/types';

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#FFDAD6', P1: '#FFE0B2', P2: '#FFF8E1', P3: '#F3EDF7',
};

interface KanbanTaskDrawerProps {
  open: boolean;
  task: KanbanTaskOut | null;
  columns: KanbanColumnData[];
  fields: FieldDef[];
  onClose: () => void;
  onMove: (taskId: number, toColId: number) => void;
  onDelete: (taskId: number) => void;
}

export default function KanbanTaskDrawer({
  open, task, columns, fields, onClose, onMove, onDelete,
}: KanbanTaskDrawerProps) {
  if (!task) return null;

  const sortedColumns = [...columns].sort((a, b) => a.sort_order - b.sort_order);
  // All fields sorted by order for detail display
  const detailFields = [...fields].sort((a, b) => a.order - b.order);

  const getFieldValue = (field: FieldDef): string | null => {
    if (field.system) {
      return (task as Record<string, unknown>)[field.key] as string ?? null;
    }
    return (task.custom_fields as Record<string, unknown>)?.[field.key] as string ?? null;
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: 480, maxWidth: '90vw' } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task.title}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Basic info - all detail fields */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.06, mb: 1, display: 'block' }}>
            基本信息
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {task.priority && (
              <Chip label={task.priority} size="small" sx={{
                bgcolor: PRIORITY_COLORS[task.priority] || '#F3EDF7',
                fontWeight: 600, fontSize: '0.7rem',
              }} />
            )}
            {task.task_type && <Chip label={task.task_type} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />}
            {task.version && <Chip label={task.version} size="small" sx={{ fontSize: '0.65rem', fontFamily: 'monospace', bgcolor: '#EDE7F0' }} />}
          </Box>
          {detailFields.filter(f => f.show_in_detail && !['title', 'priority', 'task_type', 'version'].includes(f.key)).map(f => {
            const val = getFieldValue(f);
            if (!val) return null;
            return (
              <Box key={f.key} sx={{ mb: 1.5 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">{f.label}</Typography>
                <Typography variant="body2" sx={{
                  whiteSpace: 'pre-wrap', bgcolor: 'action.hover', p: 1, borderRadius: 1,
                  border: '1px solid', borderColor: 'divider', mt: 0.25,
                }}>
                  {val}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Column switching (includes Back functionality) */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.06, mb: 1, display: 'block' }}>
            状态列
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {sortedColumns.map(col => {
              const isCurrent = col.id === task.column_id;
              return (
                <Button
                  key={col.id}
                  size="small"
                  variant={isCurrent ? 'contained' : 'outlined'}
                  onClick={() => !isCurrent && onMove(task.id, col.id)}
                  disabled={isCurrent}
                  sx={{ fontSize: '0.7rem', borderRadius: 2, minWidth: 0 }}
                >
                  {col.name}
                </Button>
              );
            })}
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Delete */}
        <Button color="error" size="small" onClick={() => onDelete(task.id)}
          sx={{ fontSize: '0.75rem' }}>
          删除任务
        </Button>
      </Box>
    </Drawer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/todo/kanban/KanbanTaskDrawer.tsx
git commit -m "refactor: KanbanTaskDrawer show template fields, add column switcher"
```

---

### Task 13: 前端 — page.tsx 集成（KanbanSettingsDialog + KanbanTask API 对接）

**Files:**
- Modify: `frontend/src/app/todo/page.tsx`

This is the largest integration task. Key changes:
1. Import new components and API functions
2. Add state for kanbanTasks, fields, kanban settings dialog
3. Replace SprintTabs props (remove onEditSprint/onDeleteSprint, add onOpenSettings)
4. Add KanbanSettingsDialog to the render tree
5. Wire up kanban task CRUD to backend API
6. Replace old SprintDialog/SprintDeleteDialog with SprintListEditor in settings

- [ ] **Step 1: Update imports**

```typescript
import {
  SprintTabs, KanbanBoard, KanbanTaskDrawer,
  KanbanSettingsDialog,
} from '@/components/todo/kanban';
import type { TodoOut, FolderOut, APITag, Sprint, KanbanColumnData, KanbanTaskOut, FieldDef, KanbanConfig } from '@/lib/types';
import {
  listSprints, createSprint, updateSprint, deleteSprint as apiDeleteSprint,
  listKanbanColumns, moveTodoToColumn,
} from '@/lib/api';
import {
  listKanbanTasks, createKanbanTask, updateKanbanTask, deleteKanbanTask, moveKanbanTask,
} from '@/lib/api/kanbanTask';
```

- [ ] **Step 2: Add state**

```typescript
const [kanbanTasks, setKanbanTasks] = useState<KanbanTaskOut[]>([]);
const [kanbanFields, setKanbanFields] = useState<FieldDef[]>([]);
const [settingsOpen, setSettingsOpen] = useState(false);
```

- [ ] **Step 3: Replace SprintTabs usage**

```tsx
<SprintTabs
  sprints={kanbanSprints}
  activeSprintId={activeSprintId}
  onSprintChange={(id) => setActiveSprintId(id)}
  onNewSprint={() => handleNewSprint()}
  onOpenSettings={() => setSettingsOpen(true)}
/>
```

- [ ] **Step 4: Add KanbanSettingsDialog**

```tsx
{currentFolder?.mode === 'kanban' && (
  <KanbanSettingsDialog
    open={settingsOpen}
    onClose={() => setSettingsOpen(false)}
    columns={kanbanColumns}
    sprints={kanbanSprints}
    fields={kanbanFields}
    kanbanConfig={currentFolder?.kanban_config ?? null}
    onSaveColumns={handleSaveColumns}
    onSaveFields={handleSaveFields}
    onSaveSprints={handleSaveSprints}
    onSavePreferences={handleSavePreferences}
  />
)}
```

- [ ] **Step 5: Add handler functions**

```typescript
const handleSaveColumns = async (columns: KanbanColumnData[]) => {
  // API calls for reordering/updating columns
  setKanbanColumns(columns);
};

const handleSaveFields = async (fields: FieldDef[]) => {
  setKanbanFields(fields);
  // Persist to folder.kanban_config via updateFolder API
  if (activeFolder) {
    const config: KanbanConfig = { kanban_template: { fields } };
    await updateFolder(activeFolder, { kanban_config: config });
  }
};

const handleSaveSprints = async (sprints: Sprint[]) => {
  // Persist sprint changes via API
  setKanbanSprints(sprints);
};
```

- [ ] **Step 6: Update fetchKanbanData to load kanban tasks instead of todos**

```typescript
const fetchKanbanData = useCallback(async (folderId: number) => {
  const [sprints, columns, tasks] = await Promise.all([
    listSprints(folderId),
    listKanbanColumns(sprintId),
    listKanbanTasks(folderId, activeSprintId),
  ]);
  setKanbanSprints(sprints);
  setKanbanColumns(columns);
  setKanbanTasks(tasks);
  // Load fields from folder config
  const folder = findFolderById(foldersRef.current, folderId);
  if (folder?.kanban_config?.kanban_template?.fields) {
    setKanbanFields(folder.kanban_config.kanban_template.fields);
  }
}, [activeSprintId]);
```

- [ ] **Step 7: Remove old SprintDialog/SprintDeleteDialog from render tree**

Replace them with the new KanbanSettingsDialog approach.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/todo/page.tsx frontend/src/components/todo/kanban/index.ts
git commit -m "feat: integrate KanbanSettingsDialog and KanbanTask API into todo page"
```

---

### Task 14: 前端 — 改造 FolderDialog（mode=kanban 保持简洁）

**Files:**
- Modify: `frontend/src/components/todo/FolderDialog.tsx`

- [ ] **Step 1: Remove kanban init settings section**

The current FolderDialog shows `#kanban-init-settings` div with default column preview when mode=kanban. Remove this section entirely.

In `FolderDialog.tsx`, find:
```tsx
{mode === 'kanban' && (
  <Box sx={{ ... }}>
    <!-- default column preview and options -->
  </Box>
)}
```

Replace with nothing — or just keep it empty. The dialog should show: name, color, mode toggle. No extra kanban options.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/todo/FolderDialog.tsx
git commit -m "refactor: FolderDialog remove kanban init options, keep clean"
```

---

### Task 15: 验证

- [ ] **Step 1: Run backend tests**

```bash
cd backend && pytest tests/ -v
```

Expected: All existing tests pass + new kanban task tests pass

- [ ] **Step 2: Build frontend**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No TypeScript errors

- [ ] **Step 3: Run frontend dev server and manual test**

```bash
cd frontend && npm run dev
```

Manual checks:
1. Create kanban folder → auto enters kanban view → verify SprintTabs shows ⚙️ button
2. Click ⚙️ → KanbanSettingsDialog opens with 4 tabs → verify each tab renders
3. Create a kanban task → verify card shows priority/type/version chips + title + confirm button
4. Click card → drawer opens → verify all fields shown + column switcher works
5. Click confirm button → task moves to next column
6. Add custom field in settings → verify it appears on new task form

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix: post-integration fixes"
```
