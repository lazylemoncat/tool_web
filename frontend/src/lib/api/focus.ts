import { apiFetch } from '@/lib/api';
import type {
  FocusRange,
  FocusSessionCreate,
  FocusSessionFilters,
  FocusSessionListResponse,
  FocusSessionOut,
  FocusSessionUpdate,
  FocusSummaryResponse,
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
