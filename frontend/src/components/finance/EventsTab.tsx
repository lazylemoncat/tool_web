'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import DialogHeader from '@/components/shared/DialogHeader';
import * as api from '@/lib/api';
import { DATE_PICKER_DISPLAY_FORMAT } from '@/lib/dateFormats';
import type { FinanceEventOut } from '@/lib/financeTypes';

interface EventsTabProps {
  events: FinanceEventOut[];
  activeLedgerId: number | null;
  onEventClick?: (event: FinanceEventOut) => void;
  onRefresh: () => void;
}

const EVENT_COLORS = ['#6C5CE7', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

export default function EventsTab({ events, activeLedgerId, onEventClick, onRefresh }: EventsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [color, setColor] = useState('#6C5CE7');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => { setName(''); setDescription(''); setStartAt(''); setEndAt(''); setColor('#6C5CE7'); setError(''); };

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) return;
    if (!activeLedgerId) { setError('未选择账本'); return; }
    setSaving(true);
    try {
      await api.createEvent({ ledger_id: activeLedgerId, name: name.trim(), description: description || null, start_at: startAt || null, end_at: endAt || null, color });
      setDialogOpen(false); resetForm(); onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setDialogOpen(false); resetForm(); };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>事件管理</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>按时间段追踪收支</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={() => setDialogOpen(true)}
          sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}>
          + 新建事件
        </Button>
      </Box>
      {events.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>📅</Typography>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>暂无事件</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>点击“新建事件”开始创建</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {events.map((event) => (
            <Box key={event.id} onClick={() => onEventClick?.(event)}
              sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, cursor: 'pointer' }}>
              <Box sx={{ width: 4, bgcolor: event.color || '#6C5CE7', borderRadius: 2, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', mb: 0.375 }}>{event.name}</Typography>
                {event.description && <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mb: 1 }}>{event.description}</Typography>}
                <Box sx={{ display: 'flex', gap: 1.75, fontSize: '0.625rem', color: 'text.secondary' }}>
                  {event.start_at && <Typography sx={{ fontSize: '0.625rem' }}>📅 {event.start_at.slice(0, 10)} ~ {event.end_at?.slice(0, 10) || ''}</Typography>}
                  {(event.transaction_count ?? 0) > 0 && <Typography sx={{ fontSize: '0.625rem' }}>{event.transaction_count} 笔交易</Typography>}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        <DialogHeader title="新建事件" onClose={handleClose} />
        <DialogContent sx={{ pt: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
          <TextField fullWidth label="名称" size="small" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} autoFocus />
          <TextField fullWidth label="描述" size="small" value={description} onChange={(e) => setDescription(e.target.value)} sx={{ mb: 2 }} multiline minRows={2} />
          <DatePicker
            label="开始日期"
            value={startAt ? dayjs(startAt) : null}
            onChange={(date) => setStartAt(date ? date.format('YYYY-MM-DD') : '')}
            format={DATE_PICKER_DISPLAY_FORMAT}
            slotProps={{ textField: { fullWidth: true, size: 'small', sx: { mb: 2 } } }}
          />
          <DatePicker
            label="结束日期"
            value={endAt ? dayjs(endAt) : null}
            onChange={(date) => setEndAt(date ? date.format('YYYY-MM-DD') : '')}
            format={DATE_PICKER_DISPLAY_FORMAT}
            slotProps={{ textField: { fullWidth: true, size: 'small', sx: { mb: 2 } } }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {EVENT_COLORS.map((c) => (
              <Box key={c} onClick={() => setColor(c)}
                sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: c, cursor: 'pointer', border: '3px solid', borderColor: color === c ? 'text.primary' : 'transparent', transition: 'all 0.15s' }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="text" onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>取消</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || saving} sx={{ borderRadius: 4, px: 3, boxShadow: 'none', textTransform: 'none' }}>创建</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
