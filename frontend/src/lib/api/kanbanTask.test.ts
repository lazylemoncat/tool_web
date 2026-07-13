import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './client';
import {
  createKanbanTask,
  deleteKanbanTask,
  getKanbanTask,
  listKanbanTasks,
  moveKanbanTask,
  updateKanbanTask,
} from './kanbanTask';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe('kanban task API wrappers', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('lists tasks with folder, sprint, and column filters', async () => {
    apiFetchMock.mockResolvedValueOnce([]);

    await listKanbanTasks(1, 2, 3);

    expect(apiFetchMock).toHaveBeenCalledWith(
      'GET',
      '/api/v1/kanban/tasks?folder_id=1&sprint_id=2&column_id=3',
    );
  });

  it('omits optional filters when they are null', async () => {
    apiFetchMock.mockResolvedValueOnce([]);

    await listKanbanTasks(1, null, null);

    expect(apiFetchMock).toHaveBeenCalledWith(
      'GET',
      '/api/v1/kanban/tasks?folder_id=1',
    );
  });

  it('uses the expected endpoints for CRUD operations', async () => {
    apiFetchMock.mockResolvedValue({});

    await getKanbanTask(10);
    await createKanbanTask({
      folder_id: 1,
      sprint_id: 2,
      column_id: 3,
      title: 'Task',
    });
    await updateKanbanTask(10, { title: 'Updated' });
    await deleteKanbanTask(10);
    await moveKanbanTask(10, { target_column_id: 4 });

    expect(apiFetchMock).toHaveBeenNthCalledWith(
      1,
      'GET',
      '/api/v1/kanban/tasks/10',
    );
    expect(apiFetchMock).toHaveBeenNthCalledWith(
      2,
      'POST',
      '/api/v1/kanban/tasks',
      { folder_id: 1, sprint_id: 2, column_id: 3, title: 'Task' },
    );
    expect(apiFetchMock).toHaveBeenNthCalledWith(
      3,
      'PUT',
      '/api/v1/kanban/tasks/10',
      { title: 'Updated' },
    );
    expect(apiFetchMock).toHaveBeenNthCalledWith(
      4,
      'DELETE',
      '/api/v1/kanban/tasks/10',
    );
    expect(apiFetchMock).toHaveBeenNthCalledWith(
      5,
      'PUT',
      '/api/v1/kanban/tasks/10/move',
      { target_column_id: 4 },
    );
  });
});
