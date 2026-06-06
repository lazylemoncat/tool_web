---
name: codegraph-workflow
description: Use this skill whenever the user asks to search, understand, trace, impact-analyze, or modify code in a repository that uses CodeGraph. This includes locating files or symbols, checking call relationships, syncing `.codegraph`, using `codegraph context/query/callers/callees/impact`, and deciding when to fall back to `rg` or direct file reads.
---

# CodeGraph Workflow

Use CodeGraph as the first code intelligence layer before raw text search when the repository has or should have a `.codegraph/` index.

## Repository First Steps

1. Confirm the current working directory is the intended repository.
2. Confirm the current Git branch before code search or edits.
3. Check whether `.codegraph/` exists.
4. If the index is missing or likely stale, initialize or sync it before doing architecture, symbol, or impact analysis.

For this workspace, the main target repository is:

```text
C:\Users\pc6\Desktop\work2\tool_web\tool_web
```

## Index Setup

Initialize when `.codegraph/` is absent:

```powershell
codegraph init -i C:\Users\pc6\Desktop\work2\tool_web\tool_web
```

Check status:

```powershell
codegraph status C:\Users\pc6\Desktop\work2\tool_web\tool_web
```

Sync when files changed or the index may be stale:

```powershell
codegraph sync C:\Users\pc6\Desktop\work2\tool_web\tool_web
```

Do not commit `.codegraph/`. It is a local index directory.

## Search Strategy

Use CodeGraph first for semantic code questions:

- "Where is X implemented?" -> `codegraph query` or `codegraph context`.
- "How does this feature work?" -> `codegraph context`, then inspect the most relevant files.
- "What calls this?" -> `codegraph callers`.
- "What does this call?" -> `codegraph callees`.
- "What breaks if I change this?" -> `codegraph impact`.
- "Trace how A reaches B" -> use trace/path tooling if available, otherwise combine context with callers/callees.

Use `rg` after CodeGraph when:

- The symbol is not indexed.
- You need exact text, literals, CSS class names, route strings, docs, or config keys.
- You need to confirm current file contents after recent edits.
- You are searching non-code files or generated assets.

Read files directly after narrowing candidates with CodeGraph or `rg`. Avoid broad manual file-reading loops when CodeGraph can answer the relationship question.

## Working Pattern For Code Changes

1. Use CodeGraph to locate the feature entry points and related symbols.
2. Read the specific files that will be edited.
3. Make narrowly scoped edits in the target branch only.
4. Sync or re-check CodeGraph only if another round of relationship analysis is needed after edits.
5. Run the focused tests or build checks relevant to the change.
6. Run `git diff` to verify only intended lines changed.
7. Update related project documentation if repository rules require it.

## Handling Stale Or Partial Results

If CodeGraph output looks incomplete:

1. Run `codegraph status`.
2. Sync the index.
3. Retry the CodeGraph query.
4. Fall back to `rg` and direct file reads only for the missing detail.

If a file was edited after the last index sync, trust direct file reads for that file until the index catches up.

## Git And Branch Discipline

CodeGraph helps with discovery only. It does not relax repository Git rules:

- Do not create, merge, delete, or tag branches without explicit user instruction.
- Do not commit or push unless the user authorizes it.
- Do not modify long-lived or release branches directly.
- If the user asks to work on a feature branch, switch only when instructed and confirm the branch before searching or editing.

## Example: Locate A Finance Page

1. Confirm the branch.
2. Run CodeGraph context/query for finance page names or route concepts.
3. Inspect likely entries such as:

```text
frontend/src/pages/finance/FinanceLayout.tsx
frontend/src/pages/finance/DashboardPage.tsx
frontend/src/pages/finance/TransactionsPage.tsx
frontend/src/components/finance/
```

4. Use `rg` for route strings, CSS classes, UI labels, or docs that CodeGraph does not index well.
5. Read only the files needed for the requested change.
