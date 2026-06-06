import dayjs from 'dayjs';
import type { CalendarEvent } from './calendarTypes';

export interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

export function todayStr(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function formatDate(date: string): string {
  return dayjs(date).format('YYYY年M月D日');
}

export function formatMonthLabel(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

export function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return '全天';
  const start = dayjs(event.startAt).format('HH:mm');
  return event.endAt ? `${start}-${dayjs(event.endAt).format('HH:mm')}` : start;
}

export function getMonthGrid(year: number, month: number): CalendarDay[][] {
  const first = dayjs(new Date(year, month, 1));
  const firstMondayIndex = (first.day() + 6) % 7;
  const gridStart = first.subtract(firstMondayIndex, 'day');
  const today = todayStr();

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const current = gridStart.add(weekIndex * 7 + dayIndex, 'day');
      return {
        date: current.format('YYYY-MM-DD'),
        day: current.date(),
        isCurrentMonth: current.month() === month,
        isToday: current.format('YYYY-MM-DD') === today,
        isWeekend: dayIndex >= 5,
      };
    }),
  );
}

export function getWeekDays(date: string): CalendarDay[] {
  const current = dayjs(date);
  const monday = current.subtract((current.day() + 6) % 7, 'day');
  const today = todayStr();

  return Array.from({ length: 7 }, (_, index) => {
    const item = monday.add(index, 'day');
    return {
      date: item.format('YYYY-MM-DD'),
      day: item.date(),
      isCurrentMonth: item.month() === current.month(),
      isToday: item.format('YYYY-MM-DD') === today,
      isWeekend: index >= 5,
    };
  });
}

export function getRangeForView(view: 'month' | 'week' | 'day' | 'agenda', selectedDate: string) {
  const selected = dayjs(selectedDate);
  if (view === 'month') {
    return {
      start: selected.startOf('month').format('YYYY-MM-DD'),
      end: selected.endOf('month').format('YYYY-MM-DD'),
    };
  }
  if (view === 'week') {
    const week = getWeekDays(selectedDate);
    return { start: week[0].date, end: week[6].date };
  }
  if (view === 'agenda') {
    return {
      start: selected.startOf('month').format('YYYY-MM-DD'),
      end: selected.add(1, 'month').endOf('month').format('YYYY-MM-DD'),
    };
  }
  return { start: selectedDate, end: selectedDate };
}

export function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  return a.startAt.localeCompare(b.startAt) || a.title.localeCompare(b.title);
}

