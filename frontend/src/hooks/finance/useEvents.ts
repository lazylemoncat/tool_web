import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import { useFinanceBase } from './useFinanceBase'
import type { FinanceEvent } from './types'

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
