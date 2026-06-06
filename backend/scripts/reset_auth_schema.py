"""
Reset the development database to the new reusable auth schema.

This script is intentionally destructive. The project is still pre-release and
the auth refactor does not preserve legacy authentication data.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import src.models.finance  # noqa: F401,E402
import src.models.tag  # noqa: F401,E402
import src.models.theme  # noqa: F401,E402
import src.models.user  # noqa: F401,E402
from src.database import SessionLocal, _seed_admin, engine  # noqa: E402
from src.models.todo import Base  # noqa: E402


def main() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    _seed_admin()
    db = SessionLocal()
    try:
        print("Auth schema reset complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
