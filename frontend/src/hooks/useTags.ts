/*
 标签 hook: 获取、创建、删除用户标签.
*/

import { useState, useCallback } from 'react'
import api from '../api/client'

export interface Tag {
  id: number
  name: string
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])

  const fetchTags = useCallback(async (search?: string, folderId?: number | null) => {
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (folderId != null) params.folder_id = String(folderId)
      const data = await api.get('/tags', { params }) as any
      return (Array.isArray(data) ? data : []) as Tag[]
    } catch {
      return []
    }
  }, [])

  const createTag = useCallback(async (name: string): Promise<Tag | null> => {
    try {
      return await api.post('/tags', { name }) as any as Tag
    } catch {
      return null
    }
  }, [])

  const deleteTag = useCallback(async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/tags/${id}`)
      return true
    } catch {
      return false
    }
  }, [])

  return { tags, setTags, fetchTags, createTag, deleteTag }
}
