"""Tag and theme API contract tests."""


def _create_folder(client, headers, name):
    resp = client.post(
        "/api/v1/folders",
        json={"name": name},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


def _create_tag(client, headers, name):
    resp = client.post(
        "/api/v1/tags",
        json={"name": name},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


def test_tags_are_idempotent_searchable_and_folder_scoped(
    client, auth_headers
):
    folder_a = _create_folder(client, auth_headers, "Folder A")
    folder_b = _create_folder(client, auth_headers, "Folder B")

    urgent = _create_tag(client, auth_headers, "urgent")
    duplicate = _create_tag(client, auth_headers, "urgent")
    later = _create_tag(client, auth_headers, "later")
    assert duplicate["id"] == urgent["id"]

    task_a = client.post(
        "/api/v1/todos",
        json={
            "folder_id": folder_a["id"],
            "title": "Tagged A",
            "tag_ids": [urgent["id"]],
        },
        headers=auth_headers,
    )
    assert task_a.status_code == 201
    task_b = client.post(
        "/api/v1/todos",
        json={
            "folder_id": folder_b["id"],
            "title": "Tagged B",
            "tag_ids": [later["id"]],
        },
        headers=auth_headers,
    )
    assert task_b.status_code == 201

    search = client.get("/api/v1/tags?search=urg", headers=auth_headers)
    assert search.status_code == 200
    assert [tag["name"] for tag in search.json()] == ["urgent"]

    scoped = client.get(
        f"/api/v1/tags?folder_id={folder_a['id']}",
        headers=auth_headers,
    )
    assert scoped.status_code == 200
    assert scoped.json() == [urgent]


def test_tags_are_isolated_by_user(client, auth_headers_for):
    owner_headers = auth_headers_for("tag_owner")
    other_headers = auth_headers_for("tag_other")
    tag = _create_tag(client, owner_headers, "private")

    owner_list = client.get("/api/v1/tags", headers=owner_headers)
    assert owner_list.status_code == 200
    assert [item["id"] for item in owner_list.json()] == [tag["id"]]

    other_list = client.get("/api/v1/tags", headers=other_headers)
    assert other_list.status_code == 200
    assert other_list.json() == []

    other_delete = client.delete(
        f"/api/v1/tags/{tag['id']}",
        headers=other_headers,
    )
    assert other_delete.status_code == 404

    owner_delete = client.delete(
        f"/api/v1/tags/{tag['id']}",
        headers=owner_headers,
    )
    assert owner_delete.status_code == 204


def test_theme_crud_response_contract(client, auth_headers):
    create = client.post(
        "/api/v1/themes",
        json={"name": "Calm", "config_json": '{"primary":"#123456"}'},
        headers=auth_headers,
    )
    assert create.status_code == 201
    theme = create.json()
    assert theme["name"] == "Calm"
    assert theme["config_json"] == '{"primary":"#123456"}'

    listed = client.get("/api/v1/themes", headers=auth_headers)
    assert listed.status_code == 200
    assert listed.json()[0]["name"] == "Calm"
    assert "config_json" not in listed.json()[0]

    fetched = client.get(
        f"/api/v1/themes/{theme['id']}",
        headers=auth_headers,
    )
    assert fetched.status_code == 200
    assert fetched.json()["config_json"] == '{"primary":"#123456"}'

    updated = client.put(
        f"/api/v1/themes/{theme['id']}",
        json={"name": "Calm Dark", "config_json": '{"mode":"dark"}'},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Calm Dark"
    assert updated.json()["config_json"] == '{"mode":"dark"}'

    deleted = client.delete(
        f"/api/v1/themes/{theme['id']}",
        headers=auth_headers,
    )
    assert deleted.status_code == 204

    missing = client.get(
        f"/api/v1/themes/{theme['id']}",
        headers=auth_headers,
    )
    assert missing.status_code == 404


def test_themes_validate_payload_and_are_isolated_by_user(
    client, auth_headers_for
):
    owner_headers = auth_headers_for("theme_owner")
    other_headers = auth_headers_for("theme_other")

    invalid = client.post(
        "/api/v1/themes",
        json={"name": "", "config_json": ""},
        headers=owner_headers,
    )
    assert invalid.status_code == 422
    assert invalid.json()["code"] == 422

    create = client.post(
        "/api/v1/themes",
        json={"name": "Private", "config_json": "{}"},
        headers=owner_headers,
    )
    assert create.status_code == 201
    theme_id = create.json()["id"]

    hidden = client.get(f"/api/v1/themes/{theme_id}", headers=other_headers)
    assert hidden.status_code == 404

    forbidden_delete = client.delete(
        f"/api/v1/themes/{theme_id}",
        headers=other_headers,
    )
    assert forbidden_delete.status_code == 404
