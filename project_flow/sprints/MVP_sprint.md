# MVP_sprint

1.   目标:

     建立 Tool Web 的最小可用闭环: 用户可以通过浏览器注册登录,管理 Todo,查看基础 Dashboard,并通过后端 REST API 完成同一套数据读写.

2.   核心用户路径

     ```text
     用户打开项目
     → 注册或登录账号
     → 进入 Dashboard 或 Todo 页面
     → 创建,编辑,完成或删除任务
     → 在响应式界面看到明确结果
     → 通过文档知道如何本地运行和验证
     ```

3.   功能范围

     -   用户认证: 注册,登录,登出,cookie-based JWT,token 自动刷新.
     -   Todo: 任务 CRUD,完成状态,优先级,截止日期,搜索筛选和基础组织能力.
     -   Dashboard: 今日任务,快速创建,最近任务和清晰的下一步入口.
     -   API: 提供稳定 RESTful 接口,支持前端和后续 Agent 调用.
     -   响应式 Web: PC,手机和平板可用,移动端提供适合触控的导航.
     -   文档: README,模块文档,project_flow 和 changelog 保持同步.

4.   验收清单

     -   新用户可以完成注册,登录和登出.
     -   登录用户只能访问自己的 Todo 数据.
     -   用户可以创建,更新,完成,筛选和删除任务.
     -   前端 `/api/*` 请求通过 Next rewrites 正确代理到 FastAPI.
     -   本地开发可按 README 启动前端和后端.
     -   后端 `ruff`, `mypy`, `pytest` 有明确执行命令.
     -   前端 `npm run test` 和 `npm run build` 有明确执行命令.
     -   每次改动同步更新相关文档和 `changelog.md`.

## 范围与边界

1.   当前版本只做:

     -   单用户数据隔离下的认证,Todo,Dashboard,基础 API 和响应式体验.
     -   支持个人部署所需的 Docker Compose 和 `.env.example`.
     -   保留 Finance 和主题模块的现有能力,但 MVP 验收不依赖新增复杂功能.

2.   当前版本不做:

     -   插件系统,插件市场和第三方扩展权限模型.
     -   复杂自动化规则,Webhook 重试系统和 Agent SDK.
     -   多工作区,团队协作和细粒度 RBAC.
     -   原生桌面端或移动端 App.

## 技术边界

| 边界 | 当前选择 | 原因 |
| ---- | -------- | ---- |
| 前端 | Next.js + React + MUI | 统一页面路由,响应式 UI 和复杂控件体验 |
| 后端 | FastAPI + SQLAlchemy + Pydantic | API 清晰,类型边界明确,测试成本可控 |
| 数据库 | SQLite | MVP 和个人部署阶段足够简单 |
| 部署 | Docker Compose | 前后端服务边界清晰,便于本地和服务器复用 |

## 复杂度控制

为了避免过度设计,当前阶段遵守:

-   先完成稳定用户路径,再扩展高级模块.
-   不提前引入缓存,消息队列和微服务.
-   新增功能必须有明确模块归属,API 边界和文档位置.
-   UI 自定义能力采用渐进开放策略,先固定布局,再扩展 Widget 配置.
