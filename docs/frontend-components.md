# Frontend Reusable Components

This document is the first stop before building or changing frontend pages. Prefer these reusable components and local patterns before creating new page-specific UI.

## Import Rule

Use `frontend/src/components/ui/index.ts` for shared UI primitives:

```ts
import { Button, Modal, FormField, Select } from '../components/ui'
```

Use direct imports only for module-specific components, such as home, layout, todo, or finance components.

## UI Primitives

Use these for general page and form construction:

| Need | Component | Location |
|---|---|---|
| Command button | `Button` | `components/ui/Button` |
| Icon-only command | `IconButton` | `components/ui/IconButton` |
| Text input | `Input` | `components/ui/Input` |
| Multi-line input | `Textarea` | `components/ui/Textarea` |
| Numeric input | `NumberInput` | `components/ui/NumberInput` |
| Option picker | `Select` | `components/ui/Select` |
| Searchable option picker | `Combobox` | `components/ui/Combobox` |
| Form label, help, error wrapper | `FormField` | `components/ui/FormField` |
| Form action row | `FormFooter` | `components/ui/FormFooter` |
| Framed content card | `Card`, `CardHeader`, `CardBody`, `CardFooter` | `components/ui/Card` |
| Modal dialog | `Modal` | `components/ui/Modal` |
| Side/bottom panel | `Drawer` | `components/ui/Drawer` |
| Confirmation flow | `ConfirmDialogProvider`, `useConfirm` | `components/ui/ConfirmDialog` |
| Toast notification | `ToastProvider`, `useToast` | `components/ui/Toast` |
| Menu | `DropdownMenu` and subcomponents | `components/ui/DropdownMenu` |
| Tooltip | `Tooltip`, `TooltipProvider` | `components/ui/Tooltip` |
| Tabs | `Tabs` | `components/ui/Tabs` |
| Status label | `Badge` | `components/ui/Badge` |
| User identity | `Avatar` | `components/ui/Avatar` |
| Loading placeholder | `Skeleton`, `Spinner` | `components/ui/Skeleton`, `components/ui/Spinner` |
| Empty data state | `EmptyState` | `components/ui/EmptyState` |
| Floating content | `Popover` | `components/ui/Popover` |

Do not hand-roll modal overlays, dropdown menus, toast systems, confirmation dialogs, tabs, cards, or form footers when these components fit.

## Layout Components

| Need | Component | Notes |
|---|---|---|
| Authenticated desktop top bar | `AppTopBar` | `components/layout/AppTopBar.tsx`; global shell navigation and account menu. |
| Mobile page header | `Header` | `components/layout/Header.tsx`; mobile menu, title, account dropdown. |
| Todo folder sidebar | `Sidebar` | `components/layout/Sidebar.tsx`; todo folder tree and dnd-kit sorting. |

For app-level authenticated pages, keep using the global layout in `frontend/src/layouts/index.tsx`. Do not duplicate top bars or auth gates inside pages unless a page owns a special local navigation surface, such as the Home dashboard sidebar.

## Settings Components

| Need | Component | Notes |
|---|---|---|
| Account overview and security actions | `AccountSection` | `components/settings/sections/AccountSection.tsx`; username summary plus password/delete-account/TOTP entry points. |
| TOTP setup | `TotpPage` | `pages/settings/TotpPage.tsx`; independent MFA setup page with local QR rendering, fallback URI copy, confirmation code, and recovery codes. |

## Home Components

| Need | Component | Notes |
|---|---|---|
| Top-level feature card | `HomeModuleCard` | `components/home/HomeModuleCard.tsx`; use for TODO, bookkeeping, and future top-level modules. Includes icon, title, description, arrow, and management-control slot. |
| Recent tasks widget | `RecentTodosWidget` | `components/home/RecentTodosWidget.tsx`; reads todo data and renders compact dashboard content. |
| Monthly bookkeeping widget | `MonthlyFinanceWidget` | `components/home/MonthlyFinanceWidget.tsx`; reads first ledger dashboard data and renders summary/chart content. |

When adding a new Home module, extend `DASHBOARD_ITEMS` in `HomePage.tsx` and render it through `HomeModuleCard` instead of creating a one-off card.

Home dashboard management state is persisted in local storage under `toolweb.homeDashboard`. Keep future Home module IDs stable so existing user layouts survive upgrades.

## Drag Sorting Pattern

Use `@dnd-kit` for sortable UI. Follow the existing patterns:

- Todo task rows: `components/todo/TodoList.tsx`, `components/todo/SubTaskList.tsx`
- Todo sidebar folders: `components/layout/Sidebar.tsx`
- Finance sortable lists: `components/finance/FinanceSortableList.tsx`
- Home dashboard cards: `pages/HomePage.tsx`

Use a visible drag handle matching the existing todo and finance list handle. Do not represent drag sorting with move-left or move-right buttons unless the user explicitly asks for button sorting.

## Todo Components

| Need | Component | Notes |
|---|---|---|
| Main todo list | `TodoList` | Sortable task list with drag handles. |
| Todo row | `TodoItem` | Row actions, completion state, metadata. |
| Create/edit task | `TodoForm` | Task form modal content. |
| Nested subtasks | `SubTaskList`, `SubTaskDrawer` | Subtask list and drawer workflow. |
| Task detail | `TaskDetail` | Detail modal. |
| Tag input | `TagInput` | Reusable tag editor for todo forms. |

Prefer these components for todo-related pages. Do not rebuild task rows, tag editors, or drag sorting shells in page files.

## Finance Components

| Need | Component | Notes |
|---|---|---|
| Finance shell sidebar | `FinanceSidebar` | Finance route navigation. |
| Dashboard cards/charts | `FinanceDashboard`, `FinanceCharts` | Finance dashboard display. |
| Transaction form | `TransactionForm` | Main transaction modal with tabs. |
| Transaction card | `TxCard` | Mobile transaction card. |
| Transaction filters | `TxFilterBar` | Mobile filter drawer entry. |
| Transaction detail | `TransactionDetail` | Detail view and child transaction actions. |
| Sub transaction drawer | `SubTxDrawer` | Child transaction workflow. |
| Sortable finance list | `FinanceSortableList` | Generic dnd-kit list wrapper for finance rows. |
| Budget form | `BudgetForm` | Budget create/edit modal. |
| Event form | `EventForm` | Event create/edit modal. |
| Category/tag management | `CategoryManager`, `TagManager` | Inline finance metadata management. |

Inside `TransactionForm`, reuse subcomponents under `components/finance/transactionForm/` rather than expanding the main form file.

## Common Components

| Need | Component | Notes |
|---|---|---|
| Legacy/common toast bridge | `components/common/Toast.tsx` | Compatibility wrapper around UI toast. |
| Error boundary | `ErrorBoundary` | Runtime crash boundary used by app root. |
| Search input | `SearchBar` | Shared search bar pattern. |
| Priority label | `PriorityTag` | Todo priority display. |
| Theme custom button slots | `CustomButtons` | Theme runtime button insertion. |

Prefer UI primitives for new work. Use `common` components only when they match an existing module pattern.

## Styling Rules

- Use semantic CSS tokens from `frontend/src/styles/tokens/`.
- Keep page-specific styles in existing page/global style areas only when there is no component-local stylesheet.
- Do not hard-code colors, border radii, or shadows when a token exists.
- Use existing drag handle classes and behavior as references before adding new sortable UI.
- Keep cards at modest radius and avoid nested cards.

## Before Creating A New Component

1. Search `components/ui` for a primitive.
2. Search the domain folder, such as `components/todo`, `components/finance`, or `components/home`.
3. Reuse an existing component if the props can express the need.
4. Add a new component only when it removes repeated structure or represents a real reusable pattern.
5. Update this document when a new reusable component is introduced.
