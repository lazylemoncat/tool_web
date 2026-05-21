/*
 搜索栏组件: 带防抖的搜索输入框.
*/

import React, { useState, useEffect } from 'react'

interface Props {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

const SearchBar: React.FC<Props> = ({ value, onChange, placeholder = '搜索任务...' }) => {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => onChange(local), 300)
    return () => clearTimeout(timer)
  }, [local])

  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <div className="search-bar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export default SearchBar
