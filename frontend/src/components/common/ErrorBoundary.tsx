import React, { Component } from 'react'
import { useLocale } from '../../i18n'
import { Button } from '../ui'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundaryInner extends Component<Props & { t: (key: string) => string }, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 16,
          padding: 24,
          textAlign: 'center',
        }}>
          <h2>{this.props.t('errors.unexpectedTitle')}</h2>
          <p style={{ color: 'var(--color-fg-muted)' }}>
            {this.state.error?.message || this.props.t('errors.unexpectedMessage')}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
          >
            {this.props.t('errors.reload')}
          </Button>
        </div>
      )
    }
    return this.props.children as React.ReactNode
  }
}

const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const { t } = useLocale()
  return <ErrorBoundaryInner t={t}>{children}</ErrorBoundaryInner>
}

export default ErrorBoundary
