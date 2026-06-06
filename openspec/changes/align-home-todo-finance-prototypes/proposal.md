## Why

The current Next.js pages for the home dashboard, Todo, and finance modules do not fully match the root HTML prototypes and several visible labels are mojibake. These three prototypes are the current product reference, so the implemented pages need to match their layout, wording, interaction model, and working data flows.

## What Changes

- Align the authenticated home page with `index.html`, including dashboard cards, management controls, add/remove card dialogs, navigation management, settings dialog, and live Todo/finance summary data.
- Align the Todo page with `todo.html`, including the sidebar views, folder tree, filters, task list, task detail expansion, create/edit/delete/toggle flows, batch actions, folder actions, dialogs, empty states, and responsive sidebar behavior.
- Align the finance page with `accounting.html`, including the finance dashboard, transaction list, books, accounts, category management, tags, budgets, events, transaction create/edit/detail flows, filters, split transactions, attachments, Todo relations, and responsive navigation.
- Replace garbled UI text with the exact Chinese copy and labels represented by the HTML prototypes.
- Use Material Design as the explicit theme style and implement page controls with MUI components.
- Ensure every exposed control either performs its expected action through existing APIs or is backed by a new/updated API task in this change. No primary prototype control should remain as a static placeholder, snackbar-only action, or broken button.
- Preserve authentication, per-user data scoping, existing API contracts where possible, and current Docker/Next/FastAPI project structure.

## Capabilities

### New Capabilities
- `prototype-aligned-home-dashboard`: Authenticated home dashboard mirrors `index.html` and provides working dashboard management and module summary entry points.
- `prototype-aligned-todo`: Todo module mirrors `todo.html` and supports working task, folder, filter, batch, and responsive interactions.
- `prototype-aligned-finance`: Finance module mirrors `accounting.html` and supports working ledger, account, category, tag, budget, event, transaction, attachment, relation, and dashboard interactions.

### Modified Capabilities
- None.

## Impact

- Frontend pages: `frontend/src/app/(auth)/page.tsx`, `frontend/src/app/(auth)/todo/page.tsx`, `frontend/src/app/(auth)/finance/page.tsx`.
- Shared frontend code: Material/MUI theme setup, `frontend/src/styles/prototype.css`, `frontend/src/lib/api.ts`, `frontend/src/lib/types.ts`, navigation/auth wrappers, and any extracted page components introduced to keep the pages maintainable.
- Backend APIs likely touched for missing or underused prototype flows: Todo bulk/folder/tag operations and finance ledgers, accounts, categories, tags, transactions, events, budgets, attachments, relations, dashboard, and stats endpoints.
- Tests: frontend interaction coverage for the three pages plus backend API tests for any endpoint behavior added or changed.
