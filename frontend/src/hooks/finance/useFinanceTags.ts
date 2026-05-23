import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import { useFinanceBase } from './useFinanceBase'
import type { FinanceTag } from './types'

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
