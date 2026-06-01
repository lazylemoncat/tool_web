// ===== Finance Module Types (matches backend API) =====

// Ledgers (账本)
export interface LedgerOut {
  id: number;
  name: string;
  icon: string;
  currency: string;
  created_at: string;
}

export interface LedgerCreate {
  name: string;
  icon?: string;
  currency?: string;
}

export interface LedgerUpdate {
  name?: string;
  icon?: string;
  currency?: string;
}

// Accounts (账户)
export type AccountType = '借记卡' | '信用卡' | '现金' | '电子钱包' | '虚拟账户';

export interface AccountOut {
  id: number;
  ledger_id: number;
  name: string;
  type: string;
  currency: string;
  initial_balance: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  current_balance?: string;
}

export interface AccountCreate {
  ledger_id: number;
  name: string;
  type?: string;
  currency?: string;
  initial_balance?: number | string;
}

export interface AccountUpdate {
  name?: string;
  type?: string;
  currency?: string;
  initial_balance?: number | string;
  archived?: boolean;
}

// Categories (分类 - tree)
export interface CategoryOut {
  id: number;
  ledger_id: number;
  parent_id: number | null;
  name: string;
  icon: string;
  created_at: string;
  children: CategoryOut[];
}

export interface CategoryCreate {
  ledger_id: number;
  parent_id?: number | null;
  name: string;
  icon?: string;
}

export interface CategoryUpdate {
  parent_id?: number | null;
  name?: string;
  icon?: string;
}

// Finance Tags (标签)
export interface FinanceTagOut {
  id: number;
  ledger_id: number;
  name: string;
}

export interface FinanceTagCreate {
  ledger_id: number;
  name: string;
}

// Budgets (预算)
export interface BudgetOut {
  id: number;
  ledger_id: number;
  name: string;
  amount: string;
  currency: string;
  rrule: string | null;
  filters: Record<string, unknown> | null;
  rollover: boolean;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
  current_spent?: string;
  progress_pct?: number;
}

export interface BudgetCreate {
  ledger_id: number;
  name: string;
  amount: number | string;
  currency?: string;
  rrule?: string | null;
  filters?: Record<string, unknown> | null;
  rollover?: boolean;
  alert_threshold?: number;
}

export interface BudgetUpdate {
  name?: string;
  amount?: number | string;
  currency?: string;
  rrule?: string | null;
  filters?: Record<string, unknown> | null;
  rollover?: boolean;
  alert_threshold?: number;
}

// Events (事件)
export interface FinanceEventOut {
  id: number;
  ledger_id: number;
  name: string;
  description: string | null;
  start_at: string | null;
  end_at: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  transaction_count?: number;
  total_amount?: string;
}

export interface FinanceEventCreate {
  ledger_id: number;
  name: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  color?: string;
}

export interface FinanceEventUpdate {
  name?: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  color?: string;
}

export interface EventSummary {
  event: FinanceEventOut;
  transactions: TransactionOut[];
  total_expense: string;
  total_income: string;
}

// Transactions (交易)
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface SplitItem {
  note?: string | null;
  amount: number | string;
  category_id?: number | null;
}

export interface TransactionOut {
  id: number;
  ledger_id: number;
  account_id: number;
  type: string;
  amount: string;
  currency: string;
  occurred_at: string;
  recorded_at: string;
  category_id: number | null;
  note: string | null;
  event_id: number | null;
  parent_transaction_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Nested objects (populated by API)
  account?: AccountOut;
  category?: CategoryOut;
  event?: FinanceEventOut;
  tags?: FinanceTagOut[];
  split_items?: SplitItemOut[];
  attachments?: unknown[];
  linked_todos?: unknown[];
  children?: TransactionOut[];
}

export interface SplitItemOut {
  id: number;
  transaction_id: number;
  note: string | null;
  amount: string;
  category_id: number | null;
  sort_order: number;
  category?: CategoryOut;
}

export interface TransactionCreate {
  ledger_id: number;
  account_id: number;
  type: string;
  amount: number | string;
  currency?: string;
  occurred_at?: string;
  category_id?: number | null;
  note?: string | null;
  event_id?: number | null;
  parent_transaction_id?: number | null;
  sort_order?: number;
  tag_ids?: number[];
  split_items?: SplitItem[];
  attachment_ids?: number[];
  linked_todo_ids?: number[];
}

export interface TransactionUpdate {
  account_id?: number;
  type?: string;
  amount?: number | string;
  currency?: string;
  occurred_at?: string;
  category_id?: number | null;
  note?: string | null;
  event_id?: number | null;
  parent_transaction_id?: number | null;
  sort_order?: number;
  tag_ids?: number[];
  split_items?: SplitItem[];
  attachment_ids?: number[];
  linked_todo_ids?: number[];
}

export interface TransactionListResponse {
  items: TransactionOut[];
  total: number;
  skip: number;
  limit: number;
}

// Dashboard
export interface BudgetSummary {
  id: number;
  name: string;
  amount: string;
  current_spent: string;
  progress_pct: number;
  rrule: string | null;
  alert_threshold: number;
}

export interface DashboardSummary {
  total_assets: string;
  month_income: string;
  month_expense: string;
  budget_usage_pct: number;
  recent_transactions: TransactionOut[];
  budgets: BudgetSummary[];
}

// Stats (for charts)
export interface CategoryDataItem {
  category_name: string;
  category_icon: string;
  total: string;
  color: string;
}

export interface TrendDataItem {
  month: string;
  income: string;
  expense: string;
}

export interface StatsResponse {
  category_data: CategoryDataItem[];
  trend_data: TrendDataItem[];
}
