def test_register(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "newuser",
            "password": "password123",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["username"] == "newuser"
    assert "token" in body


def test_register_duplicate(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "dupuser",
            "password": "password123",
        },
    )
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "dupuser",
            "password": "password123",
        },
    )
    assert resp.status_code == 409


def test_login_success(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "loginuser",
            "password": "password123",
        },
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={
            "username": "loginuser",
            "password": "password123",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "token" in body


def test_login_wrong_password(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "pwuser",
            "password": "password123",
        },
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={
            "username": "pwuser",
            "password": "wrongpwd",
        },
    )
    assert resp.status_code == 401


def test_me_requires_auth(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_with_auth(client, auth_headers):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["username"] == "testuser"
