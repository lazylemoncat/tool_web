'use client';

import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import type { FinanceEventOut } from '@/lib/financeTypes';

interface EventDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  event: FinanceEventOut | null;
}

export default function EventDetailDrawer({ open, onClose, event }: EventDetailDrawerProps) {
  if (!event) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      slotProps={{ paper: { sx: { width: 400, maxWidth: '90vw', borderRadius: 0 } } }}>
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: `${event.color || '#6C5CE7'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>📅</Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'text.primary', mb: 0.25 }}>{event.name}</Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>{event.description}</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </IconButton>
        </Box>
      </Box>

      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
          <Box>
            <Typography sx={{ fontSize: '0.625rem', color: '#A5A2AD', mb: 0.25 }}>开始日期</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.primary', fontWeight: 500 }}>{event.start_at?.slice(0, 10) || '未设置'}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.625rem', color: '#A5A2AD', mb: 0.25 }}>结束日期</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.primary', fontWeight: 500 }}>{event.end_at?.slice(0, 10) || '未设置'}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.625rem', color: '#A5A2AD', mb: 0.25 }}>交易笔数</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.primary', fontWeight: 500 }}>{event.transaction_count || 0} 笔</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.625rem', color: '#A5A2AD', mb: 0.25 }}>颜色</Typography>
            <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: event.color || '#6C5CE7' }} />
          </Box>
        </Box>
      </Box>

      <Divider />
      <Box sx={{ px: 2.5, py: 2, display: 'flex', gap: 1 }}>
        <Button variant="outlined" onClick={onClose} fullWidth sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', color: 'text.secondary', borderColor: 'divider' }}>关闭</Button>
        <Button variant="contained" fullWidth sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', boxShadow: 'none' }}>编辑</Button>
      </Box>
    </Drawer>
  );
}
