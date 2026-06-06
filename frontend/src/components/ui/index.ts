/*
 ui/index.ts - 通用组件统一导出.
 通用组件库基于 Radix headless + 项目 CSS, 全部组件直接使用语义 token.
 命令式入口 (ConfirmDialog/Toast) 通过 themeBridge 暴露到 window.toolweb.ui 给主题脚本使用.
*/

export { default as Button } from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'

export { default as IconButton } from './IconButton'
export type { IconButtonProps } from './IconButton'

export { default as Input } from './Input'
export type { InputProps } from './Input'

export { default as Textarea } from './Textarea'
export type { TextareaProps } from './Textarea'

export { default as NumberInput } from './NumberInput'
export type { NumberInputProps } from './NumberInput'

export { default as Select } from './Select'
export type { SelectProps, SelectOption } from './Select'

export { default as Combobox } from './Combobox'
export type { ComboboxProps, ComboboxOption } from './Combobox'

export { default as Modal } from './Modal'
export type { ModalProps } from './Modal'

export { default as Drawer } from './Drawer'
export type { DrawerProps } from './Drawer'

export { ConfirmDialogProvider, useConfirm } from './ConfirmDialog'
export type { ConfirmOptions } from './ConfirmDialog'

export { ToastProvider, useToast } from './Toast'
export type { ToastVariant, ToastOptions } from './Toast'

export { default as Tooltip, TooltipProvider } from './Tooltip'
export type { TooltipProps } from './Tooltip'

export { default as Popover } from './Popover'
export type { PopoverProps } from './Popover'

export { default as Tabs } from './Tabs'
export type { TabsProps, TabItem } from './Tabs'

export { default as Skeleton } from './Skeleton'
export type { SkeletonProps } from './Skeleton'

export { default as EmptyState } from './EmptyState'
export type { EmptyStateProps } from './EmptyState'

export { default as Spinner } from './Spinner'
export type { SpinnerProps } from './Spinner'

export { default as Card, CardHeader, CardBody, CardFooter } from './Card'
export type { CardProps } from './Card'

export { default as Badge } from './Badge'
export type { BadgeProps, BadgeVariant } from './Badge'

export { default as DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuSub } from './DropdownMenu'
export type { DropdownMenuProps } from './DropdownMenu'

export { default as Avatar } from './Avatar'
export type { AvatarProps } from './Avatar'

export { default as FormField, useFormField } from './FormField'
export type { FormFieldProps } from './FormField'

export { default as FormFooter } from './FormFooter'
export type { FormFooterProps } from './FormFooter'
