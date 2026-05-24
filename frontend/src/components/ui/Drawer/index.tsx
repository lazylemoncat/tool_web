import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import IconButton from '../IconButton'
import './styles.css'

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: 'left' | 'right' | 'bottom'
  stackLevel?: number
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

const Drawer: React.FC<DrawerProps> = ({
  open,
  onOpenChange,
  side = 'right',
  stackLevel = 0,
  title,
  description,
  children,
  footer,
  className = '',
}) => {
  const stackLevelClamped = Math.min(3, Math.max(0, stackLevel))
  const style = stackLevelClamped > 0
    ? { zIndex: `var(--z-drawer-stack-${stackLevelClamped})` } as React.CSSProperties
    : undefined

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ui-drawer-overlay" style={style} />
        <Dialog.Content className={`ui-drawer ui-drawer-${side} ${className}`} style={style}>
          {(title || description) && (
            <div className="ui-drawer-header">
              <div className="ui-drawer-titles">
                {title && <Dialog.Title className="ui-drawer-title">{title}</Dialog.Title>}
                {description && <Dialog.Description className="ui-drawer-description">{description}</Dialog.Description>}
              </div>
              <Dialog.Close asChild>
                <IconButton aria-label="Close" size="lg" className="modal-close">✕</IconButton>
              </Dialog.Close>
            </div>
          )}
          <div className="ui-drawer-body">{children}</div>
          {footer && <div className="ui-drawer-footer">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default Drawer
