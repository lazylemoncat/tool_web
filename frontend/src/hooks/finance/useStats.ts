import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import type { StatsData } from './types'

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
