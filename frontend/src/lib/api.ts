// 兼容入口 (TD-01 收敛中): 通用 client 与已迁出的 Todo/Kanban 模块 API 从此处再导出,
// 旧引用点无需改动. Auth 与 Finance 部分尚未迁出, 全量收敛后本文件将移除.
import { apiFetch, getCsrfToken, extractErrorMessage, refreshToken, ApiError } from './api/client';
import type {
  AuthResponse, LoginRequest, LoginResponse, MeResponse, MfaVerifyRequest,
  PasswordResetRequest,
  UsernameAvailabilityResponse,
} from './types';
import type {
  LedgerOut, LedgerCreate, LedgerUpdate,
  AccountOut, AccountCreate, AccountUpdate,
  CategoryOut, CategoryCreate, CategoryUpdate,
  FinanceTagOut, FinanceTagCreate, FinanceTagUpdate,
  BudgetOut, BudgetCreate, BudgetUpdate,
  FinanceEventOut, FinanceEventCreate, FinanceEventUpdate, EventSummary,
  TransactionOut, TransactionCreate, TransactionUpdate, TransactionListResponse, AttachmentOut,
  DashboardSummary, StatsResponse,
} from './financeTypes';
import type { ReorderItem } from './types';

export { ApiError, apiFetch } from './api/client';
export type { ApiFetchOptions } from './api/client';
export * from './api/todo';
export * from './api/kanban';

// ===== Auth =====
export async function login(body: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('POST', '/api/v1/auth/login', body, { skipCsrf: true, skipAuthRefresh: true });
}

export async function verifyMfa(body: MfaVerifyRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('POST', '/api/v1/auth/mfa/verify', body, { skipCsrf: true, skipAuthRefresh: true });
}

export async function resetPassword(body: PasswordResetRequest): Promise<void> {
  return apiFetch<void>('POST', '/api/v1/auth/password/reset', body, {
    skipCsrf: true,
    skipAuthRefresh: true,
  });
}

export async function logout(): Promise<void> {
  await apiFetch<void>('POST', '/api/v1/auth/logout', undefined, { skipCsrf: true });
}

export async function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('GET', '/api/v1/auth/me');
}

export async function refreshTokenApi(): Promise<void> {
  await refreshToken();
}

export async function register(body: {
  username: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('POST', '/api/v1/auth/register', body, {
    skipCsrf: true,
    skipAuthRefresh: true,
  });
}

export async function checkUsernameAvailability(
  username: string,
): Promise<UsernameAvailabilityResponse> {
  const query = new URLSearchParams({ username });
  return apiFetch<UsernameAvailabilityResponse>(
    'GET',
    `/api/v1/auth/username-availability?${query.toString()}`,
    undefined,
    { skipAuthRefresh: true },
  );
}

// ===== Finance: Ledgers =====
export async function listLedgers(): Promise<LedgerOut[]> {
  return apiFetch<LedgerOut[]>('GET', '/api/v1/finance/ledgers');
}

export async function createLedger(body: LedgerCreate): Promise<LedgerOut> {
  return apiFetch<LedgerOut>('POST', '/api/v1/finance/ledgers', body);
}

export async function updateLedger(id: number, body: LedgerUpdate): Promise<LedgerOut> {
  return apiFetch<LedgerOut>('PUT', `/api/v1/finance/ledgers/${id}`, body);
}

export async function deleteLedger(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/finance/ledgers/${id}`);
}

export async function reorderLedgers(items: ReorderItem[]): Promise<void> {
  return apiFetch<void>('POST', '/api/v1/finance/ledgers/reorder', { items });
}

// ===== Finance: Accounts =====
export async function listAccounts(ledgerId: number): Promise<AccountOut[]> {
  return apiFetch<AccountOut[]>('GET', `/api/v1/finance/accounts?ledger_id=${ledgerId}`);
}

export async function createAccount(body: AccountCreate): Promise<AccountOut> {
  return apiFetch<AccountOut>('POST', '/api/v1/finance/accounts', body);
}

export async function updateAccount(id: number, body: AccountUpdate): Promise<AccountOut> {
  return apiFetch<AccountOut>('PUT', `/api/v1/finance/accounts/${id}`, body);
}

export async function deleteAccount(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/finance/accounts/${id}`);
}

export async function reorderAccounts(ledgerId: number, items: ReorderItem[]): Promise<void> {
  return apiFetch<void>('POST', `/api/v1/finance/accounts/reorder?ledger_id=${ledgerId}`, { items });
}

// ===== Finance: Categories =====
export async function listCategories(ledgerId: number): Promise<CategoryOut[]> {
  return apiFetch<CategoryOut[]>('GET', `/api/v1/finance/categories?ledger_id=${ledgerId}`);
}

export async function createCategory(body: CategoryCreate): Promise<CategoryOut> {
  return apiFetch<CategoryOut>('POST', '/api/v1/finance/categories', body);
}

export async function updateCategory(id: number, body: CategoryUpdate): Promise<CategoryOut> {
  return apiFetch<CategoryOut>('PUT', `/api/v1/finance/categories/${id}`, body);
}

export async function deleteCategory(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/finance/categories/${id}`);
}

export async function reorderCategories(ledgerId: number, items: ReorderItem[]): Promise<void> {
  return apiFetch<void>('POST', `/api/v1/finance/categories/reorder?ledger_id=${ledgerId}`, { items });
}

// ===== Finance: Tags =====
export async function listFinanceTags(ledgerId: number): Promise<FinanceTagOut[]> {
  return apiFetch<FinanceTagOut[]>('GET', `/api/v1/finance/tags?ledger_id=${ledgerId}`);
}

export async function createFinanceTag(body: FinanceTagCreate): Promise<FinanceTagOut> {
  return apiFetch<FinanceTagOut>('POST', '/api/v1/finance/tags', body);
}

export async function updateFinanceTag(id: number, body: FinanceTagUpdate): Promise<FinanceTagOut> {
  return apiFetch<FinanceTagOut>('PUT', `/api/v1/finance/tags/${id}`, body);
}

export async function deleteFinanceTag(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/finance/tags/${id}`);
}

export async function reorderFinanceTags(ledgerId: number, items: ReorderItem[]): Promise<void> {
  return apiFetch<void>('POST', `/api/v1/finance/tags/reorder?ledger_id=${ledgerId}`, { items });
}

// ===== Finance: Budgets =====
export async function listBudgets(ledgerId: number): Promise<BudgetOut[]> {
  return apiFetch<BudgetOut[]>('GET', `/api/v1/finance/budgets?ledger_id=${ledgerId}`);
}

export async function createBudget(body: BudgetCreate): Promise<BudgetOut> {
  return apiFetch<BudgetOut>('POST', '/api/v1/finance/budgets', body);
}

export async function updateBudget(id: number, body: BudgetUpdate): Promise<BudgetOut> {
  return apiFetch<BudgetOut>('PUT', `/api/v1/finance/budgets/${id}`, body);
}

export async function deleteBudget(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/finance/budgets/${id}`);
}

export async function reorderBudgets(ledgerId: number, items: ReorderItem[]): Promise<void> {
  return apiFetch<void>('POST', `/api/v1/finance/budgets/reorder?ledger_id=${ledgerId}`, { items });
}

// ===== Finance: Events =====
export async function listEvents(ledgerId: number): Promise<FinanceEventOut[]> {
  return apiFetch<FinanceEventOut[]>('GET', `/api/v1/finance/events?ledger_id=${ledgerId}`);
}

export async function createEvent(body: FinanceEventCreate): Promise<FinanceEventOut> {
  return apiFetch<FinanceEventOut>('POST', '/api/v1/finance/events', body);
}

export async function updateEvent(id: number, body: FinanceEventUpdate): Promise<FinanceEventOut> {
  return apiFetch<FinanceEventOut>('PUT', `/api/v1/finance/events/${id}`, body);
}

export async function deleteEvent(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/finance/events/${id}`);
}

export async function getEventSummary(id: number): Promise<EventSummary> {
  return apiFetch<EventSummary>('GET', `/api/v1/finance/events/${id}/summary`);
}

// ===== Finance: Transactions =====
export async function listTransactions(ledgerId: number, params?: {
  type?: string;
  account_id?: number;
  category_id?: number;
  tag_id?: number;
  event_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<TransactionListResponse> {
  const query = new URLSearchParams();
  query.set('ledger_id', String(ledgerId));
  if (params?.type) query.set('type', params.type);
  if (params?.account_id) query.set('account_id', String(params.account_id));
  if (params?.category_id) query.set('category_id', String(params.category_id));
  if (params?.tag_id) query.set('tag_id', String(params.tag_id));
  if (params?.event_id) query.set('event_id', String(params.event_id));
  if (params?.start_date) query.set('start_date', params.start_date);
  if (params?.end_date) query.set('end_date', params.end_date);
  if (params?.search) query.set('search', params.search);
  if (params?.skip) query.set('skip', String(params.skip));
  if (params?.limit) query.set('limit', String(params.limit));
  return apiFetch<TransactionListResponse>('GET', `/api/v1/finance/transactions?${query.toString()}`);
}

export async function getTransaction(id: number): Promise<TransactionOut> {
  return apiFetch<TransactionOut>('GET', `/api/v1/finance/transactions/${id}`);
}

export async function createTransaction(body: TransactionCreate): Promise<TransactionOut> {
  return apiFetch<TransactionOut>('POST', '/api/v1/finance/transactions', body);
}

export async function updateTransaction(id: number, body: TransactionUpdate): Promise<TransactionOut> {
  return apiFetch<TransactionOut>('PUT', `/api/v1/finance/transactions/${id}`, body);
}

export async function deleteTransaction(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/finance/transactions/${id}`);
}

export async function uploadFinanceAttachment(file: File): Promise<AttachmentOut> {
  const formData = new FormData();
  formData.append('file', file);
  const headers: Record<string, string> = {};
  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-Token'] = csrf;

  const res = await fetch('/api/v1/finance/attachments/upload', {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) as unknown : undefined;
  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(data, `请求失败 (${res.status})`), data);
  }
  return data as AttachmentOut;
}

// ===== Finance: Dashboard & Stats =====
export async function getDashboard(ledgerId: number): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('GET', `/api/v1/finance/dashboard?ledger_id=${ledgerId}`);
}

export async function getStats(ledgerId: number): Promise<StatsResponse> {
  return apiFetch<StatsResponse>('GET', `/api/v1/finance/stats?ledger_id=${ledgerId}&period=month`);
}
