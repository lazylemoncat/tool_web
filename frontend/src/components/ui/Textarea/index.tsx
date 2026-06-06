import React, { forwardRef } from 'react'
import { useFormField } from '../FormField'
import '../Input/styles.css'
import './styles.css'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
  autosize?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid, autosize, className = '', id, rows = 3, onInput, ...rest }, ref) => {
    const field = useFormField()
    const inputId = id ?? field?.id
    const finalInvalid = invalid ?? field?.invalid ?? false
    const describedBy = [field?.errorId, field?.hintId].filter(Boolean).join(' ') || undefined

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (autosize) {
        const el = e.currentTarget
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
      }
      onInput?.(e as React.FormEvent<HTMLTextAreaElement> & Parameters<NonNullable<typeof onInput>>[0])
    }

    return (
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`ui-input ui-textarea ${finalInvalid ? 'ui-input-invalid' : ''} ${className}`}
        aria-invalid={finalInvalid || undefined}
        aria-describedby={describedBy}
        onInput={handleInput}
        {...rest}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export default Textarea
