/*
 帮助页面: 左侧导航 + Markdown 内容渲染, 按功能拆分文档.
*/

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useLocale } from '../i18n'

interface Topic {
  key: string
  i18nKey: string
}

const TOPICS: Topic[] = [
  { key: 'todo', i18nKey: 'help.todo' },
  { key: 'auth', i18nKey: 'help.auth' },
  { key: 'api', i18nKey: 'help.api' },
  { key: 'settings', i18nKey: 'help.settings' },
]

const HelpPage: React.FC = () => {
  const { locale, t } = useLocale()
  const navigate = useNavigate()
  const [active, setActive] = useState('todo')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/help/${active}_helper_${locale}.md`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.text()
      })
      .then(setContent)
      .catch(() => setContent(`*${t('help.notFound')}*`))
      .finally(() => setLoading(false))
  }, [active, locale, t])

  return (
    <div className="help-page">
      <div className="help-header">
        <button className="help-back" onClick={() => navigate('/')}>
          ← {t('app.back')}
        </button>
        <h1>{t('help.title')}</h1>
      </div>
      <div className="help-layout">
        <nav className="help-sidebar">
          {TOPICS.map((topic) => (
            <div
              key={topic.key}
              className={`help-sidebar-item ${active === topic.key ? 'active' : ''}`}
              onClick={() => setActive(topic.key)}
            >
              {t(topic.i18nKey)}
            </div>
          ))}
        </nav>
        <main className="help-content">
          {loading ? (
            <p className="help-loading">{t('help.loading')}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          )}
        </main>
      </div>
    </div>
  )
}

export default HelpPage
