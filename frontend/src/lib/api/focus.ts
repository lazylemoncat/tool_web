import { apiFetch } from '@/lib/api';
import type {
  FocusFolderCreate,
  FocusFolderOut,
  FocusFolderUpdate,
  FocusRange,
  FocusSessionCreate,
  FocusSessionFilters,
  FocusSessionListResponse,
  FocusSessionOut,
  FocusSessionUpdate,
  FocusSummaryResponse,
  FocusTag,
} from '@/lib/focusTypes';

function appendParam(params: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') return;
  params.set(key, String(value));
}

export async function listFocusSessions(
  filters?: FocusSessionFilters,
): Promise<FocusSessionListResponse> {
  const params = new URLSearchParams();
  appendParam(params, 'search', filters?.search);
  appendParam(params, 'mode', filters?.mode);
  appendParam(params, 'abandoned', filters?.abandoned);
  appendParam(params, 'folder_id', filters?.folder_id);
  appendParam(params, 'tag_id', filters?.tag_id);
  appendParam(params, 'started_from', filters?.started_from);
  appendParam(params, 'started_to', filters?.started_to);
  appendParam(params, 'skip', filters?.skip);
  appendParam(params, 'limit', filters?.limit);
  const qs = params.toString();
  return apiFetch<FocusSessionListResponse>('GET', `/api/v1/focus/sessions${qs ? '?' + qs : ''}`);
}

export async function createFocusSession(
  body: FocusSessionCreate,
): Promise<FocusSessionOut> {
  return apiFetch<FocusSessionOut>('POST', '/api/v1/focus/sessions', body);
}

export async function updateFocusSession(
  id: number,
  body: FocusSessionUpdate,
): Promise<FocusSessionOut> {
  return apiFetch<FocusSessionOut>('PUT', `/api/v1/focus/sessions/${id}`, body);
}

export async function deleteFocusSession(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/focus/sessions/${id}`);
}

export async function getFocusSummary(
  range: FocusRange,
): Promise<FocusSummaryResponse> {
  const params = new URLSearchParams({ range });
  return apiFetch<FocusSummaryResponse>('GET', `/api/v1/focus/summary?${params}`);
}

export async function listFocusFolders(
  params?: { parent_id?: number; skip?: number; limit?: number },
): Promise<FocusFolderOut[]> {
  const query = new URLSearchParams();
  appendParam(query, 'parent_id', params?.parent_id);
  appendParam(query, 'skip', params?.skip);
  appendParam(query, 'limit', params?.limit);
  const qs = query.toString();
  return apiFetch<FocusFolderOut[]>('GET', `/api/v1/focus/folders${qs ? '?' + qs : ''}`);
}

export async function createFocusFolder(
  body: FocusFolderCreate,
): Promise<FocusFolderOut> {
  return apiFetch<FocusFolderOut>('POST', '/api/v1/focus/folders', body);
}

export async function updateFocusFolder(
  id: number,
  body: FocusFolderUpdate,
): Promise<FocusFolderOut> {
  return apiFetch<FocusFolderOut>('PUT', `/api/v1/focus/folders/${id}`, body);
}

export async function deleteFocusFolder(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/focus/folders/${id}`);
}

export async function reorderFocusFolders(
  items: { id: number; sort_order: number }[],
): Promise<void> {
  return apiFetch<void>('POST', '/api/v1/focus/folders/reorder', { items });
}

export async function listFocusTags(params?: { search?: string }): Promise<FocusTag[]> {
  const query = new URLSearchParams();
  appendParam(query, 'search', params?.search);
  const qs = query.toString();
  return apiFetch<FocusTag[]>('GET', `/api/v1/focus/tags${qs ? '?' + qs : ''}`);
}

export async function createFocusTag(body: { name: string }): Promise<FocusTag> {
  return apiFetch<FocusTag>('POST', '/api/v1/focus/tags', body);
}

export async function deleteFocusTag(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/focus/tags/${id}`);
}
