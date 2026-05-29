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
    const savedOrder = localStorage.getItem(`finance-budget-order-${ledgerId}`)
    if (!savedOrder) {
      setBudgets(data)
      return
    }
    try {
      const order = JSON.parse(savedOrder) as number[]
      const orderMap = new Map(order.map((id, index) => [id, index]))
      setBudgets([...data].sort((a, b) => (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER)))
    } catch {
      setBudgets(data)
    }
  }, [ledgerId])

  useEffect(() => {
    fetchBudgets().catch(() => {}).finally(() => setLoading(false))
  }, [fetchBudgets])

  const createBudget = async (fields: Record<string, unknown>) => {
    try { await api.post('/finance/budgets', fields); await fetchBudgets(); return true }
    catch (err) { handleError(err); await fetchBudgets(); return false }
  }
  const updateBudget = async (id: number, fields: Record<string, unknown>) => {
    try { await api.put(`/finance/budgets/${id}`, fields); await fetchBudgets(); return true }
    catch (err) { handleError(err); await fetchBudgets(); return false }
  }
  const deleteBudget = async (id: number) => {
    try { await api.delete(`/finance/budgets/${id}`); await fetchBudgets() }
    catch (err) { handleError(err); fetchBudgets() }
  }
  const reorderBudgets = (items: { id: number; sort_order: number }[]) => {
    if (ledgerId == null) return
    const orderMap = new Map(items.map((item) => [item.id, item.sort_order]))
    setBudgets((prev) => {
      const next = [...prev].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
      localStorage.setItem(`finance-budget-order-${ledgerId}`, JSON.stringify(next.map((budget) => budget.id)))
      return next
    })
  }
  return { budgets, loading, createBudget, updateBudget, deleteBudget, reorderBudgets, refresh: fetchBudgets }
}
