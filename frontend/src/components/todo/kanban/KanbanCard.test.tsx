import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FieldDef, KanbanTaskOut } from '@/lib/types';
import KanbanCard from './KanbanCard';

const fields: FieldDef[] = [
  {
    key: 'title',
    label: 'Title',
    type: 'text',
    show_on_card: true,
    show_in_detail: true,
    required: true,
    order: 1,
    system: true,
  },
  {
    key: 'module',
    label: 'Module',
    type: 'text',
    show_on_card: true,
    show_in_detail: true,
    required: false,
    order: 2,
    system: false,
  },
];

const task: KanbanTaskOut = {
  id: 1,
  folder_id: 1,
  sprint_id: 2,
  column_id: 3,
  title: 'Card title',
  version: 'V1',
  task_type: 'feature',
  priority: 'P1',
  requirement_desc: null,
  technical_desc: null,
  acceptance_criteria: null,
  custom_fields: { module: 'frontend' },
  sort_order: 0,
  created_at: '2026-06-01T00:00:00',
  updated_at: '2026-06-01T00:00:00',
};

describe('KanbanCard', () => {
  it('renders card fields and handles click, confirm, and drag', async () => {
    const onClick = vi.fn();
    const onConfirm = vi.fn();
    const onDragStart = vi.fn();

    render(
      <KanbanCard
        task={task}
        fields={fields}
        isLastColumn={false}
        onClick={onClick}
        onConfirm={onConfirm}
        onDragStart={onDragStart}
      />,
    );

    expect(screen.getByText('Card title')).toBeInTheDocument();
    expect(screen.getByText('Module: frontend')).toBeInTheDocument();
    fireEvent.dragStart(screen.getByText('Card title'));
    expect(onDragStart).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByText('Card title'));
    expect(onClick).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('hides confirm action in the last column', () => {
    render(
      <KanbanCard
        task={task}
        fields={fields}
        isLastColumn
        onClick={vi.fn()}
        onConfirm={vi.fn()}
        onDragStart={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
