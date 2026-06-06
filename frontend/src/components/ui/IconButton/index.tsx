import React, { forwardRef } from 'react'
import './styles.css'

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  /** 必填: 屏幕阅读器读出的描述 */
  'aria-label': string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'secondary' | 'danger' | 'primary'
  children: React.ReactNode
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', variant = 'ghost', children, className = '', type = 'button', ...rest }, ref) => {
    const cls = ['ui-icon-btn', `ui-icon-btn-${size}`, `ui-icon-btn-${variant}`, className]
      .filter(Boolean)
      .join(' ')
    return (
      <button ref={ref} type={type} className={cls} {...rest}>
        {children}
      </button>
    )
  },
)
IconButton.displayName = 'IconButton'

export default IconButton
