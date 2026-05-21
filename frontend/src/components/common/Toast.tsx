import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
})

let nextId = 0

const bgMap: Record<ToastType, string> = {
  success: '#4a7c59',
  error: '#c44e4e',
  warning: '#c4943a',
  info: '#6b8cce',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: bgMap[t.type],
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              animation: 'fadeIn 0.2s ease',
              cursor: 'pointer',
            }}
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
