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
import { ApiError } from '@/lib/api';
import type { AccountOut } from '@/lib/financeTypes';

interface AccountsTabProps {
  accounts: AccountOut[];
  activeLedgerId: number | null;
  onRefresh: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  '借记卡': '#D1FAE5', '信用卡': '#FEE2E2', '现金': '#FEF3C7', '电子钱包': '#E8E0FF', '虚拟账户': '#F0EFF4',
};

const TYPE_ICONS: Record<string, string> = {
  '借记卡': '💳', '信用卡': '💳', '现金': '💵', '电子钱包': '📱', '虚拟账户': '🏦',
};

const ACCOUNT_TYPES = ['借记卡', '信用卡', '现金', '电子钱包', '虚拟账户'];

export default function AccountsTab({ accounts, activeLedgerId, onRefresh }: AccountsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('借记卡');
  const [initialBalance, setInitialBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setType('借记卡');
    setInitialBalance('');
    setError('');
  };

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) return;
    if (!activeLedgerId) {
      setError('未选择账本');
      return;
    }
    setSaving(true);
    try {
      const balance = initialBalance ? Number(initialBalance) : 0;
      await api.createAccount({
        ledger_id: activeLedgerId,
        name: name.trim(),
        type,
        initial_balance: balance,
      });
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '创建账户失败';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: '#F5F6FA', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>账户管理</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#4B5563' }}>管理你的资金账户</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={() => setDialogOpen(true)}
          sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none', bgcolor: '#6D5DFC', '&:hover': { bgcolor: '#5A4DE0' } }}>
          + 新建账户
        </Button>
      </Box>
      {accounts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>🏦</Typography>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>暂无账户</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>点击"新建账户"开始</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2 }}>
          {accounts.map((acc) => {
            const balance = Number(acc.current_balance || acc.initial_balance);
            return (
              <Box key={acc.id} sx={{ bgcolor: 'background.paper', borderRadius: 3.5, p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: '#EDECF0', display: 'flex', alignItems: 'flex-start', gap: 1.75, opacity: acc.archived ? 0.55 : 1 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: TYPE_COLORS[acc.type] || '#F0EFF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 }}>
                  {TYPE_ICONS[acc.type] || '💳'}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: 'text.primary', mb: 0.375 }}>{acc.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                    <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', bgcolor: '#F5F6FA', px: 1, py: 0.25, borderRadius: 1 }}>{acc.type}</Typography>
                    {acc.archived && <Typography sx={{ fontSize: '0.625rem', color: '#F59E0B', bgcolor: '#FFFBEB', px: 1, py: 0.25, borderRadius: 1 }}>已归档</Typography>}
                  </Box>
                  <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, color: balance < 0 ? '#EF4444' : acc.archived ? '#A5A2AD' : 'text.primary', mb: 0.375 }}>¥{balance.toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: '0.625rem', color: '#A5A2AD' }}>初始余额 ¥{Number(acc.initial_balance).toLocaleString()}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)', color: '#fff', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700 }}>新建账户</Typography>
          <IconButton size="small" onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.8)' }}>✕</IconButton>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
          <TextField fullWidth label="名称" size="small" value={name} onChange={(e) => { setName(e.target.value); setError(''); }}
            sx={{ mb: 2 }} autoFocus slotProps={{ htmlInput: { autoComplete: 'off' } }} />
          <TextField select fullWidth label="类型" size="small" value={type} onChange={(e) => setType(e.target.value)} sx={{ mb: 2 }}>
            {ACCOUNT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="初始余额" size="small" type="number" value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            slotProps={{ htmlInput: { step: '0.01', min: '0' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="text" onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>取消</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || saving}
            sx={{ borderRadius: 4, px: 3, boxShadow: 'none', textTransform: 'none', fontWeight: 600 }}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
