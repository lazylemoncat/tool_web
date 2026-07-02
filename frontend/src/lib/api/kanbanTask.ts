import { apiFetch } from './client';
import type {
  KanbanTaskOut, KanbanTaskCreate, KanbanTaskUpdate, MoveKanbanTaskRequest,
} from '@/lib/types';

export async function listKanbanTasks(
  folderId: number,
  sprintId?: number | null,
  columnId?: number | null,
): Promise<KanbanTaskOut[]> {
  const params = new URLSearchParams({ folder_id: String(folderId) });
  if (sprintId != null) params.set('sprint_id', String(sprintId));
  if (columnId != null) params.set('column_id', String(columnId));
  return apiFetch<KanbanTaskOut[]>('GET', `/api/v1/kanban/tasks?${params}`);
}

export async function getKanbanTask(id: number): Promise<KanbanTaskOut> {
  return apiFetch<KanbanTaskOut>('GET', `/api/v1/kanban/tasks/${id}`);
}

export async function createKanbanTask(body: KanbanTaskCreate): Promise<KanbanTaskOut> {
  return apiFetch<KanbanTaskOut>('POST', '/api/v1/kanban/tasks', body);
}

export async function updateKanbanTask(id: number, body: KanbanTaskUpdate): Promise<KanbanTaskOut> {
  return apiFetch<KanbanTaskOut>('PUT', `/api/v1/kanban/tasks/${id}`, body);
}

export async function deleteKanbanTask(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/kanban/tasks/${id}`);
}

export async function moveKanbanTask(id: number, body: MoveKanbanTaskRequest): Promise<KanbanTaskOut> {
  return apiFetch<KanbanTaskOut>('PUT', `/api/v1/kanban/tasks/${id}/move`, body);
}
