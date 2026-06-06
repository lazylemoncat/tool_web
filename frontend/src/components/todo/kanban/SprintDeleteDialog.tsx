'use client';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import type { Sprint } from '@/lib/types';

interface SprintDeleteDialogProps {
  sprint: Sprint | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SprintDeleteDialog({ sprint, onClose, onConfirm }: SprintDeleteDialogProps) {
  return (
    <Dialog open={Boolean(sprint)} onClose={onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ fontSize: '2rem', mb: 1, textAlign: 'center' }}>⚠️</Box>
        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, textAlign: 'center' }}>
          删除 Sprint？
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          确定要删除 Sprint <strong>「{sprint?.name}」</strong> 吗？
          此操作将<strong style={{ color: '#BA1A1A' }}>同时删除该 Sprint 内的所有任务和列</strong>，不可撤销。
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: 1, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>取消</Button>
        <Button variant="contained" color="error" onClick={onConfirm} sx={{ borderRadius: 2 }}>确认删除</Button>
      </DialogActions>
    </Dialog>
  );
}
