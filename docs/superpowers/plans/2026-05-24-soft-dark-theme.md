# Soft Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3rd built-in theme option "Soft Dark" (柔和深色) using Radix Olive gray + Grass accent with warm green undertones.

**Architecture:** Extend existing 3-value `Theme` type to 4 values (`'light' | 'dark' | 'soft-dark' | 'system'`), add `[data-theme="soft-dark"]` CSS block in `semantic.css`, and update UI in ThemeManager + Sidebar.

**Tech Stack:** CSS custom properties, TypeScript, React

---

### Task 1: Add i18n keys

**Files:**
- Modify: `frontend/src/locales/en.json`
- Modify: `frontend/src/locales/zh.json`

- [ ] **Step 1: Add English key**

In `en.json`, after `"dark": "Dark"` (settings section), add:

```json
"softDark": "Soft Dark",
```

- [ ] **Step 2: Add Chinese key**

In `zh.json`, after `"dark": "深色"` (settings section), add:

```json
"softDark": "柔和深色",
```

- [ ] **Step 3: Verify**

```bash
node -e "console.log(require('./frontend/src/locales/en.json').settings.softDark)"
```
Expected: `Soft Dark`

```bash
node -e "console.log(require('./frontend/src/locales/zh.json').settings.softDark)"
```
Expected: `柔和深色`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/locales/en.json frontend/src/locales/zh.json
git commit -m "feat: add soft-dark theme i18n keys"
```

---

### Task 2: Extend Theme type and applyTheme()

**Files:**
- Modify: `frontend/src/theme.ts` (lines 1-20 approximately)

- [ ] **Step 1: Update Theme type**

Change line ~6 from:
```ts
export type Theme = 'light' | 'dark' | 'system'
```
to:
```ts
export type Theme = 'light' | 'dark' | 'soft-dark' | 'system'
```

- [ ] **Step 2: Update applyTheme() to handle soft-dark**

The current `applyTheme()` function resolves `'system'` via `prefers-color-scheme` and sets `data-theme` to `'light'` or `'dark'`. For `'soft-dark'`, it should set `data-theme="soft-dark"` directly (like `'dark'`).

Current code (~line 10-16):
```ts
export function applyTheme(theme: Theme) {
  let resolved: string
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } else {
    resolved = theme
  }
  document.documentElement.dataset.theme = resolved
}
```

No change needed — the else branch already handles `'soft-dark'` by passing it directly to `data-theme`. Only the type needs updating.

- [ ] **Step 3: Verify TypeScript compile**

```bash
cd frontend && npx tsc --noEmit
```
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/theme.ts
git commit -m "feat: add soft-dark to Theme type"
```

---

### Task 3: Add soft-dark CSS tokens

**Files:**
- Modify: `frontend/src/styles/tokens/semantic.css`

- [ ] **Step 1: Add `[data-theme="soft-dark"]` block**

At the end of `semantic.css`, after the existing `[data-theme="dark"]` block, add:

```css
/* ─── Soft Dark (Olive gray + Grass accent) ─── */
[data-theme="soft-dark"] {
  color-scheme: dark;

  /* ── Olive scale (green-gray) replaces Slate as neutral ── */
  --color-gray-1: #161e11;
  --color-gray-2: #1c2019;
  --color-gray-3: #232b21;
  --color-gray-4: #2b3328;
  --color-gray-5: #313b2e;
  --color-gray-6: #394435;
  --color-gray-7: #45503f;
  --color-gray-8: #596350;
  --color-gray-9: #6e7965;
  --color-gray-10: #7b8672;
  --color-gray-11: #b3bcab;
  --color-gray-12: #f3f5f2;

  /* ── Grass scale (warm green) replaces Indigo as accent ── */
  --color-accent-1: #0d3618;
  --color-accent-2: #133f1f;
  --color-accent-3: #1b4d28;
  --color-accent-4: #215a30;
  --color-accent-5: #276838;
  --color-accent-6: #2f7841;
  --color-accent-7: #388a4d;
  --color-accent-8: #409e58;
  --color-accent-9: #2eb15c;
  --color-accent-10: #1f8a40;
  --color-accent-11: #68cc80;
  --color-accent-12: #eaf7ec;

  /* ── Semantic overrides ── */
  --color-bg: var(--color-gray-1);
  --color-bg-elevated: var(--color-gray-2);
  --color-bg-sunken: #111712;
  --color-bg-hover: var(--color-gray-3);
  --color-bg-active: var(--color-gray-4);
  --color-bg-overlay: rgba(14, 18, 12, 0.65);

  --color-fg: var(--color-gray-12);
  --color-fg-muted: var(--color-gray-11);
  --color-fg-subtle: var(--color-gray-10);
  --color-fg-on-accent: #ffffff;

  --color-border: var(--color-gray-4);
  --color-border-strong: var(--color-gray-6);
  --color-border-focus: var(--color-accent-8);

  --color-accent: var(--color-accent-9);
  --color-accent-hover: var(--color-accent-10);
  --color-accent-active: var(--color-accent-8);
  --color-accent-subtle: var(--color-accent-3);
  --color-accent-muted: var(--color-accent-2);

  --color-success: #2eb15c;
  --color-success-hover: #1f8a40;
  --color-success-fg: #eaf7ec;
  --color-danger: #e5484d;
  --color-danger-hover: #dc3e42;
  --color-danger-fg: #feecee;
  --color-warning: #f5b047;
  --color-warning-hover: #e09b2e;
  --color-warning-fg: #fef3e0;
  --color-info: #46a758;
  --color-info-hover: #3b924b;
  --color-info-fg: #eaf7ec;

  --color-income: #2eb15c;
  --color-expense: #e5484d;

  --color-priority-high: var(--color-danger);
  --color-priority-high-bg: #3b1618;
  --color-priority-medium: var(--color-warning);
  --color-priority-medium-bg: #3b2e16;
  --color-priority-low: var(--color-gray-11);
  --color-priority-low-bg: var(--color-gray-3);

  --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-2: 0 2px 8px rgba(0, 0, 0, 0.35);
  --shadow-3: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-4: 0 8px 24px rgba(0, 0, 0, 0.45);
  --shadow-5: 0 12px 32px rgba(0, 0, 0, 0.5);
}
```

- [ ] **Step 2: Verify CSS syntax**

```bash
cd frontend && npx tsc --noEmit
```
Expected: zero errors (CSS is not type-checked but vite build catches syntax issues)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/tokens/semantic.css
git commit -m "feat: add soft-dark CSS tokens (Olive + Grass)"
```

---

### Task 4: Add soft-dark option to Settings ThemeManager

**Files:**
- Modify: `frontend/src/components/settings/ThemeManager.tsx`

- [ ] **Step 1: Add 4th radio button**

The ThemeManager renders radio buttons for `light`, `dark`, `system`. Add `soft-dark` between `dark` and `system`.

Find the radio group section (around the `settings-radio-group` div). The current structure maps over themes or has inline buttons. Add:

```tsx
<label className={`settings-radio ${theme === 'soft-dark' ? 'checked' : ''}`}>
  <input
    type="radio"
    name="theme"
    value="soft-dark"
    checked={theme === 'soft-dark'}
    onChange={() => {
      saveTheme('soft-dark')
      onThemeChange('soft-dark', null)
    }}
  />
  {t('settings.softDark')}
</label>
```

Place it between the `dark` and `system` radio buttons in the existing radio group.

- [ ] **Step 2: Verify TypeScript compile**

```bash
cd frontend && npx tsc --noEmit
```
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/settings/ThemeManager.tsx
git commit -m "feat: add soft-dark option to ThemeManager settings"
```

---

### Task 5: Add soft-dark button to Sidebar quick-toggle

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add 4th theme toggle button**

The Sidebar renders quick-toggle buttons in `sidebar-theme-btns`. Find the existing three buttons (light, dark, system) and add `soft-dark` between dark and system.

Current pattern (each button):
```tsx
<button
  className="sidebar-theme-btn"
  onClick={() => handleThemeChange('dark')}
  title={t('settings.dark')}
>
  {t('settings.dark').charAt(0)}
</button>
```

Add after the dark button:
```tsx
<button
  className="sidebar-theme-btn"
  onClick={() => handleThemeChange('soft-dark')}
  title={t('settings.softDark')}
>
  {t('settings.softDark').charAt(0)}
</button>
```

- [ ] **Step 2: Verify TypeScript compile**

```bash
cd frontend && npx tsc --noEmit
```
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: add soft-dark quick-toggle to Sidebar"
```

---

### Task 6: End-to-end verification

- [ ] **Step 1: Build check**

```bash
cd frontend && npm run build
```
Expected: tsc + vite build both pass, zero errors

- [ ] **Step 2: Manual verification checklist**

1. `npm run dev` → open `http://localhost:5173`
2. Settings page → 4 theme options visible: Light / Soft Dark / Dark / System
3. Sidebar → 4 quick-toggle buttons
4. Select "Soft Dark" → background turns warm dark green (`#161e11`), accent turns grass green (`#2eb15c`)
5. Select "Dark" → background returns to cold slate (`#111113`)
6. Select "Soft Dark", refresh page → persists via localStorage
7. Navigate Finance page → cards, tables, forms render correctly in soft dark
8. Navigate Todo page → todo items, forms, modals render correctly

- [ ] **Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final verification of soft-dark theme"
```
