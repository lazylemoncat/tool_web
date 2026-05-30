import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import { getToken } from '../../utils/token'
import { useFinanceBase } from './useFinanceBase'
import type { Ledger } from './types'

export function useLedgers() {
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [loading, setLoading] = useState(true)
  const { handleError } = useFinanceBase()

  const fetchLedgers = useCallback(async () => {
    if (!getToken()) { setLoading(false); return }
    const data = await api.get('/finance/ledgers') as Ledger[]
    setLedgers(data)
  }, [])

  useEffect(() => {
    fetchLedgers().catch(() => {}).finally(() => setLoading(false))
  }, [fetchLedgers])

  const createLedger = async (name: string, icon?: string, currency?: string) => {
    try {
      await api.post('/finance/ledgers', { name, icon, currency })
      await fetchLedgers()
      return true
    } catch (err) {
      handleError(err)
      await fetchLedgers()
      return false
    }
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
