import React from 'react'
import Button from '../Button'
import { useLocale } from '../../../i18n'
import './styles.css'

export interface FormFooterProps {
  onCancel: () => void
  onSubmit: () => void
  submitLabel?: string
  cancelLabel?: string
  submitting?: boolean
  disabled?: boolean
  danger?: boolean
  extraLeft?: React.ReactNode
}

const FormFooter: React.FC<FormFooterProps> = ({
  onCancel,
  onSubmit,
  submitLabel,
  cancelLabel,
  submitting = false,
  disabled = false,
  danger = false,
  extraLeft,
}) => {
  const { t } = useLocale()

  return (
    <div className="form-footer">
      <div className="form-footer-left">
        {extraLeft}
      </div>
      <div className="form-footer-right">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          {cancelLabel ?? t('app.cancel')}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onSubmit}
          loading={submitting}
          disabled={disabled || submitting}
        >
          {submitLabel ?? t('app.confirm')}
        </Button>
      </div>
    </div>
  )
}

export default FormFooter
