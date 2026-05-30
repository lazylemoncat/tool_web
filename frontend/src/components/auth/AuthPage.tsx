import React, { useState } from 'react'
import { useNavigate } from 'umi'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../i18n'
import { useErrorDisplay } from '../../hooks/useErrorDisplay'

const AuthPage: React.FC = () => {
  const { login, register, loading } = useAuth()
  const navigate = useNavigate()
  const { locale, setLocale, t } = useLocale()
  const { displayError } = useErrorDisplay()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function getPasswordStrength(pw: string): { level: 'weak' | 'medium' | 'strong'; label: string } {
    if (pw.length < 8) return { level: 'weak', label: t('auth.strengthWeak') }
    const hasLetter = /[a-zA-Z]/.test(pw)
    const hasDigit = /\d/.test(pw)
    const hasSpecial = /[^a-zA-Z\d]/.test(pw)
    if (hasLetter && hasDigit && hasSpecial) return { level: 'strong', label: t('auth.strengthStrong') }
    if (hasLetter && hasDigit) return { level: 'medium', label: t('auth.strengthMedium') }
    return { level: 'weak', label: t('auth.strengthWeak') }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError(t('auth.fillRequired'))
      return
    }
    try {
      if (tab === 'login') {
        await login(username.trim(), password, rememberMe)
      } else {
        await register(username.trim(), password)
      }
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(displayError(err))
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-lang-switcher">
          <button
            className={`auth-lang-btn ${locale === 'zh' ? 'active' : ''}`}
            onClick={() => setLocale('zh')}
          >中文</button>
          <button
            className={`auth-lang-btn ${locale === 'en' ? 'active' : ''}`}
            onClick={() => setLocale('en')}
          >English</button>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); setUsername(''); setPassword('') }}
          >
            {t('auth.login')}
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); setUsername(''); setPassword('') }}
          >
            {t('auth.register')}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('auth.username')}</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.enterUsername')}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>{t('auth.password')}</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.enterPassword')}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {tab === 'register' && password && (() => {
            const strength = getPasswordStrength(password)
            return (
              <div className="password-strength">
                <div className={`strength-bar strength-${strength.level}`} />
                <span>{strength.label}</span>
              </div>
            )
          })()}

          {tab === 'login' && (
            <div className="auth-remember">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">{t('auth.rememberMe')}</label>
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-submit" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? t('auth.processing') : tab === 'login' ? t('auth.login') : t('auth.register')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthPage
