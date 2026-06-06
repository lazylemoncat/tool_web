from src.auth.adapters.sqlalchemy_models import AuthMfaMethod, User
from src.auth.adapters.stores import AuthStore


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


def test_username_availability(client):
    available = client.get(
        "/api/v1/auth/username-availability",
        params={"username": "newname"},
    )
    assert available.status_code == 200
    assert available.json() == {"username": "newname", "available": True}

    client.post(
        "/api/v1/auth/register",
        json={
            "username": "usedname",
            "password": "password123",
        },
    )
    taken = client.get(
        "/api/v1/auth/username-availability",
        params={"username": "usedname"},
    )
    assert taken.status_code == 200
    assert taken.json() == {"username": "usedname", "available": False}


def test_reset_password_with_recovery_code(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "resetuser",
            "password": "password123",
        },
    )
    user = db_session.query(User).filter(User.username == "resetuser").first()
    assert user is not None
    db_session.add(
        AuthMfaMethod(
            id="test-reset-mfa",
            user_id=user.id,
            method_type="totp",
            is_enabled=True,
        )
    )
    AuthStore(db_session).create_recovery_codes(
        user_id=user.id,
        codes=["RESET-CODE-1"],
    )
    db_session.commit()

    reset_resp = client.post(
        "/api/v1/auth/password/reset",
        json={
            "username": "resetuser",
            "method": "recovery_code",
            "code": "RESET-CODE-1",
            "new_password": "newpass123",
        },
    )
    assert reset_resp.status_code == 204

    login_resp = client.post(
        "/api/v1/auth/login",
        json={
            "username": "resetuser",
            "password": "newpass123",
        },
    )
    assert login_resp.status_code == 200


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
