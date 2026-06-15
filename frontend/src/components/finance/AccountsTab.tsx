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
import { alpha } from '@mui/material/styles';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import DialogHeader from '@/components/shared/DialogHeader';
import * as api from '@/lib/api';
import { ApiError } from '@/lib/api';
import type { AccountOut } from '@/lib/financeTypes';

interface AccountsTabProps {
  accounts: AccountOut[];
  activeLedgerId: number | null;
  onRefresh: () => void | Promise<unknown>;
}

const TYPE_COLORS: Record<string, string> = {
  '借记卡': '#D1FAE5', '信用卡': '#FEE2E2', '现金': '#FEF3C7', '电子钱包': '#E8E0FF', '虚拟账户': '#F0EFF4',
};

const TYPE_ICONS: Record<string, string> = {
  '借记卡': '💳', '信用卡': '💳', '现金': '💵', '电子钱包': '📱', '虚拟账户': '🏦',
};

const ACCOUNT_TYPES = ['借记卡', '信用卡', '现金', '电子钱包', '虚拟账户'];

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function AccountsTab({ accounts, activeLedgerId, onRefresh }: AccountsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountOut | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('借记卡');
  const [initialBalance, setInitialBalance] = useState('');
  const [archived, setArchived] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draggedAccountId, setDraggedAccountId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountOut | null>(null);

  const resetForm = () => {
    setEditingAccount(null);
    setName('');
    setType('借记卡');
    setInitialBalance('');
    setArchived(false);
    setError('');
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (account: AccountOut) => {
    setEditingAccount(account);
    setName(account.name);
    setType(account.type || '借记卡');
    setInitialBalance(String(account.initial_balance ?? ''));
    setArchived(Boolean(account.archived));
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) return;
    if (!activeLedgerId) {
      setError('未选择账本');
      return;
    }
    setSaving(true);
    try {
      const balance = initialBalance ? Number(initialBalance) : 0;
      if (editingAccount) {
        await api.updateAccount(editingAccount.id, {
          name: name.trim(),
          type,
          initial_balance: balance,
          archived,
        });
      } else {
        await api.createAccount({
          ledger_id: activeLedgerId,
          name: name.trim(),
          type,
          initial_balance: balance,
          sort_order: accounts.length,
        });
      }
      setDialogOpen(false);
      resetForm();
      await onRefresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '保存账户失败';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (account: AccountOut) => {
    setDeleteTarget(account);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteAccount(deleteTarget.id);
      setDeleteTarget(null);
      await onRefresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '删除账户失败';
      setError(msg);
    }
  };

  const handleReorder = async (from: number, to: number) => {
    if (!activeLedgerId) return;
    const ordered = moveItem(accounts, from, to);
    if (ordered === accounts) return;
    await api.reorderAccounts(activeLedgerId, ordered.map((account, i) => ({ id: account.id, sort_order: i })));
    await onRefresh();
  };

  const handleDrop = async (targetId: number) => {
    if (draggedAccountId === null || draggedAccountId === targetId) return;
    const from = accounts.findIndex((account) => account.id === draggedAccountId);
    const to = accounts.findIndex((account) => account.id === targetId);
    setDraggedAccountId(null);
    if (from < 0 || to < 0) return;
    try {
      await handleReorder(from, to);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '账户排序失败';
      setError(msg);
    }
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>账户管理</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>新增、重命名、删除并调整资金账户顺序</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={openCreate}
          sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}>
          + 新建账户
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
      {accounts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>🏦</Typography>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>暂无账户</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>点击“新建账户”开始</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
          {accounts.map((acc) => {
            const balance = Number(acc.current_balance || acc.initial_balance);
            return (
              <Box
                key={acc.id}
                draggable
                onDragStart={() => setDraggedAccountId(acc.id)}
                onDragEnd={() => setDraggedAccountId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(acc.id)}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 3.5,
                  p: 2.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: '1px solid',
                  borderColor: draggedAccountId === acc.id ? 'primary.main' : 'divider',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.75,
                  cursor: 'grab',
                  opacity: draggedAccountId === acc.id ? 0.55 : acc.archived ? 0.55 : 1,
                }}
              >
                <Box sx={(theme) => ({ width: 40, height: 40, borderRadius: 2.5, bgcolor: theme.palette.mode === 'dark' ? alpha(TYPE_COLORS[acc.type] || theme.palette.primary.main, 0.22) : TYPE_COLORS[acc.type] || '#F0EFF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 })}>
                  {TYPE_ICONS[acc.type] || '💳'}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary', mb: 0.375 }}>{acc.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', bgcolor: 'action.hover', px: 1, py: 0.25, borderRadius: 1 }}>{acc.type}</Typography>
                    {acc.archived && <Typography sx={(theme) => ({ fontSize: '0.625rem', color: 'warning.main', bgcolor: alpha(theme.palette.warning.main, 0.14), px: 1, py: 0.25, borderRadius: 1 })}>已归档</Typography>}
                  </Box>
                  <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, color: balance < 0 ? 'error.main' : acc.archived ? 'text.secondary' : 'text.primary', mb: 0.375 }}>¥{balance.toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', mb: 1 }}>初始余额 ¥{Number(acc.initial_balance).toLocaleString()}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    <Tooltip title="排序手柄">
                      <IconButton size="small" sx={{ width: 28, height: 28, cursor: 'grab', fontSize: '0.875rem' }}>⋮⋮</IconButton>
                    </Tooltip>
                    <Button size="small" variant="outlined" onClick={() => openEdit(acc)} sx={{ minWidth: 0, px: 1, fontSize: '0.6875rem' }}>编辑</Button>
                    <Button size="small" color="error" variant="text" onClick={() => handleDelete(acc)} sx={{ minWidth: 0, px: 1, fontSize: '0.6875rem' }}>删除</Button>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        <DialogHeader title={editingAccount ? '编辑账户' : '新建账户'} onClose={handleClose} />
        <DialogContent sx={{ pt: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
          <TextField fullWidth label="名称" size="small" value={name} onChange={(e) => { setName(e.target.value); setError(''); }}
            sx={{ mb: 2 }} autoFocus slotProps={{ htmlInput: { autoComplete: 'off' } }} />
          <TextField select fullWidth label="类型" size="small" value={type} onChange={(e) => setType(e.target.value)} sx={{ mb: 2 }}>
            {ACCOUNT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="初始余额" size="small" type="number" value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)} sx={{ mb: editingAccount ? 2 : 0 }}
            slotProps={{ htmlInput: { step: '0.01', min: '0' } }} />
          {editingAccount && (
            <TextField select fullWidth label="状态" size="small" value={archived ? 'archived' : 'active'} onChange={(e) => setArchived(e.target.value === 'archived')}>
              <MenuItem value="active">正常</MenuItem>
              <MenuItem value="archived">归档</MenuItem>
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="text" onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>取消</Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim() || saving}
            sx={{ borderRadius: 4, px: 3, boxShadow: 'none', textTransform: 'none', fontWeight: 600 }}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除账户"
        message={deleteTarget ? `确定删除账户“${deleteTarget.name}”？相关流水会受数据库级联规则影响。` : ''}
        confirmLabel="删除"
        cancelLabel="取消"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
