/*
 自定义主题 hook: 获取、创建、更新、删除用户主题.
*/

import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'

export interface UserTheme {
  id: number
  name: string
  config_json: string
  created_at: string
  updated_at: string
}

export interface UserThemeBrief {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export function useThemes() {
  const [themes, setThemes] = useState<UserThemeBrief[]>([])
  const [loading, setLoading] = useState(true)

  const fetchThemes = useCallback(async () => {
    try {
      const data = await api.get('/themes') as any
      setThemes(Array.isArray(data) ? data : [])
    } catch {
      setThemes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchThemes()
  }, [fetchThemes])

  const createTheme = useCallback(async (name: string, configJson: string): Promise<UserTheme | null> => {
    try {
      const data = await api.post('/themes', { name, config_json: configJson }) as any
      await fetchThemes()
      return data as UserTheme
    } catch {
      return null
    }
  }, [fetchThemes])

  const getTheme = useCallback(async (id: number): Promise<UserTheme | null> => {
    try {
      return await api.get(`/themes/${id}`) as any as UserTheme
    } catch {
      return null
    }
  }, [])

  const updateTheme = useCallback(async (id: number, name: string, configJson: string): Promise<boolean> => {
    try {
      await api.put(`/themes/${id}`, { name, config_json: configJson })
      await fetchThemes()
      return true
    } catch {
      return false
    }
  }, [fetchThemes])

  const deleteTheme = useCallback(async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/themes/${id}`)
      await fetchThemes()
      return true
    } catch {
      return false
    }
  }, [fetchThemes])

  return { themes, loading, createTheme, getTheme, updateTheme, deleteTheme, refresh: fetchThemes }
}
