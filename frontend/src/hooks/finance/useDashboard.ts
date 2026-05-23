import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import { useFinanceBase } from './useFinanceBase'
import type { DashboardSummary } from './types'

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
