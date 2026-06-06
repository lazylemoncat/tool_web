## Context

The project has a Next.js frontend under `frontend/src/app/(auth)` and a FastAPI backend under `backend/src`. The root files `index.html`, `todo.html`, and `accounting.html` are the current visual and interaction references for the authenticated home dashboard, Todo module, and finance module. The implementation style is Material Design and page controls should be built with MUI components. The current React pages already call parts of the backend, but the UI copy is mojibake in multiple places and several prototype controls are simplified or static.

The backend already exposes most needed Todo and finance resources, including folders, todos, Todo tags, finance ledgers, accounts, categories, finance tags, transactions, events, budgets, attachments, relations, dashboard, and stats. The implementation should first use those APIs instead of introducing client-only fake behavior.

## Goals / Non-Goals

**Goals:**

- Make `/`, `/todo`, and `/finance` visually and behaviorally match `index.html`, `todo.html`, and `accounting.html`.
- Use Material Design tokens and MUI components for layout, navigation, cards, dialogs, forms, drawers, tables, chips, alerts, and buttons.
- Restore all visible Chinese copy from the prototypes and remove mojibake from user-facing UI.
- Keep every visible primary action functional through real state changes, API calls, or documented validation/error handling.
- Preserve authentication, per-user scoping, and current project folder conventions.
- Keep implementation maintainable by extracting focused components and typed API helpers when page files become too large.

**Non-Goals:**

- Replacing the existing backend framework, auth system, database layer, or routing model.
- Changing unrelated pages such as login, register, help, and settings beyond navigation consistency required by the three target pages.
- Adding new product modules not represented by the three root HTML prototypes.
- Committing, branching, tagging, or releasing as part of this documentation change.

## Decisions

### Treat the HTML prototypes as the source of truth

The root HTML files define layout, labels, states, and intended interactions. The React pages should be rebuilt to match those files while keeping React state and backend data flows. This avoids drifting between prototype and implementation.

Alternative considered: keep the current React layout and only fix broken labels. That would be faster, but it would not satisfy the requirement to align with the three corresponding HTML files.

### Build the UI with MUI Material components

Use MUI components such as `Box`, `Grid`, `Card`, `Stack`, `Button`, `Dialog`, `Drawer`, `Tabs`, `TextField`, `Select`, `Chip`, `Alert`, `List`, `Menu`, and icon components from `@mui/icons-material`. Page-specific styling should use `sx` and the existing MUI theme first, with CSS kept for global shell and prototype compatibility.

Alternative considered: continue using custom class-based DOM. That would preserve older CSS but would not meet the explicit Material/MUI requirement.

### Use existing APIs before adding backend work

Todo should use existing `/api/v1/folders`, `/api/v1/todos`, `/api/v1/tags`, reorder, toggle, and bulk endpoints. Finance should use existing `/api/v1/finance/*` endpoints for ledgers, accounts, categories, tags, transactions, events, budgets, attachments, relations, dashboard, and stats.

When a prototype control maps to an existing endpoint, implement the frontend flow. When the prototype requires behavior not fully supported by current request/response types, update the typed frontend models and backend tests around the existing endpoint before adding a new endpoint.

Alternative considered: implement missing controls as local-only UI state. That would make demos look complete, but it would violate the requirement that functions operate normally.

### Split dense pages into local components

The three target pages are dense operational screens. Implementation should extract page-local components for toolbars, sidebars, cards, dialogs, drawers, and list rows once a single file becomes hard to review. Shared helpers should go under existing frontend folders only when reused by more than one page.

Alternative considered: copy the prototype DOM structure directly into one large page file. That would preserve visual order but would make API integration, testing, and future fixes fragile.

### Keep data loading explicit and typed

Each page should expose clear loading, empty, and error states. API calls should use `apiRequest` and typed response interfaces from `frontend/src/lib/types.ts`. Static prototype sample data may be used only for visual placeholders when no user data exists and the UI clearly represents an empty or fallback state.

Alternative considered: hardcode prototype numbers and sample records permanently. That would match screenshots but would break real user workflows.

### Verify with both automated checks and browser inspection

The change should be verified with TypeScript/lint/build checks, focused backend tests for changed endpoints, and browser inspection of desktop and mobile layouts for the three target routes.

Alternative considered: rely only on code review. That is not enough for prototype alignment because visual regressions and broken dialogs are easy to miss in static diffs.

## Risks / Trade-offs

- [Risk] The HTML prototypes are large and contain many controls, so a one-shot port can create oversized components. -> Mitigation: implement page sections in small components and keep tasks ordered by page and feature group.
- [Risk] Backend and frontend type definitions may not currently expose all finance fields used by the prototype. -> Mitigation: update `frontend/src/lib/types.ts` and add backend tests before wiring the UI.
- [Risk] Some prototype behaviors are ambiguous, such as dashboard card persistence and navigation customization. -> Mitigation: implement deterministic local/user-preference behavior only when it is already supported; otherwise document and add explicit backend/API tasks.
- [Risk] Visual alignment can regress across desktop and mobile. -> Mitigation: test at representative desktop and mobile widths and keep responsive sidebar/bottom-nav requirements in specs.
- [Risk] Fixing mojibake could touch many strings. -> Mitigation: edit targeted files only and review `git diff` after changes.

## Migration Plan

1. Implement frontend copy/layout alignment page by page, starting with visible text and navigation.
2. Wire existing backend APIs for current features before adding or changing backend behavior.
3. Add or update backend endpoint tests only where frontend flows require API behavior not currently covered.
4. Run frontend checks, backend tests, and browser verification for `/`, `/todo`, and `/finance`.
5. Roll back by reverting the OpenSpec implementation change if verification fails before release.

## Open Questions

- Should dashboard card order, hidden cards, and navigation preferences persist per user through the existing auth preferences endpoint or remain browser-local for the first implementation?
- Should finance attachments be fully uploaded through `/api/v1/finance/attachments/upload` in this iteration, or should the UI only support already-uploaded attachments until upload UX requirements are refined?
