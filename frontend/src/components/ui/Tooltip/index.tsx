import React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import './styles.css'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  delayDuration?: number
  disabled?: boolean
}

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TooltipPrimitive.Provider delayDuration={300}>{children}</TooltipPrimitive.Provider>
)

const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top', delayDuration, disabled }) => {
  if (disabled) return <>{children}</>
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content side={side} className="ui-tooltip" sideOffset={6}>
          {content}
          <TooltipPrimitive.Arrow className="ui-tooltip-arrow" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export default Tooltip
