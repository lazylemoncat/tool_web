import React from 'react'
import './styles.css'

export interface SkeletonProps {
  variant?: 'block' | 'text' | 'circle'
  width?: number | string
  height?: number | string
  lines?: number
  className?: string
  style?: React.CSSProperties
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'block',
  width,
  height,
  lines = 1,
  className = '',
  style,
}) => {
  if (variant === 'text' && lines > 1) {
    return (
      <span className={`ui-skeleton-group ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className="ui-skeleton ui-skeleton-text"
            style={{
              width: i === lines - 1 ? '60%' : '100%',
              height,
            }}
          />
        ))}
      </span>
    )
  }
  return (
    <span
      className={`ui-skeleton ui-skeleton-${variant} ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  )
}

export default Skeleton
