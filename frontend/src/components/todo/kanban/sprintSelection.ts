import type { Sprint } from '@/lib/types';

/**
 * Resolves the sprint opened by default when entering a Kanban folder.
 * Sprint lists are ordered oldest to newest by sort_order, then id.
 */
export function getLatestSprintId(sprints: Sprint[]): number | null {
  if (sprints.length === 0) return null;

  return sprints.reduce((latest, sprint) => {
    if (sprint.sort_order > latest.sort_order) return sprint;
    if (sprint.sort_order === latest.sort_order && sprint.id > latest.id) {
      return sprint;
    }
    return latest;
  }, sprints[0]).id;
}
