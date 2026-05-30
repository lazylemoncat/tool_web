/*
 TotpPage - TOTP 启用独立页.
 负责调用 auth MFA setup/confirm 接口, 本地生成二维码, 并在启用成功后展示一次性恢复码.
*/

import QRCode from 'qrcode'
import React from 'react'
import { useNavigate } from 'umi'
import { authClient } from '../../auth/client/AuthClient'
import { Button, Input, Textarea } from '../../components/ui'
import { useErrorDisplay } from '../../hooks/useErrorDisplay'
import { useLocale } from '../../i18n'
import './TotpPage.css'

type TotpSetupState = {
  method_id: string
  otpauth_uri: string
}

const QR_SIZE = 208
const CODE_LENGTH = 6

const TotpPage: React.FC = () => {
  const { t } = useLocale()
  const { displayError } = useErrorDisplay()
  const navigate = useNavigate()

  const [setup, setSetup] = React.useState<TotpSetupState | null>(null)
  const [qrDataUrl, setQrDataUrl] = React.useState('')
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([])
  const [loadingSetup, setLoadingSetup] = React.useState(true)
  const [confirming, setConfirming] = React.useState(false)

  React.useEffect(() => {
    let active = true

    const loadSetup = async () => {
      setLoadingSetup(true)
      setError('')
      setMessage('')

      try {
        const nextSetup = await authClient.startTotpSetup()
        const nextQrDataUrl = await QRCode.toDataURL(nextSetup.otpauth_uri, {
          errorCorrectionLevel: 'M',
          margin: 2,
          scale: 8,
          width: QR_SIZE,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        })

        if (!active) return
        setSetup(nextSetup)
        setQrDataUrl(nextQrDataUrl)
      } catch (err) {
        if (active) setError(displayError(err))
      } finally {
        if (active) setLoadingSetup(false)
      }
    }

    loadSetup()

    return () => {
      active = false
    }
  }, [])

  const handleCopyUri = async () => {
    if (!setup?.otpauth_uri) return

    try {
      await navigator.clipboard.writeText(setup.otpauth_uri)
      setMessage('TOTP 配置 URI 已复制.')
      setError('')
    } catch {
      setError('浏览器拒绝复制, 请手动复制下面的 URI.')
    }
  }

  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedCode = code.trim()
    if (!setup) return
    if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(trimmedCode)) {
      setError('请输入认证器中的 6 位数字验证码.')
      return
    }

    setConfirming(true)
    setError('')
    setMessage('')

    try {
      const result = await authClient.confirmTotpSetup(setup.method_id, trimmedCode)
      setRecoveryCodes(result.recovery_codes)
      setSetup(null)
      setQrDataUrl('')
      setCode('')
      setMessage('TOTP 已启用. 请立即保存恢复码, 离开本页后不会再次显示.')
    } catch (err) {
      setError(displayError(err))
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="standalone-page totp-page">
      <button className="settings-back-link" onClick={() => navigate('/settings/account')}>
        ← {t('app.back')}
      </button>

      <header className="totp-page-header">
        <p className="totp-eyebrow">多因素认证</p>
        <h2>启用 TOTP</h2>
        <p>使用认证器应用扫描二维码, 然后输入动态验证码完成绑定.</p>
      </header>

      {loadingSetup && (
        <div className="totp-status-panel" aria-live="polite">
          正在生成 TOTP 二维码...
        </div>
      )}

      {!loadingSetup && setup && (
        <form className="totp-setup-grid" onSubmit={handleConfirm}>
          <section className="totp-qr-panel" aria-labelledby="totp-qr-title">
            <h3 id="totp-qr-title">1. 扫描二维码</h3>
            <div className="totp-qr-box">
              {qrDataUrl ? (
                <img src={qrDataUrl} width={QR_SIZE} height={QR_SIZE} alt="TOTP 配置二维码" />
              ) : (
                <span>二维码生成失败</span>
              )}
            </div>
            <p>推荐使用 Microsoft Authenticator, Google Authenticator, 1Password 等支持 TOTP 的应用.</p>
          </section>

          <section className="totp-confirm-panel" aria-labelledby="totp-confirm-title">
            <h3 id="totp-confirm-title">2. 输入验证码</h3>
            <label htmlFor="totp-code">认证器验证码</label>
            <Input
              id="totp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              pattern={`\\d{${CODE_LENGTH}}`}
              placeholder="输入 6 位验证码"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
            />

            <details className="totp-uri-details">
              <summary>无法扫码时手动输入</summary>
              <Textarea readOnly rows={4} value={setup.otpauth_uri} className="totp-uri-textarea" />
              <Button variant="secondary" onClick={handleCopyUri}>
                复制 URI
              </Button>
            </details>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="auth-error">{error}</p>}

            <div className="totp-actions">
              <Button type="submit" loading={confirming}>
                确认启用
              </Button>
              <Button variant="ghost" onClick={() => navigate('/settings/account')}>
                {t('app.cancel')}
              </Button>
            </div>
          </section>
        </form>
      )}

      {!loadingSetup && recoveryCodes.length > 0 && (
        <section className="totp-recovery-panel" aria-labelledby="totp-recovery-title">
          <h3 id="totp-recovery-title">恢复码</h3>
          <p>每个恢复码只能使用一次. 请保存在安全位置.</p>
          <pre>{recoveryCodes.join('\n')}</pre>
          <Button onClick={() => navigate('/settings/account')}>完成</Button>
        </section>
      )}

      {!loadingSetup && !setup && recoveryCodes.length === 0 && error && (
        <div className="totp-status-panel">
          <p className="auth-error">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      )}
    </div>
  )
}

export default TotpPage
