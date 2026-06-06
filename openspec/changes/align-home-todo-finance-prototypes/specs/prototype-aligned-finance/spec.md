## ADDED Requirements

### Requirement: Finance page matches the root prototype
The system SHALL render `/finance` to match `accounting.html` in sidebar navigation, dashboard cards, charts, transaction views, management screens, dialogs, drawers, Chinese copy, and responsive mobile navigation using Material Design styling and MUI components.

#### Scenario: User opens finance dashboard
- **WHEN** an authenticated user visits `/finance`
- **THEN** the page displays the ledger sidebar, dashboard title, period switcher, record action, management action, stat cards, budget usage, category share, monthly trend, recent transactions, and matching labels without mojibake

#### Scenario: User opens finance on mobile
- **WHEN** the viewport is mobile width
- **THEN** the mobile bottom navigation and sidebar/hamburger interactions allow switching between dashboard, transactions, books, and budgets without layout overlap

### Requirement: Finance dashboard uses live data
The system MUST display finance dashboard, stats, budgets, category share, trend, and recent transaction data from backend APIs for the selected ledger.

#### Scenario: Ledger data loads successfully
- **WHEN** the selected ledger has accounts, transactions, budgets, and categories
- **THEN** the dashboard values, charts, recent transactions, and sidebar badges reflect persisted data

#### Scenario: Ledger has no data
- **WHEN** the selected ledger has no accounts, transactions, budgets, categories, tags, or events
- **THEN** each section displays the matching empty state and a working create action where the prototype provides one

### Requirement: Transaction lifecycle works
The system SHALL support creating, editing, deleting, viewing details, searching, filtering, splitting, attaching files, tagging, linking Todo items, and associating events for transactions according to the prototype.

#### Scenario: User records a transaction
- **WHEN** the user submits the "记一笔" form with type, amount, account, category, date, note, tags, event, split rows, attachments, or linked Todo items
- **THEN** the transaction is persisted with supported related data and all affected dashboard, account, budget, and transaction views refresh

#### Scenario: User edits transaction details
- **WHEN** the user opens a transaction detail drawer and edits or deletes the transaction
- **THEN** the persisted transaction changes or is removed after confirmation and related summaries refresh

#### Scenario: User filters transactions
- **WHEN** the user searches notes or filters by type, category, account, tag, event, date range, or advanced filters represented by the prototype
- **THEN** the transaction list shows matching persisted transactions and preserves clear empty and error states

### Requirement: Finance resource management works
The system MUST support ledger, account, category, tag, budget, and event management flows represented by the prototype through backend APIs.

#### Scenario: User manages ledgers and accounts
- **WHEN** the user creates, edits, deletes, or switches ledgers or accounts
- **THEN** the sidebar, account lists, balances, and dependent forms update consistently for the selected ledger

#### Scenario: User manages categories and tags
- **WHEN** the user creates, edits, deletes, searches, or nests categories, or creates and deletes tags
- **THEN** transaction forms and category/tag management views reflect the persisted changes

#### Scenario: User manages budgets and events
- **WHEN** the user creates, edits, deletes, or views budgets and events
- **THEN** budget usage, event summaries, transaction associations, and related empty states update from persisted data
