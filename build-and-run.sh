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

echo "Building images..."
docker compose build

echo "Starting containers..."
docker compose up -d

echo ""
echo "App running at http://localhost:8003"
