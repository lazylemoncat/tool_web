/*
 AccountSection — 账号概要 + 修改密码/注销账号入口按钮.
*/

import React from 'react'
import { useNavigate } from 'umi'
import { useAuth } from '../../../context/AuthContext'
import { useLocale } from '../../../i18n'
import { Button } from '../../ui'

const AccountSection: React.FC = () => {
  const { username } = useAuth()
  const { t } = useLocale()
  const navigate = useNavigate()

  return (
    <div>
      <h2>{t('settings.account')}</h2>

      <div className="settings-section-block">
        <h3>{t('settings.accountSummary')}</h3>
        <div className="settings-row">
          <span className="settings-row-label">{t('auth.username')}</span>
          <span className="settings-row-label">{username}</span>
        </div>
      </div>

      <div className="settings-section-block">
        <h3>{t('auth.changePassword')}</h3>
        <p>{t('settings.changePasswordHint')}</p>
        <Button variant="secondary" onClick={() => navigate('/settings/account/password')}>
          {t('settings.managePassword')}
        </Button>
      </div>

      <div className="settings-section-block">
        <h3>多因素认证</h3>
        <p>启用 TOTP 后, 登录时需要输入认证器应用中的动态验证码.</p>
        <Button variant="secondary" onClick={() => navigate('/settings/account/totp')}>
          启用 TOTP
        </Button>
      </div>

      <div className="settings-section-block">
        <h3>{t('auth.deleteAccount')}</h3>
        <p>{t('auth.deleteAccountWarning')}</p>
        <Button variant="danger" onClick={() => navigate('/settings/account/delete')}>
          {t('auth.deleteAccountButton')}
        </Button>
      </div>
    </div>
  )
}

export default AccountSection
