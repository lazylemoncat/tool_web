import React from 'react'
import './styles.css'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  inline?: boolean
  label?: string
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', inline = false, label, className = '' }) => {
  const cls = ['ui-spinner', `ui-spinner-${size}`, inline ? 'ui-spinner-inline' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <span className={cls} role="status" aria-live="polite" aria-label={label}>
      <span className="ui-spinner-circle" aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}

export default Spinner
