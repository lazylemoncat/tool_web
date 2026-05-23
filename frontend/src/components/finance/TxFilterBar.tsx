/*
  TxFilterBar: 交易筛选栏, 支持账户/分类/标签/事件/类型/日期/搜索.
*/
import React, { useState } from 'react'
import { useLocale } from '../../i18n'
import type { Account, FinanceCategory, FinanceTag, FinanceEvent, TransactionFilters } from '../../hooks/finance'

interface Props {
  accounts: Account[]
  categories: FinanceCategory[]
  tags: FinanceTag[]
  events: FinanceEvent[]
  filters: TransactionFilters
  onFiltersChange: (f: TransactionFilters) => void
}

const flatCategories = (cats: FinanceCategory[]): FinanceCategory[] => {
  const result: FinanceCategory[] = []
  const walk = (list: FinanceCategory[]) => {
    for (const c of list) {
      result.push(c)
      if (c.children?.length) walk(c.children)
    }
  }
  walk(cats)
  return result
}

const TxFilterBar: React.FC<Props> = ({ accounts, categories, tags, events, filters, onFiltersChange }) => {
  const { t } = useLocale()
  const [show, setShow] = useState(false)

  const set = (patch: Partial<TransactionFilters>) => {
    onFiltersChange({ ...filters, ...patch })
  }

  const clear = () => {
    onFiltersChange({})
  }

  const hasActive = filters.type || filters.account_id || filters.category_id || filters.tag_id || filters.event_id || filters.start_date || filters.end_date || filters.search

  return (
    <div className="finance-filter-bar">
      <div className="finance-filter-toggle" onClick={() => setShow(!show)}>
        <span>{t('finance.filter')} {hasActive ? `(${t('finance.filter')})` : ''}</span>
        <span>{show ? '▲' : '▼'}</span>
      </div>

      {show && (
        <div className="finance-filter-rows">
          <div className="finance-filter-row">
            <select
              value={filters.type || ''}
              onChange={(e) => set({ type: e.target.value || undefined })}
              className="finance-select"
            >
              <option value="">{t('finance.allTypes')}</option>
              <option value="expense">{t('finance.expense')}</option>
              <option value="income">{t('finance.income')}</option>
              <option value="transfer">{t('finance.transfer')}</option>
            </select>

            <select
              value={filters.account_id || ''}
              onChange={(e) => set({ account_id: e.target.value ? Number(e.target.value) : undefined })}
              className="finance-select"
            >
              <option value="">{t('finance.allAccounts')}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <select
              value={filters.category_id || ''}
              onChange={(e) => set({ category_id: e.target.value ? Number(e.target.value) : undefined })}
              className="finance-select"
            >
              <option value="">{t('finance.allCategories')}</option>
              {flatCategories(categories).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={filters.event_id || ''}
              onChange={(e) => set({ event_id: e.target.value ? Number(e.target.value) : undefined })}
              className="finance-select"
            >
              <option value="">{t('finance.allEvents')}</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>

          <div className="finance-filter-row">
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => set({ start_date: e.target.value || undefined })}
              className="finance-input-sm"
            />
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => set({ end_date: e.target.value || undefined })}
              className="finance-input-sm"
            />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => set({ search: e.target.value || undefined })}
              placeholder={`${t('finance.search')}...`}
              className="finance-input-sm flex-1"
            />
            <button className="btn-cancel" onClick={clear}>{t('finance.clearFilters')}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TxFilterBar
