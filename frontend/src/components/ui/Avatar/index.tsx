import React, { useState } from 'react'
import './styles.css'

export interface AvatarProps {
  src?: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function initials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const [errored, setErrored] = useState(false)
  const showImg = src && !errored
  return (
    <span className={`ui-avatar ui-avatar-${size} ${className}`} aria-label={name}>
      {showImg ? (
        <img src={src} alt={name ?? ''} onError={() => setErrored(true)} />
      ) : (
        <span className="ui-avatar-fallback">{initials(name)}</span>
      )}
    </span>
  )
}

export default Avatar
