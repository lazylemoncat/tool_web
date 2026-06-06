#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

if [ -z "${JWT_SECRET:-}" ]; then
  echo "ERROR: JWT_SECRET is not set. Set it in .env before starting the app."
  exit 1
fi

echo "Building images..."
if [ "${NO_CACHE:-0}" = "1" ]; then
  docker compose build --no-cache
else
  docker compose build
fi

echo "Starting containers..."
docker compose up -d

if [ "${RESET_AUTH_SCHEMA:-0}" = "1" ]; then
  echo "Resetting auth schema..."
  docker compose exec -T backend /app/.venv/bin/python -c "from src.database import engine, _seed_admin; from src.models.todo import Base; import src.models.user, src.models.theme, src.models.tag, src.models.finance; Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine); _seed_admin(); print('Auth schema reset complete.')"
fi

echo ""
echo "Frontend running at http://localhost:8003"
echo "Backend running at http://localhost:8004"
