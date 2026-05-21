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
