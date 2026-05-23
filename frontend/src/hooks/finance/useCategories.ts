import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import { useFinanceBase } from './useFinanceBase'
import type { FinanceCategory } from './types'

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
    try { const cat = await api.post('/finance/categories', fields) as FinanceCategory; await fetchCategories(); return cat }
    catch (err) { handleError(err); fetchCategories(); return null }
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
