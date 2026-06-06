'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { MarkerIcon } from '@/components/shared/MarkerPicker';
import * as api from '@/lib/api';
import type { AccountOut, CategoryOut, FinanceTagOut, FinanceEventOut, TransactionOut } from '@/lib/financeTypes';

interface TransactionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  accounts: AccountOut[];
  categories: CategoryOut[];
  tags: FinanceTagOut[];
  events: FinanceEventOut[];
  activeLedgerId: number | null;
  editTx: TransactionOut | null;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

export default function TransactionFormDialog({
  open, onClose, onSaved, accounts, categories, tags, events, activeLedgerId, editTx,
}: TransactionFormDialogProps) {
  const isEdit = !!editTx;
  const [formType, setFormType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [eventId, setEventId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editTx) {
      setFormType(editTx.type as 'expense' | 'income' | 'transfer');
      setAmount(Number(editTx.amount).toString());
      setNote(editTx.note || '');
      setAccountId(editTx.account_id);
      setCategoryId(editTx.category_id || '');
      setTagIds(editTx.tags?.map((t) => t.id) || []);
      setEventId(editTx.event_id || '');
    } else {
      setFormType('expense'); setAmount(''); setNote('');
      setAccountId(accounts[0]?.id || '');
      setCategoryId(''); setTagIds([]); setEventId('');
    }
  }, [editTx, open, accounts]);

  const handleSave = async () => {
    if (!amount || !accountId || !activeLedgerId) return;
    setSaving(true);
    try {
      const body = {
        ledger_id: activeLedgerId,
        account_id: Number(accountId),
        type: formType,
        amount,
        note: note || null,
        category_id: categoryId ? Number(categoryId) : null,
        tag_ids: tagIds,
        event_id: eventId ? Number(eventId) : null,
      };
      if (isEdit) {
        await api.updateTransaction(editTx!.id, body);
      } else {
        await api.createTransaction(body);
      }
      onSaved();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
      <Box sx={{ background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)', color: '#fff', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: '1.25rem' }}>💰</Typography>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700 }}>{isEdit ? '编辑交易' : '记一笔'}</Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 2.5, pb: 0 }}>
        {/* Type Toggle */}
        <Box sx={{ display: 'flex', gap: 0.75, mb: 2.5 }}>
          {([{ key: 'expense' as const, label: '支出', emoji: '💸' }, { key: 'income' as const, label: '收入', emoji: '💰' }, { key: 'transfer' as const, label: '转账', emoji: '🔄' }]).map((t) => (
            <Box key={t.key} onClick={() => setFormType(t.key)}
              sx={{ flex: 1, py: 1, textAlign: 'center', borderRadius: 2, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', bgcolor: formType === t.key ? 'primary.main' : 'action.hover', color: formType === t.key ? '#fff' : 'text.secondary', transition: 'all 0.15s', '&:hover': { bgcolor: formType === t.key ? 'primary.main' : 'action.selected' } }}>
              {t.emoji} {t.label}
            </Box>
          ))}
        </Box>

        {/* Amount */}
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', mb: 0.5, fontWeight: 600 }}>金额</Typography>
        <TextField fullWidth value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" size="medium"
          slotProps={{ input: { sx: { fontSize: '1.75rem', fontWeight: 700, height: 56, fontFamily: 'Plus Jakarta Sans, sans-serif' } } }} sx={{ mb: 1.5 }} />

        <Box sx={{ display: 'flex', gap: 0.75, mb: 2.5, flexWrap: 'wrap' }}>
          {QUICK_AMOUNTS.map((n) => (
            <Typography key={n} onClick={() => setAmount(String(n))}
              sx={{ px: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.6875rem', fontWeight: 600, bgcolor: amount === String(n) ? 'primary.main' : 'action.hover', color: amount === String(n) ? '#fff' : 'text.secondary', cursor: 'pointer', '&:hover': { bgcolor: amount === String(n) ? 'primary.main' : 'action.selected' } }}>
              ¥{n}
            </Typography>
          ))}
        </Box>

        {/* Account + Category */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <TextField select fullWidth size="small" label="账户" value={accountId} onChange={(e) => setAccountId(Number(e.target.value))}>
            {accounts.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
          </TextField>
          <TextField select fullWidth size="small" label="分类" value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}>
            <MenuItem value="">未分类</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  <MarkerIcon type={c.icon_type} value={c.icon_value} size={16} />
                  {c.name}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Event */}
        <TextField select fullWidth size="small" label="关联事件" value={eventId} onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : '')} sx={{ mb: 2 }}>
          <MenuItem value="">无</MenuItem>
          {events.map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
        </TextField>

        {/* Note */}
        <TextField fullWidth multiline minRows={2} size="small" label="备注" value={note} onChange={(e) => setNote(e.target.value)} placeholder="添加备注..." sx={{ mb: 2 }} />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="text" onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8125rem', textTransform: 'none' }}>取消</Button>
        <Button variant="contained" onClick={handleSave} disabled={!amount || !accountId || saving}
          sx={{ borderRadius: 4, px: 3, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}>
          {isEdit ? '更新' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
