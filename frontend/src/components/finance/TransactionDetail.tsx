/*
  TransactionDetail: 交易详情 Modal (只读), 含编辑/删除/子账单管理.
*/
import React, { useState } from 'react'
import { useNavigate } from 'umi'
import { useLocale } from '../../i18n'
import { FormFooter, useConfirm, useToast } from '../ui'
import type { Account, FinanceCategory, FinanceTag, Transaction } from '../../hooks/finance'
import api from '../../api/client'
import SubTxDrawer from './SubTxDrawer'

interface Props {
  transaction: Transaction
  accounts: Account[]
  categories: FinanceCategory[]
  tags: FinanceTag[]
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  onRefresh: () => void
}

const fmt = (v: unknown, digits = 2): string => {
  const n = Number(v)
  return isNaN(n) ? '0.' + '0'.repeat(digits) : n.toFixed(digits)
}

const TX_LABELS: Record<string, string> = { expense: 'expense', income: 'income', transfer: 'transfer' }

const TransactionDetail: React.FC<Props> = ({ transaction: tx, accounts, categories, tags, onEdit, onDelete, onClose, onRefresh }) => {
  const { t } = useLocale()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const toast = useToast()
  const [subTxDrawer, setSubTxDrawer] = useState<{ open: boolean; editTx?: Transaction }>({ open: false })

  const isParent = tx.parent_transaction_id == null
  const childCount = tx.children?.length ?? 0

  const openCreateChild = () => setSubTxDrawer({ open: true })
  const openEditChild = (child: Transaction) => setSubTxDrawer({ open: true, editTx: child })
  const closeSubTxDrawer = () => setSubTxDrawer({ open: false })

  const handleDeleteChild = async (child: Transaction) => {
    const ok = await confirm({
      title: t('finance.confirmDeleteTransaction'),
      description: t('finance.deleteTransactionDescription'),
      danger: true,
    })
    if (!ok) return
    try {
      await api.delete(`/finance/transactions/${child.id}`)
      toast({ message: t('finance.transactionDeleted'), variant: 'success' })
      onRefresh()
    } catch {
      toast({ message: t('finance.transactionDeleteFailed'), variant: 'error' })
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('finance.transactionDetail')}</h3>
          <button className="modal-close" onClick={onClose} aria-label={t('app.close')}>x</button>
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
            <div className="form-group mt-3">
              <label className="form-label">{t('finance.tags')}</label>
              <div className="finance-tag-chips">
                {tx.tags.map((tag) => (
                  <span key={tag.id} className="finance-tag-chip active">{tag.name}</span>
                ))}
              </div>
            </div>
          )}

          {isParent && (
            <div className="form-group mt-3">
              <label className="form-label">{t('finance.childTransactions')}{childCount > 0 && ` (${childCount})`}</label>
              {childCount > 0 && (
                <div className="finance-split-list">
                  {tx.children!.map((child) => (
                    <div key={child.id} className="finance-split-row">
                      <span className={`finance-tx-type finance-tx-${child.type}`}>
                        {child.type === 'expense' ? '-' : child.type === 'income' ? '+' : 'S'}
                      </span>
                      <span className="tx-split-amount">{fmt(child.amount)}</span>
                      <span className="tx-split-meta">
                        {child.category?.name || t('finance.uncategorized')}
                      </span>
                      <span className="tx-split-note">
                        {child.note || ''}
                      </span>
                      <button className="btn-sm" onClick={() => openEditChild(child)}>{t('app.edit')}</button>
                      <button className="finance-tx-del" onClick={() => handleDeleteChild(child)} aria-label={t('app.delete')}>x</button>
                    </div>
                  ))}
                </div>
              )}
              {childCount === 0 && (
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>{t('finance.noChildTx')}</span>
              )}
              <button className="btn-sm" onClick={openCreateChild} style={{ marginTop: 8 }}>
                + {t('finance.addChildTransaction')}
              </button>
            </div>
          )}

          {tx.split_items && tx.split_items.length > 0 && (
            <div className="form-group mt-3">
              <label className="form-label">{t('finance.showSplit')}</label>
              <div className="finance-split-list">
                {tx.split_items.map((s) => (
                  <div key={s.id} className="finance-split-row">
                    <span className="tx-split-amount">{fmt(s.amount)}</span>
                    <span className="tx-split-meta">
                      {s.category?.name || t('finance.uncategorized')}
                    </span>
                    <span className="tx-split-note">
                      {s.note || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tx.attachments && tx.attachments.length > 0 && (
            <div className="form-group mt-3">
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
            <div className="form-group mt-3">
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
            <div className="form-group mt-3">
              <label className="form-label">{t('finance.event')}</label>
              <div className="finance-detail-value">{tx.event_id}</div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <FormFooter onCancel={onClose} onSubmit={onEdit} submitLabel={t('app.edit')} extraLeft={<button className="btn-danger" onClick={onDelete}>{t('app.delete')}</button>} />
        </div>
      </div>

      {subTxDrawer.open && (
        <SubTxDrawer
          open={subTxDrawer.open}
          onOpenChange={(o) => { if (!o) closeSubTxDrawer() }}
          parentTxId={tx.id}
          ledgerId={tx.ledger_id}
          parentAmount={tx.amount}
          childTransactions={tx.children ?? []}
          editTx={subTxDrawer.editTx || null}
          accounts={accounts}
          categories={categories}
          tags={tags}
          onSuccess={() => { onRefresh() }}
        />
      )}
    </div>
  )
}

export default TransactionDetail
