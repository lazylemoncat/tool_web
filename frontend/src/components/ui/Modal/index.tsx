import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import IconButton from '../IconButton'
import './styles.css'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  dismissible?: boolean
  closeOnOverlayClick?: boolean
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  dismissible = true,
  closeOnOverlayClick = true,
  children,
  footer,
  className = '',
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ui-modal-overlay" />
        <Dialog.Content
          className={`ui-modal ui-modal-${size} ${className}`}
          onPointerDownOutside={(e: Event) => { if (!closeOnOverlayClick) e.preventDefault() }}
          onInteractOutside={(e: Event) => { if (!closeOnOverlayClick) e.preventDefault() }}
        >
          {(title || description) && (
            <div className="ui-modal-header">
              <div className="ui-modal-titles">
                {title && <Dialog.Title className="ui-modal-title">{title}</Dialog.Title>}
                {description && <Dialog.Description className="ui-modal-description">{description}</Dialog.Description>}
              </div>
              {dismissible && (
                <Dialog.Close asChild>
                  <IconButton aria-label="Close" size="lg" className="modal-close">✕</IconButton>
                </Dialog.Close>
              )}
            </div>
          )}
          <div className="ui-modal-body">{children}</div>
          {footer && <div className="ui-modal-footer">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default Modal
