# UML diagrams

## Modeling summaries

### Full database ERD overview

- Diagram type: ERD / database schema diagram.
- Scope: whole database overview at standard granularity.
- Included: users, themes, todo folders, todos, todo tags, recurrence rules, ledgers, accounts, finance categories, finance tags, transactions, split items, events, budgets, attachments, transaction join tables, and polymorphic resource relations.
- Excluded: backend API flows, service call chains, frontend state, and non-key audit timestamps where they would clutter the overview.
- Evidence:
  - `backend/src/models/user.py`
  - `backend/src/models/todo.py`
  - `backend/src/models/tag.py`
  - `backend/src/models/finance.py`
  - `backend/src/models/theme.py`
- Assumptions: SQLAlchemy models and Alembic migrations are the schema source of truth. `resource_relations` is modeled as an application-level polymorphic relation because its type/id columns are not declared as foreign keys.

### Frontend component overview

- Diagram type: component diagram.
- Scope: whole frontend component system.
- Included: Umi route configuration, application layout, authentication entry, Home dashboard, Todo, finance, settings and utility pages, shared UI primitives, common components, hooks, API client, styles, and external UI libraries.
- Excluded: individual small UI primitive internals, every finance subpage, every todo child component, backend services, database schema, and API endpoint-level flows.
- Evidence:
  - `frontend/.umirc.ts`
  - `frontend/src/layouts/index.tsx`
  - `frontend/src/pages/HomePage.tsx`
  - `frontend/src/pages/TodoPage.tsx`
  - `frontend/src/pages/finance/FinanceLayout.tsx`
  - `frontend/src/components/ui/index.ts`
  - `frontend/src/components/finance/FinanceCharts.tsx`
  - `docs/frontend-components.md`
- Assumptions: domain folders are grouped as UML components so the whole-frontend diagram stays readable and under the component diagram node limit. Dependency arrows represent observed imports, route composition, provider usage, hook usage, or external library usage.

## Diagrams

- [Full database ERD overview](erd/full-database-overview.puml): whole database table overview with primary keys, foreign keys, key business fields, and core relationships.
- [Frontend component overview](component/frontend-component-overview.puml): route, layout, feature, shared component, hook, API client, style, and external UI library dependencies for the whole frontend.
