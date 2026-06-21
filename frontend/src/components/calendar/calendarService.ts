import { apiFetch } from '@/lib/api';
import type {
  CalendarEvent,
  CalendarFilterState,
  CalendarSource,
  CalendarSubscription,
  EventCreatePayload,
  EventStatus,
  EventUpdatePayload,
  ReminderOffset,
  RepeatRule,
  SourceType,
} from './calendarTypes';
import { compareEvents } from './dateUtils';

interface CalendarEventApi {
  id: string;
  title: string;
  start_at: string;
  all_day: boolean;
  source_id: string;
  source_type: SourceType;
  color: string;
  icon: string;
  repeat_rule: RepeatRule;
  reminder: ReminderOffset;
  readonly: boolean;
  created_at: string;
  updated_at: string;
  description?: string | null;
  end_at?: string | null;
  location?: string | null;
  linked_module?: 'todo' | 'finance' | 'calendar' | null;
  linked_object_id?: string | null;
  status?: EventStatus | null;
  amount?: string | number | null;
  direction?: 'income' | 'expense' | null;
}

interface CalendarSourceApi {
  id: string;
  name: string;
  type: SourceType;
  color: string;
  visible: boolean;
  readonly: boolean;
  icon: string;
  sync_url?: string | null;
  last_synced_at?: string | null;
}

interface CalendarSubscriptionApi {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  last_synced_at?: string | null;
  sync_error?: string | null;
}

interface CalendarEventMutationApi {
  title?: string;
  start_at?: string;
  all_day?: boolean;
  source_id?: string;
  repeat_rule?: RepeatRule;
  reminder?: ReminderOffset;
  description?: string;
  end_at?: string;
  location?: string;
  color?: string;
}

export function getDefaultFilter(): CalendarFilterState {
  return {
    searchQuery: '',
    showManual: true,
    showTodo: true,
    showFinance: true,
    showHoliday: true,
    showSubscription: true,
  };
}

export async function getEventsForRange(start: string, end: string): Promise<CalendarEvent[]> {
  const query = new URLSearchParams({ start, end });
  const events = await apiFetch<CalendarEventApi[]>('GET', `/api/v1/calendar/events?${query.toString()}`);
  return events.map(toCalendarEvent).sort(compareEvents);
}

export async function getSources(): Promise<CalendarSource[]> {
  const sources = await apiFetch<CalendarSourceApi[]>('GET', '/api/v1/calendar/sources');
  return sources.map(toCalendarSource);
}

export async function getSubscriptions(): Promise<CalendarSubscription[]> {
  const subscriptions = await apiFetch<CalendarSubscriptionApi[]>('GET', '/api/v1/calendar/subscriptions');
  return subscriptions.map(toCalendarSubscription);
}

export async function createEvent(payload: EventCreatePayload): Promise<CalendarEvent> {
  const event = await apiFetch<CalendarEventApi>('POST', '/api/v1/calendar/events', toMutationPayload(payload));
  return toCalendarEvent(event);
}

export async function updateEvent(payload: EventUpdatePayload): Promise<CalendarEvent> {
  const event = await apiFetch<CalendarEventApi>(
    'PUT',
    `/api/v1/calendar/events/${encodeURIComponent(payload.id)}`,
    toMutationPayload(payload),
  );
  return toCalendarEvent(event);
}

export async function deleteEvent(id: string): Promise<void> {
  await apiFetch<void>('DELETE', `/api/v1/calendar/events/${encodeURIComponent(id)}`);
}

export async function syncSubscription(id: string): Promise<CalendarSubscription | null> {
  const subscription = await apiFetch<CalendarSubscriptionApi>(
    'POST',
    `/api/v1/calendar/subscriptions/${encodeURIComponent(id)}/sync`,
  );
  return toCalendarSubscription(subscription);
}

export function toggleSourceVisibility(sources: CalendarSource[], sourceId: string): CalendarSource[] {
  return sources.map((source) => (source.id === sourceId ? { ...source, visible: !source.visible } : source));
}

export function filterEventsForRange(
  events: CalendarEvent[],
  start: string,
  end: string,
  filter: CalendarFilterState,
  sources: CalendarSource[],
): CalendarEvent[] {
  const query = filter.searchQuery.trim().toLowerCase();
  const visibleSourceIds = new Set(sources.filter((source) => source.visible).map((source) => source.id));
  return events
    .filter((event) => {
      const eventDate = event.startAt.substring(0, 10);
      const matchesDate = eventDate >= start && eventDate <= end;
      const matchesType = isSourceTypeVisible(event.sourceType, filter);
      const matchesSource = visibleSourceIds.size === 0 || visibleSourceIds.has(event.sourceId);
      const matchesQuery =
        !query ||
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query);
      return matchesDate && matchesType && matchesSource && matchesQuery;
    })
    .sort(compareEvents);
}

function toCalendarEvent(event: CalendarEventApi): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    startAt: event.start_at,
    endAt: event.end_at ?? undefined,
    allDay: event.all_day,
    sourceId: event.source_id,
    sourceType: event.source_type,
    color: event.color,
    icon: event.icon,
    location: event.location ?? undefined,
    repeatRule: event.repeat_rule,
    reminder: event.reminder,
    readonly: event.readonly,
    linkedModule: event.linked_module ?? undefined,
    linkedObjectId: event.linked_object_id ?? undefined,
    status: event.status ?? undefined,
    amount: event.amount === null || event.amount === undefined ? undefined : Number(event.amount),
    direction: event.direction ?? undefined,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
  };
}

function toCalendarSource(source: CalendarSourceApi): CalendarSource {
  return {
    id: source.id,
    name: source.name,
    type: source.type,
    color: source.color,
    visible: source.visible,
    readonly: source.readonly,
    icon: source.icon,
    syncUrl: source.sync_url ?? undefined,
    lastSyncedAt: source.last_synced_at ?? undefined,
  };
}

function toCalendarSubscription(subscription: CalendarSubscriptionApi): CalendarSubscription {
  return {
    id: subscription.id,
    name: subscription.name,
    url: subscription.url,
    color: subscription.color,
    enabled: subscription.enabled,
    lastSyncedAt: subscription.last_synced_at ?? undefined,
    syncError: subscription.sync_error ?? undefined,
  };
}

function toMutationPayload(payload: EventCreatePayload | EventUpdatePayload): CalendarEventMutationApi {
  const body: CalendarEventMutationApi = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.startAt !== undefined) body.start_at = normalizeStartAt(payload.startAt, Boolean(payload.allDay));
  if (payload.endAt !== undefined) body.end_at = normalizeStartAt(payload.endAt, false);
  if (payload.allDay !== undefined) body.all_day = payload.allDay;
  if (payload.sourceId !== undefined) body.source_id = payload.sourceId;
  if (payload.repeatRule !== undefined) body.repeat_rule = payload.repeatRule;
  if (payload.reminder !== undefined) body.reminder = payload.reminder;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.location !== undefined) body.location = payload.location;
  if (payload.color !== undefined) body.color = payload.color;
  return body;
}

function normalizeStartAt(value: string, allDay: boolean): string {
  if (allDay) return `${value.substring(0, 10)}T00:00:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  return value;
}

function isSourceTypeVisible(sourceType: SourceType, filter: CalendarFilterState): boolean {
  if (sourceType === 'manual') return filter.showManual;
  if (sourceType === 'todo') return filter.showTodo;
  if (sourceType === 'finance_income' || sourceType === 'finance_expense' || sourceType === 'finance_event' || sourceType === 'bill') {
    return filter.showFinance;
  }
  if (sourceType === 'holiday') return filter.showHoliday;
  return filter.showSubscription;
}
