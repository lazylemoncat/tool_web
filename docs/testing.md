# 测试方案

本项目测试分为后端 API 测试, 前端单元/组件测试, 前后端通信契约测试和可选 E2E smoke 测试.

## 后端测试

后端使用 `pytest + FastAPI TestClient`, 覆盖认证, Todo, Kanban, Sprint, Kanban Column, Tags, Themes, Finance 和通用错误响应.

运行命令:

```bash
cd backend
uv sync --extra dev
uv run --with ruff ruff check src tests
uv run --with mypy mypy --ignore-missing-imports src tests
JWT_SECRET=test-secret-key-test-secret-key-1234 uv run python -m pytest tests -q
```

重点覆盖:

- 用户认证, 401, 登录态恢复, 用户数据隔离.
- Todo CRUD, 子任务, 筛选, 分页, Kanban Todo 字段.
- Sprint 和 Kanban Column 创建, 默认列, reorder, 删除迁移任务, 非法归属.
- Tags 和 Themes CRUD, 幂等创建, 搜索, folder 过滤, 用户隔离.
- Finance 交易, 统计接口, 空数据响应, relation 所属权, linked todo 隔离.
- 400, 401, 404, 422 的统一错误响应结构.

## 前端测试

前端使用 `Vitest + React Testing Library + jsdom + user-event`, 请求层使用 fetch mock 或模块 mock.

运行命令:

```bash
cd frontend
npm ci
npm run test
npm run test:watch
npm run build
```

当前 `npm run lint` 仍存在前端重构遗留的 baseline 错误, CI 中暂时保留为非阻塞输出. 在 lint baseline 清理后, 应将 CI lint 步骤改为阻塞.

重点覆盖:

- `frontend/src/lib/api.ts`: method, URL, query, payload, headers, credentials, CSRF, 204, 错误解析, 401 refresh retry.
- `frontend/src/lib/api/kanbanTask.ts`: KanbanTask API endpoint contract.
- `AuthContext`: 初始化登录态, 登录, MFA, 登出, ApiError 状态.
- 登录页和注册页: 必填校验, 提交调用, 后端错误展示.
- Todo/BatchBar 和 KanbanCard: 批量操作, 卡片点击, 确认流转, 末列状态.
- Finance/TransactionFormDialog: 新增和编辑交易提交 payload.

## 通信契约

通信契约测试分两层:

- 前端 mock fetch: 验证前端发出的 URL, query, body, headers 和 credentials.
- 后端 TestClient: 验证后端响应 shape, 状态码, 字段名和错误结构.

重点链路:

- 登录态恢复和 401 refresh retry.
- Todo 查询, 新增, Kanban 任务移动.
- Finance transaction 创建, stats/dashboard 空数据和 relation 所属权.
- 后端错误响应到前端 `ApiError` 的消息解析.

## CI 覆盖

`.github/workflows/dev-test-deploy.yml` 和 `.github/workflows/release-build-run.yml` 执行:

- 后端: `uv sync --frozen --extra dev`, `ruff check src tests`, `mypy --ignore-missing-imports src tests`, `pytest tests -q`.
- 前端: `npm ci`, `npm run lint` (当前非阻塞), `npm run test`, `npm run build`.

E2E smoke 目前未启用. 如果后续需要加入 Playwright, 建议单独 job 运行登录, Todo 创建/编辑/删除和 Finance 创建/统计展示, 避免拖慢单元测试反馈.
