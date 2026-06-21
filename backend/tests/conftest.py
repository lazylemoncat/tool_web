"""
Test fixtures. Uses sqlite:// with StaticPool to share in-memory DB.
"""

import os

os.environ.setdefault("JWT_SECRET", "a" * 32)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import src.models.calendar  # noqa: F401  register calendar tables
import src.models.finance  # noqa: F401  register finance tables with Base.metadata
import src.models.kanban  # noqa: F401  register kanban tables
import src.models.kanban_task  # noqa: F401  register kanban_task table
import src.models.tag  # noqa: F401  register tag tables with Base.metadata
import src.models.theme  # noqa: F401  register theme tables with Base.metadata
import src.models.user  # noqa: F401  register auth tables with Base.metadata
from src.database import get_db
from src.models.todo import Base

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    import src.utils.rate_limit as rl

    rl._attempts.clear()
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide a database session for model-level tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    import src.database
    from src.main import app

    src.database.init_db = lambda: None
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Get auth headers for a newly registered test user."""
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "password": "testpass1",
        },
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": "testpass1",
        },
    )
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_for(client):
    """Create an authenticated user and clear cookies before returning."""
    counter = 0

    def _create(username_prefix: str = "testuser"):
        nonlocal counter
        counter += 1
        username = f"{username_prefix}_{counter}"
        password = "testpass1"

        client.cookies.clear()
        register_resp = client.post(
            "/api/v1/auth/register",
            json={
                "username": username,
                "password": password,
            },
        )
        assert register_resp.status_code == 201

        login_resp = client.post(
            "/api/v1/auth/login",
            json={
                "username": username,
                "password": password,
            },
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["token"]
        client.cookies.clear()
        return {"Authorization": f"Bearer {token}"}

    return _create
