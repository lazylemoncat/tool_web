from datetime import datetime

import src.routers.todo as todo_router


def _freeze_today(monkeypatch, frozen: datetime) -> None:
    """冻结 toggle 逻辑中的 utcnow, 其余 datetime 类方法沿用父类."""

    class _FrozenDatetime(datetime):
        @classmethod
        def utcnow(cls):  # noqa: N805
            return frozen

    monkeypatch.setattr(todo_router, "datetime", _FrozenDatetime)


def test_create_todo(client, auth_headers):
    resp = client.post(
        "/api/v1/todos",
        json={
            "title": "My Task",
            "priority": 1,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "My Task"
    assert body["priority"] == 1
    assert body["children"] == []


def test_create_and_update_todo_with_optional_due_time(client, auth_headers):
    resp = client.post(
        "/api/v1/todos",
        json={
            "title": "Timed Task",
            "due_date": "2026-06-18",
            "due_time": "14:30",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["due_date"] == "2026-06-18"
    assert body["due_time"] == "14:30:00"

    updated = client.put(
        f"/api/v1/todos/{body['id']}",
        json={"due_time": "16:45"},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["due_time"] == "16:45:00"


def test_create_kanban_todo_returns_column_fields(client, auth_headers):
    folder_resp = client.post(
        "/api/v1/folders",
        json={"name": "Board", "mode": "kanban"},
        headers=auth_headers,
    )
    assert folder_resp.status_code == 201
    folder_id = folder_resp.json()["id"]

    sprint_resp = client.get(
        f"/api/v1/sprints?folder_id={folder_id}",
        headers=auth_headers,
    )
    assert sprint_resp.status_code == 200
    sprint_id = sprint_resp.json()[0]["id"]

    columns_resp = client.get(
        f"/api/v1/kanban-columns?sprint_id={sprint_id}",
        headers=auth_headers,
    )
    assert columns_resp.status_code == 200
    column_id = columns_resp.json()[0]["id"]

    create_resp = client.post(
        "/api/v1/todos",
        json={
            "folder_id": folder_id,
            "column_id": column_id,
            "title": "Kanban Task",
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["sprint_id"] == sprint_id
    assert created["column_id"] == column_id

    list_resp = client.get(
        f"/api/v1/todos?folder_id={folder_id}&sprint_id={sprint_id}",
        headers=auth_headers,
    )
    assert list_resp.status_code == 200
    listed = list_resp.json()["items"][0]
    assert listed["sprint_id"] == sprint_id
    assert listed["column_id"] == column_id


def test_list_todos(client, auth_headers):
    client.post(
        "/api/v1/todos", json={"title": "Task 1"}, headers=auth_headers
    )
    client.post(
        "/api/v1/todos", json={"title": "Task 2"}, headers=auth_headers
    )
    resp = client.get("/api/v1/todos", headers=auth_headers)
    assert resp.status_code == 200
    todos = resp.json()["items"]
    assert len(todos) == 2


def test_list_todos_filter_by_status(client, auth_headers):
    resp = client.post(
        "/api/v1/todos", json={"title": "Active Task"}, headers=auth_headers
    )
    todo_id = resp.json()["id"]
    client.patch(f"/api/v1/todos/{todo_id}/toggle", headers=auth_headers)

    resp = client.get("/api/v1/todos?status=completed", headers=auth_headers)
    assert len(resp.json()["items"]) == 1
    resp = client.get("/api/v1/todos?status=active", headers=auth_headers)
    assert len(resp.json()["items"]) == 0


def test_list_todos_filter_by_priority(client, auth_headers):
    client.post(
        "/api/v1/todos",
        json={"title": "High", "priority": 1},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/todos",
        json={"title": "Low", "priority": 3},
        headers=auth_headers,
    )
    resp = client.get("/api/v1/todos?priority=1", headers=auth_headers)
    assert len(resp.json()["items"]) == 1


def test_list_todos_pagination(client, auth_headers):
    for i in range(5):
        client.post(
            "/api/v1/todos", json={"title": f"Task {i}"}, headers=auth_headers
        )
    resp = client.get("/api/v1/todos?skip=0&limit=2", headers=auth_headers)
    assert len(resp.json()["items"]) == 2


def test_update_todo(client, auth_headers):
    resp = client.post(
        "/api/v1/todos", json={"title": "Old Title"}, headers=auth_headers
    )
    todo_id = resp.json()["id"]
    resp = client.put(
        f"/api/v1/todos/{todo_id}",
        json={"title": "New Title"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "New Title"


def test_delete_todo(client, auth_headers):
    resp = client.post(
        "/api/v1/todos", json={"title": "Delete Me"}, headers=auth_headers
    )
    todo_id = resp.json()["id"]
    resp = client.delete(f"/api/v1/todos/{todo_id}", headers=auth_headers)
    assert resp.status_code == 204


def test_toggle_todo(client, auth_headers):
    resp = client.post(
        "/api/v1/todos", json={"title": "Toggle Me"}, headers=auth_headers
    )
    todo_id = resp.json()["id"]
    resp = client.patch(
        f"/api/v1/todos/{todo_id}/toggle", headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["is_completed"] is True


def test_todo_not_found(client, auth_headers):
    resp = client.put(
        "/api/v1/todos/9999", json={"title": "Nope"}, headers=auth_headers
    )
    assert resp.status_code == 404


def test_create_subtask(client, auth_headers):
    resp = client.post(
        "/api/v1/todos", json={"title": "Parent"}, headers=auth_headers
    )
    parent_id = resp.json()["id"]
    resp = client.post(
        "/api/v1/todos",
        json={
            "title": "Child",
            "parent_id": parent_id,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    resp = client.get("/api/v1/todos", headers=auth_headers)
    parent = resp.json()["items"][0]
    assert len(parent["children"]) == 1
    assert parent["children"][0]["title"] == "Child"


# ===== 重复任务边界场景 =====


def _create_recurring(client, auth_headers, **overrides):
    payload = {
        "title": "Recurring",
        "recurrence_rules": ["FREQ=WEEKLY"],
        **overrides,
    }
    resp = client.post("/api/v1/todos", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    return resp.json()


def _list_items(client, auth_headers, **params):
    resp = client.get(
        "/api/v1/todos", params=params, headers=auth_headers
    )
    assert resp.status_code == 200
    return resp.json()["items"]


def test_recurring_weekly_keeps_weekday_anchor(
    client, auth_headers, monkeypatch
):
    # 2026-07-15 是周三; 任务锚定在周一 (2026-06-22), 过期多周后完成
    _freeze_today(monkeypatch, datetime(2026, 7, 15, 10, 0, 0))
    todo = _create_recurring(
        client, auth_headers, due_date="2026-06-22"
    )
    client.patch(f"/api/v1/todos/{todo['id']}/toggle", headers=auth_headers)

    active = _list_items(client, auth_headers, status="active")
    assert len(active) == 1
    # 下一次仍是周一 (7/20), 而非完成日所在的周三 (7/22)
    assert active[0]["due_date"] == "2026-07-20"


def test_recurring_monthly_clamps_short_month(
    client, auth_headers, monkeypatch
):
    # 1 月 31 日按月重复, 2 月没有 31 日应裁剪到 2 月末而非跳过 2 月
    _freeze_today(monkeypatch, datetime(2026, 2, 10, 10, 0, 0))
    todo = _create_recurring(
        client,
        auth_headers,
        due_date="2026-01-31",
        recurrence_rules=["FREQ=MONTHLY"],
    )
    client.patch(f"/api/v1/todos/{todo['id']}/toggle", headers=auth_headers)

    active = _list_items(client, auth_headers, status="active")
    assert len(active) == 1
    assert active[0]["due_date"] == "2026-02-28"


def test_recurring_early_completion_skips_same_day(
    client, auth_headers, monkeypatch
):
    # 提前完成未来到期的任务, 下一次应从原到期日再往后推, 不生成同日实例
    _freeze_today(monkeypatch, datetime(2026, 7, 15, 10, 0, 0))
    todo = _create_recurring(
        client, auth_headers, due_date="2026-07-20"
    )
    client.patch(f"/api/v1/todos/{todo['id']}/toggle", headers=auth_headers)

    active = _list_items(client, auth_headers, status="active")
    assert len(active) == 1
    assert active[0]["due_date"] == "2026-07-27"


def test_recurring_retoggle_does_not_duplicate(client, auth_headers):
    todo = _create_recurring(
        client, auth_headers, recurrence_rules=["FREQ=DAILY"]
    )
    toggled = client.patch(
        f"/api/v1/todos/{todo['id']}/toggle", headers=auth_headers
    )
    # 重复链交由新实例延续, 已完成实例的规则被清空
    assert toggled.json()["recurrence_rules"] == []

    # 完成→取消→再完成, 不应再生成第二个未来实例
    client.patch(f"/api/v1/todos/{todo['id']}/toggle", headers=auth_headers)
    client.patch(f"/api/v1/todos/{todo['id']}/toggle", headers=auth_headers)

    items = _list_items(client, auth_headers)
    generated = [
        item for item in items
        if item["id"] != todo["id"] and item["title"] == "Recurring"
    ]
    assert len(generated) == 1
    assert generated[0]["recurrence_rules"] != []


def test_recurring_copies_children_uncompleted(client, auth_headers):
    todo = _create_recurring(
        client, auth_headers, recurrence_rules=["FREQ=DAILY"]
    )
    child_resp = client.post(
        "/api/v1/todos",
        json={
            "title": "Checklist Item",
            "parent_id": todo["id"],
            "due_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    assert child_resp.status_code == 201

    client.patch(
        f"/api/v1/todos/{todo['id']}/toggle",
        json={"complete_children": True},
        headers=auth_headers,
    )

    active = _list_items(client, auth_headers, status="active")
    new_parent = next(
        item for item in active if item["title"] == "Recurring"
    )
    assert len(new_parent["children"]) == 1
    child = new_parent["children"][0]
    assert child["title"] == "Checklist Item"
    assert child["is_completed"] is False
    assert child["due_date"] is None
