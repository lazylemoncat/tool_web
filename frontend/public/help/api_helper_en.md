# API Help

## Basics

- Base path: `/api/v1`.
- Authentication: `Authorization: Bearer <token>`.
- All endpoints except register and login require a token.
- Default content type: `application/json`.

## Auth

### POST `/auth/register`

Register a user.

```json
{ "username": "rex", "password": "secret" }
```

### POST `/auth/login`

Login and receive a token.

```json
{ "username": "rex", "password": "secret" }
```

### GET `/auth/me`

Read current user information.

### PUT `/auth/preferences`

Update preferences such as theme, language, and default filters.

```json
{ "preferences": { "theme": "dark", "language": "en" } }
```

## Todo

### GET `/todos`

List tasks. Common query parameters:

- `folder_id`: folder.
- `search`: title keyword.
- `priority`: `1`, `2`, or `3`.
- `status`: `active` or `completed`.
- `tag_id`: tag.
- `skip` / `limit`: pagination.

### POST `/todos`

Create a task.

```json
{
  "title": "Prepare weekly report",
  "folder_id": null,
  "priority": 2,
  "tag_ids": [1],
  "recurrence_rules": []
}
```

### PUT `/todos/{id}`

Update task fields.

### DELETE `/todos/{id}`

Delete a task.

### PATCH `/todos/{id}/toggle`

Toggle completion.

### POST `/todos/reorder`

Save task ordering.

```json
{ "items": [{ "id": 1, "sort_order": 0 }, { "id": 2, "sort_order": 1 }] }
```

### POST `/todos/bulk`

Bulk complete, delete, or move tasks.

## Folder

### GET `/folders`

Read the folder tree.

### POST `/folders`

Create a folder.

```json
{ "name": "Work", "color": "#6366f1", "parent_id": null }
```

### PUT `/folders/{id}`

Update folder name, color, or parent.

### DELETE `/folders/{id}`

Delete a folder.

### POST `/folders/reorder`

Save folder ordering.

## Tag

### GET `/tags`

List todo tags. Supports `search`.

### POST `/tags`

Create a tag. Duplicate names are handled idempotently.

### DELETE `/tags/{id}`

Delete a tag.

## Finance

### Ledger

- `GET /finance/ledgers`: list ledgers.
- `POST /finance/ledgers`: create ledger.
- `PUT /finance/ledgers/{id}`: update ledger.
- `DELETE /finance/ledgers/{id}`: delete ledger.

### Account

- `GET /finance/accounts?ledger_id=1`: list accounts.
- `POST /finance/accounts`: create account.
- `PUT /finance/accounts/{id}`: update account.
- `DELETE /finance/accounts/{id}`: delete account.

### Category

- `GET /finance/categories?ledger_id=1`: read category tree.
- `POST /finance/categories`: create category.
- `PUT /finance/categories/{id}`: update category.
- `DELETE /finance/categories/{id}`: delete category.

### Finance Tag

- `GET /finance/tags?ledger_id=1`: list finance tags.
- `POST /finance/tags`: create finance tag.
- `DELETE /finance/tags/{id}`: delete finance tag.

### Transaction

- `GET /finance/transactions?ledger_id=1`: list transactions.
- `POST /finance/transactions`: create transaction.
- `PUT /finance/transactions/{id}`: update transaction.
- `DELETE /finance/transactions/{id}`: delete transaction.
- `POST /finance/transactions/reorder`: save transaction ordering.

Transactions support account, category, tag, event, type, date, and keyword filters.

### Budget

- `GET /finance/budgets?ledger_id=1`: list budgets.
- `POST /finance/budgets`: create budget.
- `PUT /finance/budgets/{id}`: update budget.
- `DELETE /finance/budgets/{id}`: delete budget.

### Event

- `GET /finance/events?ledger_id=1`: list events.
- `POST /finance/events`: create event.
- `PUT /finance/events/{id}`: update event.
- `DELETE /finance/events/{id}`: delete event.
- `GET /finance/events/{id}/summary`: read event summary.

### Dashboard And Stats

- `GET /finance/dashboard?ledger_id=1`: read dashboard summary.
- `GET /finance/stats?ledger_id=1&period=month`: read chart statistics.

### Attachment

- `POST /finance/attachments/upload`: upload transaction attachment.

## Theme

### GET `/themes`

List custom themes.

### POST `/themes`

Create a theme.

### GET `/themes/{id}`

Read theme detail.

### PUT `/themes/{id}`

Update theme.

### DELETE `/themes/{id}`

Delete theme.
