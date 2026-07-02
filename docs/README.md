# Tool Web 文档索引

本文档是项目文档的唯一入口和地图. 代码结构和接口以当前 `develop` 分支为准.

## 阅读顺序

| 场景 | 推荐文档 |
|------|----------|
| 了解项目定位和边界 | [`product.md`](product.md) |
| 了解架构与技术选型 | [`architecture.md`](architecture.md), [`frontend.md`](frontend.md), [`api.md`](api.md) |
| 了解近期计划和远期方向 | [`roadmap.md`](roadmap.md) |
| 修代码坏味道 / 统一约定 | [`tech-debt.md`](tech-debt.md) |
| 本地开发和验证 | [`README.md`](../README.md), [`testing.md`](testing.md), [`github-actions.md`](github-actions.md) |
| 修改认证功能 | [`auth.md`](auth.md), [`api.md`](api.md) |
| 修改 Todo 或 Kanban | [`todo.md`](todo.md), [`api.md`](api.md) |
| 修改 Finance | [`finance.md`](finance.md), [`api.md`](api.md) |
| 修改 Calendar | [`calendar.md`](calendar.md), [`frontend.md`](frontend.md) |
| 修改 Focus 番茄钟 | [`focus.md`](focus.md), [`api.md`](api.md), [`frontend.md`](frontend.md) |
| 修改主题和语言偏好 | [`theme.md`](theme.md), [`frontend.md`](frontend.md), [`auth.md`](auth.md) |

## 根目录文档

| 文件 | 用途 |
|------|------|
| [`README.md`](../README.md) | 项目介绍,快速启动,项目结构和常用文档入口 |
| [`AGENTS.md`](../AGENTS.md) | 协作,Git Flow,编码,文档和 CodeGraph 规则 |
| [`changelog.md`](../changelog.md) | 项目代码,配置,文档和流程变更记录 |

## 产品与规划文档

| 文件 | 覆盖范围 |
|------|----------|
| [`product.md`](product.md) | 产品定位,产品边界,已实现能力,设计原则和 Agent-ready 远期愿景 |
| [`architecture.md`](architecture.md) | 架构选择,模块划分,依赖方向,架构约束和未来扩展点 |
| [`roadmap.md`](roadmap.md) | 近期重心和远期 (不排期) 方向 |
| [`tech-debt.md`](tech-debt.md) | 代码技术债立案,优先级和验收标准 |

## 模块文档

| 文件 | 覆盖范围 |
|------|----------|
| [`api.md`](api.md) | `/api/v1` REST API,统一响应,Auth,Todo,Kanban,Finance 等端点 |
| [`auth.md`](auth.md) | 登录,注册,MFA,重置密码,偏好设置,认证数据流和后端认证模块 |
| [`frontend.md`](frontend.md) | Next.js 前端结构,全局 Provider,页面接入状态,运行和验证 |
| [`todo.md`](todo.md) | Todo,文件夹,标签,重复任务,Kanban,拖拽排序和相关 API |
| [`finance.md`](finance.md) | 账本,账户,分类,标签,交易,预算,事件,附件和统计 |
| [`calendar.md`](calendar.md) | 日历视图,手动事件持久化,聚合数据来源和只读来源规则 |
| [`focus.md`](focus.md) | 番茄钟,自由计时,专注记录归档,统计总览和 Focus API |
| [`theme.md`](theme.md) | 当前 MUI 主题,主题偏好,语言偏好和后端主题 API 边界 |
| [`testing.md`](testing.md) | 后端 pytest,前端 Vitest,通信契约和 CI 验证范围 |
| [`github-actions.md`](github-actions.md) | dev/release 部署 workflow,Secrets 和 Variables |

## 非文档目录说明

| 路径 | 说明 |
|------|------|
| `../skills/`, `../.codex/`, `../.od-skills/` | 本地 AI 技能和流程文件,不作为产品文档维护 |
| `../frontend/dist/help/` | 前端构建产物中的用户帮助文档,不作为文档源维护 |

## 维护规则

- **单一事实来源 (SSOT)**: 每类信息只在其对应文档维护,其他文档只放链接,不复制内容.
- 新增模块时,先补对应模块文档,再在本索引和 [`README.md`](../README.md) 的常用文档中加入入口.
- 修改代码,配置,文档或流程后,同步更新 [`changelog.md`](../changelog.md).
- 历史方案和已完成的迭代清单直接删除,靠 git 历史与 changelog 追溯,不在文档树中留存.
- 涉及日期选择控件的前端文档应明确使用 MUI X `DatePicker` 和共享日期格式常量.
