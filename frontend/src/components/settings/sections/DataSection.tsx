/*
 DataSection — 数据导入/导出.
*/

import React from 'react'
import { useLocale } from '../../../i18n'
import { Button } from '../../ui'

const DataSection: React.FC = () => {
  const { t } = useLocale()

  return (
    <div>
      <h2>{t('settings.data')}</h2>

      <div className="settings-section-block">
        <h3>{t('settings.exportData')}</h3>
        <p>{t('settings.exportDataHint')}</p>
        <Button variant="secondary" onClick={() => {/* TODO */}}>
          {t('settings.export')}
        </Button>
      </div>

      <div className="settings-section-block">
        <h3>{t('settings.importData')}</h3>
        <p>{t('settings.importDataHint')}</p>
        <Button variant="secondary" onClick={() => {/* TODO */}}>
          {t('settings.import')}
        </Button>
      </div>
    </div>
  )
}

export default DataSection
