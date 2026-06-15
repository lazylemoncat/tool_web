'use client';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useThemeCtx } from '@/components/theme/ThemeRegistry';
import DialogHeader from '@/components/shared/DialogHeader';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { mode, toggle } = useThemeCtx();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}
    >
      <DialogHeader title="偏好设置" icon={<SettingsRoundedIcon fontSize="small" />} onClose={onClose} />

      <DialogContent sx={{ pt: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
              深色模式
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              切换后会立即应用到当前界面.
            </Typography>
          </Box>
          <Switch
            checked={mode === 'dark'}
            onChange={toggle}
            color="primary"
            slotProps={{ input: { 'aria-label': '切换深色模式' } }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="contained" onClick={onClose} sx={{ px: 3 }}>
          完成
        </Button>
      </DialogActions>
    </Dialog>
  );
}
