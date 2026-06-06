# Kanban 任务模板 + 设置功能 · 设计文档

> 日期: 2026-06-03
> 状态: 定稿
> 基于 index.html 原型设计，采用 KanbanTask 独立表 + Folder 模板配置方案

---

## Context

在 Todo 页面的 Kanban 模式中增加：

1. **编辑 Sprint 功能** — 通过显式按钮（非右键菜单）访问 Sprint 设置
2. **编辑 Kanban 设置功能** — 统一设置面板，含列管理、任务卡模板、Sprint 管理、偏好设置
3. **Kanban 任务卡片模板更换** — 7 个结构化字段：任务名称、所属版本、任务类型、优先级、需求说明、技术说明、验收标准
4. **模板可在文件夹级别配置** — 每个 Kanban 文件夹有独立的模板定义，范围仅在该文件夹内

看板任务与普通 Todo 任务不兼容，使用独立数据表。

---

## 1. 数据模型

### 1.1 KanbanTask 表（新建）

```
kanban_tasks
├── id                  int PK
├── user_id             FK → auth_users.id         NOT NULL
├── folder_id           FK → folders.id            NOT NULL
├── sprint_id           FK → sprints.id            NULLABLE
├── column_id           FK → kanban_columns.id     NULLABLE
│
├── title               varchar(500)               NOT NULL  ← 任务名称
├── version             varchar(100)               NULLABLE  ← 所属版本
├── task_type           varchar(50)                NULLABLE  ← 任务类型
├── priority            varchar(10)                NULLABLE  ← P0/P1/P2/P3
├── requirement_desc    text                       NULLABLE  ← 需求说明
├── technical_desc      text                       NULLABLE  ← 技术说明
├── acceptance_criteria text                       NULLABLE  ← 验收标准
│
├── custom_fields       JSON                       NULLABLE  ← 自定义字段
├── sort_order          int                        DEFAULT 0
├── created_at          datetime                   NOT NULL
└── updated_at          datetime                   NOT NULL
```

### 1.2 Folder.kanban_config（新增 JSON 字段）

存储在 Folder 模型上，作为看板模板配置。字段定义使用**统一数组**（不分 system/custom 两组），通过 `system` 属性区分。

```json
{
  "kanban_template": {
    "fields": [
      {
        "key": "title",
        "label": "任务名称",
        "type": "text",
        "show_on_card": true,
        "show_in_detail": true,
        "required": true,
        "order": 1,
        "system": true,
        "editable": true,
        "default_value": ""
      },
      {
        "key": "version",
        "label": "所属版本",
        "type": "text",
        "show_on_card": true,
        "show_in_detail": true,
        "required": false,
        "order": 2,
        "system": true,
        "editable": true,
        "default_value": ""
      },
      {
        "key": "task_type",
        "label": "任务类型",
        "type": "select",
        "show_on_card": true,
        "show_in_detail": true,
        "required": true,
        "order": 3,
        "system": true,
        "editable": true,
        "default_value": "feat",
        "options": ["feat", "bug", "chore", "refactor", "docs", "test"]
      },
      {
        "key": "priority",
        "label": "优先级",
        "type": "select",
        "show_on_card": true,
        "show_in_detail": true,
        "required": true,
        "order": 4,
        "system": true,
        "editable": true,
        "default_value": "P2",
        "options": ["P0", "P1", "P2", "P3"]
      },
      {
        "key": "requirement_desc",
        "label": "需求说明",
        "type": "textarea",
        "show_on_card": false,
        "show_in_detail": true,
        "required": false,
        "order": 5,
        "system": true,
        "editable": true,
        "default_value": ""
      },
      {
        "key": "technical_desc",
        "label": "技术说明",
        "type": "textarea",
        "show_on_card": false,
        "show_in_detail": true,
        "required": false,
        "order": 6,
        "system": true,
        "editable": true,
        "default_value": ""
      },
      {
        "key": "acceptance_criteria",
        "label": "验收标准",
        "type": "textarea",
        "show_on_card": false,
        "show_in_detail": true,
        "required": false,
        "order": 7,
        "system": true,
        "editable": true,
        "default_value": ""
      }
    ]
  }
}
```

### 1.3 字段配置属性说明

| 属性 | 类型 | 说明 |
|------|------|------|
| `key` | string | 字段标识，**创建后不可修改**。system=true 时固定为预定义 key |
| `label` | string | 展示名称，可修改 |
| `type` | enum | `text` / `textarea` / `select` / `number` / `date` |
| `show_on_card` | bool | 是否在看板卡片直接显示 |
| `show_in_detail` | bool | 是否在详情抽屉中显示 |
| `required` | bool | 创建/编辑时是否必填 |
| `order` | int | 排序序号，控制展示顺序 |
| `system` | bool | true=系统字段（存真实列），false=自定义字段（存 custom_fields JSON） |
| `editable` | bool | 用户端是否可编辑 |
| `default_value` | any | 默认值 |
| `options` | string[] | 仅 type=select 时有效，可选值列表 |

### 1.4 数据存储规则

- `system: true` 的字段 → 值写入 `kanban_tasks` 对应的真实列（如 `title`, `priority` 等）
- `system: false` 的字段 → 值写入 `kanban_tasks.custom_fields` JSON 对象中，key 为字段的 `key`
- 新增自定义字段时 `key` 创建后不可修改（`label` 可改），避免旧数据丢失

### 1.5 数据库索引

```sql
-- 看板加载：按 folder + sprint + column 查询任务并按 sort_order 排序
CREATE INDEX idx_kt_board ON kanban_tasks (user_id, folder_id, sprint_id, column_id, sort_order);

-- 列排序：按 folder 查询列并按 sort_order 排序
CREATE INDEX idx_kc_folder ON kanban_columns (user_id, folder_id, sort_order);

-- Sprint 筛选：按 folder 查询 sprint
CREATE INDEX idx_sp_folder ON sprints (user_id, folder_id, status);
```

---

## 2. API 设计

### 2.1 KanbanTask CRUD（新路由 `/api/v1/kanban/tasks`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/kanban/tasks?folder_id=&sprint_id=&column_id=` | 列表（看板加载） |
| GET | `/api/v1/kanban/tasks/:id` | 单任务详情 |
| POST | `/api/v1/kanban/tasks` | 创建（按 template config 校验） |
| PUT | `/api/v1/kanban/tasks/:id` | 更新（校验同上） |
| DELETE | `/api/v1/kanban/tasks/:id` | 删除 |
| PUT | `/api/v1/kanban/tasks/:id/move` | 移动（换列/sprint，含容量检查） |

### 2.2 创建/更新请求体

```json
{
  "folder_id": 1,
  "sprint_id": 2,
  "column_id": 3,
  "title": "实现用户登录",
  "version": "v2.1.0",
  "task_type": "feat",
  "priority": "P1",
  "requirement_desc": "支持邮箱+密码登录",
  "technical_desc": "使用 JWT token",
  "acceptance_criteria": "登录成功返回 token",
  "custom_fields": {
    "story_point": "5",
    "module": "认证"
  }
}
```

### 2.3 后端校验流程

创建/更新 KanbanTask 时执行以下校验链：

1. **加载配置**: 从 `folder.kanban_config` 读取字段定义
2. **逐字段校验**（遍历 `fields[]` 数组）:
   - `required=true` → 值不能为空
   - `type=select` → 值必须在 `options` 数组内
   - `type=number` → 值必须是合法数字
   - `type=date` → 值必须是合法日期
3. **写入路由**:
   - `system=true` → 值映射到对应真实列
   - `system=false` → 值写入 `custom_fields` JSON
4. **归属校验**:
   - `column_id` 必须属于当前 `folder_id`
   - `sprint_id` 必须属于当前 `folder_id`（为空则不校验）
5. **容量校验**:
   - 目标列的当前任务数 < `max_task_count`（如果设置了上限）

### 2.4 模板配置 API

复用现有 Folder 路由：

- `PUT /api/v1/folders/:id` — 更新文件夹时传入 `kanban_config`
- `GET /api/v1/folders` / `GET /api/v1/folders/:id` — 返回中附带 `kanban_config`

---

## 3. 前端 UI 设计

### 3.1 KanbanCard（改造）

按 `folder.kanban_config.fields` 动态生成卡片内容：

```
┌──────────────────────────────────┐
│ [P1] [feature] [v2.1.0]         │ ← chip row: show_on_card=true 的短字段
│                                  │
│ 实现用户登录功能                  │ ← title (最多 2 行，溢出省略)
│                                  │
│ [后端] [认证]                    │ ← tags
│                                  │
│ 📅 06/15  📋 2/5  🏷 当前 Sprint │ ← meta
│                                  │
│ ┌──────────────────────────────┐ │
│ │           → 确认              │ │ ← 仅「确认」按钮（移到下一列）
│ └──────────────────────────────┘ │
│           (点击卡片打开抽屉)       │
└──────────────────────────────────┘
```

- **芯片行**: 仅显示 `show_on_card=true` 的简短字段（优先级、任务类型、版本）
- **操作**: 卡片仅保留「确认」按钮（流转到下一列）
- **Back 功能**: 移至详情抽屉的「状态列切换」区域

### 3.2 KanbanTaskDrawer（改造）

任务详情显示所有 `show_in_detail=true` 的字段，并按 `order` 排序：

- **基础信息区**: 所有字段值按顺序展示
- **状态列切换**: 显示所有非归档列按钮，可点击切换（含容量检查），实现 Back 功能
- **验收标准**: 逐项列出（带 checkbox）
- **说明区**: 需求说明、技术说明
- **流转日志**: 任务操作历史

### 3.3 KanbanSettingsDialog（新建）

统一设置面板，位于看板页面右上角 ⚙️ 按钮，含 4 个标签页：

| 标签页 | 内容 |
|--------|------|
| **列配置** | 列列表（拖拽排序手柄、名称、容量、任务数），编辑/删除按钮，新增列按钮 |
| **任务卡模板** | 字段列表（类型标签、必填标记、系统字段标记），自定义字段增删改，恢复默认模板按钮 |
| **Sprint 管理** | Sprint 列表（名称、状态徽章、目标、日期范围），编辑/删除按钮，新建 Sprint 按钮 |
| **偏好设置** | 复选框：显示归档任务、允许拖拽移动、记住最后筛选状态；下拉：默认新任务列 |

### 3.4 Sprint 编辑入口

- **入口**: SprintTabs 右侧 ⚙️ 按钮 → 打开 KanbanSettingsDialog → Sprint 管理标签页
- **去掉**: 右键菜单编辑 Sprint 的方式
- **新建 Sprint**: SprintTabs 右侧 ➕ 按钮 → 打开 Sprint 编辑弹窗

### 3.5 新建/编辑任务表单（TaskDialog 改造）

看板模式下，根据 `folder.kanban_config.fields` 动态渲染表单：

- `required=true` → 标签旁显示红色 `*` 标记
- `type=text` → `<input type="text">`
- `type=textarea` → `<textarea>`
- `type=select` → `<select>`，选项来自 `options` 数组
- `type=number` → `<input type="number">`
- `type=date` → `<input type="date">`

### 3.6 FolderDialog（改造）

保持简洁，不因 mode=kanban 而增加额外选项：
- mode 切换按钮文字变化：「Todo 列表」→「Kanban 看板」
- 保存按钮文字变化：「创建文件夹」→「创建 Kanban 文件夹」
- 默认列和后端自动创建，无需用户选择

---

## 4. 组件变更清单

### 新建文件

| 文件 | 说明 |
|------|------|
| `backend/src/models/kanban_task.py` | KanbanTask SQLAlchemy 模型 |
| `backend/src/schemas/kanban_task.py` | KanbanTask Pydantic 请求/响应 schemas |
| `backend/src/routers/kanban_task.py` | KanbanTask CRUD 路由 |
| `frontend/src/lib/api/kanbanTask.ts` | KanbanTask CRUD API 调用函数 |
| `frontend/src/components/todo/kanban/KanbanSettingsDialog.tsx` | 4 标签页统一设置面板 |
| `frontend/src/components/todo/kanban/FieldTemplateEditor.tsx` | 字段模板编辑组件 |
| `frontend/src/components/todo/kanban/ColumnListEditor.tsx` | 列管理列表组件 |
| `frontend/src/components/todo/kanban/SprintListEditor.tsx` | Sprint 管理列表组件 |
| `frontend/src/components/todo/kanban/KanbanPreferences.tsx` | 偏好设置面板组件 |
| `frontend/src/components/todo/kanban/CustomFieldDialog.tsx` | 自定义字段添加/编辑弹窗 |

### 改造文件

| 文件 | 变更 |
|------|------|
| `backend/src/models/todo.py` | Folder 模型增加 `kanban_config` 字段 |
| `backend/src/schemas/todo.py` | FolderCreate/Update/Out 增加 `kanban_config` |
| `backend/src/routers/folder.py` | 创建 kanban 文件夹时自动初始化默认 7 列 + 默认 Sprint |
| `backend/src/database.py` | 添加新表和新索引的迁移 |
| `frontend/src/lib/types.ts` | 新增 KanbanTask、KanbanConfig、FieldDef 等类型 |
| `frontend/src/components/todo/kanban/KanbanCard.tsx` | 按模板动态渲染，去掉 Back 按钮 |
| `frontend/src/components/todo/kanban/KanbanTaskDrawer.tsx` | 显示所有模板字段，状态列切换 |
| `frontend/src/components/todo/kanban/SprintTabs.tsx` | 增加 ⚙️ 和 ➕ 按钮，去掉右键菜单 |
| `frontend/src/components/todo/FolderDialog.tsx` | mode=kanban 保持简洁 |
| `frontend/src/components/todo/TaskDialog.tsx` | 看板模式动态表单 |
| `frontend/src/app/todo/page.tsx` | 接入 KanbanSettingsDialog |
| `frontend/src/components/todo/kanban/index.ts` | 导出新组件 |

---

## 5. 验证方案

1. **后端测试**:
   - 针对 KanbanTask CRUD 写 pytest 测试（`backend/tests/test_kanban_task.py`）
   - 覆盖字段校验：required、select options、type 验证
   - 覆盖归属校验：column_id/sprint_id 跨文件夹拒绝
   - 覆盖容量校验：达到上限时拒绝

2. **前端验证**:
   - 创建 kanban 文件夹 → 进入看板 → 新建任务 → 确认移动到下一列 → 打开详情查看所有字段
   - 打开 Kanban 设置 → 编辑列/模板/Sprint/偏好 → 关闭后重新打开确认保存
   - 切换不同 kanban 文件夹 → 验证模板各自独立

3. **数据库验证**:
   - 确认 `kanban_tasks` 表创建成功，所有列正确
   - 确认三组索引创建成功
   - 确认 Folder 表新增 `kanban_config` 列
