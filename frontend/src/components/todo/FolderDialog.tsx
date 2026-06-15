'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import DialogHeader from '@/components/shared/DialogHeader';
import MarkerPicker, { MARKER_COLORS, type MarkerValue } from '@/components/shared/MarkerPicker';

interface FolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, marker: MarkerValue, mode: 'todo' | 'kanban') => void;
}

export default function FolderDialog({ open, onClose, onSave }: FolderDialogProps) {
  const [name, setName] = useState('');
  const [marker, setMarker] = useState<MarkerValue>({ type: 'color', value: MARKER_COLORS[0] });
  const [mode, setMode] = useState<'todo' | 'kanban'>('todo');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('请输入文件夹名称'); return; }
    onSave(name.trim(), marker, mode);
    setName('');
    setMarker({ type: 'color', value: MARKER_COLORS[0] });
    setMode('todo');
    setError('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
      <DialogHeader title="新建文件夹" icon="+" onClose={onClose} />
      <DialogContent sx={{ pt: 2.5 }}>
        <Box sx={{ mb: 2.25 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>文件夹名称</Typography>
          <TextField fullWidth placeholder="输入文件夹名称" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }} error={!!error} size="small" />
          {/* Fixed-height error slot — prevents dialog re-center on error toggle */}
          <Box sx={{ height: '1.25em', mt: 0.5, display: 'flex', alignItems: 'center' }}>
            {error && (
              <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem' }}>{error}</Typography>
            )}
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>文件夹标识</Typography>
          <MarkerPicker marker={marker} onChange={setMarker} label={null} />
        </Box>
        <Box sx={{ mt: 2.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>工作模式</Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => v && setMode(v)}
            fullWidth
            size="small"
            sx={{ '& .MuiToggleButton-root': { borderRadius: 2, py: 1, fontSize: '0.8125rem' } }}
          >
            <ToggleButton value="todo">
              <Box sx={{ mr: 0.75 }}>📋</Box> Todo 列表
            </ToggleButton>
            <ToggleButton value="kanban">
              <Box sx={{ mr: 0.75 }}>📊</Box> Kanban 看板
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="text" onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.875rem' }}>取消</Button>
        <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 4, px: 3 }}>{mode === 'kanban' ? '创建 Kanban 文件夹' : '创建'}</Button>
      </DialogActions>
    </Dialog>
  );
}
