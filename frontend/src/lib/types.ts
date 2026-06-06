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

export interface PasswordResetRequest {
  username: string;
  method: MfaMethod;
  code: string;
  new_password: string;
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

export interface UsernameAvailabilityResponse {
  username: string;
  available: boolean;
}

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
  sprint_id: number | null;
  column_id: number | null;
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
  sprint_id?: number | null;
  column_id?: number | null;
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
  sprint_id?: number | null;
  column_id?: number | null;
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

export interface ReorderItem {
  id: number;
  sort_order: number;
}

export interface BulkTodoRequest {
  ids: number[];
  action: 'complete' | 'delete' | 'move';
  folder_id?: number | null;
}

export interface TodoToggleBody {
  complete_children?: boolean;
}

// ===== KanbanTask (independent from Todo) =====
export interface KanbanTaskOut {
  id: number;
  folder_id: number;
  sprint_id: number | null;
  column_id: number | null;
  title: string;
  version: string | null;
  task_type: string | null;
  priority: string | null;  // P0/P1/P2/P3
  requirement_desc: string | null;
  technical_desc: string | null;
  acceptance_criteria: string | null;
  custom_fields: Record<string, unknown> | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface KanbanTaskCreate {
  folder_id: number;
  sprint_id?: number | null;
  column_id?: number | null;
  title: string;
  version?: string | null;
  task_type?: string | null;
  priority?: string | null;
  requirement_desc?: string | null;
  technical_desc?: string | null;
  acceptance_criteria?: string | null;
  custom_fields?: Record<string, unknown> | null;
  sort_order?: number;
}

export interface KanbanTaskUpdate {
  title?: string;
  sprint_id?: number | null;
  column_id?: number | null;
  version?: string | null;
  task_type?: string | null;
  priority?: string | null;
  requirement_desc?: string | null;
  technical_desc?: string | null;
  acceptance_criteria?: string | null;
  custom_fields?: Record<string, unknown> | null;
  sort_order?: number;
}

export interface MoveKanbanTaskRequest {
  target_column_id: number;
  target_sprint_id?: number | null;
  sort_order?: number;
}

// ===== Field definition (for kanban_config template) =====
export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date';
  show_on_card: boolean;
  show_in_detail: boolean;
  required: boolean;
  order: number;
  system: boolean;
  editable?: boolean;
  default_value?: string;
  options?: string[];
}

export interface KanbanTemplate {
  fields: FieldDef[];
}

export interface KanbanConfig {
  kanban_template: KanbanTemplate;
}

// ===== Folders =====
export interface FolderOut {
  id: number;
  parent_id: number | null;
  name: string;
  color: string;
  icon_type: 'color' | 'emoji';
  icon_value: string;
  mode: string;  // "todo" | "kanban"
  kanban_config: KanbanConfig | null;
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
  icon_type?: 'color' | 'emoji';
  icon_value?: string;
  sort_order?: number;
  mode?: string;  // "todo" | "kanban"
}

export interface FolderUpdate {
  parent_id?: number | null;
  name?: string;
  color?: string;
  icon_type?: 'color' | 'emoji';
  icon_value?: string;
  sort_order?: number;
  mode?: string;
  kanban_config?: KanbanConfig | null;
}

// ===== Kanban: Sprint & Columns =====
export interface Sprint {
  id: number;
  folder_id: number;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'planned' | 'completed';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SprintCreate {
  folder_id: number;
  name: string;
  goal?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  sort_order?: number;
}

export interface SprintUpdate {
  name?: string;
  goal?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  sort_order?: number;
}

export interface KanbanColumnData {
  id: number;
  sprint_id: number;
  name: string;
  color: string | null;
  capacity: number | null;
  sort_order: number;
  is_archived: boolean;
  task_count: number;
  created_at: string;
  updated_at: string;
}

export interface KanbanColumnCreate {
  sprint_id: number;
  name: string;
  color?: string;
  capacity?: number | null;
  sort_order?: number;
  is_archived?: boolean;
}

export interface KanbanColumnUpdate {
  name?: string;
  color?: string;
  capacity?: number | null;
  sort_order?: number;
  is_archived?: boolean;
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
