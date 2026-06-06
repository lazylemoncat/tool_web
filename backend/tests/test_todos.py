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
