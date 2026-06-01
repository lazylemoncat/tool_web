export interface AuthUser {
  id: number;
  username: string;
  is_admin: boolean;
}

export interface AuthResponse {
  status?: 'authenticated' | 'mfa_required';
  token?: string;
  username?: string;
  preferences?: Record<string, unknown>;
  user?: AuthUser;
  csrf_token?: string;
  challenge_id?: string;
  available_methods?: string[];
  expires_in?: number;
}

export interface Folder {
  id: number;
  parent_id: number | null;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  todo_count: number;
  children: Folder[];
}

export interface TodoTag {
  id: number;
  name: string;
}

export interface RecurrenceRule {
  id: number;
  rrule_string: string;
}

export interface Todo {
  id: number;
  folder_id: number | null;
  parent_id: number | null;
  title: string;
  note: string | null;
  priority: number;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children: Todo[];
  tags: TodoTag[];
  recurrence_rules: RecurrenceRule[];
}

export interface TodoListResponse {
  items: Todo[];
  total: number;
  skip: number;
  limit: number;
}

export interface Ledger {
  id: number;
  name: string;
  icon: string;
  currency: string;
  created_at: string;
}

export interface Account {
  id: number;
  ledger_id: number;
  name: string;
  type: string;
  currency: string;
  initial_balance: string;
  current_balance: string;
  archived: boolean;
}

export interface FinanceCategory {
  id: number;
  ledger_id: number;
  parent_id: number | null;
  name: string;
  icon: string;
  created_at: string;
  children: FinanceCategory[];
}

export interface FinanceTag {
  id: number;
  ledger_id: number;
  name: string;
}

export interface FinanceEvent {
  id: number;
  ledger_id: number;
  name: string;
  description: string | null;
  start_at: string | null;
  end_at: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  transaction_count: number;
  total_amount: string;
}

export interface Attachment {
  id: number;
  url: string;
  mime_type: string;
  size: number;
  created_at: string;
}

export interface SplitItem {
  id: number;
  transaction_id: number;
  amount: string;
  category_id: number | null;
  note: string | null;
  category?: FinanceCategory | null;
}

export interface Transaction {
  id: number;
  ledger_id: number;
  account_id: number;
  type: 'expense' | 'income' | 'transfer';
  amount: string;
  currency: string;
  occurred_at: string;
  recorded_at: string;
  note: string | null;
  event_id: number | null;
  parent_transaction_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category_id: number | null;
  account?: Account | null;
  category?: FinanceCategory | null;
  event?: FinanceEvent | null;
  tags: FinanceTag[];
  split_items: SplitItem[];
  attachments: Attachment[];
  linked_todos: Record<string, unknown>[];
  children: Transaction[];
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  skip: number;
  limit: number;
}

export interface Budget {
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
  current_spent: string;
  progress_pct: number;
}

export interface DashboardSummary {
  total_assets: string;
  month_income: string;
  month_expense: string;
  budget_usage_pct: number;
  recent_transactions: Transaction[];
  budgets: Budget[];
}

export interface FinanceStats {
  category_data: { name: string; value: number }[];
  trend_data: { date: string; amount: number }[];
}

export interface Relation {
  id: number;
  from_type: string;
  from_id: number;
  relation_type: string;
  to_type: string;
  to_id: number;
  created_at: string;
}
