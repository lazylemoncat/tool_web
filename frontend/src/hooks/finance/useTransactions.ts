import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../api/client'
import { useFinanceBase } from './useFinanceBase'
import type { Transaction, TransactionFilters } from './types'

export function useTransactions(ledgerId: number | null, filters: TransactionFilters = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const skipRef = useRef(0)
  const LIMIT = 50
  const { handleError } = useFinanceBase()

  const buildParams = (skip: number) => {
    const params: Record<string, string | number> = { ledger_id: ledgerId!, skip, limit: LIMIT }
    if (filters.account_id) params.account_id = filters.account_id
    if (filters.category_id) params.category_id = filters.category_id
    if (filters.tag_id) params.tag_id = filters.tag_id
    if (filters.event_id) params.event_id = filters.event_id
    if (filters.type) params.type = filters.type
    if (filters.start_date) params.start_date = filters.start_date
    if (filters.end_date) params.end_date = filters.end_date
    if (filters.search) params.search = filters.search
    return params
  }

  const fetchTransactions = useCallback(async () => {
    if (ledgerId == null) { setTransactions([]); setTotal(0); return }
    const params = buildParams(0)
    const data = await api.get('/finance/transactions', { params }) as { items: Transaction[]; total: number }
    setTransactions(data.items || [])
    setTotal(data.total || 0)
    skipRef.current = (data.items || []).length
  }, [ledgerId, filters.account_id, filters.category_id, filters.tag_id, filters.event_id, filters.type, filters.start_date, filters.end_date, filters.search])

  useEffect(() => {
    fetchTransactions().catch(() => {}).finally(() => setLoading(false))
  }, [fetchTransactions])

  const loadMore = async () => {
    if (loadingMore || transactions.length >= total) return
    setLoadingMore(true)
    try {
      const params = buildParams(skipRef.current)
      const data = await api.get('/finance/transactions', { params }) as { items: Transaction[]; total: number }
      setTransactions((prev) => [...prev, ...(data.items || [])])
      setTotal(data.total || 0)
      skipRef.current += (data.items || []).length
    } catch { /* ignore */ }
    finally { setLoadingMore(false) }
  }

  const hasMore = transactions.length < total

  const createTransaction = async (fields: Record<string, unknown>) => {
    try { const tx = await api.post('/finance/transactions', fields) as Transaction; await fetchTransactions(); return tx }
    catch (err) { handleError(err); await fetchTransactions(); return null }
  }
  const updateTransaction = async (id: number, fields: Record<string, unknown>) => {
    try { await api.put(`/finance/transactions/${id}`, fields); await fetchTransactions(); return true }
    catch (err) { handleError(err); await fetchTransactions(); return false }
  }
  const deleteTransaction = async (id: number) => {
    try { await api.delete(`/finance/transactions/${id}`); await fetchTransactions() }
    catch (err) { handleError(err); fetchTransactions() }
  }

  const reorderTransactions = async (items: { id: number; sort_order: number }[]) => {
    const orderMap = new Map(items.map((item) => [item.id, item.sort_order]))
    setTransactions((prev) => [...prev]
      .map((tx) => ({ ...tx, sort_order: orderMap.get(tx.id) ?? tx.sort_order }))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
    try { await api.post('/finance/transactions/reorder', { items }) }
    catch (err) { handleError(err); fetchTransactions() }
  }

  return { transactions, total, loading, loadingMore, hasMore, fetchTransactions, loadMore, createTransaction, updateTransaction, deleteTransaction, reorderTransactions }
}
