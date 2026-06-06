import React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import './styles.css'

export interface PopoverProps {
  trigger: React.ReactNode
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}

const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  open,
  onOpenChange,
  side = 'bottom',
  align = 'start',
  className = '',
}) => {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={`ui-popover ${className}`}
          side={side}
          align={align}
          sideOffset={6}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export default Popover
