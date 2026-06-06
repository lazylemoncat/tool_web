'use client';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import { useThemeCtx } from '@/components/theme/ThemeRegistry';

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
      <Box
        sx={{
          background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)',
          color: '#fff',
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="span" sx={{ fontSize: '1.25rem' }}>⚙️</Box>
          <Typography variant="h2" sx={{ color: '#fff', fontSize: '1.25rem' }}>
            偏好设置
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 2.5 }}>
        {/* Default start page */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>
            默认起始页
          </Typography>
          <Select fullWidth defaultValue="todo" size="small">
            <MenuItem value="home">工作台（首页）</MenuItem>
            <MenuItem value="todo">TODO</MenuItem>
            <MenuItem value="finance">记账</MenuItem>
          </Select>
        </Box>

        {/* Theme toggle */}
        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            深色模式
          </Typography>
          <Switch checked={mode === 'dark'} onChange={toggle} color="primary" />
        </Box>

        {/* Notification toggles */}
        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            新任务提醒
          </Typography>
          <Switch defaultChecked color="primary" />
        </Box>

        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            任务逾期通知
          </Typography>
          <Switch defaultChecked color="primary" />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            紧凑模式
          </Typography>
          <Switch color="primary" />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          variant="text"
          onClick={onClose}
          sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.875rem' }}
        >
          取消
        </Button>
        <Button variant="contained" onClick={onClose} sx={{ borderRadius: 4, px: 3 }}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
