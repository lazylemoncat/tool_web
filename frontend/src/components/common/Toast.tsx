/*
 兼容层: 老调用方 `toast(message, type)` 适配到新 ui Toast `toast({ message, variant })`.
 ToastProvider 已被 ui 层 UIToastProvider 替代, 此处仅作 pass-through 以减少调用方改动.
*/

import React from 'react'
import { useToast as useUIToast } from '../ui'

type ToastType = 'success' | 'error' | 'warning' | 'info'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function useToast() {
  const toast = useUIToast()
  return {
    toast: (message: string, type: ToastType = 'info') =>
      toast({ message, variant: type }),
  }
}
