import { describe, expect, it } from 'vitest';
import type { Sprint } from '@/lib/types';
import { getLatestSprintId } from './sprintSelection';

function sprint(overrides: Partial<Sprint>): Sprint {
  return {
    id: 1,
    folder_id: 10,
    name: 'Sprint',
    goal: null,
    start_date: null,
    end_date: null,
    status: 'planned',
    sort_order: 0,
    created_at: '2026-06-01T00:00:00',
    updated_at: '2026-06-01T00:00:00',
    ...overrides,
  };
}

describe('getLatestSprintId', () => {
  it('selects the last sprint by sort order when entering a kanban folder', () => {
    const sprints = [
      sprint({ id: 1, name: 'Sprint 1', sort_order: 0 }),
      sprint({ id: 2, name: 'Sprint 2', sort_order: 1 }),
      sprint({ id: 3, name: 'Sprint 3', sort_order: 2 }),
    ];

    expect(getLatestSprintId(sprints)).toBe(3);
  });

  it('uses id as a deterministic tiebreaker for equal sort order', () => {
    const sprints = [
      sprint({ id: 7, sort_order: 1 }),
      sprint({ id: 9, sort_order: 1 }),
      sprint({ id: 8, sort_order: 1 }),
    ];

    expect(getLatestSprintId(sprints)).toBe(9);
  });

  it('returns null when there are no sprints', () => {
    expect(getLatestSprintId([])).toBeNull();
  });
});
