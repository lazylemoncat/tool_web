// 通用 API 客户端: fetch 封装, CSRF 注入, 401 自动刷新重试和统一错误类型.
// 各业务模块的 API 函数位于 lib/api/<模块>.ts, 均通过本文件的 apiFetch 发请求.

export type ApiFetchOptions = {
  skipCsrf?: boolean;
  skipAuthRefresh?: boolean;
};

export class ApiError extends Error {
  status: number;
  detail?: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function doRefresh(): Promise<void> {
  const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new ApiError(res.status, '刷新登录失败');
}

export async function refreshToken(): Promise<void> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = doRefresh().finally(() => { isRefreshing = false; refreshPromise = null; });
  return refreshPromise;
}

export function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;

  const payload = data as Record<string, unknown>;
  const detail = payload.detail;
  const message = payload.message;
  const error = payload.error;

  if (typeof detail === 'string' && detail.trim()) return detail;
  if (typeof message === 'string' && message.trim()) return message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

export async function apiFetch<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: ApiFetchOptions,
): Promise<T> {
  const url = path.startsWith('http') ? path : path;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // CSRF token for mutating requests
  if (!options?.skipCsrf && method !== 'GET' && method !== 'HEAD') {
    const csrf = getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, '网络连接失败，请检查网络');
  }

  // 401 → refresh → retry once
  if (res.status === 401 && !options?.skipAuthRefresh) {
    try {
      await refreshToken();
    } catch {
      throw new ApiError(401, '未认证，请先登录');
    }
    // Retry with new CSRF token
    const retryHeaders: Record<string, string> = { ...headers };
    if (method !== 'GET' && method !== 'HEAD') {
      const csrf = getCsrfToken();
      if (csrf) retryHeaders['X-CSRF-Token'] = csrf;
    }
    try {
      res = await fetch(url, {
        method,
        headers: retryHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });
    } catch {
      throw new ApiError(0, '网络连接失败');
    }
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  // Parse JSON response
  let data: unknown;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(res.status, res.status >= 500 ? '后端服务不可用，请确认后端已启动' : '服务器返回格式错误');
  }

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(data, `请求失败 (${res.status})`), data);
  }

  return data as T;
}
