/*
  TransactionDetail: 交易详情 Modal (只读), 含编辑/删除操作.
*/
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocale } from '../../i18n'
import type { Transaction } from '../../hooks/useFinance'

interface Props {
  transaction: Transaction
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

const fmt = (v: unknown, digits = 2): string => {
  const n = Number(v)
  return isNaN(n) ? '0.' + '0'.repeat(digits) : n.toFixed(digits)
}

const TX_LABELS: Record<string, string> = { expense: 'expense', income: 'income', transfer: 'transfer' }

const TransactionDetail: React.FC<Props> = ({ transaction: tx, onEdit, onDelete, onClose }) => {
  const { t } = useLocale()
  const navigate = useNavigate()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('finance.transactionDetail')}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <div className="modal-body">
          <div className="finance-detail-grid">
            <div className="finance-detail-label">{t(`finance.${TX_LABELS[tx.type] || tx.type}`)}</div>
            <div className={`finance-detail-value finance-tx-${tx.type}`}>
              {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}{fmt(tx.amount)}
            </div>

            <div className="finance-detail-label">{t('finance.selectAccount')}</div>
            <div className="finance-detail-value">{tx.account?.name || '-'}</div>

            <div className="finance-detail-label">{t('finance.categoryPie')}</div>
            <div className="finance-detail-value">{tx.category?.name || t('finance.uncategorized')}</div>

            <div className="finance-detail-label">{t('finance.startAt')}</div>
            <div className="finance-detail-value">{tx.occurred_at?.replace('T', ' ').slice(0, 16)}</div>

            <div className="finance-detail-label">{t('finance.optionalNote')}</div>
            <div className="finance-detail-value">{tx.note || t('finance.noNote')}</div>
          </div>

          {tx.tags && tx.tags.length > 0 && (
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">{t('finance.tags')}</label>
              <div className="finance-tag-chips">
                {tx.tags.map((tag) => (
                  <span key={tag.id} className="finance-tag-chip active">{tag.name}</span>
                ))}
              </div>
            </div>
          )}

          {tx.split_items && tx.split_items.length > 0 && (
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">{t('finance.showSplit')}</label>
              <div className="finance-split-list">
                {tx.split_items.map((s) => (
                  <div key={s.id} className="finance-split-row">
                    <span style={{ minWidth: 80, textAlign: 'right' }}>{fmt(s.amount)}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {s.category?.name || t('finance.uncategorized')}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', flex: 1 }}>
                      {s.note || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tx.attachments && tx.attachments.length > 0 && (
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">{t('finance.attachments')}</label>
              <div className="finance-attachment-list">
                {tx.attachments.map((a) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="finance-attachment-item">
                    {a.url.split('/').pop()}
                  </a>
                ))}
              </div>
            </div>
          )}

          {tx.linked_todos && tx.linked_todos.length > 0 && (
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">{t('finance.linkedTodos')}</label>
              <div className="finance-attachment-list">
                {tx.linked_todos.map((todo) => (
                  <button
                    key={todo.id}
                    className="finance-todo-link"
                    onClick={() => navigate('/?folder=all')}
                  >
                    {todo.is_completed ? '✓ ' : ''}{todo.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tx.event_id && (
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">{t('finance.event')}</label>
              <div className="finance-detail-value">{tx.event_id}</div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-danger" onClick={onDelete}>{t('app.delete')}</button>
          <button className="btn-cancel" onClick={onClose}>{t('app.cancel')}</button>
          <button className="btn-submit" onClick={onEdit}>{t('app.edit')}</button>
        </div>
      </div>
    </div>
  )
}

export default TransactionDetail
