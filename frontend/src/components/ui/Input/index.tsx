import React, { forwardRef } from 'react'
import { useFormField } from '../FormField'
import './styles.css'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: 'sm' | 'md' | 'lg'
  invalid?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ size = 'md', invalid, prefix, suffix, className = '', id, ...rest }, ref) => {
    const field = useFormField()
    const inputId = id ?? field?.id
    const finalInvalid = invalid ?? field?.invalid ?? false
    const describedBy = [field?.errorId, field?.hintId].filter(Boolean).join(' ') || undefined

    const inputEl = (
      <input
        ref={ref}
        id={inputId}
        className={`ui-input ui-input-${size} ${finalInvalid ? 'ui-input-invalid' : ''} ${prefix || suffix ? 'ui-input-bare' : ''} ${className}`}
        aria-invalid={finalInvalid || undefined}
        aria-describedby={describedBy}
        {...rest}
      />
    )

    if (!prefix && !suffix) return inputEl
    return (
      <div className={`ui-input-wrap ui-input-wrap-${size} ${finalInvalid ? 'ui-input-invalid' : ''}`}>
        {prefix && <span className="ui-input-prefix">{prefix}</span>}
        {inputEl}
        {suffix && <span className="ui-input-suffix">{suffix}</span>}
      </div>
    )
  },
)
Input.displayName = 'Input'

export default Input
