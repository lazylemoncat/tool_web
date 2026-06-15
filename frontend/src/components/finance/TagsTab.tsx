'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import DialogHeader from '@/components/shared/DialogHeader';
import * as api from '@/lib/api';
import type { FinanceTagOut } from '@/lib/financeTypes';

interface TagsTabProps {
  tags: FinanceTagOut[];
  activeLedgerId: number | null;
  onRefresh: () => void | Promise<unknown>;
}

const TAG_BG_COLORS = ['#E8E0FF', '#D1FAE5', '#FEE2E2', '#DBEAFE', '#FEF3C7', '#EDE9FE'];

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function TagsTab({ tags, activeLedgerId, onRefresh }: TagsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<FinanceTagOut | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draggedTagId, setDraggedTagId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinanceTagOut | null>(null);

  const resetForm = () => { setEditingTag(null); setName(''); setError(''); };

  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (tag: FinanceTagOut) => { setEditingTag(tag); setName(tag.name); setError(''); setDialogOpen(true); };
  const handleClose = () => { setDialogOpen(false); resetForm(); };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) return;
    if (!activeLedgerId) { setError('未选择账本'); return; }
    setSaving(true);
    try {
      if (editingTag) {
        await api.updateFinanceTag(editingTag.id, { name: name.trim() });
      } else {
        await api.createFinanceTag({ ledger_id: activeLedgerId, name: name.trim(), sort_order: tags.length });
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

  const handleDelete = (tag: FinanceTagOut) => {
    setDeleteTarget(tag);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteFinanceTag(deleteTarget.id);
      setDeleteTarget(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleMove = async (from: number, to: number) => {
    if (!activeLedgerId) return;
    const ordered = moveItem(tags, from, to);
    await api.reorderFinanceTags(activeLedgerId, ordered.map((tag, index) => ({ id: tag.id, sort_order: index })));
    await onRefresh();
  };

  const handleDrop = async (targetId: number) => {
    if (draggedTagId === null || draggedTagId === targetId) return;
    const from = tags.findIndex((tag) => tag.id === draggedTagId);
    const to = tags.findIndex((tag) => tag.id === targetId);
    setDraggedTagId(null);
    if (from < 0 || to < 0) return;
    try {
      await handleMove(from, to);
    } catch (err) {
      setError(err instanceof Error ? err.message : '排序失败');
    }
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>标签管理</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>新建、重命名、删除和排序交易标签</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={openCreate}
          sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}>
          + 新建标签
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
      {tags.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>🔖</Typography>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>暂无标签</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>点击&quot;新建标签&quot;开始</Typography>
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tags.map((tag, i) => (
              <Box
                key={tag.id}
                draggable
                onDragStart={() => setDraggedTagId(tag.id)}
                onDragEnd={() => setDraggedTagId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(tag.id)}
                sx={(theme) => ({
                  bgcolor: theme.palette.mode === 'dark' ? alpha(TAG_BG_COLORS[i % TAG_BG_COLORS.length], 0.24) : TAG_BG_COLORS[i % TAG_BG_COLORS.length],
                  color: 'text.primary',
                  px: 1.25,
                  py: 0.625,
                  borderRadius: 2,
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'grab',
                  outline: draggedTagId === tag.id ? `2px solid ${theme.palette.primary.main}` : 'none',
                  opacity: draggedTagId === tag.id ? 0.55 : 1,
                })}
              >
                <Typography component="span" sx={{ fontSize: '0.6875rem', fontWeight: 600 }}>{tag.name}</Typography>
                <Tooltip title="排序手柄">
                  <IconButton size="small" sx={{ width: 20, height: 20, fontSize: '0.75rem', cursor: 'grab' }}>⋮⋮</IconButton>
                </Tooltip>
                <Tooltip title="重命名">
                  <IconButton size="small" onClick={() => openEdit(tag)} sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>✎</IconButton>
                </Tooltip>
                <Tooltip title="删除">
                  <IconButton size="small" onClick={() => handleDelete(tag)} sx={{ width: 20, height: 20, fontSize: '0.75rem', color: '#EF4444' }}>×</IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        <DialogHeader title={editingTag ? '重命名标签' : '新建标签'} onClose={handleClose} />
        <DialogContent sx={{ pt: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
          <TextField fullWidth label="名称" size="small" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="text" onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>取消</Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim() || saving} sx={{ borderRadius: 4, px: 3, boxShadow: 'none', textTransform: 'none' }}>保存</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除标签"
        message={deleteTarget ? `确定删除标签「${deleteTarget.name}」吗？` : ''}
        confirmLabel="删除"
        cancelLabel="取消"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
