import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';
import type { TodoOut } from '@/lib/types';
import TaskDetail from './TaskDetail';

const baseTask: TodoOut = {
  id: 1,
  folder_id: null,
  sprint_id: null,
  column_id: null,
  parent_id: null,
  title: 'Dark mode task',
  note: null,
  priority: 2,
  due_date: null,
  due_time: null,
  is_completed: false,
  completed_at: null,
  sort_order: 0,
  created_at: '2026-06-21T08:00:00',
  updated_at: '2026-06-21T09:00:00',
  children: [],
  tags: [],
  recurrence_rules: [],
};

describe('TaskDetail', () => {
  it('uses the dark theme paper background for the detail panel', () => {
    const theme = createTheme({ palette: { mode: 'dark' } });
    const { container } = render(
      <ThemeProvider theme={theme}>
        <TaskDetail task={baseTask} />
      </ThemeProvider>,
    );

    const panel = container.firstElementChild;
    expect(panel).not.toBeNull();
    expect(getComputedStyle(panel as Element).backgroundColor).toBe('rgb(18, 18, 18)');
  });
});
