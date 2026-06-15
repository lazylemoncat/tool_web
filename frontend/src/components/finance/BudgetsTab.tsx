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
import type { BudgetOut } from '@/lib/financeTypes';

interface BudgetsTabProps {
  budgets: BudgetOut[];
  activeLedgerId: number | null;
  onRefresh: () => void | Promise<unknown>;
}

function getProgressColor(pct: number): string {
  if (pct > 100) return '#EF4444';
  if (pct > 70) return '#F59E0B';
  return '#10B981';
}

function getRRuleLabel(rrule: string | null): string {
  if (!rrule) return '一次性';
  if (rrule.includes('FREQ=WEEKLY')) return '每周';
  if (rrule.includes('FREQ=MONTHLY')) return '每月';
  if (rrule.includes('FREQ=YEARLY')) return '每年';
  return '自定义';
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function BudgetsTab({ budgets, activeLedgerId, onRefresh }: BudgetsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetOut | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [rrule, setRrule] = useState('FREQ=MONTHLY');
  const [alertThreshold, setAlertThreshold] = useState(100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draggedBudgetId, setDraggedBudgetId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetOut | null>(null);

  const resetForm = () => {
    setEditingBudget(null);
    setName('');
    setAmount('');
    setRrule('FREQ=MONTHLY');
    setAlertThreshold(100);
    setError('');
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (budget: BudgetOut) => {
    setEditingBudget(budget);
    setName(budget.name);
    setAmount(String(budget.amount));
    setRrule(budget.rrule ?? '');
    setAlertThreshold(budget.alert_threshold);
    setError('');
    setDialogOpen(true);
  };
  const handleClose = () => { setDialogOpen(false); resetForm(); };

  const handleSave = async () => {
    setError('');
    if (!name.trim() || !amount) return;
    if (!activeLedgerId) { setError('未选择账本'); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), amount, rrule: rrule || null, alert_threshold: alertThreshold };
      if (editingBudget) {
        await api.updateBudget(editingBudget.id, payload);
      } else {
        await api.createBudget({ ledger_id: activeLedgerId, ...payload, sort_order: budgets.length });
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

  const handleDelete = (budget: BudgetOut) => {
    setDeleteTarget(budget);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteBudget(deleteTarget.id);
      setDeleteTarget(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleMove = async (from: number, to: number) => {
    if (!activeLedgerId) return;
    const ordered = moveItem(budgets, from, to);
    await api.reorderBudgets(activeLedgerId, ordered.map((budget, index) => ({ id: budget.id, sort_order: index })));
    await onRefresh();
  };

  const handleDrop = async (targetId: number) => {
    if (draggedBudgetId === null || draggedBudgetId === targetId) return;
    const from = budgets.findIndex((budget) => budget.id === draggedBudgetId);
    const to = budgets.findIndex((budget) => budget.id === targetId);
    setDraggedBudgetId(null);
    if (from < 0 || to < 0) return;
    try {
      await handleMove(from, to);
    } catch (err) {
      setError(err instanceof Error ? err.message : '排序失败');
    }
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>预算管理</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>新建、编辑、删除和排序预算</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={openCreate}
          sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}>
          + 新建预算
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
      {budgets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>💰</Typography>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>暂无预算</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>点击&quot;新建预算&quot;开始设置</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
          {budgets.map((b) => {
            const used = Number(b.current_spent || 0);
            const total = Number(b.amount);
            const pct = b.progress_pct ?? (total > 0 ? Math.min((used / total) * 100, 100) : 0);
            const barColor = getProgressColor(pct);
            const remaining = total - used;
            return (
              <Box
                key={b.id}
                draggable
                onDragStart={() => setDraggedBudgetId(b.id)}
                onDragEnd={() => setDraggedBudgetId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(b.id)}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 3.5,
                  p: 2.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: '1px solid',
                  borderColor: draggedBudgetId === b.id ? 'primary.main' : 'divider',
                  cursor: 'grab',
                  opacity: draggedBudgetId === b.id ? 0.55 : 1,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.25, gap: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>{b.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', bgcolor: 'action.hover', px: 1, py: 0.25, borderRadius: 1 }}>{getRRuleLabel(b.rrule)}</Typography>
                    <Tooltip title="排序手柄"><IconButton size="small" sx={{ width: 24, height: 24, fontSize: '0.75rem', cursor: 'grab' }}>⋮⋮</IconButton></Tooltip>
                    <Tooltip title="编辑"><IconButton size="small" onClick={() => openEdit(b)} sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>✎</IconButton></Tooltip>
                    <Tooltip title="删除"><IconButton size="small" onClick={() => handleDelete(b)} sx={{ width: 24, height: 24, fontSize: '0.75rem', color: '#EF4444' }}>×</IconButton></Tooltip>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: barColor }}>¥{used.toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mt: 0.5 }}>预算 ¥{total.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ height: 7, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden', mb: 0.5 }}>
                  <Box sx={{ width: `${Math.min(pct, 100)}%`, height: '100%', bgcolor: barColor, borderRadius: 4 }} />
                </Box>
                <Typography sx={{ fontSize: '0.625rem', color: barColor }}>
                  {remaining >= 0 ? `剩余 ¥${remaining.toLocaleString()} · ${Math.round(pct)}% 已使用` : `超支 ¥${Math.abs(remaining).toLocaleString()} · ${Math.round(pct)}%`}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        <DialogHeader title={editingBudget ? '编辑预算' : '新建预算'} onClose={handleClose} />
        <DialogContent sx={{ pt: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
          <TextField fullWidth label="名称" size="small" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} autoFocus />
          <TextField fullWidth label="金额" size="small" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} sx={{ mb: 2 }} />
          <TextField select fullWidth label="周期" size="small" value={rrule} onChange={(e) => setRrule(e.target.value)} sx={{ mb: 2 }}>
            <MenuItem value="FREQ=WEEKLY">每周</MenuItem>
            <MenuItem value="FREQ=MONTHLY">每月</MenuItem>
            <MenuItem value="FREQ=YEARLY">每年</MenuItem>
            <MenuItem value="">一次性</MenuItem>
          </TextField>
          <TextField select fullWidth label="超支提醒阈值" size="small" value={String(alertThreshold)} onChange={(e) => setAlertThreshold(Number(e.target.value))}>
            {[50, 75, 80, 90, 100].map((v) => <MenuItem key={v} value={v}>{v}%</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="text" onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>取消</Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim() || !amount || saving} sx={{ borderRadius: 4, px: 3, boxShadow: 'none', textTransform: 'none' }}>{editingBudget ? '保存' : '创建'}</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除预算"
        message={deleteTarget ? `确定删除预算「${deleteTarget.name}」吗？` : ''}
        confirmLabel="删除"
        cancelLabel="取消"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
