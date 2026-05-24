/*
 HomePage — 登录后仪表盘.
 阶段 3 先建骨架, 阶段 7 接入数据 widget.
*/

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n'
import { Card, CardHeader, CardBody } from '../components/ui'
import RecentTodosWidget from '../components/home/RecentTodosWidget'
import MonthlyFinanceWidget from '../components/home/MonthlyFinanceWidget'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useLocale()

  return (
    <div className="home-page">
      <h1 className="home-greeting">{t('landing.subtitle')}</h1>

      <div className="home-module-grid">
        <Card className="home-module-card" onClick={() => navigate('/todo')}>
          <CardHeader>
            <span className="home-module-icon home-module-todo">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="currentColor" opacity="0.12" />
                <path d="M14 24l6 6 14-14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </CardHeader>
          <CardBody>
            <h2>TODO</h2>
            <p>{t('landing.todoDesc')}</p>
          </CardBody>
        </Card>

        <Card className="home-module-card" onClick={() => navigate('/finance')}>
          <CardHeader>
            <span className="home-module-icon home-module-finance">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="currentColor" opacity="0.12" />
                <circle cx="24" cy="24" r="13" stroke="currentColor" strokeWidth="3" />
                <path d="M24 14v20M17 20h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </CardHeader>
          <CardBody>
            <h2>{t('finance.finance')}</h2>
            <p>{t('landing.financeDesc')}</p>
          </CardBody>
        </Card>

        <Card className="home-module-card" onClick={() => navigate('/settings')}>
          <CardHeader>
            <span className="home-module-icon home-module-settings">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="currentColor" opacity="0.12" />
                <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="3" />
                <path d="M24 14v4M24 30v4M14 24h4M30 24h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </CardHeader>
          <CardBody>
            <h2>{t('app.settings')}</h2>
            <p>{t('settings.description')}</p>
          </CardBody>
        </Card>

        <Card className="home-module-card" onClick={() => navigate('/help')}>
          <CardHeader>
            <span className="home-module-icon home-module-help">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="currentColor" opacity="0.12" />
                <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="3" />
                <path d="M22 22c0-1.5 1.3-3 3-3s3 1.5 3 3c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="24" cy="30" r="1.5" fill="currentColor" />
              </svg>
            </span>
          </CardHeader>
          <CardBody>
            <h2>{t('app.help')}</h2>
            <p>{t('help.description')}</p>
          </CardBody>
        </Card>
      </div>

      <div className="home-widgets">
        <RecentTodosWidget />
        <MonthlyFinanceWidget />
      </div>
    </div>
  )
}

export default HomePage
