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
for var in DOCKER_USER SSH_HOST SSH_USER REMOTE_PATH; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: ${var} is not set in .env"
    exit 1
  fi
done

BACKEND_IMAGE="${DOCKER_USER}/tool-web-backend:latest"
FRONTEND_IMAGE="${DOCKER_USER}/tool-web-frontend:latest"

echo "=== Building images ==="
docker compose build

echo ""
echo "=== Tagging images ==="
docker tag tool_web-backend "${BACKEND_IMAGE}"
docker tag tool_web-frontend "${FRONTEND_IMAGE}"

echo ""
echo "=== Pushing images to Docker Hub ==="
docker push "${BACKEND_IMAGE}"
docker push "${FRONTEND_IMAGE}"

echo ""
echo "=== Syncing files to remote ==="
scp docker-compose.prod.yml .env "${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/"

echo ""
echo "=== Deploying on remote ==="
ssh "${SSH_USER}@${SSH_HOST}" "
  cd ${REMOTE_PATH}
  docker compose -f docker-compose.prod.yml pull
  docker compose -f docker-compose.prod.yml up -d
"

echo ""
echo "=== Deploy complete ==="
