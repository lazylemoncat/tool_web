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

from src.database import get_db
from src.models.todo import Base
import src.models.user  # noqa: F401  register auth tables with Base.metadata
import src.models.tag  # noqa: F401  register tag tables with Base.metadata
import src.models.theme  # noqa: F401  register theme tables with Base.metadata
import src.models.finance  # noqa: F401  register finance tables with Base.metadata

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


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
def client():
    from src.main import app
    import src.database
    src.database.init_db = lambda: None
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Get auth headers for a newly registered test user."""
    client.post("/api/v1/auth/register", json={
        "username": "testuser",
        "password": "testpass1",
    })
    resp = client.post("/api/v1/auth/login", json={
        "username": "testuser",
        "password": "testpass1",
    })
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}
