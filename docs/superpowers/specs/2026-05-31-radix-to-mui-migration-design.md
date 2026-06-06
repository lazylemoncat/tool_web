# Radix UI → MUI Migration Design

## Context

Current project uses dual UI library (Radix + MUI). This causes:
- 2× bundle size for overlapping functionality
- Inconsistent behavior (Radix Popover has boundary collision issues)
- Maintenance overhead across two styling paradigms

Goal: Replace all Radix usage with MUI equivalents. All MUI packages already installed (`@mui/material` v9).

## Migration Scope

### 4 active Radix wrappers → MUI rewrite

| # | Component | Radix | MUI | Complexity |
|---|-----------|-------|-----|------------|
| 1 | Popover | `@radix-ui/react-popover` | `Popover` from `@mui/material` | Low |
| 2 | Combobox | `@radix-ui/react-popover` (internal) | `Popover` from `@mui/material` | Medium |
| 3 | Tooltip | `@radix-ui/react-tooltip` | `Tooltip` from `@mui/material` | Low |
| 4 | DropdownMenu | `@radix-ui/react-dropdown-menu` | `Menu` + `MenuItem` from `@mui/material` | Medium |
| 5 | Toast | `@radix-ui/react-toast` | `Snackbar` + custom Provider | High |

### 3 dead packages → remove

- `@radix-ui/react-dialog` — unused (MUI Dialog already in Modal)
- `@radix-ui/react-select` — unused (MUI Select already used)
- `@radix-ui/react-tabs` — unused (MUI Tabs already used)

### CSS files → clean Radix references

- `Combobox/styles.css` line 39: `var(--radix-popover-trigger-width)` → `var(--ui-trigger-width)` custom var
- `Toast/styles.css` lines 32-34: swipe-related rules → remove (MUI Snackbar no swipe)
- `Select/styles.css`: Radix `[data-state]` selectors → dead code, remove

---

## Component Migration Details

### 1. Popover (`ui/Popover/index.tsx`)

**Current API (keep unchanged):**
```ts
interface PopoverProps {
  trigger: React.ReactNode
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}
```

**MUI implementation:**
- Use `useState` for internal anchorEl ref
- `trigger` rendered with ref callback to capture anchor element
- Map `side`+`align` → MUI `anchorOrigin` + `transformOrigin`:
  - side=bottom align=start → anchorOrigin: {vertical:'bottom', horizontal:'left'}, transformOrigin: {vertical:'top', horizontal:'left'}
  - side=bottom align=center → both horizontal:'center'
  - ...and so on for all 12 combinations
- Keep `open`/`onOpenChange` controlled mode
- `className` applied to MUI Popover `PaperProps`

**CSS:** Keep `.ui-popover` styles, apply via `PaperProps.sx` or `className`.

### 2. Combobox (`ui/Combobox/index.tsx`)

Internally uses `PopoverPrimitive.Root/Trigger/Portal/Content`. Replace with MUI `Popover`.

**Key changes:**
- `PopoverPrimitive.Root` → `<Popover open={open} onClose={() => setOpen(false)} anchorEl={anchorEl}>`
- `PopoverPrimitive.Trigger` → trigger button with `ref={setAnchorEl}`
- `PopoverPrimitive.Content` → `<Popover>` children (auto-portal via MuiProvider config)
- CSS line 39: replace `var(--radix-popover-trigger-width)` → `var(--ui-trigger-width)` set via inline style or custom CSS var

**Consumer:** UIPreviewPage.tsx only. API unchanged.

### 3. Tooltip (`ui/Tooltip/index.tsx`)

**Current API:**
```ts
interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  delayDuration?: number
  disabled?: boolean
}
```

**MUI implementation:**
- Wrap children in MUI `<Tooltip title={content} placement={side} enterDelay={delayDuration}>`
- `disabled` → render children without wrapper
- `TooltipProvider` → replace with MUI theme `defaultProps` or simple pass-through (current usage in `app.tsx` has no config — just wraps children)
- Arrow via MUI Tooltip `arrow` prop

**CSS:** Remove `.ui-tooltip` and `.ui-tooltip-arrow`. MUI Tooltip uses its own styling via `slotProps.tooltip.sx`.

**Consumers (API unchanged):**
- `app.tsx` → `TooltipProvider` becomes no-op or removed from tree
- `UIPreviewPage.tsx`
- `TxSplitSection.tsx`

### 4. DropdownMenu (`ui/DropdownMenu/index.tsx`)

**Current exported API:**
```ts
DropdownMenu (root, props: { trigger, children, align, side, className })
DropdownMenuItem (props: { onClick, danger, children, ... })
DropdownMenuSeparator ()
DropdownMenuLabel (props: { children })
DropdownMenuSub (props: { trigger, children }) // nested submenu
```

**MUI implementation:**

Root (`DropdownMenu`):
- `useState` for anchorEl + open state (if not controlled)
- `trigger` rendered with `onClick={e => setAnchorEl(e.currentTarget)}`
- `<Menu anchorEl={anchorEl} open={open} onClose={close}>` wrapping children

Items:
- `DropdownMenuItem` → `<MenuItem>` with `onClick` + close menu
- `danger` prop → red color via `sx`
- `DropdownMenuSeparator` → `<Divider>`
- `DropdownMenuLabel` → `<ListSubheader>` or styled `<MenuItem disabled>`

Sub menu:
- `DropdownMenuSub` → nested `<Menu>` triggered from `<MenuItem>` hover/click

**CSS:** Keep most `.ui-dropdown-*` classes for custom styling. Apply via MUI `className` or `sx`.

**Consumers (API unchanged):**
- `Header.tsx` lines 31-52
- `AppTopBar.tsx` lines 94-117

### 5. Toast (`ui/Toast/index.tsx`)

**Current API:**
```ts
ToastProvider: wraps app
useToast(): (opts: ToastOptions) => void
ToastOptions: { message, variant?, duration? }
ToastVariant: 'info' | 'success' | 'warning' | 'error'
```

**MUI implementation — custom SnackbarProvider:**

Since MUI Snackbar is declarative (no imperative `toast()` call), build a provider pattern:

```tsx
// SnackbarProvider manages queue of toasts
const SnackbarProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  
  const enqueue = (opts) => {
    const id = ++counter
    setToasts(prev => [...prev, { ...opts, id }])
  }
  
  const close = (id) => setToasts(prev => prev.filter(t => t.id !== id))
  
  return (
    <ToastContext.Provider value={enqueue}>
      {children}
      {toasts.map((t, i) => (
        <Snackbar
          key={t.id}
          open
          autoHideDuration={t.duration ?? 4000}
          onClose={() => close(t.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          style={{ marginBottom: i * 56 }}
        >
          <Alert severity={variantMap[t.variant]} onClose={() => close(t.id)} variant="filled">
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  )
}
```

**Behavior changes (acceptable):**
- No swipe-to-dismiss (MUI Snackbar has no swipe). Close via button or auto-dismiss.
- Stacking via `marginBottom` offset instead of flex column
- `registerUI({ toast: push })` → keep, call `push` from `enqueue`

**CSS:** Keep `.ui-toast-viewport` positioning. `.ui-toast` styles may be replaced by MUI Alert styling. Remove `[data-swipe]` rules.

**Consumers (API unchanged — useToast() signature same):**
- 7 files using `useToast()`: `SubTxDrawer`, `TransactionDetail`, `TransactionForm`, `TxCard`, `TxChildrenDrawer`, `TxSplitSection`, `UIPreviewPage`
- `app.tsx`: `ToastProvider` → `SnackbarProvider`
- `common/Toast.tsx`: compatibility wrapper

### 6. `ui/index.ts` — export updates

Remove no-longer-existing Radix-based exports. Tooltip exports change:
- Keep: `Tooltip` (default export), `TooltipProps`
- Change: `TooltipProvider` → remove (no longer needed or becomes pass-through)
- Remove `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuLabel`, `DropdownMenuSub` if internalized

---

## Implementation Order

1. **Popover** — simplest, validates pattern
2. **Combobox** — depends on Popover, validates MUI Popover in real use
3. **Tooltip** — independent, simple
4. **DropdownMenu** — most consumer files, validates Menu API match
5. **Toast** — most complex, custom provider
6. **Cleanup** — remove 3 dead Radix packages, remove dead CSS, update import index

---

## Files Checklist

**Modified (5 component dirs):**
- `src/components/ui/Popover/index.tsx`
- `src/components/ui/Popover/styles.css`
- `src/components/ui/Combobox/index.tsx`
- `src/components/ui/Combobox/styles.css`
- `src/components/ui/Tooltip/index.tsx`
- `src/components/ui/Tooltip/styles.css`
- `src/components/ui/DropdownMenu/index.tsx`
- `src/components/ui/DropdownMenu/styles.css`
- `src/components/ui/Toast/index.tsx`
- `src/components/ui/Toast/styles.css`
- `src/components/ui/index.ts`
- `src/components/ui/Select/styles.css` (dead Radix CSS removal)

**Consumer files needing update (if API changes):**
- `src/app.tsx` — ToastProvider/TooltipProvider rename
- `src/components/layout/Header.tsx` — DropdownMenu imports
- `src/components/layout/AppTopBar.tsx` — DropdownMenu imports

**Build files:**
- `frontend/package.json` — remove 3 dead Radix deps

---

## Verification

1. `pnpm install` — no Radix packages remain in node_modules
2. `pnpm tsc --noEmit` — type-check passes
3. `pnpm build` — Umi build succeeds
4. Manual check: open popover/dropdown near viewport edge — no overflow
5. Manual check: trigger toast — appears, auto-dismisses, stacks correctly
6. Manual check: tooltip hover — shows with arrow
