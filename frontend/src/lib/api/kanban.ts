// Kanban 模块 API: Sprint 与看板列. 看板任务 (含移动) 的 API 位于 lib/api/kanbanTask.ts.
// 看板只使用 KanbanTask 体系, 普通 Todo 不绑定看板列.
import { apiFetch } from './client';
import type {
  Sprint, SprintCreate, SprintUpdate,
  KanbanColumnData, KanbanColumnCreate, KanbanColumnUpdate,
} from '@/lib/types';

// ===== Sprints =====
export async function listSprints(folderId: number): Promise<Sprint[]> {
  return apiFetch<Sprint[]>('GET', `/api/v1/sprints?folder_id=${folderId}`);
}

export async function createSprint(body: SprintCreate): Promise<Sprint> {
  return apiFetch<Sprint>('POST', '/api/v1/sprints', body);
}

export async function updateSprint(id: number, body: SprintUpdate): Promise<Sprint> {
  return apiFetch<Sprint>('PUT', `/api/v1/sprints/${id}`, body);
}

export async function deleteSprint(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/sprints/${id}`);
}

// ===== Kanban Columns =====
export async function listKanbanColumns(sprintId: number): Promise<KanbanColumnData[]> {
  return apiFetch<KanbanColumnData[]>('GET', `/api/v1/kanban-columns?sprint_id=${sprintId}`);
}

export async function createKanbanColumn(body: KanbanColumnCreate): Promise<KanbanColumnData> {
  return apiFetch<KanbanColumnData>('POST', '/api/v1/kanban-columns', body);
}

export async function updateKanbanColumn(id: number, body: KanbanColumnUpdate): Promise<KanbanColumnData> {
  return apiFetch<KanbanColumnData>('PUT', `/api/v1/kanban-columns/${id}`, body);
}

export async function deleteKanbanColumn(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/kanban-columns/${id}`);
}

export async function reorderKanbanColumns(items: { id: number; sort_order: number }[]): Promise<void> {
  return apiFetch<void>('POST', '/api/v1/kanban-columns/reorder', { items });
}
