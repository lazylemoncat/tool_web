# API 接口帮助

## 基础信息

- 基础路径: `/api/v1`.
- 认证方式: `Authorization: Bearer <token>`.
- 除注册和登录外, 请求都需要登录 token.
- 默认内容类型: `application/json`.

## Auth 接口

### POST `/auth/register`

注册新用户.

```json
{ "username": "rex", "password": "secret" }
```

### POST `/auth/login`

登录并获取 token.

```json
{ "username": "rex", "password": "secret" }
```

### GET `/auth/me`

获取当前用户信息.

### PUT `/auth/preferences`

更新用户偏好, 例如主题, 语言和默认筛选.

```json
{ "preferences": { "theme": "dark", "language": "zh" } }
```

## Todo 接口

### GET `/todos`

获取任务列表. 常用查询参数:

- `folder_id`: 文件夹.
- `search`: 标题关键词.
- `priority`: 优先级 `1`, `2`, `3`.
- `status`: `active` 或 `completed`.
- `tag_id`: 标签.
- `skip` / `limit`: 分页.

### POST `/todos`

创建任务.

```json
{
  "title": "准备周报",
  "folder_id": null,
  "priority": 2,
  "tag_ids": [1],
  "recurrence_rules": []
}
```

### PUT `/todos/{id}`

更新任务字段.

### DELETE `/todos/{id}`

删除任务.

### PATCH `/todos/{id}/toggle`

切换完成状态.

### POST `/todos/reorder`

批量保存任务排序.

```json
{ "items": [{ "id": 1, "sort_order": 0 }, { "id": 2, "sort_order": 1 }] }
```

### POST `/todos/bulk`

批量完成, 删除或移动任务.

## Folder 接口

### GET `/folders`

获取文件夹树.

### POST `/folders`

创建文件夹.

```json
{ "name": "工作", "color": "#6366f1", "parent_id": null }
```

### PUT `/folders/{id}`

更新文件夹名称, 颜色或父级.

### DELETE `/folders/{id}`

删除文件夹.

### POST `/folders/reorder`

保存文件夹排序.

## Tag 接口

### GET `/tags`

获取任务标签. 支持 `search`.

### POST `/tags`

创建标签. 同名标签按幂等方式处理.

### DELETE `/tags/{id}`

删除标签.

## Finance 接口

### Ledger

- `GET /finance/ledgers`: 获取账本.
- `POST /finance/ledgers`: 创建账本.
- `PUT /finance/ledgers/{id}`: 更新账本.
- `DELETE /finance/ledgers/{id}`: 删除账本.

### Account

- `GET /finance/accounts?ledger_id=1`: 获取账户.
- `POST /finance/accounts`: 创建账户.
- `PUT /finance/accounts/{id}`: 更新账户.
- `DELETE /finance/accounts/{id}`: 删除账户.

### Category

- `GET /finance/categories?ledger_id=1`: 获取分类树.
- `POST /finance/categories`: 创建分类.
- `PUT /finance/categories/{id}`: 更新分类.
- `DELETE /finance/categories/{id}`: 删除分类.

### Finance Tag

- `GET /finance/tags?ledger_id=1`: 获取记账标签.
- `POST /finance/tags`: 创建记账标签.
- `DELETE /finance/tags/{id}`: 删除记账标签.

### Transaction

- `GET /finance/transactions?ledger_id=1`: 获取交易列表.
- `POST /finance/transactions`: 创建交易.
- `PUT /finance/transactions/{id}`: 更新交易.
- `DELETE /finance/transactions/{id}`: 删除交易.
- `POST /finance/transactions/reorder`: 保存交易排序.

交易支持账户, 分类, 标签, 事件, 类型, 日期和关键词筛选.

### Budget

- `GET /finance/budgets?ledger_id=1`: 获取预算.
- `POST /finance/budgets`: 创建预算.
- `PUT /finance/budgets/{id}`: 更新预算.
- `DELETE /finance/budgets/{id}`: 删除预算.

### Event

- `GET /finance/events?ledger_id=1`: 获取事件.
- `POST /finance/events`: 创建事件.
- `PUT /finance/events/{id}`: 更新事件.
- `DELETE /finance/events/{id}`: 删除事件.
- `GET /finance/events/{id}/summary`: 获取事件汇总.

### Dashboard And Stats

- `GET /finance/dashboard?ledger_id=1`: 获取仪表盘摘要.
- `GET /finance/stats?ledger_id=1&period=month`: 获取图表统计.

### Attachment

- `POST /finance/attachments/upload`: 上传交易附件.

## Theme 接口

### GET `/themes`

获取自定义主题列表.

### POST `/themes`

创建主题.

### GET `/themes/{id}`

获取主题详情.

### PUT `/themes/{id}`

更新主题.

### DELETE `/themes/{id}`

删除主题.
