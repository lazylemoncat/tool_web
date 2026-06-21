'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import dayjsZhCn from 'dayjs/locale/zh-cn';
import CalendarEventDialog, { type CalendarEventFormData } from './CalendarEventDialog';
import {
  createEvent,
  deleteEvent,
  filterEventsForRange,
  getDefaultFilter,
  getEventsForRange,
  getSources,
  getSubscriptions,
  syncSubscription,
  toggleSourceVisibility,
  updateEvent,
} from './calendarService';
import {
  WEEKDAY_LABELS,
  formatEventTime,
  getMonthGrid,
  getRangeForView,
  getWeekDays,
  todayStr,
} from './dateUtils';
import type { CalendarEvent, CalendarFilterState, CalendarSource, CalendarSubscription, CalendarView } from './calendarTypes';

dayjs.locale(dayjsZhCn);

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'month', label: '月' },
  { value: 'week', label: '周' },
  { value: 'day', label: '日' },
  { value: 'agenda', label: '日程' },
];

const FILTER_OPTIONS: { key: keyof CalendarFilterState; label: string; color: string }[] = [
  { key: 'showManual', label: '我的日历', color: '#6C5CE7' },
  { key: 'showTodo', label: '任务', color: '#3B82F6' },
  { key: 'showFinance', label: '记账', color: '#10B981' },
  { key: 'showHoliday', label: '节假日', color: '#EF4444' },
  { key: 'showSubscription', label: '订阅', color: '#8B5CF6' },
];

const surfaceTokens = {
  background: 'var(--mui-palette-background-default)',
  surface: 'var(--mui-palette-background-paper)',
  surfaceContainer: 'var(--mui-palette-action-selected)',
  surfaceLow: 'var(--mui-palette-action-hover)',
  surfaceHover: 'var(--mui-palette-action-selected)',
  outline: 'var(--mui-palette-divider)',
  outlineSoft: 'var(--mui-palette-divider)',
  primary: 'var(--mui-palette-primary-main)',
  primaryContainer: 'var(--mui-palette-action-selected)',
  onPrimaryContainer: 'var(--mui-palette-primary-main)',
  text: 'var(--mui-palette-text-primary)',
  muted: 'var(--mui-palette-text-secondary)',
  dim: 'var(--mui-palette-text-disabled)',
};

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [filter, setFilter] = useState<CalendarFilterState>(getDefaultFilter);
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [subscriptions, setSubscriptions] = useState<CalendarSubscription[]>([]);
  const [rawEvents, setRawEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const selected = dayjs(selectedDate);
  const monthSections = useMemo(
    () => [-1, 0, 1, 2].map((offset) => dayjs(selectedDate).startOf('month').add(offset, 'month')),
    [selectedDate],
  );
  const range = useMemo(() => {
    if (view === 'month') {
      return {
        start: monthSections[0].startOf('month').format('YYYY-MM-DD'),
        end: monthSections[monthSections.length - 1].endOf('month').format('YYYY-MM-DD'),
      };
    }
    return getRangeForView(view, selectedDate);
  }, [monthSections, selectedDate, view]);
  const events = useMemo(
    () => filterEventsForRange(rawEvents, range.start, range.end, filter, sources),
    [filter, range.end, range.start, rawEvents, sources],
  );
  const selectedEvents = useMemo(
    () => filterEventsForRange(rawEvents, selectedDate, selectedDate, filter, sources),
    [filter, rawEvents, selectedDate, sources],
  );

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRawEvents(await getEventsForRange(range.start, range.end));
    } catch (loadError) {
      setError(getErrorMessage(loadError, '日历数据加载失败'));
    } finally {
      setLoading(false);
    }
  }, [range.end, range.start]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    let ignore = false;
    async function loadSources() {
      try {
        const [sourceData, subscriptionData] = await Promise.all([getSources(), getSubscriptions()]);
        if (!ignore) {
          setSources(sourceData);
          setSubscriptions(subscriptionData);
        }
      } catch (loadError) {
        if (!ignore) setError(getErrorMessage(loadError, '日历来源加载失败'));
      }
    }
    void loadSources();
    return () => {
      ignore = true;
    };
  }, []);

  const move = (direction: -1 | 1) => {
    const unit = view === 'month' || view === 'agenda' ? 'month' : view === 'week' ? 'week' : 'day';
    setSelectedDate(selected.add(direction, unit).format('YYYY-MM-DD'));
  };

  const openCreateDialog = (date = selectedDate) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setEventDialogOpen(true);
  };

  const openDateDetail = (date: string) => {
    setSelectedDate(date);
    setDetailOpen(true);
  };

  const openEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventDialogOpen(true);
  };

  const handleSaveEvent = async (data: CalendarEventFormData) => {
    const startAt = data.allDay ? `${data.date}T00:00:00` : `${data.date}T${data.time || '09:00'}:00`;
    const payload = {
      title: data.title,
      startAt,
      allDay: data.allDay,
      sourceId: data.sourceId,
      repeatRule: data.repeatRule,
      reminder: data.reminder,
      description: data.description || undefined,
      location: data.location || undefined,
    };
    try {
      if (data.id) await updateEvent({ id: data.id, ...payload });
      else await createEvent(payload);
      await loadEvents();
      setEventDialogOpen(false);
    } catch (saveError) {
      setError(getErrorMessage(saveError, '日历事件保存失败'));
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      await loadEvents();
      setEventDialogOpen(false);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, '日历事件删除失败'));
    }
  };

  const handleToggleSource = (sourceId: string) => {
    setSources((current) => toggleSourceVisibility(current, sourceId));
  };

  const handleSync = async (subscriptionId: string) => {
    try {
      await syncSubscription(subscriptionId);
      setSubscriptions(await getSubscriptions());
      await loadEvents();
    } catch (syncError) {
      setError(getErrorMessage(syncError, '订阅同步失败'));
    }
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: surfaceTokens.background, color: surfaceTokens.text }}>
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 1.5, sm: 2, md: 4.5 }, pb: 14 }}>
        <CalendarToolbar
          view={view}
          selectedDate={selectedDate}
          filter={filter}
          onViewChange={setView}
          onPrev={() => move(-1)}
          onNext={() => move(1)}
          onToday={() => setSelectedDate(todayStr())}
          onSearch={(value) => setFilter((prev) => ({ ...prev, searchQuery: value }))}
          onOpenFilters={() => setFilterOpen(true)}
          onCreate={() => openCreateDialog()}
        />

        {loading && (
          <CalendarSurface sx={{ mb: 2, px: 2.5, py: 1.5 }}>
            <Typography sx={{ fontSize: '0.8125rem', color: surfaceTokens.muted }}>正在加载日历数据</Typography>
          </CalendarSurface>
        )}

        {error && (
          <CalendarSurface sx={{ mb: 2, px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.8125rem', color: '#DC2626', fontWeight: 700 }}>{error}</Typography>
            <Button onClick={() => void loadEvents()} sx={outlinePillSx}>重试</Button>
          </CalendarSurface>
        )}

        {view === 'month' && (
          <Box>
            {monthSections.map((month) => (
              <MonthSection
                key={month.format('YYYY-MM')}
                year={month.year()}
                month={month.month()}
                selectedDate={selectedDate}
                events={filterEventsForRange(
                  rawEvents,
                  month.startOf('month').format('YYYY-MM-DD'),
                  month.endOf('month').format('YYYY-MM-DD'),
                  filter,
                  sources,
                )}
                onSelectDate={openDateDetail}
                onCreate={openCreateDialog}
              />
            ))}
          </Box>
        )}

        {view === 'week' && (
          <WeekView
            selectedDate={selectedDate}
            events={events}
            onSelectDate={setSelectedDate}
            onCreate={() => openCreateDialog(selectedDate)}
            onEdit={openEvent}
          />
        )}

        {view === 'day' && (
          <DayView
            selectedDate={selectedDate}
            events={selectedEvents}
            onCreate={() => openCreateDialog(selectedDate)}
            onEdit={openEvent}
          />
        )}

        {view === 'agenda' && (
          <AgendaList events={events} onEdit={openEvent} />
        )}
      </Box>

      <DetailDrawer
        open={detailOpen}
        selectedDate={selectedDate}
        events={selectedEvents}
        onClose={() => setDetailOpen(false)}
        onCreate={() => openCreateDialog(selectedDate)}
        onEdit={openEvent}
      />

      <FilterDrawer
        open={filterOpen}
        filter={filter}
        sources={sources}
        subscriptions={subscriptions}
        events={events}
        onClose={() => setFilterOpen(false)}
        onToggleFilter={(key) => setFilter((prev) => ({ ...prev, [key]: !prev[key] }))}
        onToggleSource={handleToggleSource}
        onSync={handleSync}
      />

      <CalendarEventDialog
        key={`${eventDialogOpen ? 'open' : 'closed'}-${editingEvent?.id ?? 'new'}-${selectedDate}`}
        open={eventDialogOpen}
        event={editingEvent}
        selectedDate={selectedDate}
        sources={sources}
        onClose={() => setEventDialogOpen(false)}
        onDelete={handleDeleteEvent}
        onSave={handleSaveEvent}
      />
    </Box>
  );
}

function CalendarToolbar({
  view,
  selectedDate,
  filter,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onSearch,
  onOpenFilters,
  onCreate,
}: {
  view: CalendarView;
  selectedDate: string;
  filter: CalendarFilterState;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSearch: (value: string) => void;
  onOpenFilters: () => void;
  onCreate: () => void;
}) {
  const selected = dayjs(selectedDate);

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 64,
        zIndex: 40,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
        py: { xs: 2, md: 3 },
        bgcolor: surfaceTokens.background,
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {view === 'agenda' ? '日程' : `${selected.month() + 1}月`}
          </Typography>
          <Button
            size="small"
            sx={{
              borderRadius: 999,
              px: 1.75,
              py: 0.35,
              minWidth: 0,
              bgcolor: surfaceTokens.surfaceContainer,
              color: surfaceTokens.muted,
              fontSize: '0.75rem',
              fontWeight: 700,
              '&:hover': { bgcolor: surfaceTokens.primaryContainer, color: surfaceTokens.primary },
            }}
          >
            {selected.year()}
          </Button>
        </Box>
        <Typography sx={{ mt: 0.25, fontSize: '0.8125rem', color: surfaceTokens.muted }}>
          {view === 'month' ? '连续月份 · 点击日期查看详情' : selected.format('YYYY年M月D日 dddd')}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', pt: 0.75 }}>
        <Box sx={{ display: 'inline-flex', bgcolor: surfaceTokens.surface, border: `1px solid ${surfaceTokens.outline}`, borderRadius: 999, overflow: 'hidden' }}>
          {VIEW_OPTIONS.map((option) => (
            <Button
              key={option.value}
              onClick={() => onViewChange(option.value)}
              sx={{
                minWidth: 48,
                px: 2,
                py: 0.75,
                borderRadius: 0,
                fontSize: '0.8125rem',
                fontWeight: view === option.value ? 700 : 500,
                color: view === option.value ? surfaceTokens.primary : surfaceTokens.muted,
                bgcolor: view === option.value ? surfaceTokens.primaryContainer : 'transparent',
                '&:hover': { bgcolor: view === option.value ? surfaceTokens.primaryContainer : surfaceTokens.surfaceHover },
              }}
            >
              {option.label}
            </Button>
          ))}
        </Box>

        <IconButton onClick={onPrev} sx={circleButtonSx}>
          <ChevronLeftIcon />
        </IconButton>
        <IconButton onClick={onNext} sx={circleButtonSx}>
          <ChevronRightIcon />
        </IconButton>
        <Button onClick={onToday} sx={outlinePillSx}>
          今天
        </Button>
        <Button startIcon={<FilterListIcon />} onClick={onOpenFilters} sx={outlinePillSx}>
          筛选
        </Button>
        <TextField
          size="small"
          placeholder="搜索"
          value={filter.searchQuery}
          onChange={(event) => onSearch(event.target.value)}
          sx={{
            width: { xs: 150, sm: 190 },
            '& .MuiOutlinedInput-root': {
              height: 38,
              borderRadius: 999,
              bgcolor: surfaceTokens.surface,
              fontSize: '0.8125rem',
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button startIcon={<AddIcon />} onClick={onCreate} sx={filledPillSx}>
          新建事件
        </Button>
      </Box>
    </Box>
  );
}

function MonthSection({
  year,
  month,
  selectedDate,
  events,
  onSelectDate,
  onCreate,
}: {
  year: number;
  month: number;
  selectedDate: string;
  events: CalendarEvent[];
  onSelectDate: (date: string) => void;
  onCreate: (date: string) => void;
}) {
  const grid = getMonthGrid(year, month);
  const eventsByDate = groupEventsByDate(events);

  return (
    <Box sx={{ mb: 2, borderRadius: '24px', bgcolor: surfaceTokens.surface, boxShadow: '0 4px 16px rgba(108,92,231,0.06)', px: { xs: 1, sm: 2.5, md: 3 }, pt: 2.5, pb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, pb: 1.5, mb: 0.25, borderBottom: `1px solid ${surfaceTokens.outlineSoft}` }}>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 800 }}>{month + 1}月</Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: surfaceTokens.dim, fontWeight: 600 }}>{year}</Typography>
        {events.length > 0 && (
          <Typography sx={{ ml: 'auto', fontSize: '0.75rem', color: surfaceTokens.dim }}>{events.length} 个事件</Typography>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.25 }}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Typography key={label} sx={{ py: 1, textAlign: 'center', fontSize: '0.6875rem', fontWeight: 800, color: surfaceTokens.muted, letterSpacing: '0.06em' }}>
            {label}
          </Typography>
        ))}
      </Box>

      {grid.map((week, weekIndex) => (
        <Box key={`${year}-${month}-${weekIndex}`} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: 80, borderTop: weekIndex === 0 ? 0 : `1px solid ${surfaceTokens.outlineSoft}` }}>
          {week.map((day, dayIndex) => {
            const dayEvents = eventsByDate.get(day.date) ?? [];
            const selected = day.date === selectedDate;
            return (
              <Box
                key={day.date}
                onClick={() => onSelectDate(day.date)}
                onDoubleClick={() => onCreate(day.date)}
                sx={{
                  minHeight: { xs: 82, md: 90 },
                  px: { xs: 0.5, md: 0.75 },
                  py: 1,
                  cursor: 'pointer',
                  userSelect: 'none',
                  opacity: day.isCurrentMonth ? 1 : 0.28,
                  bgcolor: selected ? surfaceTokens.primaryContainer : 'transparent',
                  transition: 'background 120ms cubic-bezier(0.2,0,0,1), opacity 120ms cubic-bezier(0.2,0,0,1)',
                  borderRight: dayIndex === 6 ? 0 : '1px solid transparent',
                  '&:hover': { bgcolor: selected ? surfaceTokens.primaryContainer : surfaceTokens.surfaceLow, opacity: day.isCurrentMonth ? 1 : 0.42 },
                }}
              >
                <Box
                  sx={{
                    width: day.isToday ? 42 : 38,
                    height: day.isToday ? 42 : 38,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 0.125,
                    color: day.isToday ? '#fff' : surfaceTokens.text,
                    bgcolor: day.isToday ? surfaceTokens.primary : 'transparent',
                    fontSize: day.isToday ? '1.5rem' : '1.375rem',
                    fontWeight: day.isToday ? 800 : 700,
                    lineHeight: 1,
                  }}
                >
                  {day.day}
                </Box>
                {day.isCurrentMonth && (
                  <>
                    <HolidayLabel events={dayEvents} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', mt: 0.25, minHeight: 4 }}>
                      {dayEvents.slice(0, 2).map((event) => (
                        <Box key={event.id} sx={{ height: 4, borderRadius: '2px', maxWidth: 'calc(100% - 8px)', bgcolor: event.color }} />
                      ))}
                      {dayEvents.length > 2 && (
                        <Typography sx={{ mt: '-1px', fontSize: '0.5625rem', lineHeight: 1, color: surfaceTokens.dim, fontWeight: 700 }}>
                          +{dayEvents.length - 2}
                        </Typography>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

function HolidayLabel({ events }: { events: CalendarEvent[] }) {
  const holiday = events.find((event) => event.sourceType === 'holiday');
  const label = holiday?.title;
  if (!label) return null;
  return (
    <Typography sx={{ px: 0.25, maxWidth: 64, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.625rem', color: '#EF4444', fontWeight: 800, lineHeight: 1.2 }}>
      {label}
    </Typography>
  );
}

function WeekView({
  selectedDate,
  events,
  onSelectDate,
  onCreate,
  onEdit,
}: {
  selectedDate: string;
  events: CalendarEvent[];
  onSelectDate: (date: string) => void;
  onCreate: () => void;
  onEdit: (event: CalendarEvent) => void;
}) {
  const week = getWeekDays(selectedDate);
  const eventsByDate = groupEventsByDate(events);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const rangeLabel = `${dayjs(week[0].date).format('M月D日')} - ${dayjs(week[6].date).format('M月D日')}`;
  const stats = getWeekStats(events);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <CalendarSurface sx={{ p: { xs: 1.5, md: 2.5 }, pb: { xs: 1, md: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: surfaceTokens.muted, letterSpacing: '0.01em' }}>
            {rangeLabel}
            <Box component="span" sx={{ ml: 1.25, fontSize: '0.75rem', color: surfaceTokens.dim, fontWeight: 500 }}>
              第 {getWeekNumber(selectedDate)} 周 · {events.length} 个事件
            </Box>
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton onClick={() => onSelectDate(dayjs(selectedDate).subtract(7, 'day').format('YYYY-MM-DD'))} sx={smallCircleButtonSx}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={() => onSelectDate(dayjs(selectedDate).add(7, 'day').format('YYYY-MM-DD'))} sx={smallCircleButtonSx}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
          {week.map((day, index) => {
            const dayEvents = eventsByDate.get(day.date) ?? [];
            const selected = day.date === selectedDate;
            return (
              <Box
                key={day.date}
                onClick={() => onSelectDate(day.date)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minHeight: { xs: 78, md: 88 },
                  px: 0.5,
                  py: 1.25,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: selected ? 'rgba(108,92,231,0.30)' : 'transparent',
                  bgcolor: selected ? surfaceTokens.primaryContainer : 'transparent',
                  opacity: day.isCurrentMonth ? 1 : 0.35,
                  '&:hover': { bgcolor: selected ? surfaceTokens.primaryContainer : surfaceTokens.surfaceLow },
                }}
              >
                <Typography sx={{ mb: 0.25, fontSize: '0.625rem', fontWeight: 800, color: surfaceTokens.dim, letterSpacing: '0.05em' }}>
                  {WEEKDAY_LABELS[index]}
                </Typography>
                <Box
                  sx={{
                    width: day.isToday ? 38 : 36,
                    height: day.isToday ? 38 : 36,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: day.isToday ? '1.25rem' : '1.125rem',
                    fontWeight: day.isToday ? 800 : 700,
                    color: day.isToday ? '#fff' : surfaceTokens.text,
                    bgcolor: day.isToday ? surfaceTokens.primary : 'transparent',
                  }}
                >
                  {day.day}
                </Box>
                <HolidayLabel events={dayEvents} />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '100%', mt: 0.25, minHeight: 3 }}>
                  {dayEvents.slice(0, 3).map((event) => (
                    <Box key={event.id} sx={{ width: 28, maxWidth: 'calc(100% - 12px)', height: 3, borderRadius: 2, bgcolor: event.color }} />
                  ))}
                  {dayEvents.length > 3 && (
                    <Typography sx={{ fontSize: '0.5rem', lineHeight: 1, color: surfaceTokens.dim, fontWeight: 700 }}>+{dayEvents.length - 3}</Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </CalendarSurface>

      <WeekStatsCard stats={stats} />
      <SelectedDayCard selectedDate={selectedDate} events={selectedEvents} onCreate={onCreate} onEdit={onEdit} />
    </Box>
  );
}

function WeekStatsCard({ stats }: { stats: WeekStats }) {
  const items = [
    { label: '日程', value: stats.schedule, color: '#6C5CE7', bg: 'rgba(108,92,231,0.10)', icon: '日' },
    { label: `任务 (${stats.todoPending} 待完成)`, value: stats.todo, color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', icon: '✓' },
    { label: `收入 (${stats.incomeCount} 笔)`, value: `+¥${stats.income.toLocaleString()}`, color: '#10B981', bg: 'rgba(16,185,129,0.10)', icon: '入' },
    { label: `支出 (${stats.expenseCount} 笔)`, value: `-¥${stats.expense.toLocaleString()}`, color: '#EF4444', bg: 'rgba(239,68,68,0.10)', icon: '出' },
    { label: '记账事件', value: stats.bill, color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', icon: '账' },
    { label: '节假日', value: stats.holiday, color: '#EF4444', bg: 'rgba(239,68,68,0.10)', icon: '休' },
  ];

  return (
    <CalendarSurface sx={{ p: { xs: 1.5, md: 2 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 1 }}>
        {items.map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, bgcolor: item.bg, color: item.color, fontSize: '0.8125rem', fontWeight: 900 }}>
              {item.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 900, lineHeight: 1.2, color: item.color }}>{item.value}</Typography>
              <Typography sx={{ fontSize: '0.625rem', color: surfaceTokens.muted, lineHeight: 1.2 }} noWrap>{item.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </CalendarSurface>
  );
}

function DayView({ selectedDate, events, onCreate, onEdit }: { selectedDate: string; events: CalendarEvent[]; onCreate: () => void; onEdit: (event: CalendarEvent) => void }) {
  return (
    <SelectedDayCard
      selectedDate={selectedDate}
      events={events}
      onCreate={onCreate}
      onEdit={onEdit}
      full
    />
  );
}

function SelectedDayCard({
  selectedDate,
  events,
  onCreate,
  onEdit,
  full = false,
}: {
  selectedDate: string;
  events: CalendarEvent[];
  onCreate: () => void;
  onEdit: (event: CalendarEvent) => void;
  full?: boolean;
}) {
  const selected = dayjs(selectedDate);
  const allDayEvents = events.filter((event) => event.allDay);
  const timedEvents = events.filter((event) => !event.allDay);
  const holiday = events.find((event) => event.sourceType === 'holiday');

  return (
    <CalendarSurface sx={{ p: { xs: 2, md: full ? 3 : 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.01em' }}>
            {selected.month() + 1}月{selected.date()}日{selectedDate === todayStr() ? ' · 今天' : ''}
          </Typography>
          <Typography sx={{ mt: 0.25, fontSize: '0.75rem', color: surfaceTokens.muted }}>
            {selected.format('dddd')}{holiday ? ` · ${holiday.title}` : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75 }}>
            {selectedDate === todayStr() && <Badge label="今天" tone="today" />}
            {holiday && <Badge label={holiday.title} tone="holiday" />}
          </Box>
        </Box>
        <Button onClick={onCreate} sx={selectedDayAddButtonSx}>+ 新建事件</Button>
      </Box>

      {allDayEvents.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography sx={timelineSectionLabelSx}>全天</Typography>
          <TimelineList events={allDayEvents} emptyText="无全天事件" onEdit={onEdit} variant="selected" />
        </Box>
      )}

      <Box>
        {allDayEvents.length > 0 && <Typography sx={timelineSectionLabelSx}>时间线</Typography>}
        <TimelineList events={timedEvents} emptyText={allDayEvents.length > 0 ? '无时间事件' : '这一天暂无日程'} onEdit={onEdit} variant="selected" showTimeColumn />
      </Box>
    </CalendarSurface>
  );
}

function AgendaList({ events, onEdit }: { events: CalendarEvent[]; onEdit: (event: CalendarEvent) => void }) {
  const grouped = groupEventsByDate(events);

  if (events.length === 0) {
    return (
      <CalendarSurface sx={{ p: { xs: 2, md: 3 } }}>
        <SectionHeader title="日程列表" meta="未来事件" />
        <EmptyState text="没有找到相关日程" />
      </CalendarSurface>
    );
  }

  return (
    <CalendarSurface sx={{ p: { xs: 2, md: 3 } }}>
      <SectionHeader title="日程列表" meta="未来事件" />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
        {Array.from(grouped.entries()).map(([date, items]) => {
          const isToday = date === todayStr();
          const holiday = items.find((event) => event.sourceType === 'holiday');
          return (
            <Box key={date}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, pb: 0.75, mb: 0.5, borderBottom: `1px solid ${surfaceTokens.outlineSoft}` }}>
                <Typography sx={{ fontSize: '0.9375rem', fontWeight: 900 }}>{dayjs(date).format('M月D日')}</Typography>
                <Typography sx={{ fontSize: '0.6875rem', color: surfaceTokens.muted }}>{dayjs(date).format('ddd')}</Typography>
                {isToday && <Badge label="今天" tone="today" />}
                {holiday && <Badge label={holiday.title} tone="holiday" />}
                <Typography sx={{ ml: 'auto', fontSize: '0.6875rem', color: surfaceTokens.dim }}>{items.length} 个</Typography>
              </Box>
              <TimelineList events={items} emptyText="无事件" onEdit={onEdit} variant="agenda" />
            </Box>
          );
        })}
      </Box>
    </CalendarSurface>
  );
}

function CalendarSurface({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box sx={{ borderRadius: '24px', bgcolor: surfaceTokens.surface, boxShadow: '0 4px 16px rgba(108,92,231,0.06)', ...sx }}>
      {children}
    </Box>
  );
}

function SectionHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, pb: 1.5, mb: 2, borderBottom: `1px solid ${surfaceTokens.outlineSoft}` }}>
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 900 }}>{title}</Typography>
      <Typography sx={{ fontSize: '0.8125rem', color: surfaceTokens.dim, fontWeight: 700 }}>{meta}</Typography>
    </Box>
  );
}

interface WeekStats {
  schedule: number;
  todo: number;
  todoPending: number;
  income: number;
  incomeCount: number;
  expense: number;
  expenseCount: number;
  bill: number;
  holiday: number;
}

function getWeekStats(events: CalendarEvent[]): WeekStats {
  return events.reduce<WeekStats>(
    (stats, event) => {
      if (event.sourceType === 'manual' || event.sourceType === 'subscription') stats.schedule += 1;
      if (event.sourceType === 'todo') {
        stats.todo += 1;
        if (event.status !== 'completed') stats.todoPending += 1;
      }
      if (event.sourceType === 'finance_income') {
        stats.income += event.amount ?? 0;
        stats.incomeCount += 1;
      }
      if (event.sourceType === 'finance_expense') {
        stats.expense += event.amount ?? 0;
        stats.expenseCount += 1;
      }
      if (event.sourceType === 'finance_event' || event.sourceType === 'bill') stats.bill += 1;
      if (event.sourceType === 'holiday') stats.holiday += 1;
      return stats;
    },
    { schedule: 0, todo: 0, todoPending: 0, income: 0, incomeCount: 0, expense: 0, expenseCount: 0, bill: 0, holiday: 0 },
  );
}

function getWeekNumber(date: string): number {
  const value = dayjs(date);
  const start = value.startOf('year');
  return Math.ceil((value.diff(start, 'day') + start.day() + 1) / 7);
}

function DetailDrawer({
  open,
  selectedDate,
  events,
  onClose,
  onCreate,
  onEdit,
}: {
  open: boolean;
  selectedDate: string;
  events: CalendarEvent[];
  onClose: () => void;
  onCreate: () => void;
  onEdit: (event: CalendarEvent) => void;
}) {
  const selected = dayjs(selectedDate);
  const totalIncome = events.filter((event) => event.direction === 'income').reduce((sum, event) => sum + (event.amount ?? 0), 0);
  const totalExpense = events.filter((event) => event.direction === 'expense').reduce((sum, event) => sum + (event.amount ?? 0), 0);

  return (
    <DrawerFrame open={open} onClose={onClose} width={420}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', p: '24px 24px 16px', borderBottom: `1px solid ${surfaceTokens.outlineSoft}` }}>
        <Box>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {selected.month() + 1}月{selected.date()}日
          </Typography>
          <Typography sx={{ mt: 0.25, fontSize: '0.8125rem', color: surfaceTokens.muted }}>{selected.format('dddd')}</Typography>
        </Box>
        <IconButton onClick={onClose} sx={drawerCloseSx}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', px: 3, py: 1.5 }}>
        {selectedDate === todayStr() && <Badge label="今天" tone="today" />}
        {events.some((event) => event.sourceType === 'holiday') && <Badge label={events.find((event) => event.sourceType === 'holiday')?.title ?? '节假日'} tone="holiday" />}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, px: 3, py: 1.5, borderBottom: `1px solid ${surfaceTokens.outlineSoft}` }}>
        <Stat label={`${events.length} 个事件`} />
        {totalIncome > 0 && <Stat label={`+¥${totalIncome.toLocaleString()}`} color="#10B981" />}
        {totalExpense > 0 && <Stat label={`-¥${totalExpense.toLocaleString()}`} color="#EF4444" />}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
        <Typography sx={{ mb: 1.25, fontSize: '0.6875rem', fontWeight: 800, color: surfaceTokens.dim, letterSpacing: '0.06em' }}>
          当日事件
        </Typography>
        <TimelineList events={events} emptyText="暂无事件" onEdit={onEdit} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', px: 3, py: 2, borderTop: `1px solid ${surfaceTokens.outlineSoft}` }}>
        <Button onClick={onCreate} sx={tonalPillSx}>+ 新建事件</Button>
        <Button onClick={onClose} sx={outlinePillSx}>关闭</Button>
      </Box>
    </DrawerFrame>
  );
}

function FilterDrawer({
  open,
  filter,
  sources,
  subscriptions,
  events,
  onClose,
  onToggleFilter,
  onToggleSource,
  onSync,
}: {
  open: boolean;
  filter: CalendarFilterState;
  sources: CalendarSource[];
  subscriptions: CalendarSubscription[];
  events: CalendarEvent[];
  onClose: () => void;
  onToggleFilter: (key: keyof CalendarFilterState) => void;
  onToggleSource: (sourceId: string) => void;
  onSync: (subscriptionId: string) => void;
}) {
  return (
    <DrawerFrame open={open} onClose={onClose} width={360}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', p: '24px 24px 16px', borderBottom: `1px solid ${surfaceTokens.outlineSoft}` }}>
        <Box>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 800 }}>日历筛选</Typography>
          <Typography sx={{ mt: 0.25, fontSize: '0.8125rem', color: surfaceTokens.muted }}>来源,订阅与显示范围</Typography>
        </Box>
        <IconButton onClick={onClose} sx={drawerCloseSx}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
        <Typography sx={drawerSectionTitleSx}>来源类型</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {FILTER_OPTIONS.map((option) => (
            <FilterRow
              key={option.key}
              label={option.label}
              color={option.color}
              count={events.filter((event) => matchesFilterKey(event, option.key)).length}
              checked={Boolean(filter[option.key])}
              onClick={() => onToggleFilter(option.key)}
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography sx={drawerSectionTitleSx}>日历来源</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {sources.map((source) => (
            <FilterRow
              key={source.id}
              label={source.name}
              color={source.color}
              count={events.filter((event) => event.sourceId === source.id).length}
              checked={source.visible}
              onClick={() => onToggleSource(source.id)}
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography sx={drawerSectionTitleSx}>订阅</Typography>
        {subscriptions.map((subscription) => (
          <Box key={subscription.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{subscription.name}</Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: surfaceTokens.dim }}>
                {subscription.lastSyncedAt ? dayjs(subscription.lastSyncedAt).format('YYYY-MM-DD HH:mm') : '尚未同步'}
              </Typography>
            </Box>
            <Tooltip title="同步">
              <IconButton size="small" onClick={() => onSync(subscription.id)}>
                <SyncIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
      </Box>
    </DrawerFrame>
  );
}

function DrawerFrame({ open, width, onClose, children }: { open: boolean; width: number; onClose: () => void; children: React.ReactNode }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      slotProps={{
        paper: {
          sx: {
            ml: 'auto',
            width: { xs: '100vw', sm: width },
            maxWidth: { xs: '100vw', sm: '90vw' },
            height: { xs: '85vh', sm: '100vh' },
            mt: { xs: '15vh', sm: 0 },
            borderRadius: { xs: '16px 16px 0 0', sm: '24px 0 0 24px' },
            boxShadow: '-8px 0 40px rgba(0,0,0,0.10)',
            bgcolor: surfaceTokens.surface,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
        backdrop: {
          sx: { bgcolor: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(4px)' },
        },
      }}
    >
      {children}
    </Dialog>
  );
}

function FilterRow({ label, color, count, checked, onClick }: { label: string; color: string; count: number; checked: boolean; onClick: () => void }) {
  return (
    <Box onClick={onClick} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 1.25, borderRadius: '12px', cursor: 'pointer', '&:hover': { bgcolor: surfaceTokens.surfaceLow } }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography sx={{ flex: 1, fontSize: '0.8125rem', fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ minWidth: 20, textAlign: 'right', fontSize: '0.6875rem', color: surfaceTokens.dim }}>{count}</Typography>
      <SwitchVisual checked={checked} />
    </Box>
  );
}

function SwitchVisual({ checked }: { checked: boolean }) {
  return (
    <Box sx={{ width: 44, height: 24, borderRadius: 12, bgcolor: checked ? surfaceTokens.primaryContainer : surfaceTokens.outline, position: 'relative', transition: 'all 200ms cubic-bezier(0.2,0,0,1)' }}>
      <Box sx={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', bgcolor: checked ? surfaceTokens.primary : '#fff', boxShadow: checked ? '0 1px 4px rgba(108,92,231,0.3)' : '0 1px 3px rgba(0,0,0,0.12)', transition: 'all 200ms cubic-bezier(0.2,0,0,1)' }} />
    </Box>
  );
}

function TimelineList({
  events,
  emptyText,
  compact = false,
  variant = 'drawer',
  showTimeColumn = false,
  onEdit,
}: {
  events: CalendarEvent[];
  emptyText: string;
  compact?: boolean;
  variant?: 'drawer' | 'selected' | 'agenda';
  showTimeColumn?: boolean;
  onEdit: (event: CalendarEvent) => void;
}) {
  if (events.length === 0) {
    return <EmptyState text={emptyText} compact={compact} />;
  }

  const timelineMode = variant === 'selected' && showTimeColumn;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: variant === 'drawer' ? 1 : 0 }}>
      {events.map((event, index) => (
        <Box
          key={event.id}
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onEdit(event);
          }}
          sx={{
            display: 'flex',
            gap: timelineMode ? 1.75 : 1.5,
            p: variant === 'drawer' ? (compact ? 1 : 1.5) : '8px',
            mx: variant === 'drawer' ? 0 : -1,
            borderRadius: '12px',
            bgcolor: variant === 'drawer' ? surfaceTokens.surfaceLow : 'transparent',
            cursor: 'pointer',
            opacity: event.status === 'completed' ? 0.56 : 1,
            borderLeft: variant === 'drawer' && event.status === 'overdue' ? '3px solid #DC2626' : 'none',
            '&:hover': { bgcolor: surfaceTokens.surfaceLow },
          }}
        >
          {timelineMode && (
            <Box sx={{ width: 46, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pt: 0.25 }}>
              <Typography sx={{ fontSize: event.allDay ? '0.625rem' : '0.6875rem', color: event.allDay ? surfaceTokens.dim : surfaceTokens.muted, fontWeight: 700, lineHeight: 1.3, letterSpacing: event.allDay ? '0.02em' : 0 }}>
                {formatEventTime(event)}
              </Typography>
            </Box>
          )}
          {timelineMode ? (
            <Box sx={{ width: 14, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: event.color, mt: 0.75, zIndex: 2 }} />
              {index < events.length - 1 && <Box sx={{ position: 'absolute', top: 0, bottom: -0.5, left: '50%', width: '1.5px', bgcolor: surfaceTokens.outline, transform: 'translateX(-50%)' }} />}
            </Box>
          ) : (
            <Box sx={{ width: 4, borderRadius: 2, bgcolor: event.color, flexShrink: 0, alignSelf: 'stretch' }} />
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, lineHeight: 1.35, textDecoration: event.status === 'completed' ? 'line-through' : 'none' }} noWrap={compact}>
              {event.title}
              {event.status === 'overdue' && (
                <Box component="span" sx={{ ml: 0.75, px: 0.75, py: 0.125, borderRadius: 999, bgcolor: '#FEF2F2', color: '#DC2626', fontSize: '0.5625rem', fontWeight: 800 }}>
                  逾期
                </Box>
              )}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
              {!timelineMode && <Typography sx={{ fontSize: '0.6875rem', color: surfaceTokens.muted }}>{formatEventTime(event)}</Typography>}
              <TinyChip label={getSourceLabel(event)} color={event.color} />
              {event.location && <TinyChip label={event.location} />}
              {event.amount !== undefined && (
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: event.direction === 'income' ? '#10B981' : '#EF4444' }}>
                  {event.direction === 'income' ? '+' : '-'}¥{event.amount.toLocaleString()}
                </Typography>
              )}
              {event.status === 'completed' && <TinyChip label="已完成" color="#16A34A" />}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function EmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <Box sx={{ py: compact ? 1 : 4, textAlign: 'center', color: surfaceTokens.dim }}>
      {!compact && <CalendarMonthIcon sx={{ opacity: 0.25, mb: 0.75 }} />}
      <Typography sx={{ fontSize: '0.8125rem' }}>{text}</Typography>
    </Box>
  );
}

function Badge({ label, tone }: { label: string; tone: 'today' | 'holiday' }) {
  return (
    <Box sx={{ px: 1.25, py: 0.25, borderRadius: 999, fontSize: '0.6875rem', fontWeight: 800, color: tone === 'today' ? surfaceTokens.primary : '#EF4444', bgcolor: tone === 'today' ? surfaceTokens.surfaceContainer : '#FEF2F2', border: tone === 'today' ? `1px solid ${surfaceTokens.primaryContainer}` : 'none' }}>
      {label}
    </Box>
  );
}

function Stat({ label, color }: { label: string; color?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, fontSize: '0.75rem', color: surfaceTokens.muted }}>
      {color && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color }} />}
      <Typography sx={{ fontSize: '0.75rem', fontWeight: color ? 800 : 600, color: color ?? surfaceTokens.muted }}>{label}</Typography>
    </Box>
  );
}

function TinyChip({ label, color = surfaceTokens.primary }: { label: string; color?: string }) {
  return (
    <Box sx={{ px: 1, py: 0.125, borderRadius: 999, bgcolor: `${color}22`, color, fontSize: '0.625rem', fontWeight: 800 }}>
      {label}
    </Box>
  );
}

function getSourceLabel(event: CalendarEvent): string {
  if (event.sourceType === 'manual') return '我的日历';
  if (event.sourceType === 'todo') return '任务';
  if (event.sourceType === 'finance_income') return '收入';
  if (event.sourceType === 'finance_expense') return '支出';
  if (event.sourceType === 'finance_event') return '记账事件';
  if (event.sourceType === 'bill') return '账单';
  if (event.sourceType === 'holiday') return '节假日';
  return '订阅';
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function matchesFilterKey(event: CalendarEvent, key: keyof CalendarFilterState): boolean {
  if (key === 'showManual') return event.sourceType === 'manual';
  if (key === 'showTodo') return event.sourceType === 'todo';
  if (key === 'showFinance') return event.sourceType === 'finance_income' || event.sourceType === 'finance_expense' || event.sourceType === 'finance_event' || event.sourceType === 'bill';
  if (key === 'showHoliday') return event.sourceType === 'holiday';
  if (key === 'showSubscription') return event.sourceType === 'subscription';
  return false;
}

function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();
  events.forEach((event) => {
    const date = event.startAt.substring(0, 10);
    grouped.set(date, [...(grouped.get(date) ?? []), event]);
  });
  return grouped;
}

const circleButtonSx = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  border: `1px solid ${surfaceTokens.outline}`,
  bgcolor: 'transparent',
  color: surfaceTokens.muted,
  '&:hover': { bgcolor: surfaceTokens.surfaceHover, color: surfaceTokens.primary, borderColor: surfaceTokens.primary },
};

const smallCircleButtonSx = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: `1px solid ${surfaceTokens.outline}`,
  bgcolor: 'transparent',
  color: surfaceTokens.muted,
  '&:hover': { bgcolor: surfaceTokens.surfaceHover, color: surfaceTokens.text },
};

const outlinePillSx = {
  height: 38,
  borderRadius: 999,
  px: 1.5,
  border: `1px solid ${surfaceTokens.outline}`,
  bgcolor: 'transparent',
  color: surfaceTokens.muted,
  fontSize: '0.8125rem',
  fontWeight: 700,
  '&:hover': { bgcolor: surfaceTokens.surfaceHover, color: surfaceTokens.primary, borderColor: surfaceTokens.primary },
};

const tonalPillSx = {
  height: 34,
  borderRadius: 999,
  px: 1.5,
  bgcolor: surfaceTokens.primaryContainer,
  color: surfaceTokens.onPrimaryContainer,
  fontSize: '0.75rem',
  fontWeight: 800,
  '&:hover': { bgcolor: surfaceTokens.surfaceContainer },
};

const filledPillSx = {
  height: 38,
  borderRadius: 999,
  px: 2,
  bgcolor: surfaceTokens.primary,
  color: '#fff',
  fontSize: '0.8125rem',
  fontWeight: 800,
  boxShadow: '0 8px 24px rgba(108,92,231,0.18)',
  '&:hover': { bgcolor: '#7567EA', boxShadow: '0 12px 32px rgba(108,92,231,0.28)' },
};

const selectedDayAddButtonSx = {
  height: 32,
  borderRadius: 999,
  px: 1.75,
  bgcolor: surfaceTokens.primary,
  color: '#fff',
  fontSize: '0.75rem',
  fontWeight: 800,
  flexShrink: 0,
  '&:hover': { bgcolor: '#7567EA' },
};

const timelineSectionLabelSx = {
  mb: 0.75,
  fontSize: '0.6875rem',
  fontWeight: 800,
  color: surfaceTokens.dim,
  letterSpacing: '0.04em',
};

const drawerCloseSx = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  color: surfaceTokens.muted,
  '&:hover': { bgcolor: surfaceTokens.surfaceHover, color: surfaceTokens.text },
};

const drawerSectionTitleSx = {
  mb: 1,
  fontSize: '0.6875rem',
  fontWeight: 800,
  color: surfaceTokens.dim,
  letterSpacing: '0.06em',
};
