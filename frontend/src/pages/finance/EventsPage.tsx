/*
  EventsPage: 事件列表子页面.
*/
import React from 'react'
import { useOutletContext } from 'umi'
import { useLocale } from '../../i18n'
import { Button, EmptyState, IconButton } from '../../components/ui'
import type { FinanceContext } from './FinanceLayout'

const EventsPage: React.FC = () => {
  const ctx = useOutletContext<FinanceContext>()
  const { t } = useLocale()

  return (
    <div className="finance-placeholder">
      <div className="finance-section-header">
        <h3>{t('finance.events')}</h3>
        <Button onClick={ctx.openNewEvent}>+ {t('finance.newEvent')}</Button>
      </div>
      {ctx.events.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={t('finance.noEvents')}
          description={t('finance.noEventsHint')}
          action={<Button onClick={ctx.openNewEvent}>+ {t('finance.newEvent')}</Button>}
        />
      ) : (
        ctx.events.map((ev) => (
          <div key={ev.id} className="finance-event-row">
            <span className="dot" style={{ background: ev.color }} />
            <span>{ev.name}</span>
            <span>{ev.transaction_count} tx</span>
            <span>{ctx.fmt(ev.total_amount)}</span>
            <div className="finance-budget-row-actions">
              <Button size="sm" variant="secondary" onClick={() => ctx.openEditEvent(ev)}>{t('app.edit')}</Button>
              <IconButton aria-label={t('app.delete')} size="sm" variant="danger" onClick={() => ctx.handleDeleteEvent(ev.id)}>🗑</IconButton>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default EventsPage
