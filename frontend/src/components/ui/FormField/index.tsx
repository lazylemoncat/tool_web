import React, { createContext, useContext, useId } from 'react'
import './styles.css'

interface FieldCtx {
  id: string
  errorId?: string
  hintId?: string
  invalid: boolean
}

const FieldContext = createContext<FieldCtx | null>(null)

export function useFormField(): FieldCtx | null {
  return useContext(FieldContext)
}

export interface FormFieldProps {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  htmlFor?: string
  children: React.ReactNode
  className?: string
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className = '',
}) => {
  const autoId = useId()
  const id = htmlFor ?? autoId
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined
  const ctx: FieldCtx = { id, errorId, hintId, invalid: !!error }
  return (
    <div className={`ui-field ${error ? 'ui-field-invalid' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="ui-field-label">
          {label}
          {required && <span className="ui-field-required" aria-hidden="true">*</span>}
        </label>
      )}
      <FieldContext.Provider value={ctx}>{children}</FieldContext.Provider>
      {hint && !error && (
        <p id={hintId} className="ui-field-hint">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="ui-field-error" role="alert">{error}</p>
      )}
    </div>
  )
}

export default FormField
