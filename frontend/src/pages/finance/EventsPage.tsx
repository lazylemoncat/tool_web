/*
  EventsPage: 事件列表子页面.
*/
import React from 'react'
import { useOutletContext } from 'umi'
import { useLocale } from '../../i18n'
import { Button, EmptyState, IconButton } from '../../components/ui'
import type { FinanceContext } from './FinanceLayout'
import FinanceSortableList from '../../components/finance/FinanceSortableList'

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
        <FinanceSortableList className="event-cards" items={ctx.events} onReorder={ctx.reorderEvents}>
          {(ev) => (
            <div key={ev.id} className="event-card" onClick={() => ctx.openEditEvent(ev)}>
              <div className="event-card-header">
                <span className="event-color-dot" style={{ background: ev.color }} />
                <span className="event-card-name">{ev.name}</span>
                {ev.start_at && (
                  <span className="event-card-date">
                    {new Date(ev.start_at).toLocaleDateString()}
                    {ev.end_at ? ` - ${new Date(ev.end_at).toLocaleDateString()}` : ''}
                  </span>
                )}
              </div>
              <div className="event-card-stats">
                <div className="event-stat">
                  <span className="event-stat-label">{t('finance.transactions')}</span>
                  <span className="event-stat-value">{ev.transaction_count}</span>
                </div>
                <div className="event-stat">
                  <span className="event-stat-label">{t('finance.total')}</span>
                  <span className={`event-stat-value ${ev.total_amount >= 0 ? 'in' : 'out'}`}>
                    {ctx.fmt(ev.total_amount)}
                  </span>
                </div>
              </div>
              <div className="finance-budget-row-actions" style={{ marginTop: 10 }}>
                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); ctx.openEditEvent(ev) }}>{t('app.edit')}</Button>
                <IconButton aria-label={t('app.delete')} size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); ctx.handleDeleteEvent(ev.id) }}>🗑</IconButton>
              </div>
            </div>
          )}
        </FinanceSortableList>
      )}
    </div>
  )
}

export default EventsPage
