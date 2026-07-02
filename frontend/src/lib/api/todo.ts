// Todo 模块 API: 任务, 文件夹和标签的 CRUD, 批量操作与排序.
import { apiFetch } from './client';
import type {
  TodoOut, TodoCreate, TodoUpdate, TodoListResponse, BulkTodoRequest, TodoToggleBody,
  FolderOut, FolderCreate, FolderUpdate,
  ReorderItem,
  APITag,
} from '@/lib/types';

// ===== Todos =====
export async function listTodos(params?: {
  folder_id?: number;
  search?: string;
  priority?: number;
  status?: 'active' | 'completed';
  tag_id?: number;
  skip?: number;
  limit?: number;
  due_from?: string;
  due_to?: string;
}): Promise<TodoListResponse> {
  const query = new URLSearchParams();
  if (params?.folder_id !== undefined) query.set('folder_id', String(params.folder_id));
  if (params?.search) query.set('search', params.search);
  if (params?.priority) query.set('priority', String(params.priority));
  if (params?.status) query.set('status', params.status);
  if (params?.tag_id) query.set('tag_id', String(params.tag_id));
  if (params?.due_from) query.set('due_from', params.due_from);
  if (params?.due_to) query.set('due_to', params.due_to);
  if (params?.skip) query.set('skip', String(params.skip));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<TodoListResponse>('GET', `/api/v1/todos${qs ? '?' + qs : ''}`);
}

export async function createTodo(body: TodoCreate): Promise<TodoOut> {
  return apiFetch<TodoOut>('POST', '/api/v1/todos', body);
}

export async function updateTodo(id: number, body: TodoUpdate): Promise<TodoOut> {
  return apiFetch<TodoOut>('PUT', `/api/v1/todos/${id}`, body);
}

export async function deleteTodo(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/todos/${id}`);
}

export async function toggleTodo(id: number, body?: TodoToggleBody): Promise<TodoOut> {
  return apiFetch<TodoOut>('PATCH', `/api/v1/todos/${id}/toggle`, body);
}

export async function bulkAction(body: BulkTodoRequest): Promise<void> {
  return apiFetch<void>('POST', '/api/v1/todos/bulk', body);
}

export async function reorderTodos(items: ReorderItem[]): Promise<void> {
  return apiFetch<void>('POST', '/api/v1/todos/reorder', { items });
}

// ===== Folders =====
export async function listFolders(params?: { parent_id?: number; skip?: number; limit?: number }): Promise<FolderOut[]> {
  const query = new URLSearchParams();
  if (params?.parent_id !== undefined) query.set('parent_id', String(params.parent_id));
  if (params?.skip) query.set('skip', String(params.skip));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<FolderOut[]>('GET', `/api/v1/folders${qs ? '?' + qs : ''}`);
}

export async function createFolder(body: FolderCreate): Promise<FolderOut> {
  return apiFetch<FolderOut>('POST', '/api/v1/folders', body);
}

export async function updateFolder(id: number, body: FolderUpdate): Promise<FolderOut> {
  return apiFetch<FolderOut>('PUT', `/api/v1/folders/${id}`, body);
}

export async function deleteFolder(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/folders/${id}`);
}

export async function reorderFolders(items: ReorderItem[]): Promise<void> {
  return apiFetch<void>('POST', '/api/v1/folders/reorder', { items });
}

// ===== Tags =====
export async function listTags(params?: { search?: string; folder_id?: number }): Promise<APITag[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.folder_id !== undefined) query.set('folder_id', String(params.folder_id));
  const qs = query.toString();
  return apiFetch<APITag[]>('GET', `/api/v1/tags${qs ? '?' + qs : ''}`);
}

export async function createTag(body: { name: string }): Promise<APITag> {
  return apiFetch<APITag>('POST', '/api/v1/tags', body);
}

export async function deleteTag(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/tags/${id}`);
}
