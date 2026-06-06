'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createKanbanColumn, updateKanbanColumn } from '@/lib/api';
import type { KanbanColumnData } from '@/lib/types';

const COLORS = ['#6750A4', '#0288D1', '#F57C00', '#7B1FA2', '#388E3C', '#1B5E20', '#616161', '#D32F2F'];

interface ColumnDialogProps {
  open: boolean;
  column: KanbanColumnData | null;
  sprintId: number;
  onClose: () => void;
  onSave: () => void;
}

export default function ColumnDialog({ open, column, sprintId, onClose, onSave }: ColumnDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6750A4');
  const [capacity, setCapacity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (column) {
      setName(column.name);
      setColor(column.color || '#6750A4');
      setCapacity(column.capacity != null ? String(column.capacity) : '');
    } else {
      setName('');
      setColor('#6750A4');
      setCapacity('');
    }
  }, [column, open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (column) {
        await updateKanbanColumn(column.id, {
          name: name.trim(),
          color,
          capacity: capacity ? parseInt(capacity) : null,
        });
      } else {
        await createKanbanColumn({
          sprint_id: sprintId,
          name: name.trim(),
          color,
          capacity: capacity ? parseInt(capacity) : null,
        });
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          {column ? '编辑列' : '新建列'}
        </Typography>
      </Box>
      <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="列名称" value={name} onChange={(e) => setName(e.target.value)} fullWidth size="small" required />
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>颜色</Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <Box key={c} onClick={() => setColor(c)}
                sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                  border: '2px solid', borderColor: color === c ? 'text.primary' : 'transparent',
                  transition: 'all 0.15s', '&:hover': { transform: 'scale(1.15)' } }} />
            ))}
          </Box>
        </Box>
        <TextField label="容量限制（留空=无限制）" type="number" value={capacity}
          onChange={(e) => setCapacity(e.target.value)} fullWidth size="small"
          slotProps={{ htmlInput: { min: 0 } }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="text" onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>取消</Button>
        <Button variant="contained" onClick={handleSave} disabled={!name.trim() || saving}
          sx={{ borderRadius: 2 }}>{saving ? '保存中…' : '保存'}</Button>
      </DialogActions>
    </Dialog>
  );
}
