/*
 标签输入组件: 自由输入 + 自动补全 + 标签芯片.
*/

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocale } from '../../i18n'
import { useTags, type Tag } from '../../hooks/useTags'

interface Props {
  selectedTags: Tag[]
  onChange: (tags: Tag[]) => void
}

const TagInput: React.FC<Props> = ({ selectedTags, onChange }) => {
  const { t } = useLocale()
  const { fetchTags, createTag } = useTags()
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showSuggestions && input.trim()) {
      const timer = setTimeout(async () => {
        const results = await fetchTags(input.trim())
        const filtered = results.filter((t) => !selectedTags.find((s) => s.id === t.id))
        setSuggestions(filtered)
        setActiveIndex(-1)
      }, 300)
      return () => clearTimeout(timer)
    }
    setSuggestions([])
  }, [input, showSuggestions, selectedTags, fetchTags])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addTag = useCallback(async (tag: Tag) => {
    if (!selectedTags.find((t) => t.id === tag.id)) {
      onChange([...selectedTags, tag])
    }
    setInput('')
    setShowSuggestions(false)
  }, [selectedTags, onChange])

  const addTagByName = useCallback(async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const existing = selectedTags.find((t) => t.name === trimmed)
    if (existing) {
      setInput('')
      setShowSuggestions(false)
      return
    }
    const newTag = await createTag(trimmed)
    if (newTag) {
      onChange([...selectedTags, newTag])
    }
    setInput('')
    setShowSuggestions(false)
  }, [selectedTags, onChange, createTag])

  const removeTag = (id: number) => {
    onChange(selectedTags.filter((t) => t.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        addTag(suggestions[activeIndex])
      } else if (input.trim()) {
        addTagByName(input.trim())
      }
    } else if (e.key === 'Backspace') {
      if (!input && selectedTags.length > 0) {
        onChange(selectedTags.slice(0, -1))
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, -1))
    }
  }

  return (
    <div className="tag-input" ref={containerRef}>
      <div className="tag-input-chips" onClick={() => inputRef.current?.focus()}>
        {selectedTags.map((tag) => (
          <span key={tag.id} className="tag-chip">
            {tag.name}
            <button
              type="button"
              className="tag-chip-remove"
              onClick={(e) => { e.stopPropagation(); removeTag(tag.id) }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="tag-input-field"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? t('tag.addTag') : ''}
        />
        {input.trim() && (
          <button
            type="button"
            className="tag-add-btn"
            onClick={(e) => { e.stopPropagation(); addTagByName(input.trim()) }}
            title={t('tag.add')}
          >
            ＋
          </button>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="tag-suggestions">
          {suggestions.map((tag, i) => (
            <li
              key={tag.id}
              className={`tag-suggestions-item ${i === activeIndex ? 'active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); addTag(tag) }}
            >
              {tag.name}
            </li>
          ))}
          {input.trim() && !suggestions.find((s) => s.name === input.trim()) && (
            <li
              className="tag-suggestions-item tag-suggestions-new"
              onMouseDown={(e) => { e.preventDefault(); addTagByName(input.trim()) }}
            >
              + {t('tag.create')} "{input.trim()}"
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

export default TagInput
