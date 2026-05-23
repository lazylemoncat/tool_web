import React from 'react'
import './styles.css'

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'info'

export interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', size = 'md', children, className = '' }) => {
  return (
    <span className={`ui-badge ui-badge-${variant} ui-badge-${size} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
