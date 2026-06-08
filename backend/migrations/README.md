# Alembic migrations

This directory owns backend schema changes. Do not add ad hoc schema migration
logic to `src/database.py`; add a new Alembic revision instead.

Common commands:

```powershell
alembic upgrade head
alembic revision --autogenerate -m "describe change"
```
