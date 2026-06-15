'use client';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { KanbanColumnData } from '@/lib/types';

interface ColumnDeleteDialogProps {
  column: KanbanColumnData | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ColumnDeleteDialog({ column, onClose, onConfirm }: ColumnDeleteDialogProps) {
  if (!column) return null;

  return (
    <Dialog open={Boolean(column)} onClose={onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogContent sx={{ py: 3 }}>
        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
          删除列「{column.name}」？
        </Typography>
        <Typography variant="body2" color="text.secondary">
          该列中的任务将自动迁移到同 Sprint 的其它列。此操作不可撤销。
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="text" onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>取消</Button>
        <Button variant="contained" color="error" onClick={onConfirm} sx={{ borderRadius: 2 }}>确认删除</Button>
      </DialogActions>
    </Dialog>
  );
}
