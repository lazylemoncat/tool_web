'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
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
  onRefresh: () => void | Promise<unknown>;
}

export default function BooksTab({ ledgers, activeLedgerId, onSelect, onRefresh }: BooksTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState<LedgerOut | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📒');
  const [currency, setCurrency] = useState('CNY');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setEditingLedger(null);
    setName('');
    setIcon('📒');
    setCurrency('CNY');
    setError('');
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (ledger: LedgerOut) => {
    setEditingLedger(ledger);
    setName(ledger.name);
    setIcon(ledger.icon || '📒');
    setCurrency(ledger.currency || 'CNY');
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingLedger) {
        await api.updateLedger(editingLedger.id, { name: name.trim(), icon, currency });
      } else {
        const created = await api.createLedger({ name: name.trim(), icon, currency, sort_order: ledgers.length });
        onSelect(created.id);
      }
      setDialogOpen(false);
      resetForm();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (ledger: LedgerOut) => {
    if (!window.confirm(`确定删除账本“${ledger.name}”？账本下的数据也会被删除。`)) return;
    try {
      await api.deleteLedger(ledger.id);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= ledgers.length) return;
    const next = [...ledgers];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    try {
      await api.reorderLedgers(next.map((ledger, i) => ({ id: ledger.id, sort_order: i })));
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '排序失败');
    }
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: '#F5F6FA', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>账本管理</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#4B5563' }}>新增、重命名、删除并调整账本顺序</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={openCreate}
          sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none', bgcolor: '#6D5DFC', '&:hover': { bgcolor: '#5A4DE0' } }}>
          + 新建账本
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
      {ledgers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>📒</Typography>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>暂无账本</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>点击“新建账本”开始</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
          {ledgers.map((book, index) => (
            <Box key={book.id} onClick={() => onSelect(book.id)}
              sx={{ bgcolor: 'background.paper', borderRadius: 3.5, p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: book.id === activeLedgerId ? '2px solid' : '1px solid', borderColor: book.id === activeLedgerId ? 'primary.main' : '#EDECF0', position: 'relative', cursor: 'pointer' }}>
              {book.id === activeLedgerId && <Typography sx={{ position: 'absolute', top: 10, right: 12, bgcolor: 'primary.main', color: '#fff', fontSize: '0.5625rem', px: 1, py: 0.25, borderRadius: 1, fontWeight: 600 }}>当前</Typography>}
              <Typography sx={{ fontSize: '1.75rem', mb: 1.25 }}>{book.icon || '📒'}</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', mb: 0.5 }}>{book.name}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                <Typography sx={{ fontSize: '0.625rem', color: '#A5A2AD' }}>{book.created_at?.slice(0, 10)} 创建</Typography>
                <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>{book.currency}</Typography>
              </Box>
              <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                <Button size="small" variant="outlined" onClick={() => openEdit(book)} sx={{ minWidth: 0, px: 1, fontSize: '0.6875rem' }}>编辑</Button>
                <Button size="small" variant="outlined" onClick={() => handleMove(index, -1)} disabled={index === 0} sx={{ minWidth: 0, px: 1, fontSize: '0.6875rem' }}>上移</Button>
                <Button size="small" variant="outlined" onClick={() => handleMove(index, 1)} disabled={index === ledgers.length - 1} sx={{ minWidth: 0, px: 1, fontSize: '0.6875rem' }}>下移</Button>
                <Button size="small" color="error" variant="text" onClick={() => handleDelete(book)} sx={{ minWidth: 0, px: 1, fontSize: '0.6875rem' }}>删除</Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)', color: '#fff', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700 }}>{editingLedger ? '编辑账本' : '新建账本'}</Typography>
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
          <Button variant="contained" onClick={handleSave} disabled={!name.trim() || saving} sx={{ borderRadius: 4, px: 3, boxShadow: 'none', textTransform: 'none' }}>{saving ? '保存中...' : '保存'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
