import React from 'react'
import { useAuth } from './useAuth'

export function ProtectedRoute({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { token, sessionChecked } = useAuth()
  if (!sessionChecked) return fallback
  if (!token) return fallback
  return <>{children}</>
}
