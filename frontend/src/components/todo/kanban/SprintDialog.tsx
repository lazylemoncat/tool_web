'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Sprint } from '@/lib/types';
import { createSprint, updateSprint } from '@/lib/api';
import dayjs from 'dayjs';

interface SprintDialogProps {
  open: boolean;
  sprint: Sprint | null;
  folderId: number;
  onClose: () => void;
  onSave: () => void;
}

export default function SprintDialog({ open, sprint, folderId, onClose, onSave }: SprintDialogProps) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sprint) {
      setName(sprint.name);
      setGoal(sprint.goal || '');
      setStartDate(sprint.start_date || '');
      setEndDate(sprint.end_date || '');
    } else {
      setName('');
      setGoal('');
      setStartDate(dayjs().format('YYYY-MM-DD'));
      setEndDate(dayjs().add(14, 'day').format('YYYY-MM-DD'));
    }
  }, [sprint, open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (sprint) {
        await updateSprint(sprint.id, {
          name: name.trim(),
          goal: goal || undefined,
          start_date: startDate || null,
          end_date: endDate || null,
        });
      } else {
        await createSprint({
          folder_id: folderId,
          name: name.trim(),
          goal: goal || undefined,
          start_date: startDate || null,
          end_date: endDate || null,
        });
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          {sprint ? '编辑 Sprint' : '新建 Sprint'}
        </Typography>
      </Box>
      <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Sprint 名称" value={name} onChange={(e) => setName(e.target.value)} fullWidth size="small" required />
        <TextField label="目标（可选）" value={goal} onChange={(e) => setGoal(e.target.value)} fullWidth size="small" multiline rows={2} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="开始日期" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} size="small"
            slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }} />
          <TextField label="结束日期" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} size="small"
            slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="text" onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>取消</Button>
        <Button variant="contained" onClick={handleSave} disabled={!name.trim() || saving}
          sx={{ borderRadius: 2, px: 3 }}>{saving ? '保存中…' : '保存'}</Button>
      </DialogActions>
    </Dialog>
  );
}
