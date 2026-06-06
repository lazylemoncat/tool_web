'use client';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface CapacityExceededDialogProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export default function CapacityExceededDialog({ open, message, onClose }: CapacityExceededDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogContent sx={{ textAlign: 'center', py: 3 }}>
        <Box sx={{ fontSize: '2rem', mb: 1 }}>⚠️</Box>
        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>容量已满</Typography>
        <Typography variant="body2" color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button variant="contained" onClick={onClose} sx={{ borderRadius: 2, px: 4 }}>知道了</Button>
      </DialogActions>
    </Dialog>
  );
}
