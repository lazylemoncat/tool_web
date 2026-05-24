/*
 NotificationsSection — 通知偏好.
*/

import React from 'react'
import { useLocale } from '../../../i18n'

const NotificationsSection: React.FC = () => {
  const { t } = useLocale()

  return (
    <div>
      <h2>{t('settings.notifications')}</h2>

      <div className="settings-section-block">
        <p>{t('settings.notificationsHint')}</p>
      </div>
    </div>
  )
}

export default NotificationsSection
