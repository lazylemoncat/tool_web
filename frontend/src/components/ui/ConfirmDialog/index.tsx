import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import Modal from '../Modal'
import Button from '../Button'
import { registerUI } from '../../../runtime/themeBridge'
import { useLocale } from '../../../i18n'

export interface ConfirmOptions {
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be inside <ConfirmDialogProvider>')
  return ctx
}

interface State extends ConfirmOptions {
  open: boolean
}

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLocale()
  const [state, setState] = useState<State>({ open: false })
  const resolverRef = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setState({ ...opts, open: true })
    })
  }, [])

  const handleClose = (result: boolean) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setState((s) => ({ ...s, open: false }))
  }

  // 注册到 themeBridge, 让主题脚本可调用 toolweb.ui.confirm
  React.useEffect(() => {
    registerUI({ confirm })
  }, [confirm])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={state.open}
        onOpenChange={(o) => { if (!o) handleClose(false) }}
        size="sm"
        title={state.title ?? t('ui.confirm.defaultTitle')}
        description={state.description}
        footer={
          <>
            <Button variant="ghost" onClick={() => handleClose(false)}>
              {state.cancelLabel ?? t('ui.confirm.cancel')}
            </Button>
            <Button
              variant={state.danger ? 'danger' : 'primary'}
              onClick={() => handleClose(true)}
              autoFocus
            >
              {state.confirmLabel ?? t('ui.confirm.confirm')}
            </Button>
          </>
        }
      />
    </ConfirmContext.Provider>
  )
}
