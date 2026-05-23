import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import { useFinanceBase } from './useFinanceBase'
import type { Budget } from './types'

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
