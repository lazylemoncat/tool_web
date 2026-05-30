# Finance Help

## Feature Groups

Finance manages ledgers, accounts, transactions, categories, tags, budgets, events, and dashboards. Open it from the home finance area or `/finance`.

## Ledgers

### Create A Ledger

1. Open Finance.
2. If there are no ledgers, click **Create First Ledger** to show the ledger name field.
3. If a ledger already exists, click **New Ledger** in the ledger selector.
4. Enter a name and confirm.

### Switch Ledgers

- Use the ledger buttons in the header.
- Accounts, categories, tags, transactions, budgets, and events are isolated by ledger.

### Delete A Ledger

- Deleting a ledger removes its accounts, transactions, budgets, and events.
- Click the delete button beside a ledger in the ledger selector to delete it.
- A confirmation dialog is shown before deletion.

## Dashboard

### Dashboard Content

The dashboard is display-focused and includes:

- Total assets.
- Monthly income.
- Monthly expense.
- Monthly balance.
- Budget usage.
- Category spending breakdown.
- Monthly expense trend.
- Recent transactions.

### Manage The Dashboard

1. Click **Manage dashboard**.
2. Check or uncheck widgets to show or hide them.
3. Use up and down buttons to change widget order.
4. Change the chart period between week, month, and year.
5. Click **Done** to exit management mode.

Dashboard configuration is saved per ledger and persists after navigation.

### Category Spending Breakdown

- The pie chart shows spending share by category.
- Uncategorized transactions are shown as **Uncategorized**.
- Hover a pie slice to see category name, percentage, and exact amount.

### Budget Usage

- Shows total spent amount and total budget amount.
- Click **Show details** to expand individual budgets.
- Individual budget rows can be temporarily hidden or shown again.

## Transactions

### Create A Transaction

1. Click **New Transaction** in the sidebar.
2. Select type: expense, income, or transfer.
3. Fill amount and account. Both are required.
4. Optionally choose category, date, note, tags, splits, attachments, and linked todos.
5. Click **Confirm** to save.

If required fields are missing, the form highlights them and stays open.

### Edit A Transaction

- Click a transaction row to open details.
- Click edit from the detail view.
- Save after making changes.

### Delete A Transaction

- Click delete from the row or detail view.
- Review the confirmation dialog.
- Confirm deletion.

### Drag Sorting

- Transaction rows support drag sorting.
- Drag from the handle.
- Order is saved to backend `sort_order`.

### Splits And Child Transactions

- Open split editing from the extended tab.
- After saving a parent transaction, use the drawer to create or edit child transactions.
- Child transaction total cannot exceed the parent amount.

### Attachments

- Upload attachments from the extended tab.
- Existing attachments can be kept or removed while editing.

### Linked Todos

- Link todos from the linked tab.
- Search available todos.
- Completed todos are dimmed.

## Budgets

### Create A Budget

1. Open **Budgets**.
2. Click **New Budget**.
3. Fill budget name and amount. Both are required.
4. Optionally configure currency, recurrence rule, category filters, tag filters, event filters, rollover, and alert threshold.
5. Confirm to save.

### Edit And Delete Budgets

- Click edit to update a budget.
- Click delete and confirm to remove it.

### Budget Ordering

- Budget cards support drag sorting.
- Current budget order is saved per ledger in the browser.

## Events

### Create An Event

1. Open **Events**.
2. Click **New Event**.
3. Fill event name. It is required.
4. Optionally set description, start time, end time, and color.
5. Confirm to save.

### Edit And Delete Events

- Click an event card or edit button to update it.
- Click delete and confirm to remove it.

### Event Ordering

- Event cards support drag sorting.
- Current event order is saved per ledger in the browser.

## Manage

### Categories

- Categories support a tree structure.
- Create root categories and child categories.
- Edit category name and parent category.
- Delete actions show a confirmation dialog.

### Tags

- Create finance tags.
- Delete unused tags.
- Use tags for transaction filtering and labeling.

## Search And Filters

Transactions can be filtered by:

- Account.
- Category.
- Tag.
- Event.
- Type.
- Start date and end date.
- Keyword.

Filters can be combined. Use clear filters to reset the list.
