import React from 'react'
import './styles.css'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, size = 'md', className = '' }) => {
  return (
    <div className={`ui-empty ui-empty-${size} ${className}`} role="status">
      {icon && <div className="ui-empty-icon" aria-hidden="true">{icon}</div>}
      <h3 className="ui-empty-title">{title}</h3>
      {description && <p className="ui-empty-description">{description}</p>}
      {action && <div className="ui-empty-action">{action}</div>}
    </div>
  )
}

export default EmptyState
