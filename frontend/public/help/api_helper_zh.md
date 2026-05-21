# API 接口文档

## 基础信息

- 基础路径：`/api/v1`
- 认证方式：`Authorization: Bearer <token>`（除了 auth 接口外都是必需的）
- 内容类型：`application/json`

## Auth 接口

### POST /api/v1/auth/register
注册新用户
```
{ "username": "...", "password": "..." }
```

### POST /api/v1/auth/login
用户登录
```
{ "username": "...", "password": "..." }
```

### GET /api/v1/auth/me
获取当前用户信息

### PUT /api/v1/auth/preferences
更新用户偏好设置
```
{ "preferences": { "theme": "dark", "language": "zh" } }
```

## Todo 接口

### GET /api/v1/todos
获取任务列表

查询参数：
- `folder_id` — 按文件夹筛选
- `search` — 按标题搜索
- `priority` — 按优先级筛选 (1/2/3)
- `status` — 按完成状态筛选 (active/completed)
- `tag_id` — 按标签筛选
- `skip` / `limit` — 分页

### POST /api/v1/todos
创建任务
```
{ "title": "...", "priority": 2, "folder_id": null, "tag_ids": [1, 2] }
```

### PUT /api/v1/todos/{id}
更新任务

### DELETE /api/v1/todos/{id}
删除任务

### PATCH /api/v1/todos/{id}/toggle
切换完成状态

### PATCH /api/v1/todos/{id}/reorder
单个任务排序

### POST /api/v1/todos/reorder
批量任务排序
```
{ "items": [{ "id": 1, "sort_order": 0 }, { "id": 2, "sort_order": 1 }] }
```

## Folder 接口

### GET /api/v1/folders
获取文件夹列表

### POST /api/v1/folders
创建文件夹
```
{ "name": "...", "color": "#6366f1" }
```

### PUT /api/v1/folders/{id}
更新文件夹

### DELETE /api/v1/folders/{id}
删除文件夹

### POST /api/v1/folders/reorder
批量文件夹排序

## Tag 接口

### GET /api/v1/tags
获取标签列表。查询参数：`search` — 按名称搜索

### POST /api/v1/tags
创建标签（同名幂等）
```
{ "name": "..." }
```

### DELETE /api/v1/tags/{id}
删除标签

## Theme 接口

### GET /api/v1/themes
获取用户自定义主题列表

### POST /api/v1/themes
创建主题
```
{ "name": "...", "config_json": "{...}" }
```

### GET /api/v1/themes/{id}
获取单个主题（含完整配置）

### PUT /api/v1/themes/{id}
更新主题

### DELETE /api/v1/themes/{id}
删除主题
