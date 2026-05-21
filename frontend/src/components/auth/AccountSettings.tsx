import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../i18n'
import { useErrorDisplay } from '../../hooks/useErrorDisplay'

const AccountSettings: React.FC = () => {
  const { changePassword, deleteAccount } = useAuth()
  const { t } = useLocale()
  const { displayError } = useErrorDisplay()

  // Password change state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeletePassword, setShowDeletePassword] = useState(false)

  function getPasswordStrength(pw: string): { level: 'weak' | 'medium' | 'strong'; label: string } {
    if (pw.length < 8) return { level: 'weak', label: t('auth.strengthWeak') }
    const hasLetter = /[a-zA-Z]/.test(pw)
    const hasDigit = /\d/.test(pw)
    const hasSpecial = /[^a-zA-Z\d]/.test(pw)
    if (hasLetter && hasDigit && hasSpecial) return { level: 'strong', label: t('auth.strengthStrong') }
    if (hasLetter && hasDigit) return { level: 'medium', label: t('auth.strengthMedium') }
    return { level: 'weak', label: t('auth.strengthWeak') }
  }

  const clearPasswordForm = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError(t('auth.fillRequired'))
      return
    }
    if (newPassword.length < 4) {
      setPasswordError(t('errors.passwordTooShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('auth.passwordsDoNotMatch'))
      return
    }

    setChangingPassword(true)
    try {
      await changePassword(oldPassword, newPassword)
      setPasswordSuccess(t('auth.passwordChanged'))
      clearPasswordForm()
    } catch (err: any) {
      setPasswordError(displayError(err))
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')

    if (!deletePassword.trim()) {
      setDeleteError(t('auth.fillRequired'))
      return
    }

    setDeleting(true)
    try {
      await deleteAccount(deletePassword)
    } catch (err: any) {
      setDeleteError(displayError(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="account-settings">
      {/* Password Change Section */}
      <div className="settings-section">
        <h3>{t('auth.changePassword')}</h3>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>{t('auth.oldPassword')}</label>
            <div className="password-wrapper">
              <input
                type={showChangePassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t('auth.enterOldPassword')}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowChangePassword(!showChangePassword)}
                tabIndex={-1}
                aria-label={showChangePassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showChangePassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>{t('auth.newPassword')}</label>
            <div className="password-wrapper">
              <input
                type={showChangePassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.enterNewPassword')}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowChangePassword(!showChangePassword)}
                tabIndex={-1}
                aria-label={showChangePassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showChangePassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {newPassword && (() => {
            const strength = getPasswordStrength(newPassword)
            return (
              <div className="password-strength">
                <div className={`strength-bar strength-${strength.level}`} />
                <span>{strength.label}</span>
              </div>
            )
          })()}
          <div className="form-group">
            <label>{t('auth.confirmNewPassword')}</label>
            <div className="password-wrapper">
              <input
                type={showChangePassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmNewPassword')}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowChangePassword(!showChangePassword)}
                tabIndex={-1}
                aria-label={showChangePassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showChangePassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {passwordError && <p className="auth-error">{passwordError}</p>}
          {passwordSuccess && <p className="success-message">{passwordSuccess}</p>}

          <button type="submit" className="btn-submit" disabled={changingPassword}>
            {changingPassword ? t('auth.processing') : t('auth.changePassword')}
          </button>
        </form>
      </div>

      {/* Account Deletion Section */}
      <div className="danger-zone">
        <h3>{t('auth.deleteAccount')}</h3>
        <p>{t('auth.deleteAccountWarning')}</p>

        {!showDeleteConfirm ? (
          <button
            className="btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t('auth.deleteAccountButton')}
          </button>
        ) : (
          <div>
            <div className="form-group">
              <label>{t('auth.deleteAccountConfirm')}</label>
              <div className="password-wrapper">
                <input
                  type={showDeletePassword ? 'text' : 'password'}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder={t('auth.enterPassword')}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  tabIndex={-1}
                  aria-label={showDeletePassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showDeletePassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {deleteError && <p className="auth-error">{deleteError}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? t('auth.processing') : t('app.confirm')}
              </button>
              <button
                className="btn-submit"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeletePassword('')
                  setDeleteError('')
                }}
              >
                {t('app.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountSettings
