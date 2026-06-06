import type {
  CalendarEvent,
  CalendarFilterState,
  CalendarSource,
  CalendarSubscription,
  EventCreatePayload,
  EventUpdatePayload,
  SourceType,
} from './calendarTypes';
import { getAllMockEvents, MOCK_SOURCES, MOCK_SUBSCRIPTIONS } from './calendarMockData';
import { compareEvents } from './dateUtils';

let events: CalendarEvent[] = getAllMockEvents();
let sources: CalendarSource[] = [...MOCK_SOURCES];
let subscriptions: CalendarSubscription[] = [...MOCK_SUBSCRIPTIONS];

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

export function getEvents(): CalendarEvent[] {
  return [...events].sort(compareEvents);
}

export function getSources(): CalendarSource[] {
  return [...sources];
}

export function getSubscriptions(): CalendarSubscription[] {
  return [...subscriptions];
}

export function getEventsForRange(start: string, end: string, filter: CalendarFilterState): CalendarEvent[] {
  const query = filter.searchQuery.trim().toLowerCase();
  return events
    .filter((event) => {
      const eventDate = event.startAt.substring(0, 10);
      const matchesDate = eventDate >= start && eventDate <= end;
      const matchesSource = isSourceVisible(event.sourceType, filter);
      const matchesQuery =
        !query ||
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query);
      return matchesDate && matchesSource && matchesQuery;
    })
    .sort(compareEvents);
}

export function createEvent(payload: EventCreatePayload): CalendarEvent {
  const source = sources.find((item) => item.id === payload.sourceId) ?? sources[0];
  const created = new Date().toISOString();
  const event: CalendarEvent = {
    id: `evt-${Date.now()}`,
    title: payload.title,
    description: payload.description,
    startAt: payload.startAt,
    endAt: payload.endAt,
    allDay: payload.allDay,
    sourceId: payload.sourceId,
    sourceType: source?.type ?? 'manual',
    color: payload.color ?? source?.color ?? '#6C5CE7',
    icon: source?.icon ?? 'calendar',
    location: payload.location,
    repeatRule: payload.repeatRule,
    reminder: payload.reminder,
    readonly: false,
    createdAt: created,
    updatedAt: created,
  };
  events = [...events, event];
  return event;
}

export function updateEvent(payload: EventUpdatePayload): CalendarEvent | null {
  const existing = events.find((event) => event.id === payload.id);
  if (!existing || existing.readonly) return null;
  const source = payload.sourceId ? sources.find((item) => item.id === payload.sourceId) : undefined;
  const updated: CalendarEvent = {
    ...existing,
    ...payload,
    sourceType: source?.type ?? existing.sourceType,
    color: payload.color ?? source?.color ?? existing.color,
    icon: source?.icon ?? existing.icon,
    updatedAt: new Date().toISOString(),
  };
  events = events.map((event) => (event.id === payload.id ? updated : event));
  return updated;
}

export function deleteEvent(id: string): boolean {
  const existing = events.find((event) => event.id === id);
  if (!existing || existing.readonly) return false;
  events = events.filter((event) => event.id !== id);
  return true;
}

export function toggleSourceVisibility(sourceId: string): CalendarSource | null {
  let changed: CalendarSource | null = null;
  sources = sources.map((source) => {
    if (source.id !== sourceId) return source;
    changed = { ...source, visible: !source.visible };
    return changed;
  });
  return changed;
}

export function syncSubscription(id: string): CalendarSubscription | null {
  let changed: CalendarSubscription | null = null;
  subscriptions = subscriptions.map((subscription) => {
    if (subscription.id !== id) return subscription;
    changed = { ...subscription, lastSyncedAt: new Date().toISOString(), syncError: undefined };
    return changed;
  });
  return changed;
}

function isSourceVisible(sourceType: SourceType, filter: CalendarFilterState): boolean {
  if (sourceType === 'manual') return filter.showManual;
  if (sourceType === 'todo') return filter.showTodo;
  if (sourceType === 'finance_income' || sourceType === 'finance_expense' || sourceType === 'bill') {
    return filter.showFinance;
  }
  if (sourceType === 'holiday') return filter.showHoliday;
  return filter.showSubscription;
}

