import React, { forwardRef } from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import './styles.css'

export interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  children,
  align = 'center',
  side = 'bottom',
  className = '',
}) => {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className={`ui-dropdown-menu ${className}`}
          align={align}
          side={side}
          sideOffset={4}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}

export const DropdownMenuItem = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { danger?: boolean }
>(({ className = '', danger, children, ...props }, ref) => {
  const cls = ['ui-dropdown-item', danger ? 'ui-dropdown-item-danger' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <DropdownMenuPrimitive.Item ref={ref} className={cls} {...props}>
      {children}
    </DropdownMenuPrimitive.Item>
  )
})
DropdownMenuItem.displayName = 'DropdownMenuItem'

export const DropdownMenuSeparator: React.FC = () => (
  <DropdownMenuPrimitive.Separator className="ui-dropdown-separator" />
)

export const DropdownMenuLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DropdownMenuPrimitive.Label className="ui-dropdown-label">{children}</DropdownMenuPrimitive.Label>
)

export const DropdownMenuSub: React.FC<{
  trigger: React.ReactNode
  children: React.ReactNode
}> = ({ trigger, children }) => (
  <DropdownMenuPrimitive.Sub>
    <DropdownMenuPrimitive.SubTrigger asChild className="ui-dropdown-item ui-dropdown-sub-trigger">
      {trigger}
    </DropdownMenuPrimitive.SubTrigger>
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent className="ui-dropdown-menu ui-dropdown-sub-content">
        {children}
      </DropdownMenuPrimitive.SubContent>
    </DropdownMenuPrimitive.Portal>
  </DropdownMenuPrimitive.Sub>
)

export default DropdownMenu
