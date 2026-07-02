'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import type { KanbanColumnData } from '@/lib/types';

interface ColumnListEditorProps {
  columns: KanbanColumnData[];
  onSave: (columns: KanbanColumnData[]) => void;
}

export default function ColumnListEditor({ columns, onSave }: ColumnListEditorProps) {
  const [editCol, setEditCol] = useState<KanbanColumnData | null>(null);
  const [localCols, setLocalCols] = useState(() => [...columns].sort((a, b) => a.sort_order - b.sort_order));

  const handleEdit = (col: KanbanColumnData) => setEditCol({ ...col });
  const handleSaveCol = () => {
    if (!editCol) return;
    const updated = localCols.map(c => c.id === editCol.id ? editCol : c);
    setLocalCols(updated);
    setEditCol(null);
    onSave(updated);
  };
  const handleDelete = (id: number) => {
    // 基于同一份 next 更新本地与回传, 连续删除时闭包里的旧数组
    // 会让已删的列在下一次 onSave 中"复活"
    const next = localCols.filter(c => c.id !== id);
    setLocalCols(next);
    onSave(next);
  };

  return (
    <Box>
      {localCols.map(col => (
        <Box key={col.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{col.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              容量: {col.capacity || '不限'} · {col.task_count} 项任务{col.is_archived ? ' · 归档列' : ''}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => handleEdit(col)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => handleDelete(col.id)}><DeleteIcon fontSize="small" color="error" /></IconButton>
        </Box>
      ))}
      <Dialog open={!!editCol} onClose={() => setEditCol(null)} maxWidth="xs" fullWidth>
        <DialogTitle>编辑列</DialogTitle>
        <DialogContent>
          <TextField label="列名称" fullWidth size="small" sx={{ mt: 1 }}
            value={editCol?.name || ''} onChange={e => setEditCol(prev => prev ? { ...prev, name: e.target.value } : null)} />
          <TextField label="容量上限" type="number" fullWidth size="small" sx={{ mt: 1 }}
            value={editCol?.capacity ?? ''} onChange={e => setEditCol(prev => prev ? { ...prev, capacity: Math.max(0, parseInt(e.target.value) || 0) } : null)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCol(null)}>取消</Button>
          <Button onClick={handleSaveCol} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
