'use client';

import { useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DATE_PICKER_DISPLAY_FORMAT } from '@/lib/dateFormats';
import type { CalendarEvent, CalendarSource, ReminderOffset, RepeatRule } from './calendarTypes';

export interface CalendarEventFormData {
  id?: string;
  title: string;
  date: string;
  time: string;
  allDay: boolean;
  sourceId: string;
  repeatRule: RepeatRule;
  reminder: ReminderOffset;
  description: string;
  location: string;
}

interface CalendarEventDialogProps {
  open: boolean;
  event: CalendarEvent | null;
  selectedDate: string;
  sources: CalendarSource[];
  onClose: () => void;
  onDelete: (eventId: string) => void;
  onSave: (data: CalendarEventFormData) => void;
}

export default function CalendarEventDialog({
  open,
  event,
  selectedDate,
  sources,
  onClose,
  onDelete,
  onSave,
}: CalendarEventDialogProps) {
  const editableSources = useMemo(() => sources.filter((source) => !source.readonly), [sources]);
  const [title, setTitle] = useState(event?.title ?? '');
  const [date, setDate] = useState<Dayjs | null>(dayjs(event?.startAt.substring(0, 10) ?? selectedDate));
  const [time, setTime] = useState(event && !event.allDay ? dayjs(event.startAt).format('HH:mm') : '');
  const [allDay, setAllDay] = useState(event?.allDay ?? true);
  const [sourceId, setSourceId] = useState(event?.sourceId ?? editableSources[0]?.id ?? '');
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(event?.repeatRule ?? 'none');
  const [reminder, setReminder] = useState<ReminderOffset>(event?.reminder ?? 'none');
  const [description, setDescription] = useState(event?.description ?? '');
  const [location, setLocation] = useState(event?.location ?? '');

  const canSubmit = title.trim().length > 0 && Boolean(date) && Boolean(sourceId);

  const handleSubmit = () => {
    if (!canSubmit || !date) return;
    onSave({
      id: event?.id,
      title: title.trim(),
      date: date.format('YYYY-MM-DD'),
      time,
      allDay,
      sourceId,
      repeatRule,
      reminder,
      description: description.trim(),
      location: location.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '1.125rem', fontWeight: 700 }}>
        {event ? '编辑事件' : '新建事件'}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <TextField
            label="标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="small"
            fullWidth
            required
            autoFocus
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 160px' }, gap: 2 }}>
            <DatePicker
              label="日期"
              value={date}
              onChange={(value) => setDate(value)}
              format={DATE_PICKER_DISPLAY_FORMAT}
              slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }}
            />
            <TextField
              label="时间"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              size="small"
              disabled={allDay}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <FormControlLabel
            control={<Checkbox checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />}
            label="全天事件"
          />

          <FormControl size="small" fullWidth>
            <InputLabel id="calendar-source-label">日历</InputLabel>
            <Select
              labelId="calendar-source-label"
              label="日历"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              {editableSources.map((source) => (
                <MenuItem key={source.id} value={source.id}>
                  {source.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="calendar-repeat-label">重复</InputLabel>
              <Select
                labelId="calendar-repeat-label"
                label="重复"
                value={repeatRule}
                onChange={(e) => setRepeatRule(e.target.value as RepeatRule)}
              >
                <MenuItem value="none">不重复</MenuItem>
                <MenuItem value="daily">每天</MenuItem>
                <MenuItem value="weekly">每周</MenuItem>
                <MenuItem value="monthly">每月</MenuItem>
                <MenuItem value="yearly">每年</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="calendar-reminder-label">提醒</InputLabel>
              <Select
                labelId="calendar-reminder-label"
                label="提醒"
                value={reminder}
                onChange={(e) => setReminder(e.target.value as ReminderOffset)}
              >
                <MenuItem value="none">无</MenuItem>
                <MenuItem value="at_time">事件开始时</MenuItem>
                <MenuItem value="5m">5 分钟前</MenuItem>
                <MenuItem value="15m">15 分钟前</MenuItem>
                <MenuItem value="1h">1 小时前</MenuItem>
                <MenuItem value="1d">1 天前</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="地点"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="描述"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {event && !event.readonly && (
          <Button color="error" onClick={() => onDelete(event.id)} sx={{ mr: 'auto' }}>
            删除
          </Button>
        )}
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit || Boolean(event?.readonly)}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
