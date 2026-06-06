/*
 任务数据 hooks.
*/

import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import { getToken } from '../utils/token'
import { useToast } from '../components/common/Toast'
import { useErrorDisplay } from './useErrorDisplay'

export interface Todo {
  id: number
  folder_id: number | null
  parent_id: number | null
  title: string
  note: string | null
  priority: number
  due_date: string | null
  is_completed: boolean
  completed_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
  children: Todo[]
  tags: { id: number; name: string }[]
  recurrence_rules: { id: number; rrule_string: string }[]
}

interface TodoFilters {
  folder_id?: number | null
  search?: string
  priority?: number | null
  status?: string | null
  tag_id?: number | null
}

function updateNestedTodos(todos: Todo[], id: number, updater: (t: Todo) => Todo): Todo[] {
  return todos.map(t => {
    if (t.id === id) return updater(t)
    if (t.children && t.children.length > 0) {
      return { ...t, children: updateNestedTodos(t.children, id, updater) }
    }
    return t
  })
}

function sortTodosRecursive(todos: Todo[], orderMap: Map<number, number>): Todo[] {
  return todos
    .map(t => ({
      ...t,
      sort_order: orderMap.get(t.id) ?? t.sort_order,
      children: t.children?.length ? sortTodosRecursive(t.children, orderMap) : t.children,
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function useTodos(filters: TodoFilters = {}) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { displayError } = useErrorDisplay()

  const fetchTodos = useCallback(async () => {
    if (!getToken()) { setTodos([]); setLoading(false); return }
    const params: Record<string, string | number> = {}
    if (filters.folder_id != null) params.folder_id = filters.folder_id
    if (filters.search) params.search = filters.search
    if (filters.priority) params.priority = filters.priority
    if (filters.status) params.status = filters.status
    if (filters.tag_id != null) params.tag_id = filters.tag_id
    const data: any = await api.get('/todos', { params })
    setTodos(Array.isArray(data) ? data : data.items || [])
  }, [filters.folder_id, filters.search, filters.priority, filters.status, filters.tag_id])

  useEffect(() => {
    fetchTodos().catch(() => {}).finally(() => setLoading(false))
  }, [fetchTodos])

  const createTodo = useCallback(async (fields: {
    folder_id?: number | null
    parent_id?: number | null
    title: string
    note?: string
    priority?: number
    due_date?: string | null
    tag_ids?: number[]
    recurrence_rules?: string[]
  }) => {
    try {
      await api.post('/todos', fields)
      await fetchTodos()
    } catch (err) {
      toast(displayError(err), 'error')
      fetchTodos()
    }
  }, [fetchTodos, toast, displayError])

  const updateTodo = useCallback(async (id: number, fields: Partial<Omit<Todo, 'recurrence_rules'>> & { recurrence_rules?: string[] }) => {
    try {
      await api.put(`/todos/${id}`, fields)
      await fetchTodos()
    } catch (err) {
      toast(displayError(err), 'error')
      fetchTodos()
    }
  }, [fetchTodos, toast, displayError])

  const deleteTodo = useCallback(async (id: number) => {
    try {
      await api.delete(`/todos/${id}`)
      await fetchTodos()
    } catch (err) {
      toast(displayError(err), 'error')
      fetchTodos()
    }
  }, [fetchTodos, toast, displayError])

  const toggleTodo = useCallback(async (id: number) => {
    // Optimistic update — flip immediately, rollback on failure
    setTodos(prev => updateNestedTodos(prev, id, t => ({ ...t, is_completed: !t.is_completed })))
    try {
      await api.patch(`/todos/${id}/toggle`)
    } catch (err) {
      toast(displayError(err), 'error')
      fetchTodos() // rollback on failure
    }
  }, [fetchTodos, toast, displayError])

  const reorderTodos = useCallback(async (items: { id: number; sort_order: number }[]) => {
    // Optimistic — reorder locally first (recursive), then sync to server
    const orderMap = new Map(items.map(item => [item.id, item.sort_order]))
    setTodos(prev => sortTodosRecursive(prev, orderMap))
    try {
      await api.post('/todos/reorder', { items })
    } catch (err) {
      toast(displayError(err), 'error')
      fetchTodos() // rollback on failure
    }
  }, [fetchTodos, toast, displayError])

  return { todos, loading, createTodo, updateTodo, deleteTodo, toggleTodo, reorderTodos, refresh: fetchTodos }
}
