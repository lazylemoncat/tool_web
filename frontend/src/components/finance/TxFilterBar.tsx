/*
 TxFilterBar — 筛选栏. 快速预设 chips + 行内 select/input 筛选.
*/

import React, { useState } from 'react'
import { useLocale } from '../../i18n'
import { Drawer } from '../ui'
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
  const walk = (list: FinanceCategory[]) => { for (const c of list) { result.push(c); if (c.children?.length) walk(c.children) } }
  walk(cats)
  return result
}

const QUICK_PRESETS: { labelKey: string; key: string; compute: () => { start_date?: string; end_date?: string } }[] = [
  { key: 'thisMonth', labelKey: 'finance.thisMonth', compute: () => { const d = new Date(); return { start_date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`, end_date: undefined } } },
  { key: 'lastMonth', labelKey: 'finance.lastMonth', compute: () => { const d = new Date(); d.setMonth(d.getMonth() - 1); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); return { start_date: `${y}-${m}-01`, end_date: `${y}-${m}-${new Date(y, d.getMonth() + 1, 0).getDate()}` } } },
  { key: 'last7Days', labelKey: 'finance.last7Days', compute: () => { const d = new Date(); d.setDate(d.getDate() - 7); return { start_date: d.toISOString().slice(0, 10), end_date: undefined } } },
  { key: 'thisYear', labelKey: 'finance.thisYear', compute: () => { const y = new Date().getFullYear(); return { start_date: `${y}-01-01`, end_date: undefined } } },
]

const TxFilterBar: React.FC<Props> = ({ accounts, categories, tags, events, filters, onFiltersChange }) => {
  const { t } = useLocale()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const set = (patch: Partial<TransactionFilters>) => onFiltersChange({ ...filters, ...patch })
  const clear = () => { onFiltersChange({}); setActivePreset(null) }
  const applyPreset = (preset: typeof QUICK_PRESETS[number]) => {
    set(preset.compute())
    setActivePreset(preset.key)
  }

  const allCats = flatCategories(categories)

  const activeChips: { key: string; label: string; onRemove: () => void }[] = []
  if (filters.type) activeChips.push({ key: 'type', label: t(`finance.${filters.type}`), onRemove: () => set({ type: undefined }) })
  if (filters.account_id) {
    const acct = accounts.find((a) => a.id === filters.account_id)
    activeChips.push({ key: 'account', label: acct?.name ?? String(filters.account_id), onRemove: () => set({ account_id: undefined }) })
  }
  if (filters.category_id) {
    const cat = allCats.find((c) => c.id === filters.category_id)
    activeChips.push({ key: 'category', label: cat?.name ?? String(filters.category_id), onRemove: () => set({ category_id: undefined }) })
  }
  if (filters.tag_id) {
    const tg = tags.find((t) => t.id === filters.tag_id)
    activeChips.push({ key: 'tag', label: tg?.name ?? String(filters.tag_id), onRemove: () => set({ tag_id: undefined }) })
  }
  if (filters.event_id) {
    const ev = events.find((e) => e.id === filters.event_id)
    activeChips.push({ key: 'event', label: ev?.name ?? String(filters.event_id), onRemove: () => set({ event_id: undefined }) })
  }
  if (filters.start_date) activeChips.push({ key: 'start', label: `${t('finance.from')} ${filters.start_date}`, onRemove: () => set({ start_date: undefined }) })
  if (filters.end_date) activeChips.push({ key: 'end', label: `${t('finance.to')} ${filters.end_date}`, onRemove: () => set({ end_date: undefined }) })
  if (filters.search) activeChips.push({ key: 'search', label: `"${filters.search}"`, onRemove: () => set({ search: undefined }) })

  const filterContent = (
    <>
      <div className="quick-filters">
        {QUICK_PRESETS.map((p) => (
          <button
            key={p.key}
            className={`quick-chip${activePreset === p.key ? ' active' : ''}`}
            onClick={() => applyPreset(p)}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={filters.type || ''} onChange={(e) => set({ type: e.target.value || undefined })}>
          <option value="">{t('finance.allTypes')}</option>
          <option value="expense">{t('finance.expense')}</option>
          <option value="income">{t('finance.income')}</option>
          <option value="transfer">{t('finance.transfer')}</option>
        </select>
        <select className="filter-select" value={filters.account_id || ''} onChange={(e) => set({ account_id: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">{t('finance.allAccounts')}</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="filter-select" value={filters.category_id || ''} onChange={(e) => set({ category_id: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">{t('finance.allCategories')}</option>
          {allCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="filter-select" value={filters.event_id || ''} onChange={(e) => set({ event_id: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">{t('finance.allEvents')}</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        <input type="date" className="filter-input" value={filters.start_date || ''} onChange={(e) => set({ start_date: e.target.value || undefined })} style={{ maxWidth: 140 }} />
        <input type="date" className="filter-input" value={filters.end_date || ''} onChange={(e) => set({ end_date: e.target.value || undefined })} style={{ maxWidth: 140 }} />
        <input type="text" className="filter-input" value={filters.search || ''} onChange={(e) => set({ search: e.target.value || undefined })} placeholder={`${t('finance.search')}...`} />
      </div>
    </>
  )

  return (
    <div className="finance-filter-bar">
      {filterContent}

      {activeChips.length > 0 && (
        <div className="finance-active-chips">
          {activeChips.map((chip) => (
            <span key={chip.key} className="finance-filter-chip">
              {chip.label}
              <button onClick={chip.onRemove} aria-label="Remove filter">×</button>
            </span>
          ))}
          <button className="finance-filter-clear-all" onClick={clear}>{t('finance.clearAll')}</button>
        </div>
      )}

      <Drawer open={drawerOpen} onOpenChange={(o) => { if (!o) setDrawerOpen(false) }} side="bottom" title={t('finance.filter')}>
        {filterContent}
      </Drawer>
    </div>
  )
}

export default TxFilterBar
