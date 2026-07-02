# Tool Web Focus 专注模块文档

## 功能概述

Focus 模块提供持久化番茄钟和自由计时能力. 前端位于 `/focus`, 后端统一挂载在 `/api/v1/focus`. 专注记录,文件夹和标签均属于 Focus 模块自身,不复用 Todo 的 `/api/v1/folders` 或 `/api/v1/tags`.

## 前端文件

| 文件 | 作用 |
|------|------|
| `frontend/src/app/focus/page.tsx` | Focus 页面入口,加载 Focus 文件夹,标签和统计数据 |
| `frontend/src/components/focus/FocusSidebar.tsx` | Focus 模块侧边栏,包含计时,总览,记录,文件夹和标签页 |
| `frontend/src/components/focus/FocusTimer.tsx` | 番茄钟和自由计时器,支持暂停,继续,放弃,休息,本地恢复和归档 |
| `frontend/src/components/focus/FocusArchiveDialog.tsx` | 计时结束后的归档弹窗,可选择 Focus 文件夹和 Focus 标签 |
| `frontend/src/components/focus/FocusRecords.tsx` | 专注记录列表,支持 Focus 文件夹侧栏,标签,模式,状态和日期范围筛选 |
| `frontend/src/components/focus/FocusFolders.tsx` | Focus 文件夹管理页,支持新增专注文件夹 |
| `frontend/src/components/focus/FocusTags.tsx` | Focus 标签管理页,支持新增专注标签 |
| `frontend/src/components/focus/FocusTagPicker.tsx` | Focus 标签选择与新增控件 |
| `frontend/src/components/focus/FocusSessionEditDialog.tsx` | 专注记录编辑弹窗 |
| `frontend/src/components/focus/focusUtils.ts` | 时长格式化和 Focus 文件夹扁平化工具 |
| `frontend/src/lib/focusTypes.ts` | Focus 前端类型 |
| `frontend/src/lib/api/focus.ts` | Focus API client |

## 后端文件

| 文件 | 作用 |
|------|------|
| `backend/src/models/focus.py` | `FocusFolder`, `FocusTag`, `FocusSession` 和 `focus_session_tags` ORM |
| `backend/src/schemas/focus.py` | Focus 文件夹,标签,记录,列表和统计 Pydantic schema |
| `backend/src/routers/focus.py` | `/api/v1/focus` 路由,包含文件夹,标签,记录 CRUD 和统计 |
| `backend/migrations/versions/20260622_0003_focus_sessions.py` | Focus 专属表结构迁移 |
| `backend/tests/test_focus.py` | Focus API 契约和跨用户隔离测试 |
| `frontend/src/components/focus/FocusTimer.test.tsx` | 计时恢复与归档流程组件测试 |

## 数据模型

### focus_folders

| 列名 | 类型 | 说明 |
|------|------|------|
| `id` | Integer | 主键 |
| `user_id` | Integer | 所属用户 |
| `parent_id` | Integer, nullable | 父级 Focus 文件夹 |
| `name` | String(50) | 文件夹名称 |
| `color` | String(9) | 标记颜色 |
| `icon_type` | String(10) | `color` 或 `emoji` |
| `icon_value` | String(20) | 标记值 |
| `sort_order` | Integer | 排序值 |
| `created_at` | DateTime | 创建时间 |
| `updated_at` | DateTime | 更新时间 |

### focus_tags

| 列名 | 类型 | 说明 |
|------|------|------|
| `id` | Integer | 主键 |
| `user_id` | Integer | 所属用户 |
| `name` | String(50) | 标签名称 |

`focus_tags` 对 `(user_id, name)` 做唯一约束,同名创建幂等返回已有标签.

### focus_sessions

| 列名 | 类型 | 说明 |
|------|------|------|
| `id` | Integer | 主键 |
| `user_id` | Integer | 所属用户 |
| `folder_id` | Integer, nullable | 关联 Focus 文件夹,删除文件夹后置空 |
| `name` | String(120) | 专注名称 |
| `mode` | String(20) | `pomodoro` 或 `free` |
| `planned_seconds` | Integer, nullable | 计划时长 |
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

Focus 记录通过 `focus_session_tags` 关联 Focus 自己的 `focus_tags`,后端会校验标签必须属于当前用户.

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/focus/folders` | 获取 Focus 文件夹树 |
| `POST` | `/api/v1/focus/folders` | 创建 Focus 文件夹 |
| `PUT` | `/api/v1/focus/folders/{id}` | 更新 Focus 文件夹 |
| `DELETE` | `/api/v1/focus/folders/{id}` | 删除 Focus 文件夹,已有记录置为未整理 |
| `POST` | `/api/v1/focus/folders/reorder` | 同级 Focus 文件夹排序 |
| `GET` | `/api/v1/focus/tags` | 获取 Focus 标签 |
| `POST` | `/api/v1/focus/tags` | 创建 Focus 标签 |
| `DELETE` | `/api/v1/focus/tags/{id}` | 删除 Focus 标签 |
| `GET` | `/api/v1/focus/sessions` | 获取专注记录 |
| `POST` | `/api/v1/focus/sessions` | 创建专注记录 |
| `PUT` | `/api/v1/focus/sessions/{id}` | 更新专注记录 |
| `DELETE` | `/api/v1/focus/sessions/{id}` | 删除专注记录 |
| `GET` | `/api/v1/focus/summary` | 获取专注统计 |

## 计时恢复与归档流程

- 计时进行中或暂停时,状态持续写入 localStorage (`toolweb-focus-timer-state`);页面重新打开时展示恢复横幅,横幅包含会话名称,模式和已专注时长,供用户选择继续,结束或放弃.
- 番茄钟在页面关闭期间已走完时,恢复操作直接进入已完成状态并打开归档弹窗,同时清理 localStorage 中的计时状态,避免归档后刷新再次提示恢复.
- 归档弹窗被取消后,待归档数据仍保留在页面上,已完成状态下可通过"归档记录"按钮重新打开弹窗;点击"重置"才会丢弃本次待归档数据.

## 开发约束

- Focus 文件夹和标签必须使用 `FocusFolderOut` 和 `FocusTag` 类型.
- Focus 页面不得调用 Todo 的 `listFolders`, `createFolder`, `listTags` 或 `createTag`.
- 记录筛选和归档中的 `folder_id` 与 `tag_ids` 均指向 Focus 专属表.
- 日期范围筛选继续使用 MUI X `DatePicker`,显示格式复用 `DATE_PICKER_DISPLAY_FORMAT`.
