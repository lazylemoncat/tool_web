/*
 DeleteAccountPage — 注销账号独立页 (防误触).
*/

import React, { useState } from 'react'
import { useNavigate } from 'umi'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../i18n'
import { useErrorDisplay } from '../../hooks/useErrorDisplay'
import { Button } from '../../components/ui'

const DeleteAccountPage: React.FC = () => {
  const { deleteAccount } = useAuth()
  const { t } = useLocale()
  const { displayError } = useErrorDisplay()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmStep, setConfirmStep] = useState(0)

  const handleDelete = async () => {
    setError('')
    if (!password.trim()) {
      setError(t('auth.fillRequired'))
      return
    }
    setSubmitting(true)
    try {
      await deleteAccount(password)
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
      <h2>{t('auth.deleteAccount')}</h2>

      <div className="danger-zone" style={{ maxWidth: 480 }}>
        <h3>{t('auth.deleteAccountWarning')}</h3>
        <p style={{ lineHeight: 1.6, marginBottom: 16 }}>{t('auth.deleteAccountConfirm')}</p>

        {confirmStep === 0 ? (
          <Button variant="danger" onClick={() => setConfirmStep(1)}>
            {t('auth.deleteAccountButton')}
          </Button>
        ) : (
          <div>
            <div className="form-group">
              <label>{t('auth.enterPassword')}</label>
              <div className="password-wrapper">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.enterPassword')}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="danger" onClick={handleDelete} disabled={submitting}>
                {submitting ? t('auth.processing') : t('app.confirm')}
              </Button>
              <Button variant="ghost" onClick={() => { setConfirmStep(0); setPassword(''); setError('') }}>
                {t('app.cancel')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeleteAccountPage
