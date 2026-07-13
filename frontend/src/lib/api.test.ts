import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  apiFetch,
  createTodo,
  listTodos,
  listTransactions,
  login,
} from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiFetch', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    document.cookie = 'csrf_token=csrf-token; path=/';
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    document.cookie = 'csrf_token=; Max-Age=0; path=/';
  });

  it('sends JSON requests with credentials and CSRF header', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1, title: 'Task' }));

    const result = await createTodo({ title: 'Task', priority: 2 });

    expect(result).toEqual({ id: 1, title: 'Task' });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'csrf-token',
      },
      body: JSON.stringify({ title: 'Task', priority: 2 }),
      credentials: 'include',
    });
  });

  it('returns undefined for 204 responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(apiFetch<void>('DELETE', '/api/v1/todos/1')).resolves.toBe(
      undefined,
    );
  });

  it('uses backend error messages from detail, message, or error fields', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: 'Bad detail' }, 400));
    await expect(apiFetch('GET', '/api/v1/fail')).rejects.toMatchObject({
      status: 400,
      message: 'Bad detail',
    });

    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Bad message' }, 400));
    await expect(apiFetch('GET', '/api/v1/fail')).rejects.toMatchObject({
      status: 400,
      message: 'Bad message',
    });

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Bad error' }, 400));
    await expect(apiFetch('GET', '/api/v1/fail')).rejects.toMatchObject({
      status: 400,
      message: 'Bad error',
    });
  });

  it('refreshes auth once on 401 and retries the original request', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: 'expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ user: { id: 1 } }))
      .mockResolvedValueOnce(jsonResponse({ user: { id: 1 } }));

    const result = await apiFetch('GET', '/api/v1/auth/me');

    expect(result).toEqual({ user: { id: 1 } });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/v1/auth/me', {
      method: 'GET',
      headers: {},
      body: undefined,
      credentials: 'include',
    });
  });

  it('does not attach CSRF or refresh auth for login', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ status: 'authenticated', user: { id: 1 } }),
    );

    await login({ username: 'rex', password: 'secret' });

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'rex', password: 'secret' }),
      credentials: 'include',
    });
  });

  it('builds Todo list query params from frontend filters', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ items: [], total: 0, skip: 0, limit: 20 }),
    );

    await listTodos({
      folder_id: 3,
      search: 'api contract',
      priority: 1,
      status: 'active',
      tag_id: 7,
      due_from: '2026-06-01',
      due_to: '2026-06-30',
      skip: 10,
      limit: 20,
    });

    const requestUrl = new URL(
      `http://localhost${String(fetchMock.mock.calls[0][0])}`,
    );
    expect(requestUrl.pathname).toBe('/api/v1/todos');
    expect(requestUrl.searchParams.get('folder_id')).toBe('3');
    expect(requestUrl.searchParams.get('search')).toBe('api contract');
    expect(requestUrl.searchParams.get('priority')).toBe('1');
    expect(requestUrl.searchParams.get('status')).toBe('active');
    expect(requestUrl.searchParams.get('tag_id')).toBe('7');
    expect(requestUrl.searchParams.get('sprint_id')).toBeNull();
    expect(requestUrl.searchParams.get('due_from')).toBe('2026-06-01');
    expect(requestUrl.searchParams.get('due_to')).toBe('2026-06-30');
    expect(requestUrl.searchParams.get('skip')).toBe('10');
    expect(requestUrl.searchParams.get('limit')).toBe('20');
  });

  it('builds Finance transaction query params from filters', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ items: [], total: 0, skip: 0, limit: 100 }),
    );

    await listTransactions(2, {
      type: 'expense',
      account_id: 4,
      category_id: 5,
      tag_id: 6,
      event_id: 7,
      search: 'lunch',
      skip: 20,
      limit: 50,
    });

    const requestUrl = new URL(
      `http://localhost${String(fetchMock.mock.calls[0][0])}`,
    );
    expect(requestUrl.pathname).toBe('/api/v1/finance/transactions');
    expect(requestUrl.searchParams.get('ledger_id')).toBe('2');
    expect(requestUrl.searchParams.get('type')).toBe('expense');
    expect(requestUrl.searchParams.get('account_id')).toBe('4');
    expect(requestUrl.searchParams.get('category_id')).toBe('5');
    expect(requestUrl.searchParams.get('tag_id')).toBe('6');
    expect(requestUrl.searchParams.get('event_id')).toBe('7');
    expect(requestUrl.searchParams.get('search')).toBe('lunch');
    expect(requestUrl.searchParams.get('skip')).toBe('20');
    expect(requestUrl.searchParams.get('limit')).toBe('50');
  });

  it('wraps network failures as ApiError status 0', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));

    await expect(apiFetch('GET', '/api/v1/todos')).rejects.toMatchObject({
      status: 0,
    });
  });
});
