import React from 'react'
import { useNavigate } from 'umi'
import { useLocale } from '../i18n'

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useLocale()

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <h1 className="landing-logo">
          Tool<span>Web</span>
        </h1>
        <p className="landing-subtitle">{t('landing.subtitle')}</p>
      </div>

      <div className="landing-cards">
        <button className="landing-card landing-card-todo" onClick={() => navigate('/todo')}>
          <div className="landing-card-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="14" fill="currentColor" opacity="0.12"/>
              <path d="M14 24l6 6 14-14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="landing-card-content">
            <h2>TODO</h2>
            <p>{t('landing.todoDesc')}</p>
          </div>
          <span className="landing-card-arrow">→</span>
        </button>

        <button className="landing-card landing-card-finance" onClick={() => navigate('/finance')}>
          <div className="landing-card-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="14" fill="currentColor" opacity="0.12"/>
              <circle cx="24" cy="24" r="13" stroke="currentColor" strokeWidth="3"/>
              <path d="M24 14v20M17 20h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="landing-card-content">
            <h2>{t('finance.finance')}</h2>
            <p>{t('landing.financeDesc')}</p>
          </div>
          <span className="landing-card-arrow">→</span>
        </button>
      </div>
    </div>
  )
}

export default LandingPage
