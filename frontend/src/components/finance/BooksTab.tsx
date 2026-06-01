'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import * as api from '@/lib/api';
import type { LedgerOut } from '@/lib/financeTypes';

interface BooksTabProps {
  ledgers: LedgerOut[];
  activeLedgerId: number | null;
  onSelect: (id: number) => void;
  onRefresh: () => void;
}

export default function BooksTab({ ledgers, activeLedgerId, onSelect, onRefresh }: BooksTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📒');
  const [currency, setCurrency] = useState('CNY');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => { setName(''); setIcon('📒'); setCurrency('CNY'); setError(''); };

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.createLedger({ name: name.trim(), icon, currency });
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setDialogOpen(false); resetForm(); };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: '#F5F6FA', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>账本管理</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#4B5563' }}>管理你的多套账本</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={() => setDialogOpen(true)}
          sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none', bgcolor: '#6D5DFC', '&:hover': { bgcolor: '#5A4DE0' } }}>
          + 新建账本
        </Button>
      </Box>
      {ledgers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>📒</Typography>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>暂无账本</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>点击"新建账本"开始</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
          {ledgers.map((book) => (
            <Box key={book.id} onClick={() => onSelect(book.id)}
              sx={{ bgcolor: 'background.paper', borderRadius: 3.5, p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: book.id === activeLedgerId ? '2px solid' : '1px solid', borderColor: book.id === activeLedgerId ? 'primary.main' : '#EDECF0', position: 'relative', cursor: 'pointer' }}>
              {book.id === activeLedgerId && <Typography sx={{ position: 'absolute', top: 10, right: 12, bgcolor: 'primary.main', color: '#fff', fontSize: '0.5625rem', px: 1, py: 0.25, borderRadius: 1, fontWeight: 600 }}>当前</Typography>}
              <Typography sx={{ fontSize: '1.75rem', mb: 1.25 }}>{book.icon || '📒'}</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', mb: 0.5 }}>{book.name}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.625rem', color: '#A5A2AD' }}>{book.created_at?.slice(0, 10)} 创建</Typography>
                <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>{book.currency}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)', color: '#fff', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700 }}>新建账本</Typography>
          <IconButton size="small" onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.8)' }}>✕</IconButton>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
          <TextField fullWidth label="名称" size="small" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} autoFocus />
          <TextField fullWidth label="图标" size="small" value={icon} onChange={(e) => setIcon(e.target.value)} sx={{ mb: 2 }} placeholder="📒" />
          <TextField select fullWidth label="货币" size="small" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {['CNY', 'USD', 'JPY', 'EUR'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="text" onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>取消</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || saving} sx={{ borderRadius: 4, px: 3, boxShadow: 'none', textTransform: 'none' }}>保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
