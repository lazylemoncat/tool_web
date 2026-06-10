# Alembic migrations

This directory owns backend schema changes. Do not add ad hoc schema migration
logic to `src/database.py`; add a new Alembic revision instead.

The backend Docker image copies this directory and `backend/alembic.ini` into
`/app` so application startup can run `alembic upgrade head`.

Common commands:

```powershell
alembic upgrade head
alembic revision --autogenerate -m "describe change"
```
