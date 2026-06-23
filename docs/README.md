# Tool Web 文档索引

本文档是项目文档入口,用于快速定位当前有效文档,历史方案和零散记录. 代码结构和接口以当前 `develop` 分支为准.

## 阅读顺序

| 场景 | 推荐文档 |
|------|----------|
| 了解项目定位 | [`README.md`](../README.md), [`product2.md`](../product2.md), [`project_flow/1_project_idea.md`](../project_flow/1_project_idea.md) |
| 了解架构边界 | [`project_flow/2_architecture.md`](../project_flow/2_architecture.md), [`frontend.md`](frontend.md), [`api.md`](api.md) |
| 本地开发和验证 | [`README.md`](../README.md), [`testing.md`](testing.md), [`github-actions.md`](github-actions.md) |
| 修改认证功能 | [`auth.md`](auth.md), [`api.md`](api.md) |
| 修改 Todo 或 Kanban | [`todo.md`](todo.md), [`api.md`](api.md) |
| 修改 Finance | [`finance.md`](finance.md), [`api.md`](api.md) |
| 修改 Calendar | [`calendar.md`](calendar.md), [`frontend.md`](frontend.md) |
| 修改 Focus 番茄钟 | [`focus.md`](focus.md), [`api.md`](api.md), [`frontend.md`](frontend.md) |
| 修改主题和语言偏好 | [`theme.md`](theme.md), [`frontend.md`](frontend.md), [`auth.md`](auth.md) |
| 查看数据模型或组件图 | [`uml/index.md`](uml/index.md) |

## 根目录文档

| 文件 | 用途 | 状态 |
|------|------|------|
| [`README.md`](../README.md) | 项目介绍,快速启动,项目结构和常用文档入口 | 当前有效 |
| [`AGENTS.md`](../AGENTS.md) | 协作,Git Flow,编码,文档和 CodeGraph 规则 | 当前有效 |
| [`changelog.md`](../changelog.md) | 项目代码,配置,文档和流程变更记录 | 当前有效 |
| [`product2.md`](../product2.md) | 当前 PRD,产品边界,技术栈,路线图 | 当前有效 |
| [`product.md`](../product.md) | 早期 PRD 草稿 | 历史参考 |

## 模块文档

| 文件 | 覆盖范围 |
|------|----------|
| [`api.md`](api.md) | `/api/v1` REST API,统一响应,Auth,Todo,Kanban,Finance 等端点 |
| [`auth.md`](auth.md) | 登录,注册,MFA,重置密码,偏好设置,认证数据流和后端认证模块 |
| [`frontend.md`](frontend.md) | Next.js 前端结构,全局 Provider,页面接入状态,运行和验证 |
| [`todo.md`](todo.md) | Todo,文件夹,标签,重复任务,Kanban,拖拽排序和相关 API |
| [`finance.md`](finance.md) | 账本,账户,分类,标签,交易,预算,事件,附件和统计 |
| [`calendar.md`](calendar.md) | 当前前端日历模块,内存数据层和后续 API 对接建议 |
| [`focus.md`](focus.md) | 番茄钟,自由计时,专注记录归档,统计总览和 Focus API |
| [`theme.md`](theme.md) | 当前 MUI 主题,主题偏好,语言偏好和后端主题 API 边界 |
| [`testing.md`](testing.md) | 后端 pytest,前端 Vitest,通信契约和 CI 验证范围 |
| [`github-actions.md`](github-actions.md) | dev/release 部署 workflow,Secrets 和 Variables |

## 项目流程文档

| 文件 | 覆盖范围 |
|------|----------|
| [`project_flow/1_project_idea.md`](../project_flow/1_project_idea.md) | 项目动机,目标用户,问题边界和成功标准 |
| [`project_flow/2_architecture.md`](../project_flow/2_architecture.md) | 当前架构选择,模块划分,依赖方向和扩展点 |
| [`project_flow/sprints/MVP_sprint.md`](../project_flow/sprints/MVP_sprint.md) | MVP 范围,技术边界和验收清单 |
| [`project_flow/sprints/sprint1.md`](../project_flow/sprints/sprint1.md) | Sprint 1 范围,技术边界和验收清单 |

## 历史方案和图表

| 路径 | 用途 |
|------|------|
| [`docs/superpowers/plans/`](superpowers/plans/) | 历史实现计划和任务拆分,用于追溯设计取舍 |
| [`docs/superpowers/specs/`](superpowers/specs/) | 历史设计规格,用于追溯模块演进 |

## 零散记录

| 路径 | 当前处理方式 |
|------|--------------|
| [`skills/`](../skills/) | 本地技能说明,不作为产品文档维护 |
| [`.codex/`](../.codex/) | Codex 本地技能和流程文件,不作为产品文档维护 |
| [`.od-skills/`](../.od-skills/) | OpenDesign 本地技能缓存,不作为产品文档维护 |
| [`dist/`](../dist/) | 历史构建或导出产物,不作为当前文档源维护 |

## 维护规则

- 新增模块时,先补对应模块文档,再在本索引和 [`README.md`](../README.md) 的常用文档中加入入口.
- 修改代码,配置,文档或流程后,同步更新 [`changelog.md`](../changelog.md).
- 涉及日期选择控件的前端文档应明确使用 MUI X `DatePicker` 和共享日期格式常量.
- 历史方案不直接删除; 若不再代表当前实现,在当前有效文档中标注状态和新入口.
