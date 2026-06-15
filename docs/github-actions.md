# GitHub Actions 部署文档

本文档说明当前 Docker 测试环境和发布环境的 CI 部署 workflow.

## Workflows

- `.github/workflows/release-build-run.yml`: push 到 `release_*` 分支时触发. Workflow 先执行后端和前端质量检查,再按 `deploy.sh` 的生产发布方式构建镜像,推送 Docker Hub `latest` tag,复制 `docker-compose.prod.yml` 和生成的 `.env` 到发布服务器,最后执行 `docker compose up -d`.
- `.github/workflows/dev-test-deploy.yml`: push 到 `dev` 分支时触发. Workflow 先执行后端和前端质量检查,再构建并推送 `:dev` 测试镜像,写入独立 `docker-compose.test.yml`,并使用可配置宿主机端口启动隔离的测试 Compose project.

## Quality Checks

两个 workflow 在部署前都会执行后端和前端检查.

后端检查:

- `uv sync --frozen --extra dev`
- `uv run --with ruff ruff check src tests`
- `uv run --with mypy mypy --ignore-missing-imports src tests`
- `uv run python -m pytest tests -q`

前端检查:

- `npm ci`
- `npm run lint`
- `npm run test`
- `npm run build`

Ruff 读取 `backend/pyproject.toml`,当前启用 `E`, `W`, `N`, `I`, `F`, `UP`.

## Required Secrets

通用 Docker Hub secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

发布环境 secrets:

- `RELEASE_SSH_HOST`
- `RELEASE_SSH_PRIVATE_KEY`
- `RELEASE_JWT_SECRET`

测试环境 secrets:

- `TEST_SSH_HOST`
- `TEST_SSH_PRIVATE_KEY`
- `TEST_JWT_SECRET`

可选 secrets:

- `RELEASE_SSH_USER`,默认 `root`
- `RELEASE_ADMIN_PASSWORD`,默认空
- `TEST_SSH_USER`,默认 `root`
- `TEST_ADMIN_PASSWORD`,默认空

## SSH Authentication

部署 workflow 会将 `*_SSH_PRIVATE_KEY` 写入专用 key 文件,并通过 `IdentitiesOnly yes` 强制使用该 key 做公钥认证. `*_SSH_USER` 默认是 `root`; 若出现 `Permission denied (publickey)`,应比对 workflow 打印的 `ssh-keygen -lf` 指纹与 `/root/.ssh/authorized_keys` 或配置用户 `~/.ssh/authorized_keys` 中的公钥.

## Optional Variables

发布环境 variables:

- `RELEASE_REMOTE_PATH`,默认 `/opt/tool_web`
- `RELEASE_SSH_PORT`,默认 `22`
- `RELEASE_ALLOWED_ORIGINS`,默认 `http://localhost:8003,http://localhost:3000`
- `RELEASE_DOCKER_API_PROXY_TARGET`,默认 `http://backend:8000`
- `RELEASE_RESET_AUTH_SCHEMA`,默认 `0`

测试环境 variables:

- `TEST_REMOTE_PATH`,默认 `/opt/tool_web_test`
- `TEST_SSH_PORT`,默认 `22`
- `TEST_FRONTEND_PORT`,默认 `18003`
- `TEST_BACKEND_PORT`,默认 `18004`
- `TEST_ALLOWED_ORIGINS`,默认 `http://localhost:${TEST_FRONTEND_PORT}`
- `TEST_DOCKER_API_PROXY_TARGET`,默认 `http://backend:8000`
- `TEST_COMPOSE_PROJECT`,默认 `tool-web-test`
- `TEST_RESET_AUTH_SCHEMA`,默认 `0`

测试 workflow 在远端使用 `./backend/test-data`,因此不会共享生产 SQLite 数据目录.
