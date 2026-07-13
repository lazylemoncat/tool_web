"""Tests for KanbanTask API CRUD and template validation."""

import pytest

from src.models.kanban import KanbanColumn
from src.models.kanban_task import KanbanTask
from src.models.todo import Folder
from src.models.user import User


# ── Auth override ──────────────────────────────────────────────
@pytest.fixture
def override_auth(client):
    """Override get_current_user so tests don't need real JWT tokens."""
    from src.auth.core.models import CurrentUser
    from src.main import app
    from src.middleware.auth import get_current_user

    current_user = CurrentUser(id=1, username="testuser")

    def _override():
        return current_user

    app.dependency_overrides[get_current_user] = _override
    yield
    app.dependency_overrides.pop(get_current_user, None)


# ── Test data fixtures ─────────────────────────────────────────
@pytest.fixture
def test_user(db_session):
    user = User(id=1, username="testuser", password_hash="x")
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def test_folder(db_session, test_user):
    def _create(mode="kanban"):
        folder = Folder(
            user_id=test_user.id,
            name="Kanban Board",
            mode=mode,
            kanban_config={
                "columns": ["Backlog", "Ready", "Doing", "Done"],
                "kanban_template": {
                    "fields": [
                        {
                            "key": "title",
                            "label": "Title",
                            "type": "text",
                            "system": True,
                            "required": True,
                        },
                        {
                            "key": "priority",
                            "label": "Priority",
                            "type": "select",
                            "options": ["P1", "P2", "P3"],
                            "system": True,
                        },
                        {
                            "key": "task_type",
                            "label": "Type",
                            "type": "select",
                            "options": ["feature", "bug", "chore"],
                            "system": True,
                        },
                    ]
                },
            },
        )
        db_session.add(folder)
        db_session.commit()
        return folder

    return _create


@pytest.fixture
def test_sprint(db_session, test_user):
    def _create(folder_id):
        from src.models.kanban import Sprint

        sprint = Sprint(
            folder_id=folder_id,
            user_id=test_user.id,
            name="Sprint 1",
            status="active",
        )
        db_session.add(sprint)
        db_session.commit()
        return sprint

    return _create


# ── Tests ──────────────────────────────────────────────────────


def test_create_kanban_task(
    client, override_auth, db_session, test_user, test_folder, test_sprint
):
    """Test creating a kanban task with valid fields."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)

    col = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    db_session.add(col)
    db_session.commit()

    resp = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col.id,
            "title": "Test task",
            "priority": "P1",
            "task_type": "feature",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test task"
    assert data["priority"] == "P1"
    assert data["task_type"] == "feature"


def test_create_kanban_task_required_field(
    client, override_auth, db_session, test_user, test_folder, test_sprint
):
    """Test that empty required 'title' is rejected."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    db_session.add(col)
    db_session.commit()

    resp = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col.id,
            "title": "",
            "priority": "P2",
        },
    )
    # Pydantic Field(min_length=1) raises RequestValidationError -> 422
    assert resp.status_code == 422


def test_create_kanban_task_invalid_select(
    client, override_auth, db_session, test_user, test_folder, test_sprint
):
    """Test that invalid select option is rejected by template validation."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    db_session.add(col)
    db_session.commit()

    resp = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col.id,
            "title": "Test",
            "priority": "P99",  # not in template options
        },
    )
    assert resp.status_code == 400


def test_create_kanban_task_capacity_full(
    client, override_auth, db_session, test_user, test_folder, test_sprint
):
    """Test that task creation is rejected when column is at capacity."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Doing",
        capacity=1,
        sort_order=0,
        is_archived=False,
    )
    db_session.add(col)
    db_session.commit()

    # First task -- should succeed
    resp = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col.id,
            "title": "Task 1",
            "priority": "P2",
        },
    )
    assert resp.status_code == 201

    # Second task -- should be rejected
    resp = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col.id,
            "title": "Task 2",
            "priority": "P2",
        },
    )
    assert resp.status_code == 400
    assert "capacity" in resp.text.lower()


def test_move_kanban_task(
    client, override_auth, db_session, test_user, test_folder, test_sprint
):
    """Test moving a task between columns."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col1 = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    col2 = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Ready",
        capacity=None,
        sort_order=1,
        is_archived=False,
    )
    db_session.add(col1)
    db_session.add(col2)
    db_session.commit()

    resp = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col1.id,
            "title": "Movable task",
            "priority": "P2",
        },
    )
    assert resp.status_code == 201
    task_id = resp.json()["id"]

    resp = client.put(
        f"/api/v1/kanban/tasks/{task_id}/move",
        json={
            "target_column_id": col2.id,
        },
    )
    assert resp.status_code == 200
    assert resp.json()["column_id"] == col2.id


def test_list_kanban_tasks(
    client, override_auth, db_session, test_user, test_folder, test_sprint
):
    """Test listing tasks by folder and sprint."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    db_session.add(col)
    db_session.commit()

    for i in range(3):
        client.post(
            "/api/v1/kanban/tasks",
            json={
                "folder_id": folder.id,
                "sprint_id": sprint.id,
                "column_id": col.id,
                "title": f"Task {i}",
                "priority": "P2",
            },
        )

    resp = client.get(
        f"/api/v1/kanban/tasks?folder_id={folder.id}&sprint_id={sprint.id}"
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 3


def test_create_kanban_task_validates_custom_fields(
    client,
    override_auth,
    db_session,
    test_user,
    test_folder,
    test_sprint,
):
    """Test template validation reads custom fields from custom_fields."""
    folder = test_folder(mode="kanban")
    folder.kanban_config = {
        "kanban_template": {
            "fields": [
                {
                    "key": "title",
                    "label": "Title",
                    "type": "text",
                    "system": True,
                    "required": True,
                },
                {
                    "key": "effort",
                    "label": "Effort",
                    "type": "number",
                    "system": False,
                    "required": True,
                },
                {
                    "key": "module",
                    "label": "Module",
                    "type": "select",
                    "options": ["api", "web"],
                    "system": False,
                    "required": True,
                },
            ]
        }
    }
    db_session.commit()
    sprint = test_sprint(folder_id=folder.id)
    col = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    db_session.add(col)
    db_session.commit()

    resp = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col.id,
            "title": "Custom field task",
            "custom_fields": {"effort": "3", "module": "api"},
        },
    )
    assert resp.status_code == 201
    assert resp.json()["custom_fields"] == {"effort": "3", "module": "api"}

    resp = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col.id,
            "title": "Invalid custom field task",
            "custom_fields": {"effort": "3", "module": "mobile"},
        },
    )
    assert resp.status_code == 400


def test_kanban_column_task_count_uses_kanban_tasks(
    client,
    override_auth,
    db_session,
    test_user,
    test_folder,
    test_sprint,
):
    """Test column task_count is based on KanbanTask rows."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    db_session.add(col)
    db_session.commit()
    db_session.add(
        KanbanTask(
            user_id=test_user.id,
            folder_id=folder.id,
            sprint_id=sprint.id,
            column_id=col.id,
            title="Counted task",
        )
    )
    db_session.commit()

    resp = client.get(f"/api/v1/kanban-columns?sprint_id={sprint.id}")
    assert resp.status_code == 200
    assert resp.json()[0]["task_count"] == 1


def test_create_kanban_task_rejects_column_from_other_sprint(
    client,
    override_auth,
    db_session,
    test_user,
    test_folder,
    test_sprint,
):
    """Test a task cannot be created with mismatched sprint and column ids."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    other_sprint = test_sprint(folder_id=folder.id)
    col = KanbanColumn(
        sprint_id=other_sprint.id,
        user_id=test_user.id,
        name="Other sprint column",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    db_session.add(col)
    db_session.commit()

    resp = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col.id,
            "title": "Mismatched task",
            "priority": "P2",
        },
    )
    assert resp.status_code == 400


def test_move_kanban_task_rejects_column_from_other_folder(
    client,
    override_auth,
    db_session,
    test_user,
    test_folder,
    test_sprint,
):
    """Test moving a task cannot cross Kanban folders through a column id."""
    folder = test_folder(mode="kanban")
    other_folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    other_sprint = test_sprint(folder_id=other_folder.id)
    col = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    other_col = KanbanColumn(
        sprint_id=other_sprint.id,
        user_id=test_user.id,
        name="Other backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    db_session.add(col)
    db_session.add(other_col)
    db_session.commit()

    resp = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col.id,
            "title": "Movable task",
            "priority": "P2",
        },
    )
    assert resp.status_code == 201
    task_id = resp.json()["id"]

    resp = client.put(
        f"/api/v1/kanban/tasks/{task_id}/move",
        json={
            "target_column_id": other_col.id,
        },
    )
    assert resp.status_code == 400


def test_delete_kanban_task(
    client, override_auth, db_session, test_user, test_folder, test_sprint
):
    """Test deleting a kanban task."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    db_session.add(col)
    db_session.commit()

    resp = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col.id,
            "title": "To delete",
            "priority": "P2",
        },
    )
    assert resp.status_code == 201
    task_id = resp.json()["id"]

    resp = client.delete(f"/api/v1/kanban/tasks/{task_id}")
    assert resp.status_code == 204

    resp = client.get(f"/api/v1/kanban/tasks/{task_id}")
    assert resp.status_code == 404


def test_partial_update_keeps_internal_custom_fields_with_template(
    client, override_auth, db_session, test_user, test_folder, test_sprint
):
    """保存过模板后, 仅更新 custom_fields 不应触发必填校验或丢失内部字段."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    db_session.add(col)
    db_session.commit()

    created = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col.id,
            "title": "Task with subtasks",
            "priority": "P1",
        },
    )
    assert created.status_code == 201
    task_id = created.json()["id"]

    subtasks = [{"id": "s1", "title": "step 1", "completed": False}]
    resp = client.put(
        f"/api/v1/kanban/tasks/{task_id}",
        json={"custom_fields": {"__subtasks": subtasks}},
    )
    assert resp.status_code == 200
    assert resp.json()["custom_fields"]["__subtasks"] == subtasks
    # 原有系统字段不受影响
    assert resp.json()["title"] == "Task with subtasks"
    assert resp.json()["priority"] == "P1"


def test_delete_sprint_removes_kanban_tasks(
    client, override_auth, db_session, test_user, test_folder, test_sprint
):
    """删除 Sprint 应连同其看板任务一起删除, 不留孤儿行."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    db_session.add(col)
    db_session.commit()

    created = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col.id,
            "title": "Doomed task",
            "priority": "P1",
        },
    )
    assert created.status_code == 201

    resp = client.delete(f"/api/v1/sprints/{sprint.id}")
    assert resp.status_code == 204

    db_session.expire_all()
    assert db_session.query(KanbanTask).count() == 0


def test_move_kanban_task_appends_to_target_column(
    client, override_auth, db_session, test_user, test_folder, test_sprint
):
    """未指定 sort_order 的跨列移动应排到目标列末尾."""
    folder = test_folder(mode="kanban")
    sprint = test_sprint(folder_id=folder.id)
    col1 = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Backlog",
        capacity=None,
        sort_order=0,
        is_archived=False,
    )
    col2 = KanbanColumn(
        sprint_id=sprint.id,
        user_id=test_user.id,
        name="Ready",
        capacity=None,
        sort_order=1,
        is_archived=False,
    )
    db_session.add_all([col1, col2])
    db_session.commit()

    moving = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col1.id,
            "title": "Mover",
            "priority": "P1",
            "sort_order": 1,
        },
    )
    existing = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder.id,
            "sprint_id": sprint.id,
            "column_id": col2.id,
            "title": "Resident",
            "priority": "P2",
            "sort_order": 5,
        },
    )
    assert moving.status_code == 201
    assert existing.status_code == 201

    resp = client.put(
        f"/api/v1/kanban/tasks/{moving.json()['id']}/move",
        json={"target_column_id": col2.id},
    )
    assert resp.status_code == 200
    assert resp.json()["sort_order"] == 6
