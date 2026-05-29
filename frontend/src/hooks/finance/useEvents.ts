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
    const savedOrder = localStorage.getItem(`finance-event-order-${ledgerId}`)
    if (!savedOrder) {
      setEvents(data)
      return
    }
    try {
      const order = JSON.parse(savedOrder) as number[]
      const orderMap = new Map(order.map((id, index) => [id, index]))
      setEvents([...data].sort((a, b) => (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER)))
    } catch {
      setEvents(data)
    }
  }, [ledgerId])

  useEffect(() => {
    fetchEvents().catch(() => {}).finally(() => setLoading(false))
  }, [fetchEvents])

  const createEvent = async (fields: Record<string, unknown>) => {
    try { await api.post('/finance/events', fields); await fetchEvents(); return true }
    catch (err) { handleError(err); await fetchEvents(); return false }
  }
  const updateEvent = async (id: number, fields: Record<string, unknown>) => {
    try { await api.put(`/finance/events/${id}`, fields); await fetchEvents(); return true }
    catch (err) { handleError(err); await fetchEvents(); return false }
  }
  const deleteEvent = async (id: number) => {
    try { await api.delete(`/finance/events/${id}`); await fetchEvents() }
    catch (err) { handleError(err); fetchEvents() }
  }
  const reorderEvents = (items: { id: number; sort_order: number }[]) => {
    if (ledgerId == null) return
    const orderMap = new Map(items.map((item) => [item.id, item.sort_order]))
    setEvents((prev) => {
      const next = [...prev].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
      localStorage.setItem(`finance-event-order-${ledgerId}`, JSON.stringify(next.map((event) => event.id)))
      return next
    })
  }
  return { events, loading, createEvent, updateEvent, deleteEvent, reorderEvents, refresh: fetchEvents }
}
