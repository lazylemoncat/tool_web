/*
 API 请求封装: 统一响应解包, cookie-based JWT, 自动 refresh, 401 处理.
*/

import axios from 'axios'
import { getToken, shouldRefreshToken, setToken } from '../utils/token'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Track inflight refresh to avoid duplicate calls
let refreshPromise: Promise<void> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) {
    await refreshPromise
    return !!getToken()
  }
  refreshPromise = (async () => {
    try {
      const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
      const body = res.data
      if (body.token) {
        setToken(body.token)
      }
    } catch {
      setToken(null)
    } finally {
      refreshPromise = null
    }
  })()
  await refreshPromise
  return !!getToken()
}

api.interceptors.request.use(async (config) => {
  const token = getToken()
  if (token && shouldRefreshToken(token)) {
    await tryRefresh()
  }
  return config
})

api.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body.code !== undefined && body.code !== 0) {
      return Promise.reject(new Error(body.message || 'Request failed'))
    }
    return body.data !== undefined ? body.data : body
  },
  async (err) => {
    if (err.response?.status === 401) {
      const url: string = err.config?.url || ''
      if (url.includes('/auth/login') || url.includes('/auth/register')) {
        const msg = err.response?.data?.message || err.message || 'Network error'
        return Promise.reject(new Error(msg))
      }
      const refreshed = await tryRefresh()
      if (refreshed && err.config && !err.config._retry) {
        err.config._retry = true
        return api(err.config)
      }
      // Refresh failed — clear state
      setToken(null)
      localStorage.removeItem('username')
      window.location.reload()
    }
    const msg = err.response?.data?.message || err.message || 'Network error'
    return Promise.reject(new Error(msg))
  },
)

export default api
