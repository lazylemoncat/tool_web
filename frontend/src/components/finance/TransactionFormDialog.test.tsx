import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api';
import type {
  AccountOut,
  CategoryOut,
  TransactionOut,
} from '@/lib/financeTypes';
import TransactionFormDialog from './TransactionFormDialog';

vi.mock('@/lib/api', () => ({
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}));

const account: AccountOut = {
  id: 10,
  ledger_id: 1,
  name: 'Cash',
  type: 'cash',
  currency: 'CNY',
  initial_balance: '0.00',
  archived: false,
  created_at: '2026-06-01T00:00:00',
  updated_at: '2026-06-01T00:00:00',
  current_balance: '0.00',
};

const category: CategoryOut = {
  id: 20,
  ledger_id: 1,
  parent_id: null,
  name: 'Food',
  icon_type: 'emoji',
  icon_value: '🍽️',
  created_at: '2026-06-01T00:00:00',
  children: [],
};

function renderDialog(props?: {
  editTx?: TransactionOut | null;
  onSaved?: () => void;
}) {
  return render(
    <TransactionFormDialog
      open
      onClose={vi.fn()}
      onSaved={props?.onSaved ?? vi.fn()}
      accounts={[account]}
      categories={[category]}
      tags={[]}
      events={[]}
      activeLedgerId={1}
      editTx={props?.editTx ?? null}
    />,
  );
}

describe('TransactionFormDialog', () => {
  beforeEach(() => {
    vi.mocked(api.createTransaction).mockReset();
    vi.mocked(api.updateTransaction).mockReset();
  });

  it('submits a create transaction payload', async () => {
    const onSaved = vi.fn();
    vi.mocked(api.createTransaction).mockResolvedValueOnce({} as TransactionOut);

    renderDialog({ onSaved });
    const amountInput = await screen.findByPlaceholderText('0.00');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '25.50');

    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(api.createTransaction).toHaveBeenCalledWith({
        ledger_id: 1,
        account_id: 10,
        type: 'expense',
        amount: '25.50',
        note: null,
        category_id: null,
        tag_ids: [],
        event_id: null,
      });
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('submits an update transaction payload for edit mode', async () => {
    const onSaved = vi.fn();
    vi.mocked(api.updateTransaction).mockResolvedValueOnce({} as TransactionOut);
    const editTx = {
      id: 99,
      ledger_id: 1,
      account_id: 10,
      type: 'income',
      amount: '88.00',
      currency: 'CNY',
      occurred_at: '2026-06-01T00:00:00',
      recorded_at: '2026-06-01T00:00:00',
      category_id: 20,
      note: 'Original',
      event_id: null,
      parent_transaction_id: null,
      sort_order: 0,
      created_at: '2026-06-01T00:00:00',
      updated_at: '2026-06-01T00:00:00',
      tags: [],
      split_items: [],
      attachments: [],
      linked_todos: [],
      children: [],
    } as TransactionOut;

    renderDialog({ editTx, onSaved });
    const amountInput = await screen.findByPlaceholderText('0.00');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '90');

    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(api.updateTransaction).toHaveBeenCalledWith(99, {
        ledger_id: 1,
        account_id: 10,
        type: 'income',
        amount: '90',
        note: 'Original',
        category_id: 20,
        tag_ids: [],
        event_id: null,
      });
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});
