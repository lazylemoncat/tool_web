export interface Ledger {
  id: number
  name: string
  icon: string
  currency: string
  created_at: string
}

export interface Account {
  id: number
  ledger_id: number
  name: string
  type: string
  currency: string
  initial_balance: number
  archived: boolean
  created_at: string
  updated_at: string
  current_balance: number
}

export interface FinanceCategory {
  id: number
  ledger_id: number
  parent_id: number | null
  name: string
  icon: string
  created_at: string
  children: FinanceCategory[]
}

export interface FinanceTag {
  id: number
  ledger_id: number
  name: string
}

export interface Attachment {
  id: number
  url: string
  mime_type: string
  size: number
  created_at: string
}

export interface SplitItem {
  id: number
  transaction_id: number
  amount: number
  category_id: number | null
  note: string | null
  category?: FinanceCategory | null
}

export interface Transaction {
  id: number
  ledger_id: number
  account_id: number
  type: 'expense' | 'income' | 'transfer'
  amount: number
  currency: string
  occurred_at: string
  recorded_at: string
  category_id: number | null
  note: string | null
  event_id: number | null
  parent_transaction_id: number | null
  sort_order: number
  created_at: string
  updated_at: string
  account?: Account | null
  category?: FinanceCategory | null
  tags: FinanceTag[]
  split_items: SplitItem[]
  attachments: Attachment[]
  children?: Transaction[]
  linked_todos: { id: number; title: string; is_completed: boolean }[]
}

export interface TransactionFilters {
  ledger_id?: number
  account_id?: number
  category_id?: number
  tag_id?: number
  event_id?: number
  type?: string
  start_date?: string
  end_date?: string
  search?: string
}

export interface FinanceEvent {
  id: number
  ledger_id: number
  name: string
  description: string | null
  start_at: string | null
  end_at: string | null
  color: string
  created_at: string
  updated_at: string
  transaction_count: number
  total_amount: number
}

export interface Budget {
  id: number
  ledger_id: number
  name: string
  amount: number
  currency: string
  rrule: string | null
  filters: Record<string, number[]> | null
  rollover: boolean
  alert_threshold: number
  created_at: string
  updated_at: string
  current_spent: number
  progress_pct: number
}

export interface DashboardSummary {
  total_assets: number
  month_income: number
  month_expense: number
  budget_usage_pct: number
  recent_transactions: Transaction[]
  budgets: Budget[]
}

export interface StatsData {
  category_data: { name: string; value: number }[]
  trend_data: { date: string; amount: number }[]
}
