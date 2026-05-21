/*
  Finance 模块数据 hooks: Ledger, Account, Category, Tag, Transaction, Event, Budget, Dashboard.
*/

import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import { useToast } from '../components/common/Toast'
import { useErrorDisplay } from './useErrorDisplay'

export interface Ledger {
  id: number
  name: string
  icon: string
  currency: string
  created_at: string
}

export interface Account {
  id: number
  ledger_id: number
  name: string
  type: string
  currency: string
  initial_balance: number
  archived: boolean
  created_at: string
  updated_at: string
  current_balance: number
}

export interface FinanceCategory {
  id: number
  ledger_id: number
  parent_id: number | null
  name: string
  icon: string
  created_at: string
  children: FinanceCategory[]
}

export interface FinanceTag {
  id: number
  ledger_id: number
  name: string
}

export interface SplitItem {
  id: number
  transaction_id: number
  amount: number
  category_id: number | null
  note: string | null
  category?: FinanceCategory | null
}

export interface Transaction {
  id: number
  ledger_id: number
  account_id: number
  type: 'expense' | 'income' | 'transfer'
  amount: number
  currency: string
  occurred_at: string
  recorded_at: string
  category_id: number | null
  note: string | null
  event_id: number | null
  parent_transaction_id: number | null
  sort_order: number
  created_at: string
  updated_at: string
  account?: Account | null
  category?: FinanceCategory | null
  tags: FinanceTag[]
  split_items: SplitItem[]
}

export interface TransactionFilters {
  ledger_id?: number
  account_id?: number
  category_id?: number
  tag_id?: number
  event_id?: number
  type?: string
  start_date?: string
  end_date?: string
  search?: string
}

export interface FinanceEvent {
  id: number
  ledger_id: number
  name: string
  description: string | null
  start_at: string | null
  end_at: string | null
  color: string
  created_at: string
  updated_at: string
  transaction_count: number
  total_amount: number
}

export interface Budget {
  id: number
  ledger_id: number
  name: string
  amount: number
  currency: string
  rrule: string | null
  filters: Record<string, number[]> | null
  rollover: boolean
  alert_threshold: number
  created_at: string
  updated_at: string
  current_spent: number
  progress_pct: number
}

export interface DashboardSummary {
  total_assets: number
  month_income: number
  month_expense: number
  budget_usage_pct: number
  recent_transactions: Transaction[]
  budgets: Budget[]
}

export interface StatsData {
  category_data: { name: string; value: number }[]
  trend_data: { date: string; amount: number }[]
}

function useFinanceBase() {
  const { toast } = useToast()
  const { displayError } = useErrorDisplay()
  const handleError = (err: unknown) => toast(displayError(err), 'error')
  return { handleError }
}

export function useLedgers() {
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [loading, setLoading] = useState(true)
  const { handleError } = useFinanceBase()

  const fetchLedgers = useCallback(async () => {
    const data = await api.get('/finance/ledgers') as Ledger[]
    setLedgers(data)
  }, [])

  useEffect(() => {
    fetchLedgers().catch(() => {}).finally(() => setLoading(false))
  }, [fetchLedgers])

  const createLedger = async (name: string, icon?: string, currency?: string) => {
    try { await api.post('/finance/ledgers', { name, icon, currency }); await fetchLedgers() }
    catch (err) { handleError(err); fetchLedgers() }
  }
  const updateLedger = async (id: number, fields: Partial<Ledger>) => {
    try { await api.put(`/finance/ledgers/${id}`, fields); await fetchLedgers() }
    catch (err) { handleError(err); fetchLedgers() }
  }
  const deleteLedger = async (id: number) => {
    try { await api.delete(`/finance/ledgers/${id}`); await fetchLedgers() }
    catch (err) { handleError(err); fetchLedgers() }
  }
  return { ledgers, loading, createLedger, updateLedger, deleteLedger, refresh: fetchLedgers }
}

export function useAccounts(ledgerId: number | null) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const { handleError } = useFinanceBase()

  const fetchAccounts = useCallback(async () => {
    if (ledgerId == null) { setAccounts([]); return }
    const data = await api.get('/finance/accounts', { params: { ledger_id: ledgerId } }) as Account[]
    setAccounts(data)
  }, [ledgerId])

  useEffect(() => {
    fetchAccounts().catch(() => {}).finally(() => setLoading(false))
  }, [fetchAccounts])

  const createAccount = async (fields: Record<string, unknown>) => {
    try { await api.post('/finance/accounts', fields); await fetchAccounts() }
    catch (err) { handleError(err); fetchAccounts() }
  }
  const updateAccount = async (id: number, fields: Record<string, unknown>) => {
    try { await api.put(`/finance/accounts/${id}`, fields); await fetchAccounts() }
    catch (err) { handleError(err); fetchAccounts() }
  }
  const deleteAccount = async (id: number) => {
    try { await api.delete(`/finance/accounts/${id}`); await fetchAccounts() }
    catch (err) { handleError(err); fetchAccounts() }
  }
  return { accounts, loading, createAccount, updateAccount, deleteAccount, refresh: fetchAccounts }
}

export function useCategories(ledgerId: number | null) {
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const { handleError } = useFinanceBase()

  const fetchCategories = useCallback(async () => {
    if (ledgerId == null) { setCategories([]); return }
    const data = await api.get('/finance/categories', { params: { ledger_id: ledgerId } }) as FinanceCategory[]
    setCategories(data)
  }, [ledgerId])

  useEffect(() => {
    fetchCategories().catch(() => {}).finally(() => setLoading(false))
  }, [fetchCategories])

  const createCategory = async (fields: Record<string, unknown>) => {
    try { await api.post('/finance/categories', fields); await fetchCategories() }
    catch (err) { handleError(err); fetchCategories() }
  }
  const updateCategory = async (id: number, fields: Record<string, unknown>) => {
    try { await api.put(`/finance/categories/${id}`, fields); await fetchCategories() }
    catch (err) { handleError(err); fetchCategories() }
  }
  const deleteCategory = async (id: number) => {
    try { await api.delete(`/finance/categories/${id}`); await fetchCategories() }
    catch (err) { handleError(err); fetchCategories() }
  }
  return { categories, loading, createCategory, updateCategory, deleteCategory, refresh: fetchCategories }
}

export function useFinanceTags(ledgerId: number | null) {
  const [tags, setTags] = useState<FinanceTag[]>([])
  const { handleError } = useFinanceBase()

  const fetchTags = useCallback(async (search?: string) => {
    if (ledgerId == null) return [] as FinanceTag[]
    const params: Record<string, string | number> = { ledger_id: ledgerId }
    if (search) params.search = search
    const data = await api.get('/finance/tags', { params }) as FinanceTag[]
    setTags(data)
    return data
  }, [ledgerId])

  useEffect(() => {
    fetchTags().catch(() => {})
  }, [fetchTags])

  const createTag = async (ledger_id: number, name: string) => {
    try {
      const tag = await api.post('/finance/tags', { ledger_id, name }) as FinanceTag
      await fetchTags()
      return tag
    } catch (err) { handleError(err); return null }
  }
  const deleteTag = async (id: number) => {
    try { await api.delete(`/finance/tags/${id}`); await fetchTags() }
    catch (err) { handleError(err) }
  }
  return { tags, fetchTags, createTag, deleteTag }
}

export function useTransactions(ledgerId: number | null, filters: TransactionFilters = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const { handleError } = useFinanceBase()

  const fetchTransactions = useCallback(async (skip = 0, limit = 50) => {
    if (ledgerId == null) { setTransactions([]); setTotal(0); return }
    const params: Record<string, string | number> = { ledger_id: ledgerId, skip, limit }
    if (filters.account_id) params.account_id = filters.account_id
    if (filters.category_id) params.category_id = filters.category_id
    if (filters.tag_id) params.tag_id = filters.tag_id
    if (filters.event_id) params.event_id = filters.event_id
    if (filters.type) params.type = filters.type
    if (filters.start_date) params.start_date = filters.start_date
    if (filters.end_date) params.end_date = filters.end_date
    if (filters.search) params.search = filters.search
    const data = await api.get('/finance/transactions', { params }) as { items: Transaction[]; total: number }
    setTransactions(data.items || [])
    setTotal(data.total || 0)
  }, [ledgerId, filters.account_id, filters.category_id, filters.tag_id, filters.event_id, filters.type, filters.start_date, filters.end_date, filters.search])

  useEffect(() => {
    fetchTransactions().catch(() => {}).finally(() => setLoading(false))
  }, [fetchTransactions])

  const createTransaction = async (fields: Record<string, unknown>) => {
    try { await api.post('/finance/transactions', fields); await fetchTransactions() }
    catch (err) { handleError(err); fetchTransactions() }
  }
  const updateTransaction = async (id: number, fields: Record<string, unknown>) => {
    try { await api.put(`/finance/transactions/${id}`, fields); await fetchTransactions() }
    catch (err) { handleError(err); fetchTransactions() }
  }
  const deleteTransaction = async (id: number) => {
    try { await api.delete(`/finance/transactions/${id}`); await fetchTransactions() }
    catch (err) { handleError(err); fetchTransactions() }
  }
  return { transactions, total, loading, fetchTransactions, createTransaction, updateTransaction, deleteTransaction }
}

export function useEvents(ledgerId: number | null) {
  const [events, setEvents] = useState<FinanceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const { handleError } = useFinanceBase()

  const fetchEvents = useCallback(async () => {
    if (ledgerId == null) { setEvents([]); return }
    const data = await api.get('/finance/events', { params: { ledger_id: ledgerId } }) as FinanceEvent[]
    setEvents(data)
  }, [ledgerId])

  useEffect(() => {
    fetchEvents().catch(() => {}).finally(() => setLoading(false))
  }, [fetchEvents])

  const createEvent = async (fields: Record<string, unknown>) => {
    try { await api.post('/finance/events', fields); await fetchEvents() }
    catch (err) { handleError(err); fetchEvents() }
  }
  const updateEvent = async (id: number, fields: Record<string, unknown>) => {
    try { await api.put(`/finance/events/${id}`, fields); await fetchEvents() }
    catch (err) { handleError(err); fetchEvents() }
  }
  const deleteEvent = async (id: number) => {
    try { await api.delete(`/finance/events/${id}`); await fetchEvents() }
    catch (err) { handleError(err); fetchEvents() }
  }
  return { events, loading, createEvent, updateEvent, deleteEvent, refresh: fetchEvents }
}

export function useBudgets(ledgerId: number | null) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const { handleError } = useFinanceBase()

  const fetchBudgets = useCallback(async () => {
    if (ledgerId == null) { setBudgets([]); return }
    const data = await api.get('/finance/budgets', { params: { ledger_id: ledgerId } }) as Budget[]
    setBudgets(data)
  }, [ledgerId])

  useEffect(() => {
    fetchBudgets().catch(() => {}).finally(() => setLoading(false))
  }, [fetchBudgets])

  const createBudget = async (fields: Record<string, unknown>) => {
    try { await api.post('/finance/budgets', fields); await fetchBudgets() }
    catch (err) { handleError(err); fetchBudgets() }
  }
  const updateBudget = async (id: number, fields: Record<string, unknown>) => {
    try { await api.put(`/finance/budgets/${id}`, fields); await fetchBudgets() }
    catch (err) { handleError(err); fetchBudgets() }
  }
  const deleteBudget = async (id: number) => {
    try { await api.delete(`/finance/budgets/${id}`); await fetchBudgets() }
    catch (err) { handleError(err); fetchBudgets() }
  }
  return { budgets, loading, createBudget, updateBudget, deleteBudget, refresh: fetchBudgets }
}

export function useDashboard(ledgerId: number | null) {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const { handleError } = useFinanceBase()

  const fetchDashboard = useCallback(async () => {
    if (ledgerId == null) { setDashboard(null); return }
    const data = await api.get('/finance/dashboard', { params: { ledger_id: ledgerId } }) as DashboardSummary
    setDashboard(data)
  }, [ledgerId])

  useEffect(() => {
    fetchDashboard().catch(() => {}).finally(() => setLoading(false))
  }, [fetchDashboard])

  return { dashboard, loading, refresh: fetchDashboard }
}

export function useStats(ledgerId: number | null, period = 'month') {
  const [stats, setStats] = useState<StatsData>({ category_data: [], trend_data: [] })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (ledgerId == null) { setStats({ category_data: [], trend_data: [] }); return }
    const data = await api.get('/finance/stats', { params: { ledger_id: ledgerId, period } }) as StatsData
    setStats(data)
  }, [ledgerId, period])

  useEffect(() => {
    fetchStats().catch(() => {}).finally(() => setLoading(false))
  }, [fetchStats])

  return { stats, loading, refresh: fetchStats }
}
