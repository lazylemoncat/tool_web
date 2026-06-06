def test_create_folder(client, auth_headers):
    resp = client.post(
        "/api/v1/folders",
        json={
            "name": "Work",
            "color": "#ff0000",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Work"
    assert body["todo_count"] == 0


def test_list_folders(client, auth_headers):
    client.post("/api/v1/folders", json={"name": "A"}, headers=auth_headers)
    client.post("/api/v1/folders", json={"name": "B"}, headers=auth_headers)
    resp = client.get("/api/v1/folders", headers=auth_headers)
    assert resp.status_code == 200
    folders = resp.json()
    assert len(folders) == 2


def test_update_folder(client, auth_headers):
    resp = client.post(
        "/api/v1/folders", json={"name": "Old"}, headers=auth_headers
    )
    folder_id = resp.json()["id"]
    resp = client.put(
        f"/api/v1/folders/{folder_id}",
        json={"name": "New"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New"


def test_delete_folder(client, auth_headers):
    resp = client.post(
        "/api/v1/folders", json={"name": "Temp"}, headers=auth_headers
    )
    folder_id = resp.json()["id"]
    resp = client.delete(f"/api/v1/folders/{folder_id}", headers=auth_headers)
    assert resp.status_code == 204


def test_folder_not_found(client, auth_headers):
    resp = client.put(
        "/api/v1/folders/9999", json={"name": "Nope"}, headers=auth_headers
    )
    assert resp.status_code == 404


def test_reorder_folders(client, auth_headers):
    resp1 = client.post(
        "/api/v1/folders",
        json={"name": "First", "sort_order": 0},
        headers=auth_headers,
    )
    resp2 = client.post(
        "/api/v1/folders",
        json={"name": "Second", "sort_order": 1},
        headers=auth_headers,
    )
    id1 = resp1.json()["id"]
    id2 = resp2.json()["id"]
    resp = client.post(
        "/api/v1/folders/reorder",
        json={
            "items": [
                {"id": id1, "sort_order": 5},
                {"id": id2, "sort_order": 0},
            ]
        },
        headers=auth_headers,
    )
    assert resp.status_code == 204
