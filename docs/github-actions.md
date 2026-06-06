# GitHub Actions Deployment

This document describes the CI deployment workflows for Docker-based environments.

## Workflows

- `.github/workflows/release-build-run.yml` runs on pushes to `release_*` branches. It runs backend quality checks first, then mirrors `deploy.sh`: build production images, push `latest` tags to Docker Hub, copy `docker-compose.prod.yml` and the generated `.env` file to the release server, then run `docker compose up -d`.
- `.github/workflows/dev-test-deploy.yml` runs on pushes to `dev`. It runs backend quality checks first, then builds and pushes `:dev` images, writes a separate `docker-compose.test.yml`, and starts an isolated test Compose project with configurable host ports.

## Quality Checks

Both workflows run the same backend checks before deployment:

- `uv sync --frozen --extra dev`
- `uv run --with ruff ruff check src tests`
- `uv run --with mypy mypy --ignore-missing-imports src tests`

Ruff reads `backend/pyproject.toml` and enables `E`, `W`, `N`, `I`, `F`, and `UP`.

## Required Secrets

Common Docker Hub secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Release deployment secrets:

- `RELEASE_SSH_HOST`
- `RELEASE_SSH_PRIVATE_KEY`
- `RELEASE_JWT_SECRET`

Test deployment secrets:

- `TEST_SSH_HOST`
- `TEST_SSH_PRIVATE_KEY`
- `TEST_JWT_SECRET`

Optional secrets:

- `RELEASE_SSH_USER`, default `root`
- `RELEASE_ADMIN_PASSWORD`, empty by default
- `TEST_SSH_USER`, default `root`
- `TEST_ADMIN_PASSWORD`, empty by default

## SSH Authentication

The deployment workflows write `*_SSH_PRIVATE_KEY` to a dedicated key file and force public-key authentication with `IdentitiesOnly yes`. `*_SSH_USER` defaults to `root`; when `Permission denied (publickey)` appears, compare the printed `ssh-keygen -lf` fingerprint with the public key in `/root/.ssh/authorized_keys` or the configured user's `~/.ssh/authorized_keys`.

## Optional Variables

Release variables:

- `RELEASE_REMOTE_PATH`, default `/opt/tool_web`
- `RELEASE_SSH_PORT`, default `22`
- `RELEASE_ALLOWED_ORIGINS`, default `http://localhost:8003,http://localhost:3000`
- `RELEASE_DOCKER_API_PROXY_TARGET`, default `http://backend:8000`
- `RELEASE_RESET_AUTH_SCHEMA`, default `0`

Test variables:

- `TEST_REMOTE_PATH`, default `/opt/tool_web_test`
- `TEST_SSH_PORT`, default `22`
- `TEST_FRONTEND_PORT`, default `18003`
- `TEST_BACKEND_PORT`, default `18004`
- `TEST_ALLOWED_ORIGINS`, default `http://localhost:${TEST_FRONTEND_PORT}`
- `TEST_DOCKER_API_PROXY_TARGET`, default `http://backend:8000`
- `TEST_COMPOSE_PROJECT`, default `tool-web-test`
- `TEST_RESET_AUTH_SCHEMA`, default `0`

The test workflow uses `./backend/test-data` on the remote host so it does not share the production SQLite data directory.
