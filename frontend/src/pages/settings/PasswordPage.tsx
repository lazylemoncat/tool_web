/*
 PasswordPage — 修改密码独立页.
*/

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../i18n'
import { useErrorDisplay } from '../../hooks/useErrorDisplay'
import { Button } from '../../components/ui'

const PasswordPage: React.FC = () => {
  const { changePassword } = useAuth()
  const { t } = useLocale()
  const { displayError } = useErrorDisplay()
  const navigate = useNavigate()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const strength = (() => {
    if (!newPassword) return null
    if (newPassword.length < 8) return { level: 'weak', label: t('auth.strengthWeak') }
    const hasLetter = /[a-zA-Z]/.test(newPassword)
    const hasDigit = /\d/.test(newPassword)
    const hasSpecial = /[^a-zA-Z\d]/.test(newPassword)
    if (hasLetter && hasDigit && hasSpecial) return { level: 'strong', label: t('auth.strengthStrong') }
    if (hasLetter && hasDigit) return { level: 'medium', label: t('auth.strengthMedium') }
    return { level: 'weak', label: t('auth.strengthWeak') }
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError(t('auth.fillRequired'))
      return
    }
    if (newPassword.length < 4) {
      setError(t('errors.passwordTooShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'))
      return
    }

    setSubmitting(true)
    try {
      await changePassword(oldPassword, newPassword)
      setSuccess(t('auth.passwordChanged'))
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(displayError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="standalone-page">
      <button className="settings-back-link" onClick={() => navigate('/settings/account')}>
        ← {t('app.back')}
      </button>
      <h2>{t('auth.changePassword')}</h2>

      <form onSubmit={handleSubmit} className="standalone-form">
        <div className="form-group">
          <label>{t('auth.oldPassword')}</label>
          <div className="password-wrapper">
            <input
              type={showPw ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder={t('auth.enterOldPassword')}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>{t('auth.newPassword')}</label>
          <div className="password-wrapper">
            <input
              type={showPw ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('auth.enterNewPassword')}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
          {strength && (
            <div className="password-strength" style={{ marginTop: 4 }}>
              <div className={`strength-bar strength-${strength.level}`} />
              <span>{strength.label}</span>
            </div>
          )}
        </div>
        <div className="form-group">
          <label>{t('auth.confirmNewPassword')}</label>
          <div className="password-wrapper">
            <input
              type={showPw ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.confirmNewPassword')}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? t('auth.processing') : t('auth.changePassword')}
        </Button>
      </form>
    </div>
  )
}

export default PasswordPage
