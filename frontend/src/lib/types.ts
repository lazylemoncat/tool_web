// ===== Auth =====
export interface LoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
}

export type MfaMethod = 'totp' | 'recovery_code';

export interface MfaVerifyRequest {
  challenge_id: string;
  method: MfaMethod;
  code: string;
  remember_me?: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  is_admin: boolean;
}

export interface AuthResponse {
  token?: string | null;
  username?: string | null;
  preferences?: Record<string, unknown>;
  user?: AuthUser | null;
  csrf_token?: string | null;
}

export interface LoginResponse extends AuthResponse {
  status: 'authenticated' | 'mfa_required';
  challenge_id?: string | null;
  available_methods?: string[];
  expires_in?: number | null;
}

export type MeResponse = AuthResponse;

// ===== Tags =====
export interface APITag {
  id: number;
  name: string;
}

// ===== Recurrence =====
export interface RecurrenceRuleOut {
  id: number;
  rrule_string: string;
}

// ===== Todos =====
export interface TodoOut {
  id: number;
  folder_id: number | null;
  parent_id: number | null;
  title: string;
  note: string | null;
  priority: number; // 1=high, 2=medium, 3=low
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children: TodoOut[];
  tags: APITag[];
  recurrence_rules: RecurrenceRuleOut[];
}

export interface TodoCreate {
  folder_id?: number | null;
  parent_id?: number | null;
  title: string;
  note?: string | null;
  priority?: number;
  due_date?: string | null;
  sort_order?: number;
  tag_ids?: number[];
  recurrence_rules?: string[];
}

export interface TodoUpdate {
  folder_id?: number | null;
  parent_id?: number | null;
  title?: string;
  note?: string | null;
  priority?: number;
  due_date?: string | null;
  is_completed?: boolean;
  sort_order?: number;
  tag_ids?: number[];
  recurrence_rules?: string[];
}

export interface TodoListResponse {
  items: TodoOut[];
  total: number;
  skip: number;
  limit: number;
}

export interface BulkTodoRequest {
  ids: number[];
  action: 'complete' | 'delete' | 'move';
  folder_id?: number | null;
}

export interface TodoToggleBody {
  complete_children?: boolean;
}

// ===== Folders =====
export interface FolderOut {
  id: number;
  parent_id: number | null;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  todo_count: number;
  children: FolderOut[];
}

export interface FolderCreate {
  parent_id?: number | null;
  name: string;
  color?: string;
  sort_order?: number;
}

export interface FolderUpdate {
  parent_id?: number | null;
  name?: string;
  color?: string;
  sort_order?: number;
}

// ===== Priority helpers =====
export const PRIORITY_MAP: Record<number, string> = {
  1: 'high',
  2: 'medium',
  3: 'low',
};

export const PRIORITY_LABEL: Record<number, string> = {
  1: '高',
  2: '中',
  3: '低',
};

export const PRIORITY_DISPLAY: Record<number, string> = {
  1: '高优先级',
  2: '中优先级',
  3: '低优先级',
};

export function priorityLabel(p: number): string {
  return PRIORITY_MAP[p] || 'medium';
}

// ===== Recurrence helpers =====
export const RECUR_DISPLAY: Record<string, string> = {
  'FREQ=DAILY': '每天',
  'FREQ=WEEKLY': '每周',
  'FREQ=MONTHLY': '每月',
};

export const RECUR_TO_RRULE: Record<string, string> = {
  '不重复': '',
  '每天': 'FREQ=DAILY',
  '每周': 'FREQ=WEEKLY',
  '每月': 'FREQ=MONTHLY',
};
