import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import { useFinanceBase } from './useFinanceBase'
import type { Account } from './types'

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
