# UI 组件库

## 通用组件

所有组件基于 Radix headless + 项目 CSS token 系统. 禁止硬编码颜色/阴影/圆角, 必须使用 CSS 变量 token.

### Modal
- 文件: `Modal/index.tsx`
- 基于: `@radix-ui/react-dialog`
- Props: `open`, `onOpenChange`, `title`, `description`, `size` (sm|md|lg|xl|full), `dismissible` (boolean, 默认 true), `closeOnOverlayClick`, `footer`, `className`
- 关闭按钮: 42×42px (WCAG AA), 使用 `.modal-close` 样式类
- Token: `--color-bg-overlay`, `--color-bg-elevated`, `--shadow-5`, `--radius-lg`

### Drawer
- 文件: `Drawer/index.tsx`
- 基于: `@radix-ui/react-dialog`
- Props: `open`, `onOpenChange`, `side` (right|left|bottom), `stackLevel` (0-3), `title`, `description`, `footer`, `className`
- 栈支持: stackLevel 1-3 使用 `--z-drawer-stack-1..3`
- Token: `--radius-drawer`, `--z-drawer-stack-*`

### DropdownMenu
- 文件: `DropdownMenu/index.tsx`
- 基于: `@radix-ui/react-dropdown-menu`
- 导出: `DropdownMenu` (default), `DropdownMenuItem` (含 danger 变体), `DropdownMenuSeparator`, `DropdownMenuLabel`, `DropdownMenuSub`
- Props: `trigger` (ReactNode), `align` (start|center|end), `side` (top|right|bottom|left)
- Token: `--shadow-elevated`, `--z-popover`

### FormFooter
- 文件: `FormFooter/index.tsx`
- Props: `onCancel`, `onSubmit`, `submitLabel` (默认 `t('app.confirm')`), `cancelLabel` (默认 `t('app.cancel')`), `submitting`, `disabled`, `danger`, `extraLeft`
- 复用 Button variant 体系 (primary/secondary/danger)
- 用于 Modal/Drawer footer 插槽, 统一表单提交区布局

### Toast
- 文件: `Toast/index.tsx`
- 基于: `@radix-ui/react-toast`
- 导出: `ToastProvider`, `useToast()`
- Variants: info|success|warning|error
- 兼容层: `components/common/Toast.tsx` 提供 `toast(message, type)` 旧 API, 转发至 ui Toast

### 其他组件
- Button, IconButton, Input, Textarea, NumberInput, Select, Combobox
- ConfirmDialog (命令式 `useConfirm()`), Tooltip, Popover, Tabs
- Card, Badge, Avatar, FormField, FormFooter, Skeleton, EmptyState, Spinner
