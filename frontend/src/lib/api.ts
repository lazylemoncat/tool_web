import type {
  AuthResponse, LoginRequest, LoginResponse, MeResponse, MfaVerifyRequest,
  PasswordResetRequest,
  UsernameAvailabilityResponse,
  TodoOut, TodoCreate, TodoUpdate, TodoListResponse, BulkTodoRequest, TodoToggleBody,
  FolderOut, FolderCreate, FolderUpdate,
  ReorderItem,
  APITag,
  Sprint, SprintCreate, SprintUpdate,
  KanbanColumnData, KanbanColumnCreate, KanbanColumnUpdate,
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

type ApiFetchOptions = {
  skipCsrf?: boolean;
  skipAuthRefresh?: boolean;
};

export class ApiError extends Error {
  status: number;
  detail?: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function doRefresh(): Promise<void> {
  const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new ApiError(res.status, '刷新登录失败');
}

async function refreshToken(): Promise<void> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = doRefresh().finally(() => { isRefreshing = false; refreshPromise = null; });
  return refreshPromise;
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;

  const payload = data as Record<string, unknown>;
  const detail = payload.detail;
  const message = payload.message;
  const error = payload.error;

  if (typeof detail === 'string' && detail.trim()) return detail;
  if (typeof message === 'string' && message.trim()) return message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

export async function apiFetch<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: ApiFetchOptions,
): Promise<T> {
  const url = path.startsWith('http') ? path : path;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // CSRF token for mutating requests
  if (!options?.skipCsrf && method !== 'GET' && method !== 'HEAD') {
    const csrf = getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, '网络连接失败，请检查网络');
  }

  // 401 → refresh → retry once
  if (res.status === 401 && !options?.skipAuthRefresh) {
    try {
      await refreshToken();
    } catch {
      throw new ApiError(401, '未认证，请先登录');
    }
    // Retry with new CSRF token
    const retryHeaders: Record<string, string> = { ...headers };
    if (method !== 'GET' && method !== 'HEAD') {
      const csrf = getCsrfToken();
      if (csrf) retryHeaders['X-CSRF-Token'] = csrf;
    }
    try {
      res = await fetch(url, {
        method,
        headers: retryHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });
    } catch {
      throw new ApiError(0, '网络连接失败');
    }
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  // Parse JSON response
  let data: unknown;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(res.status, res.status >= 500 ? '后端服务不可用，请确认后端已启动' : '服务器返回格式错误');
  }

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(data, `请求失败 (${res.status})`), data);
  }

  return data as T;
}

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

// ===== Todos =====
export async function listTodos(params?: {
  folder_id?: number;
  search?: string;
  priority?: number;
  status?: 'active' | 'completed';
  tag_id?: number;
  skip?: number;
  limit?: number;
  sprint_id?: number;
  due_from?: string;
  due_to?: string;
}): Promise<TodoListResponse> {
  const query = new URLSearchParams();
  if (params?.folder_id !== undefined) query.set('folder_id', String(params.folder_id));
  if (params?.search) query.set('search', params.search);
  if (params?.priority) query.set('priority', String(params.priority));
  if (params?.status) query.set('status', params.status);
  if (params?.tag_id) query.set('tag_id', String(params.tag_id));
  if (params?.sprint_id) query.set('sprint_id', String(params.sprint_id));
  if (params?.due_from) query.set('due_from', params.due_from);
  if (params?.due_to) query.set('due_to', params.due_to);
  if (params?.skip) query.set('skip', String(params.skip));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<TodoListResponse>('GET', `/api/v1/todos${qs ? '?' + qs : ''}`);
}

export async function createTodo(body: TodoCreate): Promise<TodoOut> {
  return apiFetch<TodoOut>('POST', '/api/v1/todos', body);
}

export async function updateTodo(id: number, body: TodoUpdate): Promise<TodoOut> {
  return apiFetch<TodoOut>('PUT', `/api/v1/todos/${id}`, body);
}

export async function deleteTodo(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/todos/${id}`);
}

export async function toggleTodo(id: number, body?: TodoToggleBody): Promise<TodoOut> {
  return apiFetch<TodoOut>('PATCH', `/api/v1/todos/${id}/toggle`, body);
}

export async function bulkAction(body: BulkTodoRequest): Promise<void> {
  return apiFetch<void>('POST', '/api/v1/todos/bulk', body);
}

export async function reorderTodos(items: ReorderItem[]): Promise<void> {
  return apiFetch<void>('POST', '/api/v1/todos/reorder', { items });
}

// ===== Folders =====
export async function listFolders(params?: { parent_id?: number; skip?: number; limit?: number }): Promise<FolderOut[]> {
  const query = new URLSearchParams();
  if (params?.parent_id !== undefined) query.set('parent_id', String(params.parent_id));
  if (params?.skip) query.set('skip', String(params.skip));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<FolderOut[]>('GET', `/api/v1/folders${qs ? '?' + qs : ''}`);
}

export async function createFolder(body: FolderCreate): Promise<FolderOut> {
  return apiFetch<FolderOut>('POST', '/api/v1/folders', body);
}

export async function updateFolder(id: number, body: FolderUpdate): Promise<FolderOut> {
  return apiFetch<FolderOut>('PUT', `/api/v1/folders/${id}`, body);
}

export async function deleteFolder(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/folders/${id}`);
}

export async function reorderFolders(items: ReorderItem[]): Promise<void> {
  return apiFetch<void>('POST', '/api/v1/folders/reorder', { items });
}

// ===== Sprints =====
export async function listSprints(folderId: number): Promise<Sprint[]> {
  return apiFetch<Sprint[]>('GET', `/api/v1/sprints?folder_id=${folderId}`);
}

export async function createSprint(body: SprintCreate): Promise<Sprint> {
  return apiFetch<Sprint>('POST', '/api/v1/sprints', body);
}

export async function updateSprint(id: number, body: SprintUpdate): Promise<Sprint> {
  return apiFetch<Sprint>('PUT', `/api/v1/sprints/${id}`, body);
}

export async function deleteSprint(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/sprints/${id}`);
}

// ===== Kanban Columns =====
export async function listKanbanColumns(sprintId: number): Promise<KanbanColumnData[]> {
  return apiFetch<KanbanColumnData[]>('GET', `/api/v1/kanban-columns?sprint_id=${sprintId}`);
}

export async function createKanbanColumn(body: KanbanColumnCreate): Promise<KanbanColumnData> {
  return apiFetch<KanbanColumnData>('POST', '/api/v1/kanban-columns', body);
}

export async function updateKanbanColumn(id: number, body: KanbanColumnUpdate): Promise<KanbanColumnData> {
  return apiFetch<KanbanColumnData>('PUT', `/api/v1/kanban-columns/${id}`, body);
}

export async function deleteKanbanColumn(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/kanban-columns/${id}`);
}

export async function reorderKanbanColumns(items: { id: number; sort_order: number }[]): Promise<void> {
  return apiFetch<void>('POST', '/api/v1/kanban-columns/reorder', { items });
}

// ===== Kanban Task Move =====
export async function moveTodoToColumn(todoId: number, targetColumnId: number): Promise<TodoOut> {
  return apiFetch<TodoOut>('POST', `/api/v1/todos/${todoId}/move`, { target_column_id: targetColumnId });
}

// ===== Tags =====
export async function listTags(params?: { search?: string; folder_id?: number }): Promise<APITag[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.folder_id !== undefined) query.set('folder_id', String(params.folder_id));
  const qs = query.toString();
  return apiFetch<APITag[]>('GET', `/api/v1/tags${qs ? '?' + qs : ''}`);
}

export async function createTag(body: { name: string }): Promise<APITag> {
  return apiFetch<APITag>('POST', '/api/v1/tags', body);
}

export async function deleteTag(id: number): Promise<void> {
  return apiFetch<void>('DELETE', `/api/v1/tags/${id}`);
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
