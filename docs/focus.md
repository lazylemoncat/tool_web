# Tool Web 专注番茄钟模块文档

## 功能概述

Focus 模块提供持久化番茄钟和自由计时能力. 前端位于 `/focus`, 复用全局顶部导航, `ContentHeader`, MUI 主题 token, 以及 Finance 风格的模块侧边栏和记录筛选栏. 后端 `/api/v1/focus` 路由将完成或放弃的计时记录保存到数据库, 支持记录更新, 文件夹筛选和共享标签关联.

## 前端文件清单

| 文件 | 作用 |
|------|------|
| `frontend/src/app/focus/page.tsx` | Focus 页面入口, 管理模块 tab, 侧边栏, 基础数据, 统计刷新和提示 |
| `frontend/src/components/focus/FocusSidebar.tsx` | 专注模块侧边栏, 桌面固定栏和移动端抽屉 |
| `frontend/src/components/focus/FocusTimer.tsx` | 番茄钟/自由计时器, 暂停, 继续, 放弃, 休息, 本地恢复, 计时标签和归档触发 |
| `frontend/src/components/focus/FocusArchiveDialog.tsx` | 计时结束后的归档弹窗, 可填写文件夹, 标签, 新增标签和复盘 |
| `frontend/src/components/focus/FocusOverview.tsx` | 专注统计总览, 包含范围筛选, 统计卡片, 趋势, 居中热力图和分布 |
| `frontend/src/components/focus/FocusRecords.tsx` | 专注记录列表, 支持文件夹侧边栏, 搜索, 模式, 状态, 标签, 日期范围筛选和编辑 |
| `frontend/src/components/focus/FocusSessionEditDialog.tsx` | 专注记录编辑弹窗, 支持更新名称, 模式, 时长, 文件夹, 标签, 复盘和放弃状态 |
| `frontend/src/components/focus/FocusTagPicker.tsx` | Focus 共享标签选择与新增控件 |
| `frontend/src/components/focus/FocusTags.tsx` | Focus 标签页, 支持新增共享标签并展示当前标签集合 |
| `frontend/src/components/focus/focusUtils.ts` | 时长格式化和文件夹拍平工具 |
| `frontend/src/lib/focusTypes.ts` | Focus 前端类型 |
| `frontend/src/lib/api/focus.ts` | Focus API client |

## 后端文件清单

| 文件 | 作用 |
|------|------|
| `backend/src/models/focus.py` | `FocusSession` ORM 和 `focus_session_tags` 关联表 |
| `backend/src/schemas/focus.py` | Focus 请求, 响应, 列表和统计 Pydantic schema |
| `backend/src/routers/focus.py` | `/api/v1/focus` 路由, 记录 CRUD 和统计汇总 |
| `backend/migrations/versions/20260622_0003_focus_sessions.py` | Focus 表结构迁移 |
| `backend/tests/test_focus.py` | Focus API 契约和用户隔离测试 |

## 计时流程

1. 用户进入 `/focus`, 默认展示 `计时` tab.
2. 选择 `番茄钟` 或 `自由计时`. 番茄钟支持 5/15/25/30/45/60 分钟预设.
3. 计时中状态写入 `localStorage` 的 `toolweb-focus-timer-state`, 用于刷新页面后恢复, 不向后端发送秒级请求.
4. 计时界面可选择一个或多个标签, 也可直接新增标签并自动选中; 运行中补充的标签会写入本地恢复状态并随归档保存.
5. 点击结束后打开归档弹窗. 用户可补充名称, 文件夹, 标签, 新增标签和复盘内容.
6. 点击保存或稍后整理后调用 `POST /api/v1/focus/sessions`.
7. 点击放弃时也会保存记录并携带当前标签, 但后端统计默认排除 `abandoned=true` 的记录.
8. 开启自动休息时, 番茄钟结束后进入 15 分钟休息, 休息完成或跳过后再归档.
9. 记录页可通过文件夹侧边栏筛选, 并通过编辑弹窗调用 `PUT /api/v1/focus/sessions/{id}` 更新记录.

## 数据模型

### focus_sessions

| 列名 | 类型 | 说明 |
|------|------|------|
| `id` | Integer | 主键 |
| `user_id` | Integer | 所属用户 |
| `folder_id` | Integer, nullable | 关联 Todo 文件夹, 文件夹删除后置空 |
| `name` | String(120) | 专注名称 |
| `mode` | String(20) | `pomodoro` 或 `free` |
| `planned_seconds` | Integer, nullable | 番茄钟计划时长 |
| `focus_seconds` | Integer | 实际专注秒数 |
| `pause_count` | Integer | 暂停次数 |
| `pause_seconds` | Integer | 暂停秒数 |
| `rest_seconds` | Integer | 休息秒数 |
| `started_at` | DateTime | 开始时间 |
| `ended_at` | DateTime, nullable | 结束时间 |
| `abandoned` | Boolean | 是否放弃 |
| `summary` | Text, nullable | 复盘 |
| `created_at` | DateTime | 创建时间 |
| `updated_at` | DateTime | 更新时间 |

### focus_session_tags

Focus 记录复用 Todo `tags` 表, 通过 `focus_session_tags` 建立多对多关系. 后端会校验标签必须属于当前用户.

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/focus/sessions` | 获取专注记录, 支持搜索和筛选 |
| `POST` | `/api/v1/focus/sessions` | 创建专注记录 |
| `PUT` | `/api/v1/focus/sessions/{id}` | 更新专注记录 |
| `DELETE` | `/api/v1/focus/sessions/{id}` | 删除专注记录 |
| `GET` | `/api/v1/focus/summary` | 获取统计汇总 |

### 记录筛选参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `search` | string | 按名称和复盘模糊搜索 |
| `mode` | string | `pomodoro` 或 `free` |
| `abandoned` | boolean | 按放弃状态筛选 |
| `folder_id` | int | 按文件夹筛选 |
| `tag_id` | int | 按标签筛选 |
| `started_from` | date | 开始日期下限 |
| `started_to` | date | 开始日期上限 |
| `skip` | int | 分页偏移 |
| `limit` | int | 每页数量 |

### 统计范围

`GET /api/v1/focus/summary?range=7d` 支持 `today`, `week`, `month`, `7d`, `30d`, `all`.

## 主题和交互约束

- Focus 页面使用 MUI `background`, `text`, `divider`, `action`, `primary`, `success`, `warning`, `error` token.
- 原型中的 `#6C5CE7` 与当前主题 `primary.main` 一致, 不在 Focus 组件内复制独立 CSS 变量体系.
- 90 天热力图使用主题 token 色阶, 格子尺寸 20px, 间距 5px, 在统计卡片内居中显示.
- 日期范围筛选使用 MUI X `DatePicker`, 显示格式复用 `DATE_PICKER_DISPLAY_FORMAT`.
- 计时器只在运行中使用 localStorage 做恢复; 业务记录以后端数据库为准.
