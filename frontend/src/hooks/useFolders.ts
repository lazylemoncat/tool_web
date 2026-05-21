/*
 文件夹数据 hooks.
*/

import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import { useToast } from '../components/common/Toast'
import { useErrorDisplay } from './useErrorDisplay'

export interface Folder {
  id: number
  parent_id: number | null
  name: string
  color: string
  sort_order: number
  todo_count: number
  children: Folder[]
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { displayError } = useErrorDisplay()

  const fetchFolders = useCallback(async () => {
    const data: any = await api.get('/folders')
    setFolders(data as Folder[])
  }, [])

  useEffect(() => {
    fetchFolders().catch(() => {}).finally(() => setLoading(false))
  }, [fetchFolders])

  const createFolder = async (name: string, color?: string, parentId?: number | null) => {
    try {
      await api.post('/folders', { name, color, parent_id: parentId ?? null })
      await fetchFolders()
    } catch (err) {
      toast(displayError(err), 'error')
      fetchFolders()
    }
  }

  const updateFolder = async (id: number, fields: Partial<Folder>) => {
    try {
      await api.put(`/folders/${id}`, fields)
      await fetchFolders()
    } catch (err) {
      toast(displayError(err), 'error')
      fetchFolders()
    }
  }

  const deleteFolder = async (id: number) => {
    try {
      await api.delete(`/folders/${id}`)
      await fetchFolders()
    } catch (err) {
      toast(displayError(err), 'error')
      fetchFolders()
    }
  }

  const reorderFolders = async (items: { id: number; sort_order: number }[]) => {
    try {
      await api.post('/folders/reorder', { items })
      await fetchFolders()
    } catch (err) {
      toast(displayError(err), 'error')
      fetchFolders()
    }
  }

  return { folders, loading, createFolder, updateFolder, deleteFolder, reorderFolders, refresh: fetchFolders }
}
