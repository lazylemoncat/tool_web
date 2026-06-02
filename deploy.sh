#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Copy .env.example to .env and fill in values."
  exit 1
fi
set -a
source .env
set +a

# Validate required vars
for var in DOCKER_USER SSH_HOST SSH_USER REMOTE_PATH JWT_SECRET; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: ${var} is not set in .env"
    exit 1
  fi
done

FRONTEND_IMAGE="${DOCKER_USER}/tool-web-frontend:latest"
BACKEND_IMAGE="${DOCKER_USER}/tool-web-backend:latest"
COMPOSE_BUILD_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)

echo "=== Building images ==="
if [ "${NO_CACHE:-0}" = "1" ]; then
  docker compose "${COMPOSE_BUILD_FILES[@]}" build --no-cache frontend backend
else
  docker compose "${COMPOSE_BUILD_FILES[@]}" build frontend backend
fi

echo ""
echo "=== Pushing images to Docker Hub ==="
docker push "${FRONTEND_IMAGE}"
docker push "${BACKEND_IMAGE}"

echo ""
echo "=== Syncing files to remote ==="
scp docker-compose.prod.yml .env "${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/"

echo ""
echo "=== Deploying on remote ==="
ssh "${SSH_USER}@${SSH_HOST}" "
  cd ${REMOTE_PATH}
  docker compose -f docker-compose.prod.yml pull
  docker compose -f docker-compose.prod.yml up -d
  if [ \"${RESET_AUTH_SCHEMA:-0}\" = \"1\" ]; then
    docker compose -f docker-compose.prod.yml exec -T backend /app/.venv/bin/python -c \"from src.database import engine, _seed_admin; from src.models.todo import Base; import src.models.user, src.models.theme, src.models.tag, src.models.finance; Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine); _seed_admin(); print('Auth schema reset complete.')\"
  fi
"

echo ""
echo "=== Deploy complete ==="
