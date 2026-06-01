## 1. Prototype Audit And Shared Foundation

- [x] 1.1 Compare `index.html`, `todo.html`, and `accounting.html` against the current React pages and record the required sections, controls, dialogs, and responsive states for implementation.
- [x] 1.2 Replace mojibake user-facing strings in the three target React pages with the exact Chinese labels from the prototypes.
- [x] 1.3 Update `frontend/src/lib/types.ts` so Todo and finance responses expose the fields needed by the prototype flows.
- [x] 1.4 Add focused page-local components for repeated cards, toolbars, dialogs, drawers, sidebars, and list rows when page files become hard to review.
- [x] 1.5 Use Material Design theme semantics and MUI components for the three target pages.
- [x] 1.6 Keep `frontend/src/styles/prototype.css` aligned with prototype layout, spacing, responsive breakpoints, and states without unrelated visual changes.

## 2. Home Dashboard Alignment

- [x] 2.1 Rebuild `/` to match `index.html` header, top navigation, dashboard card grid, card sizes, icons, labels, and responsive layout.
- [x] 2.2 Wire Todo and finance cards to navigate to `/todo` and `/finance` and remove placeholder-only actions.
- [x] 2.3 Load active Todo count and finance month summary from APIs with loading, empty, and error states.
- [x] 2.4 Implement management mode, add-card dialog, remove-card confirmation, navigation management dialog, and settings dialog behavior.
- [ ] 2.5 Verify dashboard card visibility and summary data remain stable after management actions.

## 3. Todo Module Alignment

- [x] 3.1 Rebuild `/todo` to match `todo.html` sidebar, folder tree, toolbar, task list, task details, batch bar, dialogs, and mobile sidebar behavior.
- [x] 3.2 Implement create, edit, delete, toggle completion, and detail expansion flows using Todo APIs.
- [x] 3.3 Implement search, status, priority, folder, tag, today, upcoming, completed, and all-task filtering with accurate counts.
- [x] 3.4 Implement multi-select batch complete, move, delete, and cancel selection flows using backend-supported operations.
- [x] 3.5 Implement folder create, child folder create, rename, delete, and reorder flows while preserving task accessibility after folder deletion.
- [ ] 3.6 Add or update Todo and folder backend tests for any endpoint behavior required by the prototype but not already covered.

## 4. Finance Dashboard And Transactions

- [x] 4.1 Rebuild `/finance` dashboard to match `accounting.html` sidebar, header, period switcher, stat cards, budget usage, category share, trend chart, recent transactions, and responsive mobile bottom nav.
- [x] 4.2 Load selected ledger dashboard, stats, budgets, category share, trend, and recent transactions from finance APIs.
- [x] 4.3 Implement transaction list search, type filter, category filter, account filter, date or advanced filter controls represented by the prototype.
- [x] 4.4 Implement transaction create, edit, detail drawer, delete confirmation, and refresh behavior for dashboard, account, budget, and list data.
- [x] 4.5 Implement transaction split rows, tags, attachments, event association, and linked Todo fields where backend APIs already support them.
- [ ] 4.6 Add or update finance transaction backend tests for split, tag, attachment, event, and Todo relation behavior used by the UI.

## 5. Finance Resource Management

- [x] 5.1 Implement ledger list, create, edit, delete, and switch flows matching the prototype books screen.
- [x] 5.2 Implement account list, create, edit, delete, archive or active-state behavior matching the prototype accounts screen.
- [x] 5.3 Implement category tree create, edit, delete, search, parent selection, and child-category behavior.
- [x] 5.4 Implement finance tag list, create, search, and delete behavior.
- [x] 5.5 Implement budget list, create, edit, delete, progress calculation, over-budget state, and empty state behavior.
- [x] 5.6 Implement event list, create, edit, delete, detail drawer, summary, and transaction association behavior.
- [ ] 5.7 Add or update backend tests for any ledger, account, category, tag, budget, event, attachment, relation, dashboard, or stats behavior changed for the UI.

## 6. Verification

- [x] 6.1 Run frontend type, lint, and build checks for the Next.js app.
- [ ] 6.2 Run backend tests for Todo, folder, tag, and finance APIs touched by the implementation.
- [ ] 6.3 Verify `/`, `/todo`, and `/finance` in a browser at desktop and mobile widths against the three root HTML prototypes.
- [ ] 6.4 Verify authenticated loading, API error, empty data, and populated data states for all three pages.
- [ ] 6.5 Review `git diff` to confirm only intended files changed and no unrelated changes were introduced.

## 7. Documentation

- [x] 7.1 Update project or module documentation affected by the implementation, including frontend page locations and changed backend behavior.
- [ ] 7.2 Document any intentional deviation from `index.html`, `todo.html`, or `accounting.html` with rationale in the relevant project documentation.
