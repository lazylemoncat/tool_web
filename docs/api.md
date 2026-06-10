# Tool Web API 文档

Base URL: `/api/v1`

## Recent Todo API Notes

- `GET /api/v1/todos` accepts `due_from` and `due_to` as `YYYY-MM-DD` date query parameters. They filter `Todo.due_date` inclusively and are used by the Todo sidebar `today` and `upcoming` views.
- `POST /api/v1/folders/reorder` accepts `{ "items": [{ "id": 1, "sort_order": 0 }] }`. All folder ids in one request must belong to the same `parent_id`; otherwise the backend returns `400`.

前端通过 Next.js 代理访问 API: 浏览器请求 `/api/v1/*`, Next 根据 `API_PROXY_TARGET` 转发到 FastAPI. 本地默认后端地址为 `http://localhost:8004`, Docker Compose 内部地址为 `http://backend:8000`.

## 统一响应格式

```json
{
  "code": 0,
  "data": { },
  "message": "ok"
}
```

## 健康检查

`GET /api/health`

## 认证

### 检查用户名是否可用
`GET /api/v1/auth/username-availability?username=rex`

响应:
```json
{ "username": "rex", "available": true }
```

该接口无需登录, 注册页在用户名达到 3 个字符后调用, 用于实时提示用户名是否已被使用. 最终注册仍以 `POST /api/v1/auth/register` 的 409 响应作为并发兜底.

### 使用 2FA 重置密码
`POST /api/v1/auth/password/reset`

请求:
```json
{
  "username": "rex",
  "method": "totp",
  "code": "123456",
  "new_password": "newpass123"
}
```

`method` 支持 `"totp"` 和 `"recovery_code"`. 用户必须已启用 MFA; 验证通过后后端更新密码并撤销该用户已有会话. 邮箱重置尚未接入, 因为当前用户模型没有邮箱字段和邮件发送服务.

## 文件夹

### 获取所有文件夹
`GET /api/v1/folders`

### 创建文件夹
`POST /api/v1/folders`
```json
{ "name": "工作", "color": "#4a7c59", "mode": "todo" }
```
`mode` 支持 `"todo"` 和 `"kanban"`. 创建 `"kanban"` 文件夹时后端会同步创建默认 Sprint 和看板列, 响应与列表接口都会返回该 `mode`.

### 更新文件夹
`PUT /api/v1/folders/{id}`
```json
{ "name": "新名称", "color": "#e07050" }
```

### 删除文件夹
`DELETE /api/v1/folders/{id}` (级联删除任务)

## 任务

### 获取任务列表
`GET /api/v1/todos`

Query 参数:
| 参数 | 类型 | 说明 |
|------|------|------|
| folder_id | int | 按文件夹筛选 |
| search | string | 按标题和备注模糊搜索 |
| priority | int | 按优先级筛选 (1/2/3) |
| status | string | active / completed |
| tag_id | int | 按标签筛选 |
| sprint_id | int | 按 Kanban Sprint 筛选 |
| column_id | int | 按 Kanban 列筛选 |

### 创建任务
`POST /api/v1/todos`
```json
{
  "folder_id": 1,
  "sprint_id": 1,
  "column_id": 1,
  "parent_id": null,
  "title": "买猫粮",
  "note": "皇家猫粮",
  "priority": 1,
  "due_date": "2026-05-20"
}
```

### 更新任务
`PUT /api/v1/todos/{id}`

### 删除任务
`DELETE /api/v1/todos/{id}` (级联删除子任务)

### 切换完成状态
`PATCH /api/v1/todos/{id}/toggle`

### 排序
`PATCH /api/v1/todos/{id}/reorder`
```json
{ "target_index": 0 }
```

## Kanban 任务

Kanban 模式使用独立的 `kanban_tasks` 表和 `/api/v1/kanban/tasks` 接口, 不再通过 `/api/v1/todos` 移动或删除卡片.

### 获取 Kanban 任务
`GET /api/v1/kanban/tasks?folder_id=1&sprint_id=1`

Query 参数:
| 参数 | 类型 | 说明 |
|------|------|------|
| folder_id | int | 必填, Kanban 文件夹 ID |
| sprint_id | int | 可选, 按 Sprint 筛选 |
| column_id | int | 可选, 按看板列筛选 |

### 创建 Kanban 任务
`POST /api/v1/kanban/tasks`
```json
{
  "folder_id": 1,
  "sprint_id": 1,
  "column_id": 1,
  "title": "实现登录流程",
  "priority": "P1",
  "task_type": "feature",
  "custom_fields": {
    "effort": "3",
    "module": "api"
  }
}
```
后端会按文件夹 `kanban_config.kanban_template.fields` 校验系统字段和 `custom_fields`, 并校验 `folder_id`, `sprint_id`, `column_id` 归属一致.

### 移动 Kanban 任务
`PUT /api/v1/kanban/tasks/{id}/move`
```json
{ "target_column_id": 2, "target_sprint_id": 1 }
```
移动时会检查目标列容量限制, 目标列必须属于当前任务所在文件夹.

### 更新和删除 Kanban 任务
- `PUT /api/v1/kanban/tasks/{id}`
- `DELETE /api/v1/kanban/tasks/{id}`

## Kanban 列

`GET /api/v1/kanban-columns?sprint_id=1` 返回列配置和 `task_count`. `task_count` 统计 `kanban_tasks` 表中对应列的卡片数.

## 标签

### 获取标签列表
`GET /api/v1/tags`

Query 参数:
| 参数 | 类型 | 说明 |
|------|------|------|
| search | string | 按名称模糊搜索 (自动补全) |
| folder_id | int | 限定到指定文件夹下任务拥有的标签 |

### 创建标签
`POST /api/v1/tags`
```json
{ "name": "工作" }
```
同名标签幂等返回已有记录, 状态码 201.

### 删除标签
`DELETE /api/v1/tags/{id}`

---

## Finance 记账

### 账本 (Ledger)
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/ledgers` | 账本列表 |
| `POST` | `/api/v1/finance/ledgers` | 创建账本 |
| `POST` | `/api/v1/finance/ledgers/reorder` | 调整账本排序 |
| `PUT` | `/api/v1/finance/ledgers/{id}` | 更新账本 |
| `DELETE` | `/api/v1/finance/ledgers/{id}` | 删除账本 |

### 账户 (Account)
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/accounts?ledger_id=` | 账户列表 |
| `POST` | `/api/v1/finance/accounts` | 创建账户 |
| `POST` | `/api/v1/finance/accounts/reorder?ledger_id=` | 调整账户排序 |
| `PUT` | `/api/v1/finance/accounts/{id}` | 更新账户 |
| `DELETE` | `/api/v1/finance/accounts/{id}` | 删除账户 |

### 分类 (Category)
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/categories?ledger_id=` | 分类树 |
| `POST` | `/api/v1/finance/categories` | 创建分类 |
| `POST` | `/api/v1/finance/categories/reorder?ledger_id=` | 调整分类排序 |
| `PUT` | `/api/v1/finance/categories/{id}` | 更新分类 |
| `DELETE` | `/api/v1/finance/categories/{id}` | 删除分类 |

### 标签 (Tag)
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/tags?ledger_id=&search=` | 标签列表 |
| `POST` | `/api/v1/finance/tags` | 创建标签 (幂等) |
| `PUT` | `/api/v1/finance/tags/{id}` | 更新标签 |
| `POST` | `/api/v1/finance/tags/reorder?ledger_id=` | 调整标签排序 |
| `DELETE` | `/api/v1/finance/tags/{id}` | 删除标签 |

### 交易 (Transaction)
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/transactions?ledger_id=&skip=&limit=` | 交易列表 (支持筛选/分页) |
| `GET` | `/api/v1/finance/transactions/{id}` | 交易详情 |
| `POST` | `/api/v1/finance/transactions` | 创建交易 (含拆单/标签) |
| `PUT` | `/api/v1/finance/transactions/{id}` | 更新交易 |
| `DELETE` | `/api/v1/finance/transactions/{id}` | 删除交易 |

### 事件 (Event)
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/events?ledger_id=` | 事件列表 |
| `POST` | `/api/v1/finance/events` | 创建事件 |
| `PUT` | `/api/v1/finance/events/{id}` | 更新事件 |
| `DELETE` | `/api/v1/finance/events/{id}` | 删除事件 |
| `GET` | `/api/v1/finance/events/{id}/summary` | 事件聚合 (财务+TODO) |

### 预算 (Budget)
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/budgets?ledger_id=` | 预算列表 (含进度) |
| `POST` | `/api/v1/finance/budgets` | 创建预算 |
| `POST` | `/api/v1/finance/budgets/reorder?ledger_id=` | 调整预算排序 |
| `PUT` | `/api/v1/finance/budgets/{id}` | 更新预算 |
| `DELETE` | `/api/v1/finance/budgets/{id}` | 删除预算 |

### Dashboard + Stats
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/dashboard?ledger_id=` | 仪表盘汇总 |
| `GET` | `/api/v1/finance/stats?ledger_id=&period=` | 图表数据 |

`/stats` 返回前端图表可直接消费的结构: `category_data[]` 包含 `category_name`, `category_icon`, `total`, `color`; `trend_data[]` 包含最近 6 个月的 `month`, `income`, `expense`.

### 关系 (Relation)
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/relations?from_type=&from_id=` | 关系列表 |
| `POST` | `/api/v1/finance/relations` | 创建关系 |
| `DELETE` | `/api/v1/finance/relations/{id}` | 删除关系 |
