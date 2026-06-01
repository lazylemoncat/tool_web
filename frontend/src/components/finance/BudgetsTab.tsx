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
import type { BudgetOut } from '@/lib/financeTypes';

interface BudgetsTabProps {
  budgets: BudgetOut[];
  activeLedgerId: number | null;
  onRefresh: () => void;
}

function getProgressColor(pct: number): string {
  if (pct > 100) return '#EF4444';
  if (pct > 70) return '#F59E0B';
  return '#10B981';
}

export default function BudgetsTab({ budgets, activeLedgerId, onRefresh }: BudgetsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [rrule, setRrule] = useState('FREQ=MONTHLY');
  const [alertThreshold, setAlertThreshold] = useState(100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => { setName(''); setAmount(''); setRrule('FREQ=MONTHLY'); setAlertThreshold(100); setError(''); };

  const handleCreate = async () => {
    setError('');
    if (!name.trim() || !amount) return;
    if (!activeLedgerId) { setError('未选择账本'); return; }
    setSaving(true);
    try {
      await api.createBudget({ ledger_id: activeLedgerId, name: name.trim(), amount, rrule, alert_threshold: alertThreshold });
      setDialogOpen(false); resetForm(); onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setDialogOpen(false); resetForm(); };

  const handleDelete = async (id: number) => {
    try { await api.deleteBudget(id); onRefresh(); } catch { /* ignore */ }
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: '#F5F6FA', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>预算管理</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#4B5563' }}>设置分类预算上限</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={() => setDialogOpen(true)}
          sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none', bgcolor: '#6D5DFC', '&:hover': { bgcolor: '#5A4DE0' } }}>
          + 新建预算
        </Button>
      </Box>
      {budgets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>💰</Typography>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>暂无预算</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>点击"新建预算"开始设置</Typography>
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
              <Box key={b.id} sx={{ bgcolor: 'background.paper', borderRadius: 3.5, p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: '#EDECF0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.25 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>{b.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', bgcolor: '#F5F6FA', px: 1, py: 0.25, borderRadius: 1 }}>{b.rrule ? '月度' : '一次性'}</Typography>
                    <Typography onClick={() => handleDelete(b.id)} sx={{ fontSize: '0.625rem', color: '#EF4444', cursor: 'pointer', '&:hover': { opacity: 0.7 } }}>删除</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: barColor }}>¥{used.toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mt: 0.5 }}>预算 ¥{total.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ height: 7, bgcolor: '#F0EFF4', borderRadius: 4, overflow: 'hidden', mb: 0.5 }}>
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
        <Box sx={{ background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)', color: '#fff', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700 }}>新建预算</Typography>
          <IconButton size="small" onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.8)' }}>✕</IconButton>
        </Box>
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
          <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || !amount || saving} sx={{ borderRadius: 4, px: 3, boxShadow: 'none', textTransform: 'none' }}>创建</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
