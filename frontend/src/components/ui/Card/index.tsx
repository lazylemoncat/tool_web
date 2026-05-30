import React from 'react'
import './styles.css'

export interface CardProps {
  variant?: 'flat' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

const Card: React.FC<CardProps> = ({
  variant = 'flat',
  padding = 'md',
  interactive = false,
  className = '',
  children,
  onClick,
}) => {
  const cls = [
    'ui-card',
    `ui-card-${variant}`,
    `ui-card-pad-${padding}`,
    interactive ? 'ui-card-interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (interactive || onClick) {
    return (
      <div className={cls} role="button" tabIndex={0} onClick={onClick}
           onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onClick) { e.preventDefault(); onClick() } }}>
        {children}
      </div>
    )
  }
  return <div className={cls}>{children}</div>
}

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`ui-card-header ${className}`}>{children}</div>
)
export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`ui-card-body ${className}`}>{children}</div>
)
export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`ui-card-footer ${className}`}>{children}</div>
)

export default Card
