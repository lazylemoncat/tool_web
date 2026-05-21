# API Documentation

## Basics

- Base URL: `/api/v1`
- Auth: `Authorization: Bearer <token>` (required except for auth endpoints)
- Content-Type: `application/json`

## Auth Endpoints

### POST /api/v1/auth/register
Register a new user
```
{ "username": "...", "password": "..." }
```

### POST /api/v1/auth/login
Login
```
{ "username": "...", "password": "..." }
```

### GET /api/v1/auth/me
Get current user info

### PUT /api/v1/auth/preferences
Update user preferences
```
{ "preferences": { "theme": "dark", "language": "en" } }
```

## Todo Endpoints

### GET /api/v1/todos
List tasks

Query params:
- `folder_id` — filter by folder
- `search` — search by title
- `priority` — filter by priority (1/2/3)
- `status` — filter by status (active/completed)
- `tag_id` — filter by tag
- `skip` / `limit` — pagination

### POST /api/v1/todos
Create task
```
{ "title": "...", "priority": 2, "folder_id": null, "tag_ids": [1, 2] }
```

### PUT /api/v1/todos/{id}
Update task

### DELETE /api/v1/todos/{id}
Delete task

### PATCH /api/v1/todos/{id}/toggle
Toggle completion status

### PATCH /api/v1/todos/{id}/reorder
Reorder single task

### POST /api/v1/todos/reorder
Batch reorder tasks
```
{ "items": [{ "id": 1, "sort_order": 0 }, { "id": 2, "sort_order": 1 }] }
```

## Folder Endpoints

### GET /api/v1/folders
List folders

### POST /api/v1/folders
Create folder
```
{ "name": "...", "color": "#6366f1" }
```

### PUT /api/v1/folders/{id}
Update folder

### DELETE /api/v1/folders/{id}
Delete folder

### POST /api/v1/folders/reorder
Batch reorder folders

## Tag Endpoints

### GET /api/v1/tags
List tags. Query: `search` — search by name

### POST /api/v1/tags
Create tag (idempotent)
```
{ "name": "..." }
```

### DELETE /api/v1/tags/{id}
Delete tag

## Theme Endpoints

### GET /api/v1/themes
List user themes

### POST /api/v1/themes
Create theme
```
{ "name": "...", "config_json": "{...}" }
```

### GET /api/v1/themes/{id}
Get full theme config

### PUT /api/v1/themes/{id}
Update theme

### DELETE /api/v1/themes/{id}
Delete theme
