"""Focus timer API contract tests."""

from datetime import datetime, timedelta


def _create_tag(client, headers, name="学习"):
    resp = client.post("/api/v1/tags", json={"name": name}, headers=headers)
    assert resp.status_code == 201
    return resp.json()


def _create_folder(client, headers, name="学习"):
    resp = client.post("/api/v1/folders", json={"name": name}, headers=headers)
    assert resp.status_code == 201
    return resp.json()


def _create_session(client, headers, **overrides):
    now = datetime.utcnow()
    payload = {
        "name": "高数复习",
        "mode": "pomodoro",
        "planned_seconds": 1500,
        "focus_seconds": 1500,
        "pause_count": 1,
        "pause_seconds": 30,
        "rest_seconds": 300,
        "started_at": (now - timedelta(minutes=30)).isoformat(),
        "ended_at": now.isoformat(),
    }
    payload.update(overrides)
    resp = client.post(
        "/api/v1/focus/sessions", json=payload, headers=headers
    )
    assert resp.status_code == 201
    return resp.json()


def test_focus_session_create_list_and_summary(client, auth_headers):
    tag = _create_tag(client, auth_headers, "数学")
    folder = _create_folder(client, auth_headers, "学习")

    session = _create_session(
        client,
        auth_headers,
        folder_id=folder["id"],
        tag_ids=[tag["id"]],
        summary="完成积分练习",
    )

    assert session["folder_id"] == folder["id"]
    assert session["folder_name"] == "学习"
    assert session["tags"] == [{"id": tag["id"], "name": "数学"}]

    listed = client.get(
        f"/api/v1/focus/sessions?tag_id={tag['id']}",
        headers=auth_headers,
    )
    assert listed.status_code == 200
    body = listed.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == session["id"]

    summary = client.get(
        "/api/v1/focus/summary?range=7d", headers=auth_headers
    )
    assert summary.status_code == 200
    summary_body = summary.json()
    assert summary_body["total_focus_seconds"] == 1500
    assert summary_body["completed_count"] == 1
    assert summary_body["abandoned_count"] == 0
    assert summary_body["tag_distribution"][0]["name"] == "数学"
    assert summary_body["folder_distribution"][0]["name"] == "学习"


def test_focus_session_update_and_delete(client, auth_headers):
    session = _create_session(client, auth_headers)

    updated = client.put(
        f"/api/v1/focus/sessions/{session['id']}",
        json={"name": "英语听力", "mode": "free", "planned_seconds": None},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "英语听力"
    assert updated.json()["mode"] == "free"

    deleted = client.delete(
        f"/api/v1/focus/sessions/{session['id']}", headers=auth_headers
    )
    assert deleted.status_code == 204

    listed = client.get("/api/v1/focus/sessions", headers=auth_headers)
    assert listed.status_code == 200
    assert listed.json()["items"] == []


def test_focus_session_rejects_foreign_tag(client, auth_headers_for):
    owner_headers = auth_headers_for("focus_owner")
    other_headers = auth_headers_for("focus_other")
    foreign_tag = _create_tag(client, other_headers, "其他用户标签")

    resp = client.post(
        "/api/v1/focus/sessions",
        json={
            "name": "非法标签",
            "mode": "pomodoro",
            "focus_seconds": 1200,
            "tag_ids": [foreign_tag["id"]],
        },
        headers=owner_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["message"] == "tag not found"


def test_focus_sessions_are_user_isolated(client, auth_headers_for):
    owner_headers = auth_headers_for("focus_owner")
    other_headers = auth_headers_for("focus_other")
    session = _create_session(client, owner_headers, name="Owner Session")

    other_list = client.get("/api/v1/focus/sessions", headers=other_headers)
    assert other_list.status_code == 200
    assert other_list.json()["items"] == []

    other_update = client.put(
        f"/api/v1/focus/sessions/{session['id']}",
        json={"name": "Hacked"},
        headers=other_headers,
    )
    assert other_update.status_code == 404
