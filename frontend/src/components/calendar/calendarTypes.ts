export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export type SourceType =
  | 'manual'
  | 'todo'
  | 'finance_income'
  | 'finance_expense'
  | 'bill'
  | 'holiday'
  | 'subscription';

export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ReminderOffset = 'none' | 'at_time' | '5m' | '15m' | '1h' | '1d';

export type EventStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

export interface CalendarSource {
  id: string;
  name: string;
  type: SourceType;
  color: string;
  visible: boolean;
  readonly: boolean;
  icon: string;
  syncUrl?: string;
  lastSyncedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;
  allDay: boolean;
  sourceId: string;
  sourceType: SourceType;
  color: string;
  icon: string;
  repeatRule: RepeatRule;
  reminder: ReminderOffset;
  readonly: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string;
  endAt?: string;
  location?: string;
  linkedModule?: 'todo' | 'finance' | 'calendar';
  linkedObjectId?: string;
  status?: EventStatus;
  amount?: number;
  direction?: 'income' | 'expense';
}

export interface CalendarFilterState {
  searchQuery: string;
  showManual: boolean;
  showTodo: boolean;
  showFinance: boolean;
  showHoliday: boolean;
  showSubscription: boolean;
}

export interface CalendarSubscription {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSyncedAt?: string;
  syncError?: string;
}

export interface EventCreatePayload {
  title: string;
  startAt: string;
  allDay: boolean;
  sourceId: string;
  repeatRule: RepeatRule;
  reminder: ReminderOffset;
  description?: string;
  endAt?: string;
  location?: string;
  color?: string;
}

export interface EventUpdatePayload extends Partial<EventCreatePayload> {
  id: string;
}

