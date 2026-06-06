import React from 'react'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import { ToastProvider } from './components/common/Toast'
import {
  ToastProvider as UIToastProvider,
  TooltipProvider,
} from './components/ui'
import { installThemeBridge, registerTheme } from './runtime/themeBridge'
import { getActiveConfig, getCurrentPage, switchPage } from './themeEngine'
import './styles/index.css'

installThemeBridge()
registerTheme({ getActiveConfig, getCurrentPage, switchPage })

export function rootContainer(container: React.ReactNode) {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <UIToastProvider>
          <ToastProvider>
            <AuthProvider>{container}</AuthProvider>
          </ToastProvider>
        </UIToastProvider>
      </TooltipProvider>
    </ErrorBoundary>
  )
}
