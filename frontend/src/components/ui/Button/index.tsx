import React, { forwardRef } from 'react'
import Spinner from '../Spinner'
import './styles.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  children?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      iconLeft,
      iconRight,
      children,
      className = '',
      disabled,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const cls = [
      'ui-btn',
      `ui-btn-${variant}`,
      `ui-btn-${size}`,
      fullWidth ? 'ui-btn-full' : '',
      loading ? 'ui-btn-loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        type={type}
        className={cls}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading && <Spinner size="sm" className="ui-btn-spinner" />}
        {!loading && iconLeft && <span className="ui-btn-icon ui-btn-icon-left">{iconLeft}</span>}
        {children && <span className="ui-btn-label">{children}</span>}
        {!loading && iconRight && <span className="ui-btn-icon ui-btn-icon-right">{iconRight}</span>}
      </button>
    )
  },
)
Button.displayName = 'Button'

export default Button
