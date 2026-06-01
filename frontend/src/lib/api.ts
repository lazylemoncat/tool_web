'use client';

export type ApiErrorPayload = {
  code?: number;
  message?: string;
  data?: unknown;
};

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload | null;

  constructor(status: number, message: string, payload: ApiErrorPayload | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.message || payload?.detail || `请求失败: ${response.status}`;
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const hasBody = init.body !== undefined && init.body !== null;

  if (hasBody && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', JSON_HEADERS['Content-Type']);
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });

  return parseResponse<T>(response);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return '请求失败, 请稍后重试';
}
