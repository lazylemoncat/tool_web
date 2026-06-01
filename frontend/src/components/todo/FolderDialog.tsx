'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface FolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}

const COLORS = ['#6282E3', '#E3628C', '#62E3A0', '#E3B462', '#B462E3', '#62D4E3'];

export default function FolderDialog({ open, onClose, onSave }: FolderDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('请输入文件夹名称'); return; }
    onSave(name.trim(), color);
    setName('');
    setColor(COLORS[0]);
    setError('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
      <Box sx={{ background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)', color: '#fff', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="span" sx={{ fontSize: '1.25rem' }}>📁</Box>
          <Typography variant="h2" sx={{ color: '#fff', fontSize: '1.25rem' }}>新建文件夹</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconButton>
      </Box>
      <DialogContent sx={{ pt: 2.5 }}>
        <Box sx={{ mb: 2.25 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>文件夹名称</Typography>
          <TextField fullWidth placeholder="输入文件夹名称" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} error={!!error} size="small" />
          {/* Fixed-height error slot — prevents dialog re-center on error toggle */}
          <Box sx={{ height: '1.25em', mt: 0.5, display: 'flex', alignItems: 'center' }}>
            {error && (
              <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem' }}>{error}</Typography>
            )}
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>颜色标识</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <Box key={c} onClick={() => setColor(c)} sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: c, cursor: 'pointer', border: '2px solid', borderColor: color === c ? 'text.primary' : 'transparent', transition: 'all 0.15s', '&:hover': { transform: 'scale(1.15)' } }} />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="text" onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.875rem' }}>取消</Button>
        <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 4, px: 3 }}>创建</Button>
      </DialogActions>
    </Dialog>
  );
}
