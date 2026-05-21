# Tool Web API 文档

Base URL: `/api/v1`

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

## 文件夹

### 获取所有文件夹
`GET /api/v1/folders`

### 创建文件夹
`POST /api/v1/folders`
```json
{ "name": "工作", "color": "#4a7c59" }
```

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

### 创建任务
`POST /api/v1/todos`
```json
{
  "folder_id": 1,
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
| `PUT` | `/api/v1/finance/ledgers/{id}` | 更新账本 |
| `DELETE` | `/api/v1/finance/ledgers/{id}` | 删除账本 |

### 账户 (Account)
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/accounts?ledger_id=` | 账户列表 |
| `POST` | `/api/v1/finance/accounts` | 创建账户 |
| `PUT` | `/api/v1/finance/accounts/{id}` | 更新账户 |
| `DELETE` | `/api/v1/finance/accounts/{id}` | 删除账户 |

### 分类 (Category)
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/categories?ledger_id=` | 分类树 |
| `POST` | `/api/v1/finance/categories` | 创建分类 |
| `PUT` | `/api/v1/finance/categories/{id}` | 更新分类 |
| `DELETE` | `/api/v1/finance/categories/{id}` | 删除分类 |

### 标签 (Tag)
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/tags?ledger_id=&search=` | 标签列表 |
| `POST` | `/api/v1/finance/tags` | 创建标签 (幂等) |
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
| `PUT` | `/api/v1/finance/budgets/{id}` | 更新预算 |
| `DELETE` | `/api/v1/finance/budgets/{id}` | 删除预算 |

### Dashboard + Stats
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/dashboard?ledger_id=` | 仪表盘汇总 |
| `GET` | `/api/v1/finance/stats?ledger_id=&period=` | 图表数据 |

### 关系 (Relation)
| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/finance/relations?from_type=&from_id=` | 关系列表 |
| `POST` | `/api/v1/finance/relations` | 创建关系 |
| `DELETE` | `/api/v1/finance/relations/{id}` | 删除关系 |
