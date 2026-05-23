import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { registerUI } from '../../../runtime/themeBridge'
import './styles.css'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastOptions {
  message: string
  variant?: ToastVariant
  duration?: number
}

type ToastFn = (opts: ToastOptions) => void

const ToastContext = createContext<ToastFn | null>(null)

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>')
  return ctx
}

interface ToastItem extends ToastOptions {
  id: number
}

let _id = 0

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback<ToastFn>((opts) => {
    const id = ++_id
    setItems((arr) => [...arr, { ...opts, id }])
  }, [])

  const remove = (id: number) => {
    setItems((arr) => arr.filter((i) => i.id !== id))
  }

  useEffect(() => {
    registerUI({ toast: push })
  }, [push])

  return (
    <ToastContext.Provider value={push}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
        {children}
        {items.map((it) => (
          <ToastPrimitive.Root
            key={it.id}
            className={`ui-toast ui-toast-${it.variant ?? 'info'}`}
            duration={it.duration}
            onOpenChange={(open: boolean) => { if (!open) remove(it.id) }}
          >
            <ToastPrimitive.Title className="ui-toast-title">
              {it.message}
            </ToastPrimitive.Title>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="ui-toast-viewport" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}
