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
import Tooltip from '@mui/material/Tooltip';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import DialogHeader from '@/components/shared/DialogHeader';
import * as api from '@/lib/api';
import type { LedgerOut } from '@/lib/financeTypes';

interface BooksTabProps {
  ledgers: LedgerOut[];
  activeLedgerId: number | null;
  onSelect: (id: number) => void;
  onRefresh: () => void | Promise<unknown>;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function BooksTab({ ledgers, activeLedgerId, onSelect, onRefresh }: BooksTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState<LedgerOut | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📒');
  const [currency, setCurrency] = useState('CNY');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draggedLedgerId, setDraggedLedgerId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LedgerOut | null>(null);

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

  const handleDelete = (ledger: LedgerOut) => {
    setDeleteTarget(ledger);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteLedger(deleteTarget.id);
      setDeleteTarget(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleReorder = async (from: number, to: number) => {
    const ordered = moveItem(ledgers, from, to);
    if (ordered === ledgers) return;
    await api.reorderLedgers(ordered.map((ledger, i) => ({ id: ledger.id, sort_order: i })));
    await onRefresh();
  };

  const handleDrop = async (targetId: number) => {
    if (draggedLedgerId === null || draggedLedgerId === targetId) return;
    const from = ledgers.findIndex((ledger) => ledger.id === draggedLedgerId);
    const to = ledgers.findIndex((ledger) => ledger.id === targetId);
    setDraggedLedgerId(null);
    if (from < 0 || to < 0) return;
    try {
      await handleReorder(from, to);
    } catch (err) {
      setError(err instanceof Error ? err.message : '排序失败');
    }
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>账本管理</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>新增、重命名、删除并调整账本顺序</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={openCreate}
          sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}>
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
          {ledgers.map((book) => (
            <Box
              key={book.id}
              draggable
              onClick={() => onSelect(book.id)}
              onDragStart={() => setDraggedLedgerId(book.id)}
              onDragEnd={() => setDraggedLedgerId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(book.id)}
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 3.5,
                p: 2.5,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: book.id === activeLedgerId ? '2px solid' : '1px solid',
                borderColor: draggedLedgerId === book.id ? 'primary.main' : book.id === activeLedgerId ? 'primary.main' : 'divider',
                position: 'relative',
                cursor: 'grab',
                opacity: draggedLedgerId === book.id ? 0.55 : 1,
              }}
            >
              {book.id === activeLedgerId && <Typography sx={{ position: 'absolute', top: 10, right: 12, bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: '0.5625rem', px: 1, py: 0.25, borderRadius: 1, fontWeight: 600 }}>当前</Typography>}
              <Typography sx={{ fontSize: '1.75rem', mb: 1.25 }}>{book.icon || '📒'}</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', mb: 0.5 }}>{book.name}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>{book.created_at?.slice(0, 10)} 创建</Typography>
                <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>{book.currency}</Typography>
              </Box>
              <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                <Tooltip title="排序手柄">
                  <IconButton size="small" sx={{ width: 28, height: 28, cursor: 'grab', fontSize: '0.875rem' }}>⋮⋮</IconButton>
                </Tooltip>
                <Button size="small" variant="outlined" onClick={() => openEdit(book)} sx={{ minWidth: 0, px: 1, fontSize: '0.6875rem' }}>编辑</Button>
                <Button size="small" color="error" variant="text" onClick={() => handleDelete(book)} sx={{ minWidth: 0, px: 1, fontSize: '0.6875rem' }}>删除</Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        <DialogHeader title={editingLedger ? '编辑账本' : '新建账本'} onClose={handleClose} />
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
      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除账本"
        message={deleteTarget ? `确定删除账本“${deleteTarget.name}”？账本下的数据也会被删除。` : ''}
        confirmLabel="删除"
        cancelLabel="取消"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
