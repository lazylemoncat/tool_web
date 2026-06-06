'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import type { Sprint } from '@/lib/types';

interface SprintListEditorProps {
  sprints: Sprint[];
  onSave: (sprints: Sprint[]) => void;
}

export default function SprintListEditor({ sprints, onSave }: SprintListEditorProps) {
  const [local, setLocal] = useState(() => [...sprints]);
  const [editSprint, setEditSprint] = useState<(Partial<Sprint> & { idx: number }) | null>(null);

  const handleEdit = (idx: number) => setEditSprint({ ...local[idx], idx });
  const handleDelete = (idx: number) => {
    const updated = local.filter((_, i) => i !== idx);
    setLocal(updated);
    onSave(updated);
  };
  const handleSave = () => {
    if (!editSprint || !editSprint.name?.trim()) return;
    const updated = local.map((s, i) => i === editSprint.idx ? { ...s, name: editSprint.name!, goal: editSprint.goal ?? null, start_date: editSprint.start_date ?? null, end_date: editSprint.end_date ?? null, status: editSprint.status || s.status } : s);
    setLocal(updated);
    setEditSprint(null);
    onSave(updated);
  };
  const handleNew = () => {
    const idx = local.length;
    setLocal(prev => [...prev, { id: 0, folder_id: 0, name: '', goal: null, start_date: null, end_date: null, status: 'planned', sort_order: idx, created_at: '', updated_at: '' }]);
    setEditSprint({ name: '', goal: null, start_date: null, end_date: null, status: 'planned', idx });
  };

  const statusLabel: Record<string, string> = { active: '进行中', planned: '未开始', completed: '已完成' };
  const statusColor: Record<string, 'success' | 'default' | 'info'> = { active: 'success', planned: 'default', completed: 'info' };

  return (
    <Box>
      {local.map((s, i) => (
        <Box key={s.id || i} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {s.name}
              <Chip label={statusLabel[s.status] || s.status} size="small" color={statusColor[s.status] || 'default'} sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {s.goal || '无目标'}{s.start_date ? ` · ${s.start_date} → ${s.end_date || ''}` : ''}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => handleEdit(i)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => handleDelete(i)}><DeleteIcon fontSize="small" color="error" /></IconButton>
        </Box>
      ))}
      <Button size="small" sx={{ mt: 1 }} onClick={handleNew}>+ 新建 Sprint</Button>
      <Dialog open={!!editSprint} onClose={() => setEditSprint(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{editSprint && editSprint.idx >= 0 && local[editSprint.idx]?.id ? '编辑 Sprint' : '新建 Sprint'}</DialogTitle>
        <DialogContent>
          <TextField label="名称" fullWidth size="small" sx={{ mt: 1 }}
            value={editSprint?.name || ''} onChange={e => setEditSprint(prev => prev ? { ...prev, name: e.target.value } : null)} />
          <TextField label="目标" fullWidth size="small" sx={{ mt: 1 }}
            value={editSprint?.goal || ''} onChange={e => setEditSprint(prev => prev ? { ...prev, goal: e.target.value } : null)} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField label="开始日期" type="date" size="small" fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={editSprint?.start_date || ''} onChange={e => setEditSprint(prev => prev ? { ...prev, start_date: e.target.value } : null)} />
            <TextField label="结束日期" type="date" size="small" fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={editSprint?.end_date || ''} onChange={e => setEditSprint(prev => prev ? { ...prev, end_date: e.target.value } : null)} />
          </Box>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>状态</InputLabel>
            <Select value={editSprint?.status || 'planned'} label="状态"
              onChange={e => setEditSprint(prev => prev ? { ...prev, status: e.target.value } : null)}>
              <MenuItem value="active">进行中</MenuItem>
              <MenuItem value="planned">未开始</MenuItem>
              <MenuItem value="completed">已完成</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSprint(null)}>取消</Button>
          <Button onClick={handleSave} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
