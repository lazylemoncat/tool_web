"""Sprint and Kanban column API contract tests."""

DEFAULT_COLUMN_NAMES = [
    "Backlog",
    "Ready",
    "Doing",
    "Testing",
    "Ready to Release",
    "Released",
    "Archived",
]


def _create_folder(client, headers, name="Board", mode="kanban"):
    resp = client.post(
        "/api/v1/folders",
        json={"name": name, "mode": mode},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


def _list_sprints(client, headers, folder_id):
    resp = client.get(
        f"/api/v1/sprints?folder_id={folder_id}",
        headers=headers,
    )
    assert resp.status_code == 200
    return resp.json()


def _list_columns(client, headers, sprint_id):
    resp = client.get(
        f"/api/v1/kanban-columns?sprint_id={sprint_id}",
        headers=headers,
    )
    assert resp.status_code == 200
    return resp.json()


def test_kanban_folder_bootstraps_default_sprint_and_columns(
    client, auth_headers
):
    folder = _create_folder(client, auth_headers)

    sprints = _list_sprints(client, auth_headers, folder["id"])
    assert len(sprints) == 1
    assert sprints[0]["name"] == "Sprint 1"
    assert sprints[0]["status"] == "active"

    columns = _list_columns(client, auth_headers, sprints[0]["id"])
    assert [column["name"] for column in columns] == DEFAULT_COLUMN_NAMES
    assert [column["sort_order"] for column in columns] == list(range(7))
    assert all(column["task_count"] == 0 for column in columns)


def test_sprint_crud_and_response_contract(client, auth_headers):
    folder = _create_folder(client, auth_headers, name="Sprint Folder")

    create_resp = client.post(
        "/api/v1/sprints",
        json={
            "folder_id": folder["id"],
            "name": "Sprint 2",
            "goal": "Regression safety",
            "start_date": "2026-06-01",
            "end_date": "2026-06-14",
            "status": "planned",
            "sort_order": 5,
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["name"] == "Sprint 2"
    assert created["start_date"] == "2026-06-01"
    assert created["end_date"] == "2026-06-14"

    update_resp = client.put(
        f"/api/v1/sprints/{created['id']}",
        json={"name": "Sprint 2.1", "status": "completed"},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["name"] == "Sprint 2.1"
    assert updated["status"] == "completed"

    columns = _list_columns(client, auth_headers, created["id"])
    assert [column["name"] for column in columns] == DEFAULT_COLUMN_NAMES


def test_sprint_rejects_missing_folder_and_invalid_date(
    client, auth_headers
):
    missing_folder = client.post(
        "/api/v1/sprints",
        json={"folder_id": 9999, "name": "No folder"},
        headers=auth_headers,
    )
    assert missing_folder.status_code == 400
    assert missing_folder.json()["message"] == "Folder not found"

    invalid_date = client.post(
        "/api/v1/sprints",
        json={
            "folder_id": 9999,
            "name": "Bad date",
            "start_date": "not-a-date",
        },
        headers=auth_headers,
    )
    assert invalid_date.status_code == 422
    assert invalid_date.json()["code"] == 422


def test_sprint_isolation_and_delete_cascades_columns(
    client, auth_headers_for
):
    owner_headers = auth_headers_for("sprint_owner")
    other_headers = auth_headers_for("sprint_other")
    folder = _create_folder(client, owner_headers, name="Private Board")
    sprint = _list_sprints(client, owner_headers, folder["id"])[0]

    hidden = client.get(
        f"/api/v1/sprints?folder_id={folder['id']}",
        headers=other_headers,
    )
    assert hidden.status_code == 200
    assert hidden.json() == []

    forbidden_update = client.put(
        f"/api/v1/sprints/{sprint['id']}",
        json={"name": "Stolen"},
        headers=other_headers,
    )
    assert forbidden_update.status_code == 404

    delete_resp = client.delete(
        f"/api/v1/sprints/{sprint['id']}",
        headers=owner_headers,
    )
    assert delete_resp.status_code == 204
    assert _list_columns(client, owner_headers, sprint["id"]) == []


def test_kanban_column_update_reorder_and_delete_migrates_tasks(
    client, auth_headers
):
    folder = _create_folder(client, auth_headers, name="Column Board")
    sprint = _list_sprints(client, auth_headers, folder["id"])[0]
    fallback_column = _list_columns(client, auth_headers, sprint["id"])[0]

    create_column = client.post(
        "/api/v1/kanban-columns",
        json={
            "sprint_id": sprint["id"],
            "name": "Review",
            "color": "#123456",
            "capacity": 3,
            "sort_order": 9,
        },
        headers=auth_headers,
    )
    assert create_column.status_code == 201
    column = create_column.json()
    assert column["task_count"] == 0

    update_column = client.put(
        f"/api/v1/kanban-columns/{column['id']}",
        json={"name": "Code Review", "capacity": 2},
        headers=auth_headers,
    )
    assert update_column.status_code == 200
    assert update_column.json()["capacity"] == 2

    create_task = client.post(
        "/api/v1/kanban/tasks",
        json={
            "folder_id": folder["id"],
            "sprint_id": sprint["id"],
            "column_id": column["id"],
            "title": "Move on delete",
            "priority": "P2",
            "task_type": "feature",
        },
        headers=auth_headers,
    )
    assert create_task.status_code == 201
    task_id = create_task.json()["id"]

    reorder = client.post(
        "/api/v1/kanban-columns/reorder",
        json={
            "items": [
                {"id": fallback_column["id"], "sort_order": 5},
                {"id": column["id"], "sort_order": 0},
            ]
        },
        headers=auth_headers,
    )
    assert reorder.status_code == 204
    reordered = _list_columns(client, auth_headers, sprint["id"])
    assert reordered[0]["id"] == column["id"]
    expected_fallback_id = reordered[1]["id"]

    delete_column = client.delete(
        f"/api/v1/kanban-columns/{column['id']}",
        headers=auth_headers,
    )
    assert delete_column.status_code == 204

    moved_task = client.get(
        f"/api/v1/kanban/tasks/{task_id}",
        headers=auth_headers,
    )
    assert moved_task.status_code == 200
    assert moved_task.json()["column_id"] == expected_fallback_id


def test_kanban_column_rejects_missing_or_foreign_sprint(
    client, auth_headers_for
):
    owner_headers = auth_headers_for("column_owner")
    other_headers = auth_headers_for("column_other")
    folder = _create_folder(client, owner_headers, name="Owner Board")
    sprint = _list_sprints(client, owner_headers, folder["id"])[0]

    missing = client.post(
        "/api/v1/kanban-columns",
        json={"sprint_id": 9999, "name": "No sprint"},
        headers=owner_headers,
    )
    assert missing.status_code == 400
    assert missing.json()["message"] == "Sprint not found"

    foreign = client.post(
        "/api/v1/kanban-columns",
        json={"sprint_id": sprint["id"], "name": "Foreign"},
        headers=other_headers,
    )
    assert foreign.status_code == 400

    hidden = client.get(
        f"/api/v1/kanban-columns?sprint_id={sprint['id']}",
        headers=other_headers,
    )
    assert hidden.status_code == 200
    assert hidden.json() == []
