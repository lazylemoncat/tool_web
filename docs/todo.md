# Tool Web 任务管理功能文档

## 功能概述

Tool Web 提供完整的任务管理系统和个人记账系统, 支持以下功能:

- **文件夹管理**: 创建嵌套文件夹, 自定义颜色, 拖拽排序, 级联删除
- **文件夹模式**: 文件夹支持 `todo` 和 `kanban` 两种模式, 选择 `kanban` 后进入看板视图并显示侧边栏看板图标
- **任务 CRUD**: 创建/查看/编辑/删除任务, 支持标题、备注、优先级、截止日期
- **子任务**: 任务内嵌套子任务, 可展开/折叠, 显示完成进度
- **优先级**: 三级优先级 (高/中/低), 彩色标签显示
- **搜索筛选**: 按关键词搜索, 按状态/优先级/文件夹/标签筛选
- **拖拽排序**: 基于 dnd-kit 的拖拽重排, 支持移动端触摸
- **移动端滑动**: 左滑显示编辑/删除按钮
- **重复任务**: 基于 RFC 5545 RRULE 的重复规则, 完成时自动生成下一实例
- **标签系统**: 多对多标签, 支持自动补全和即时创建
- **自定义主题**: 用户自定义 CSS/JS 主题, 支持上传/预览/切换
- **自定义按钮**: 主题引擎注入工具栏/侧边栏/任务项操作按钮
- **任务详情弹窗**: 点击任务项右侧 "?" 图标打开只读详情弹窗, 展示任务所有字段 (标题、备注、优先级、截止日期、标签、重复规则等)
- **批量操作**: 进入选择模式后可勾选多个任务, 批量标记完成或删除
- **键盘快捷键**: `N` 键新建任务, `/` 键聚焦搜索栏, `Esc` 关闭弹窗
- **文件夹重命名**: 鼠标悬停文件夹名称触发内联编辑图标, 点击直接修改名称
- **URL 同步筛选**: 所有筛选条件 (文件夹、搜索、优先级、状态、标签) 同步到 URL 查询参数, 页面刷新后筛选条件不丢失
- **搜索增强**: 搜索关键词同时匹配任务标题和备注 (note) 内容
- **删除确认弹窗**: 删除任务和文件夹时显示二次确认对话框, 防止误操作
- **排序规范化**: 拖拽排序或删除任务后自动重算 sort_order, 保持数字连续无间隙

---

## 使用方法

当前 Next.js 前端 `frontend/src/app/(auth)/todo/page.tsx` 已接入后端 Todo API, 支持读取文件夹和任务列表, 按状态/文件夹/关键词筛选, 新建/编辑/删除任务, 以及切换完成状态.

### 1. 文件夹管理

**创建文件夹**: 点击侧边栏底部的 "新建文件夹" 按钮, 输入名称和颜色后回车或点击确认.

**嵌套文件夹**: 创建文件夹时可选择父文件夹. 子文件夹在侧边栏中缩进显示. 支持无限层级嵌套.

**编辑文件夹**: 点击文件夹右侧编辑按钮, 修改名称或颜色.

**删除文件夹**: 点击文件夹右侧删除按钮, 需二次确认. 删除文件夹会级联删除子文件夹和所有任务.

**拖拽排序**: 长按文件夹拖拽手柄 (⠿) 可重新排列顺序.

**颜色标识**: 每个文件夹可设置十六进制颜色 (如 `#4a7c59`), 以彩色圆点显示.

**工作模式**: 创建文件夹时可选择 Todo 列表或 Kanban 看板模式. `kanban` 模式文件夹由后端返回 `mode: "kanban"`, 前端会自动切换到看板视图, 侧边栏文件夹名称右侧显示看板图标.

**Kanban 新建任务**: 在 Kanban 看板第一列点击新增按钮时, 前端打开专用 `KanbanTaskDialog`, 传递当前 `sprint_id` 与目标 `column_id`. 保存后调用 `POST /api/v1/kanban/tasks`, 并按当前 sprint 重新拉取 `kanban_tasks` 与列信息, 新任务会直接显示在第一列.

**Kanban 任务流转**: 看板卡片来自独立 `kanban_tasks` 表. 确认按钮, 拖拽移动, Drawer 中切换列和删除操作分别调用 `/api/v1/kanban/tasks/{id}/move` 与 `/api/v1/kanban/tasks/{id}`, 不再复用普通 `/todos` 接口.

**Kanban 列删除**: 删除列时, 后端会将该列内的独立 `kanban_tasks` 迁移到同一 sprint 中排序最靠前的其他列; 如果没有其他列, 任务的 `column_id` 置空.

**Kanban 动态字段**: 文件夹 `kanban_config.kanban_template.fields` 定义系统字段和自定义字段. 如果文件夹没有持久化模板, 前端会使用默认 Kanban 任务模板. 新建弹窗按模板渲染字段, 使用 `default_value` 初始化表单并做必填校验, 日期字段使用 MUI X `DatePicker` 和共享日期显示格式. 后端按同一模板校验 `custom_fields`, 并保存到 `kanban_tasks.custom_fields`.

### 2. 创建任务

**操作步骤**:
1. 点击工具栏 "新建任务" 按钮或右侧的 "+" 按钮
2. 在弹窗中填写:
   - **任务名称** (必填, 1-500 字符)
   - **文件夹** (可选, 下拉选择)
   - **优先级** (高/中/低, 默认中)
   - **截止日期** (可选, 使用 MUI X DatePicker 日期选择器)
   - **备注** (可选, 自由文本)
   - **标签** (可选, 输入搜索或创建新标签)
   - **重复规则** (可选, 启用后选择预设或输入自定义 RRULE)
3. 点击 "创建" 提交

**批量操作**: 支持一次添加多条重复规则 (如工作日 + 每月 15 号).

### 3. 查看与管理任务

**任务列表**: 主区域显示当前筛选条件下的任务, 按拖拽排序后的顺序排列.

**完成切换**: 点击任务左侧圆形复选框标记完成/未完成. 已完成任务标题添加删除线.

**展开子任务**: 有子任务的任务项显示 `▸ 2/5` 或 `▾ 2/5` 切换按钮, 点击展开/折叠子任务列表.

**编辑任务**: 点击任务右侧编辑按钮或左滑后点击编辑, 弹出编辑弹窗.

**删除任务**: 点击任务右侧删除按钮或左滑后点击删除. 删除父任务会级联删除子任务.

**重复任务**: 标记重复任务为完成时, 自动在下一个到期日创建新实例. 新实例保留相同的标题、文件夹、优先级、标签和重复规则.

### 4. 搜索与筛选

**关键词搜索**: 顶部搜索栏输入关键词, 300ms 防抖后自动搜索任务标题和备注内容.

**状态筛选**: 全部 / 未完成 / 已完成 三个切换按钮.

**优先级筛选**: 全部 / 高 / 中 / 低 四个切换按钮.

**文件夹筛选**: 点击侧边栏文件夹名称, 仅显示该文件夹下的任务. 页面标题显示当前文件夹名称 (含嵌套子文件夹). 点击 "全部" 清除筛选.

**标签筛选**: 工具栏下拉菜单按标签筛选. 选择文件夹后标签列表自动限定为该文件夹下任务拥有的标签.

**标签筛选类型**: 前端 `TaskToolbar` 的 MUI `Select` 使用字符串作为控件值, 提交筛选变化时再转换为后端需要的数字 `tag_id`, 避免混用空字符串和数字造成生产构建类型检查失败.

**组合筛选**: 所有筛选条件可同时使用, 切换任一条件自动重新查询.

**默认筛选**: 在设置页面可配置默认状态筛选 (全部/未完成/已完成). 配置后页面加载时自动应用该默认筛选, URL 参数优先于默认设置.

### 5. 拖拽排序

**桌面端**: 鼠标按住任务拖拽手柄 (⠿) 拖动.

**移动端**: 触摸任务拖拽手柄并保持 200ms, 开始拖动.

**子任务排序**: 展开子任务后同样支持拖拽排序.

**文件夹排序**: 侧边栏文件夹同样支持拖拽排序.

**排序持久化**: 排序结果即时同步到服务端.

### 6. 移动端手势

**左滑操作**: 在移动端触摸任务项并向左滑动, 露出 "编辑" 和 "删除" 按钮.

**触发距离**: 滑动超过 104px 后松手即触发, 不足则自动回弹.

### 7. 标签管理

**添加标签**: 在任务编辑弹窗的标签输入框中输入名称, 从下拉建议中选择已有标签或创建新标签.

**标签显示**: 已添加的标签以彩色徽章显示在任务项中.

**自动补全**: 输入时实时搜索已有标签, 支持键盘上下选择、回车确认.

**删除标签**: 点击标签上的 × 移除该标签.

### 8. 重复任务

**启用重复**: 在任务编辑弹窗中勾选 "启用重复", 选择预设规则或输入自定义 RRULE.

**预设规则**:
| 预设 | RRULE 字符串 |
|------|------------|
| 每天 | `FREQ=DAILY` |
| 每周 | `FREQ=WEEKLY` |
| 工作日 | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` |
| 每月 | `FREQ=MONTHLY` |

**自定义规则**: 选择 "自定义" 后手动输入 RFC 5545 格式的 RRULE 字符串.

**多规则**: 一个任务可添加多个重复规则 (如 "每个工作日 + 每月 1 号").

**自动生成**: 完成重复任务时自动创建下一个实例, 截止日期为下一个匹配日期.

**重复标识**: 设置了重复规则的任务显示 🔁 图标.

### 9. 任务详情弹窗

**打开方式**: 点击任务项右侧的 "?" 图标按钮, 弹出只读详情弹窗.

**展示内容**:
- 任务标题
- 所属文件夹
- 优先级 (高/中/低)
- 截止日期 (如有)
- 备注内容 (note 字段完整文本)
- 标签列表
- 重复规则 (如有, 显示规则描述)
- 创建时间和更新时间

**关闭方式**: 点击关闭按钮、点击遮罩层或按 `Esc` 键.

### 10. 批量操作

**进入选择模式**: 点击工具栏 "选择" 按钮进入批量选择模式, 每个任务项左侧出现复选框.

**选择任务**: 点击复选框勾选/取消勾选单个任务. 顶部显示已选数量.

**批量完成**: 选中任务后点击 "标记完成" 按钮, 将所有已选任务标记为已完成.

**批量删除**: 选中任务后点击 "删除" 按钮, 确认后批量删除所有已选任务 (含子任务).

**退出选择模式**: 点击 "取消" 按钮或按 `Esc` 键退出.

### 11. 键盘快捷键

| 快捷键 | 作用 |
|--------|------|
| `N` | 打开新建任务弹窗 |
| `/` | 聚焦搜索栏 |
| `Esc` | 关闭当前弹窗 / 退出选择模式 / 清除搜索 |

### 12. 文件夹重命名与删除确认

**文件夹重命名**: 鼠标悬停在文件夹名称上时, 名称右侧出现编辑图标 (✎). 点击图标进入内联编辑模式, 修改名称后回车保存, 按 `Esc` 或点击外部取消.

**删除确认**: 删除文件夹时弹出确认对话框, 显示文件夹名称及其包含的子文件夹和任务数量, 需要用户明确确认后执行级联删除.

**删除任务确认**: 删除任务时弹出确认对话框, 显示任务标题. 如任务包含子任务, 提示将一并删除所有子任务.

### 13. 自定义主题

**切换主题**: 设置页面可选浅色/深色/跟随系统.

**下载模板**: 点击 "下载默认模板" 导出当前 CSS 变量为 JSON 文件.

**上传主题**: 修改模板后上传 JSON 文件, 即时预览并保存.

**管理主题**: 在 "我的主题" 列表中可应用/删除已保存的自定义主题.

**自定义按钮**: 主题 JSON 中的 `buttons` 字段可配置工具栏/侧边栏/任务项操作按钮, 支持执行 API 调用、页面导航、筛选切换等操作.

---

## 数据库字段

### folders 表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `Integer` | PRIMARY KEY, AUTOINCREMENT | 文件夹唯一 ID |
| `user_id` | `Integer` | FOREIGN KEY → users.id, NOT NULL, INDEXED | 所属用户 |
| `parent_id` | `Integer` | FOREIGN KEY → folders.id, NULLABLE | 父文件夹 (嵌套) |
| `name` | `String(50)` | NOT NULL | 文件夹名称 |
| `color` | `String(7)` | DEFAULT `#6366f1` | 十六进制颜色 |
| `mode` | `String(10)` | DEFAULT `todo` | 文件夹工作模式, `todo` 或 `kanban` |
| `kanban_config` | `JSON/Text` | NULLABLE | Kanban 模板配置, 包含 `kanban_template.fields` |
| `sort_order` | `Integer` | DEFAULT 0 | 排序顺序 |
| `created_at` | `DateTime` | DEFAULT utcnow | 创建时间 |
| `updated_at` | `DateTime` | DEFAULT utcnow, ON UPDATE utcnow | 更新时间 |

**关联关系**:
- `user` → `User.folders` (多对一)
- `parent` → `Folder.children` (自引用, 级联删除)
- `children` → `Folder` (自引用, 级联删除)
- `todos` → `Todo` (一对多, 级联删除)
- `sprints` → `Sprint` (一对多, 级联删除)
- `kanban_tasks` → `KanbanTask` (一对多, 级联删除)

### todos 表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `Integer` | PRIMARY KEY, AUTOINCREMENT | 任务唯一 ID |
| `user_id` | `Integer` | FOREIGN KEY → users.id, NOT NULL, INDEXED | 所属用户 |
| `folder_id` | `Integer` | FOREIGN KEY → folders.id, NULLABLE | 所属文件夹 |
| `parent_id` | `Integer` | FOREIGN KEY → todos.id, NULLABLE | 父任务 (子任务) |
| `title` | `String(500)` | NOT NULL | 任务标题 |
| `note` | `Text` | NULLABLE | 备注 (无长度限制) |
| `priority` | `Integer` | DEFAULT 2 | 优先级: 1=高, 2=中, 3=低 |
| `due_date` | `Date` | NULLABLE | 截止日期 (无时间组件) |
| `is_completed` | `Boolean` | DEFAULT False | 是否已完成 |
| `completed_at` | `DateTime` | NULLABLE | 完成时间戳 |
| `sort_order` | `Integer` | DEFAULT 0 | 排序顺序 |
| `created_at` | `DateTime` | DEFAULT utcnow | 创建时间 |
| `updated_at` | `DateTime` | DEFAULT utcnow, ON UPDATE utcnow | 更新时间 |

**关联关系**:
- `user` → `User.todos` (多对一)
- `folder` → `Folder.todos` (多对一)
- `parent` → `Todo.children` (自引用, 级联删除)
- `children` → `Todo` (自引用, 级联删除)
- `tags` → `Tag` (多对多, 通过 `todo_tags` 关联表)
- `recurrence_rules` → `RecurrenceRule` (一对多, 级联删除)

### kanban_tasks 表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `Integer` | PRIMARY KEY, AUTOINCREMENT | Kanban 任务唯一 ID |
| `user_id` | `Integer` | FOREIGN KEY → auth_users.id, NOT NULL, INDEXED | 所属用户 |
| `folder_id` | `Integer` | FOREIGN KEY → folders.id, NOT NULL, INDEXED | 所属 Kanban 文件夹 |
| `sprint_id` | `Integer` | FOREIGN KEY → sprints.id, NULLABLE | 所属 Sprint |
| `column_id` | `Integer` | FOREIGN KEY → kanban_columns.id, NULLABLE | 所属看板列 |
| `title` | `String(500)` | NOT NULL | 任务标题 |
| `version` | `String(100)` | NULLABLE | 版本字段 |
| `task_type` | `String(50)` | NULLABLE | 类型字段 |
| `priority` | `String(10)` | NULLABLE | 优先级, 如 `P0`/`P1`/`P2`/`P3` |
| `requirement_desc` | `Text` | NULLABLE | 需求描述 |
| `technical_desc` | `Text` | NULLABLE | 技术描述 |
| `acceptance_criteria` | `Text` | NULLABLE | 验收标准 |
| `custom_fields` | `JSON` | NULLABLE | 模板定义的自定义字段值 |
| `sort_order` | `Integer` | DEFAULT 0 | 列内排序 |
| `created_at` | `DateTime` | DEFAULT utcnow | 创建时间 |
| `updated_at` | `DateTime` | DEFAULT utcnow, ON UPDATE utcnow | 更新时间 |

**约束说明**: 后端创建, 更新和移动 Kanban 任务时会校验 `folder_id`, `sprint_id`, `column_id` 归属一致, 并检查目标列 `capacity`.

### recurrence_rules 表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `Integer` | PRIMARY KEY, AUTOINCREMENT | 规则唯一 ID |
| `todo_id` | `Integer` | FOREIGN KEY → todos.id, NOT NULL, INDEXED | 所属任务 |
| `rrule_string` | `String(500)` | NOT NULL | RFC 5545 RRULE 字符串 |
| `created_at` | `DateTime` | DEFAULT utcnow | 创建时间 |

### tags 表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `Integer` | PRIMARY KEY, AUTOINCREMENT | 标签唯一 ID |
| `user_id` | `Integer` | FOREIGN KEY → users.id, NOT NULL | 所属用户 |
| `name` | `String(50)` | NOT NULL | 标签名称 |

### todo_tags 关联表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `todo_id` | `Integer` | FOREIGN KEY → todos.id, CASCADE, PRIMARY KEY | 任务 ID |
| `tag_id` | `Integer` | FOREIGN KEY → tags.id, CASCADE, PRIMARY KEY | 标签 ID |

### user_themes 表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `Integer` | PRIMARY KEY, AUTOINCREMENT | 主题唯一 ID |
| `user_id` | `Integer` | FOREIGN KEY → users.id, CASCADE, NOT NULL | 所属用户 |
| `name` | `String(100)` | NOT NULL | 主题名称 |
| `config_json` | `Text` | NOT NULL | 主题配置 JSON |
| `created_at` | `DateTime` | DEFAULT utcnow | 创建时间 |
| `updated_at` | `DateTime` | DEFAULT utcnow, ON UPDATE utcnow | 更新时间 |

---

## 后端文件地址

| 文件 | 作用 |
|------|------|
| `backend/src/routers/todo.py` | 任务 API 路由: CRUD, toggle 完成, 重排, 重复逻辑, 批量操作 (bulk), 分页响应结构, 所有权校验 |
| `backend/src/routers/folder.py` | 文件夹 API 路由: CRUD, 重排 |
| `backend/src/routers/kanban_task.py` | KanbanTask API 路由: 独立看板任务 CRUD, 模板字段校验, 容量检查, 移动列 |
| `backend/src/routers/kanban_column.py` | Kanban 列 API 路由: 列 CRUD, 重排, 基于 `kanban_tasks` 的列任务数统计 |
| `backend/src/routers/tag.py` | 标签 API 路由: 列表 (支持 search 和 folder_id)/创建 (幂等)/删除 |
| `backend/src/routers/theme.py` | 主题 API 路由: CRUD |
| `backend/src/models/todo.py` | SQLAlchemy ORM 模型: `Todo`, `Folder`, `RecurrenceRule`, `Base` |
| `backend/src/models/kanban_task.py` | SQLAlchemy ORM 模型: 独立 `KanbanTask` 表和 Folder/Column 关系 |
| `backend/src/models/kanban.py` | SQLAlchemy ORM 模型: `Sprint`, `KanbanColumn` |
| `backend/src/models/tag.py` | SQLAlchemy ORM 模型: `Tag`, `todo_tags` 关联表 |
| `backend/src/models/theme.py` | SQLAlchemy ORM 模型: `UserTheme` |
| `backend/src/schemas/todo.py` | Pydantic 模型: `TodoCreate/Update/Out`, `FolderCreate/Update/Out`, `RecurrenceRuleOut` 等 |
| `backend/src/schemas/kanban_task.py` | Pydantic 模型: `KanbanTaskCreate/Update/Out`, `MoveKanbanTaskRequest` |
| `backend/src/schemas/kanban.py` | Pydantic 模型: `Sprint*`, `KanbanColumn*` |
| `backend/src/schemas/tag.py` | Pydantic 模型: `TagCreate`, `TagOut` |
| `backend/src/schemas/theme.py` | Pydantic 模型: `ThemeCreate/Update/Out/FullOut` |
| `backend/src/database.py` | 数据库连接: 表迁移, 自动创建新表 (`recurrence_rules`, `todo_tags`, `tags`, `user_themes`), 并补齐旧库 `folders.mode` 字段 |

### 任务 API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/v1/todos` | Cookie/Token | 获取根级任务列表 (分页响应 `{items, total, skip, limit}`), 支持筛选/搜索/分页 |
| `POST` | `/api/v1/todos` | Cookie/Token | 创建任务 (含标签和重复规则) |
| `PUT` | `/api/v1/todos/{id}` | Cookie/Token | 更新任务 (部分更新) |
| `DELETE` | `/api/v1/todos/{id}` | Cookie/Token | 删除任务 (级联删除子任务) |
| `PATCH` | `/api/v1/todos/{id}/toggle` | Cookie/Token | 切换完成状态 (触发重复逻辑) |
| `PATCH` | `/api/v1/todos/{id}/reorder` | Cookie/Token | 设置单个任务的 sort_order |
| `POST` | `/api/v1/todos/reorder` | Cookie/Token | 批量重排任务 |
| `POST` | `/api/v1/todos/bulk` | Cookie/Token | 批量操作: 批量完成/删除多个任务 |

**GET /api/v1/todos 查询参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `folder_id` | int | 按文件夹筛选 |
| `search` | string | 按标题模糊搜索 (LIKE %search%) |
| `priority` | int | 按优先级筛选 (1/2/3) |
| `status` | string | `active` 或 `completed` |
| `tag_id` | int | 按标签筛选 |
| `sprint_id` | int | 按 Kanban Sprint 筛选 |
| `column_id` | int | 按 Kanban 列筛选 |
| `skip` | int | 分页偏移 (默认 0, ≥0) |
| `limit` | int | 每页数量 (默认 100, 1-500) |

### KanbanTask API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/v1/kanban/tasks?folder_id=&sprint_id=&column_id=` | Cookie/Token | 获取独立 Kanban 任务列表 |
| `POST` | `/api/v1/kanban/tasks` | Cookie/Token | 创建 Kanban 任务, 按 `kanban_config` 模板校验系统字段和 `custom_fields` |
| `PUT` | `/api/v1/kanban/tasks/{id}` | Cookie/Token | 更新 Kanban 任务和列/ Sprint 位置 |
| `DELETE` | `/api/v1/kanban/tasks/{id}` | Cookie/Token | 删除 Kanban 任务 |
| `PUT` | `/api/v1/kanban/tasks/{id}/move` | Cookie/Token | 移动 Kanban 任务到目标列, 校验目标列容量和归属 |

**POST /api/v1/todos 请求体**:
```json
{
  "folder_id": 1,
  "sprint_id": 1,
  "column_id": 1,
  "parent_id": null,
  "title": "买猫粮",
  "note": "皇家猫粮",
  "priority": 1,
  "due_date": "2026-05-20",
  "sort_order": 0,
  "tag_ids": [1, 2],
  "recurrence_rules": ["FREQ=WEEKLY;BYDAY=MO,WE,FR"]
}
```

**响应体 (TodoOut)**:
```json
{
  "code": 0,
  "data": {
    "id": 42,
    "folder_id": 1,
    "sprint_id": 1,
    "column_id": 1,
    "parent_id": null,
    "title": "买猫粮",
    "note": "皇家猫粮",
    "priority": 1,
    "due_date": "2026-05-20",
    "is_completed": false,
    "completed_at": null,
    "sort_order": 0,
    "created_at": "2026-05-17T10:30:00Z",
    "updated_at": "2026-05-17T10:30:00Z",
    "children": [],
    "tags": [{"id": 1, "name": "购物"}, {"id": 2, "name": "宠物"}],
    "recurrence_rules": [{"id": 1, "rrule_string": "FREQ=WEEKLY;BYDAY=MO,WE,FR"}]
  },
  "message": "ok"
}
```

### 文件夹 API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/v1/folders` | Cookie/Token | 获取文件夹列表 (递归嵌套) |
| `POST` | `/api/v1/folders` | Cookie/Token | 创建文件夹 |
| `PUT` | `/api/v1/folders/{id}` | Cookie/Token | 更新文件夹 (部分更新) |
| `DELETE` | `/api/v1/folders/{id}` | Cookie/Token | 删除文件夹 (级联删除子文件夹和任务) |
| `POST` | `/api/v1/folders/reorder` | Cookie/Token | 批量重排文件夹 |

**GET /api/v1/folders 查询参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `parent_id` | int | 按父文件夹筛选 (省略则只返回根级) |
| `skip` | int | 分页偏移 (默认 0) |
| `limit` | int | 每页数量 (默认 100, 1-500) |

**FolderOut 包含**:
- `mode` 字段, 用于前端决定进入 Todo 列表或 Kanban 看板模式
- 嵌套的 `children` 字段 (递归 FolderOut 数组)
- 计算字段 `todo_count` (该文件夹下根级任务数量, 不含子任务)

### 标签 API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/v1/tags` | Cookie/Token | 获取用户标签列表, 支持 `?search=` 搜索, `?folder_id=` 限定文件夹 |
| `POST` | `/api/v1/tags` | Cookie/Token | 创建标签 (同名标签幂等返回已有) |
| `DELETE` | `/api/v1/tags/{id}` | Cookie/Token | 删除标签 |

### 主题 API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/v1/themes` | Cookie/Token | 获取用户主题列表 (不含 config_json) |
| `POST` | `/api/v1/themes` | Cookie/Token | 创建新主题 |
| `GET` | `/api/v1/themes/{id}` | Cookie/Token | 获取单个主题 (含 config_json) |
| `PUT` | `/api/v1/themes/{id}` | Cookie/Token | 更新主题 |
| `DELETE` | `/api/v1/themes/{id}` | Cookie/Token | 删除主题 |

---

## 前端文件地址

| 文件 | 作用 |
|------|------|
| `frontend/src/app/todo/page.tsx` | Next.js Todo 页面: 根据文件夹 `mode` 切换普通 Todo 列表和 Kanban 看板, 管理 Kanban sprint/column/task 状态和刷新 |
| `frontend/src/lib/api/kanbanTask.ts` | KanbanTask API 封装: 列表, 创建, 更新, 删除, 移动 |
| `frontend/src/components/todo/kanban/KanbanTaskDialog.tsx` | Kanban 新建任务弹窗: 根据模板渲染系统字段和自定义字段, 使用 MUI X `DatePicker` 处理日期字段 |
| `frontend/src/components/todo/kanban/templateDefaults.ts` | Kanban 默认任务模板: 在文件夹未持久化模板时提供共享字段回退 |
| `frontend/src/components/todo/kanban/FieldTemplateEditor.tsx` | Kanban 任务卡模板编辑器: 编辑系统字段显示顺序和自定义字段 |
| `frontend/src/components/todo/kanban/KanbanBoard.tsx` | Kanban 看板容器: 按列渲染独立 `KanbanTaskOut` 卡片并处理拖拽落点 |
| `frontend/src/components/todo/kanban/KanbanColumn.tsx` | Kanban 列组件: 显示列容量/任务数, 第一列提供新建入口 |
| `frontend/src/components/todo/kanban/KanbanCard.tsx` | Kanban 卡片组件: 展示模板配置的卡片字段和确认流转按钮 |
| `frontend/src/components/todo/kanban/KanbanTaskDrawer.tsx` | Kanban 任务详情 Drawer: 展示模板详情字段, 支持切换列和删除 |
| `frontend/src/pages/TodoPage.tsx` | Todo 页面: 管理筛选状态 (含默认筛选回退), URL 同步筛选参数, 递归文件夹查找, 标签按文件夹过滤, 键盘快捷键 (N, /, Esc) |
| `frontend/.umirc.ts` | Umi 路由配置: 注册 `/todo` 页面和其他模块路由 |
| `frontend/src/layouts/index.tsx` | 全局布局: 鉴权守卫, i18n, 主题加载, 顶部栏, 页面级主题上下文 |
| `frontend/src/components/todo/TodoForm.tsx` | 任务创建/编辑弹窗: 文件夹选择, 优先级, 日期, 标签, 重复规则 |
| `frontend/src/components/todo/TodoList.tsx` | 任务列表: dnd-kit 拖拽容器, 渲染 SortableTodoItem, 批量选择模式 |
| `frontend/src/components/todo/TodoItem.tsx` | 任务卡片: 复选框, 标题, 优先级标签, 日期, 标签徽章, 操作按钮, 移动端滑动, 详情触发 ("?" 图标), 删除确认弹窗 |
| `frontend/src/components/todo/SubTaskList.tsx` | 子任务列表: 可折叠, 递归渲染嵌套子任务 |
| `frontend/src/components/todo/TagInput.tsx` | 标签输入组件: 芯片式多选, 自动补全, 即时创建 |
| `frontend/src/components/todo/TaskDetail.tsx` | 任务详情弹窗: 只读展示任务所有字段信息 |
| `frontend/src/components/layout/Sidebar.tsx` | 侧边栏: 文件夹列表, dnd-kit 拖拽排序, 嵌套文件夹, 新建/编辑/删除 |
| `frontend/src/components/layout/Header.tsx` | 移动端顶栏: 汉堡菜单, 页面标题 |
| `frontend/src/components/common/PriorityTag.tsx` | 优先级标签: 高/中/低, 彩色显示 |
| `frontend/src/components/common/SearchBar.tsx` | 搜索栏: 300ms 防抖输入 |
| `frontend/src/components/common/CustomButtons.tsx` | 自定义按钮渲染: 主题引擎注入的操作按钮 |
| `frontend/src/components/settings/ThemeManager.tsx` | 主题管理: 切换/下载模板/上传/预览/删除 |
| `frontend/src/components/settings/SettingsPage.tsx` | 设置页面: 默认筛选/主题/语言/账户管理 |
| `frontend/src/hooks/useTodos.ts` | 任务数据 hook: CRUD, toggle (乐观更新), reorder (乐观更新) |
| `frontend/src/hooks/useFolders.ts` | 文件夹数据 hook: CRUD, reorder |
| `frontend/src/hooks/useTags.ts` | 标签数据 hook: 列表 (支持 folder_id 过滤)/创建/删除 |
| `frontend/src/hooks/useThemes.ts` | 主题数据 hook: CRUD |
| `frontend/src/themeEngine.ts` | 主题引擎: CSS 注入, 自定义按钮动作执行 |
| `frontend/src/theme.ts` | 基础主题: 亮/暗切换, CSS 变量导出 |
| `frontend/src/api/client.ts` | Axios 实例: cookie 认证, 自动刷新, 响应解包 |
| `frontend/src/styles/index.css` | 全局样式: 所有 Todo/Folder/Tag 组件 CSS 类 |
| `frontend/src/locales/zh.json` | 中文翻译: `todo.*`, `sidebar.*`, `priority.*`, `tag.*`, `date.*` 等键 |
| `frontend/src/locales/en.json` | 英文翻译: 同上 |

### 前端数据流

```
TodoApp (状态中心)
  ├── filters: { folder_id, search, priority, status, tag_id }
  │     ↓ 变化时触发
  ├── useTodos(filters)
  │     ├── GET /todos?folder_id=&search=&priority=&status=&tag_id=
  │     ├── POST /todos (create)
  │     ├── PUT /todos/:id (update)
  │     ├── DELETE /todos/:id
  │     ├── PATCH /todos/:id/toggle (乐观更新)
  │     └── POST /todos/reorder (乐观更新)
  │
  ├── useFolders()
  │     ├── GET /folders
  │     ├── POST /folders (create)
  │     ├── PUT /folders/:id (update)
  │     ├── DELETE /folders/:id
  │     └── POST /folders/reorder
  │
  └── useTags()
        ├── GET /tags?search=&folder_id=
        ├── POST /tags (create)
        └── DELETE /tags/:id

渲染树:
  Sidebar ← 文件夹列表 + 选择
  Header ← 移动端标题
  Toolbar ← 搜索 + 筛选 + 新建按钮
  TodoList ← 根级任务 (dnd-kit sortable)
    └── TodoItem ← 任务卡片
          └── SubTaskList ← 子任务 (dnd-kit sortable)
                └── TodoItem ← 递归渲染
  TodoForm (modal) ← 创建/编辑任务弹窗
    └── TagInput ← 标签自动补全
```

### 乐观更新机制

**Toggle 完成**: 本地状态立即切换 `is_completed`, 同步 PATCH 请求. 失败时完整刷新列表回滚.

**拖拽排序**: 本地数组立即按新顺序排列, 同步 POST `/todos/reorder`. 失败时完整刷新列表回滚.

**其他操作**: 非乐观 — 等待服务端响应后 `fetchTodos()` / `fetchFolders()` 完整刷新.

---

## 重复任务流程序列

```
用户标记重复任务为完成
  → PATCH /api/v1/todos/{id}/toggle
    → 后端检查: is_completed 从 false → true ?
    → 后端检查: todo.recurrence_rules 非空 ?
    → 解析每个 RRULE 字符串 (dateutil rrulestr)
    → 计算下一个匹配日期 (rr.after(today))
    → 取最早的下一个日期 (min(next_dates))
    → 创建新 Todo (复制标题/文件夹/优先级/备注/标签/重复规则)
    → 设置新 Todo.due_date = 下一个匹配日期
    → 原 Todo 保持已完成状态
  → 返回原 Todo 的更新后状态
  → 前端刷新任务列表 (新实例出现在列表中)
```

**安全限制**: 如果最近的下一个匹配日期超过 90 天, 不会生成新实例.

---

## 拖拽排序实现

**库**: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`

**传感器配置**:
- 指针 (鼠标): `PointerSensor`, 激活约束 `distance: 5` (拖动 5px 后触发)
- 触摸: `TouchSensor`, 激活约束 `delay: 200ms, tolerance: 5` (长按 200ms 后触发)

**排序范围**:
- 根级任务列表 (TodoList)
- 子任务列表 (SubTaskList, 仅在父任务展开时)
- 文件夹列表 (Sidebar)

**排序策略**: `verticalListSortingStrategy` (垂直列表). 每个嵌套层级的子文件夹独立支持同级拖拽排序, 不跨父级移动.

---

## 移动端适配

**侧边栏**: 移动端默认隐藏, 点击汉堡菜单 (☰) 从左侧滑入, 带半透明遮罩层.

**滑动操作**: 任务项支持左滑显示编辑/删除按钮, 通过手动 touch 事件处理 (`onTouchStart/Move/End`), 位移上限 104px.

**拖拽排序**: 触摸长按 200ms 后激活, 与滑动操作通过 `delay` 和 `tolerance` 区分.

**响应式布局**: 主区域最大宽度 800px, 水平居中. PC 端工具栏单行显示, 移动端 (≤480px) 自动换行.

---

## 记账系统 (Finance)

**概述**: 基于 Finance.md 设计文档实现的个人财务管理系统, 与 Todo 模块共享用户认证和 UI 框架.

**核心模型**: Ledger (账本), Account (账户), Transaction (交易, 含拆单 SplitItem), Category (分类, 树状), Tag (标签), Event (事件), Budget (预算), Attachment (附件), ResourceRelation (关系).

**页面**: `/finance` — Dashboard (资产/收支/预算卡片), Transaction List (筛选/分页), Budget (进度条), Event (聚合统计).

**API 端点** (`/api/v1/finance`): 34 个端点覆盖全部 CRUD + Dashboard 汇总 + Stats 图表数据.

**技术栈**: FastAPI + SQLAlchemy (后端), React + TypeScript + Recharts (前端), 与现有项目完全统一.

**数据库表**: `ledgers`, `accounts`, `finance_categories`, `finance_tags`, `transaction_tags`, `transactions`, `split_items`, `events`, `budgets`, `attachments`, `transaction_attachments`, `resource_relations`.

**相关文件**:
| 文件 | 作用 |
|------|------|
| `Finance.md` | 产品设计文档 |
| `backend/src/models/finance.py` | 数据模型 (10 表 + 2 关联表) |
| `backend/src/schemas/finance.py` | Pydantic schemas |
| `backend/src/routers/finance.py` | API 路由 (34 端点) |
| `frontend/src/hooks/finance/` | Finance 前端数据 hooks |
| `frontend/src/pages/finance/FinanceLayout.tsx` | Finance 主页面容器 |
| `frontend/src/components/finance/` | 组件目录 |

---

## 自定义主题系统

**主题配置结构**:
```json
{
  "global": {
    "--bg-primary": "#faf8f5",
    "--accent": "#4a7c59"
  },
  "pages": {
    "todo": { "--accent": "#e07050" }
  },
  "buttons": [
    {
      "position": "toolbar",
      "label": "一键完成",
      "action": "api",
      "url": "/api/v1/todos/reorder"
    }
  ],
  "scripts": ["console.log('theme loaded')"]
}
```

**应用方式**: `applyThemeConfig()` 在 `<head>` 中注入 `<style>` 标签, 通过 `new Function()` 执行内联脚本.

**按钮位置**: `toolbar` (工具栏), `sidebar` (侧边栏), `todoItem` (任务卡片右侧).

**按钮动作**: `api` (HTTP 调用), `navigate` (页面跳转), `script` (自定义 JS), `toggleFilter` (切换筛选).

# Current Frontend Note

The Todo page now lives at `frontend/src/pages/TodoPage.tsx`. The Umi route is configured in `frontend/.umirc.ts`, while authentication, i18n, theme loading, and the shared app shell live in `frontend/src/layouts/index.tsx`. Older references in historical sections to `frontend/src/App.tsx` mean the pre-Umi app root.

## Backend Type Checking

Todo, folder, recurrence, and tag ORM models in `backend/src/models/todo.py` and `backend/src/models/tag.py` use SQLAlchemy 2 `Mapped` and `mapped_column` annotations. Relationship fields are typed as lists or nullable parent objects so mypy can validate router code without treating instance attributes as `Column` objects.

## Todo Sidebar And Kanban Updates

- Todo sidebar views are user-configurable in `frontend/src/components/layout/TodoSidebar.tsx`. The visible built-in views are saved in `localStorage` under `tool_web.todo.sidebar_views`; users can hide views such as `completed`, add hidden views back, reset, and reorder the visible view list.
- Sidebar view selection is converted to explicit Todo query params in `frontend/src/app/todo/page.tsx`: `completed` forces `status=completed`, `today` forces active tasks with `due_from=due_to=today`, and `upcoming` forces active tasks with `due_from=tomorrow`. Selecting a sidebar view also syncs the toolbar status filter so switching between views such as `completed` and `all` does not reuse a stale status filter.
- Folder drag sorting in the sidebar only works among siblings with the same `parent_id`. The frontend calls `POST /api/v1/folders/reorder` with contiguous `sort_order` values, and the backend rejects reorder requests containing folders from different parent groups.
- Folder creation and subfolder creation use the shared `MarkerPicker` in `frontend/src/components/shared/MarkerPicker.tsx`. Folder API payloads now include `icon_type` (`color` or `emoji`) and `icon_value`; sidebar folder rows render the marker through `MarkerIcon`.
- Todo task drag sorting is handled in `frontend/src/components/todo/TaskList.tsx` and `frontend/src/components/todo/TaskDetail.tsx`. Root tasks and expanded child tasks can only be reordered within the same `parent_id` group, and the page persists the order through `POST /api/v1/todos/reorder`.
- Kanban new task creation no longer exposes a sprint selector. New cards are bound to the currently active sprint and the column from which the create action was opened.
- `KanbanBoard` uses a thicker horizontal scrollbar so users can drag it more easily on wide boards.
- Subfolder creation now exposes the same `todo` / `kanban` mode choice as root folder creation, and the selected mode is sent in the folder create payload.
- `MarkerPicker` renders emoji choices in a fixed-height grid menu instead of a long select dropdown.
- The existing active Sprint goal display is moved directly under the Kanban folder title and enlarged without adding an emphasized color panel.
- Kanban task templates can add fields, delete non-title fields, move field order, and edit type, required, card visibility, and detail visibility settings.
- Kanban task subtasks are edited in the task drawer and stored under `kanban_tasks.custom_fields.__subtasks`.
