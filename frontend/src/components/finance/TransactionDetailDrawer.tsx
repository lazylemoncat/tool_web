'use client';

import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import type { TransactionOut } from '@/lib/financeTypes';

interface TransactionDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  transaction: TransactionOut | null;
  onEdit: (tx: TransactionOut) => void;
  onDelete: (id: number) => void;
}

export default function TransactionDetailDrawer({ open, onClose, transaction, onEdit, onDelete }: TransactionDetailDrawerProps) {
  if (!transaction) return null;
  const isIncome = transaction.type === 'income';
  const amount = Number(transaction.amount);
  const amountColor = isIncome ? '#10B981' : '#EF4444';
  const amountPrefix = isIncome ? '+' : '-';
  const hasSubs = transaction.split_items && transaction.split_items.length > 0;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      slotProps={{ paper: { sx: { width: 400, maxWidth: '90vw', borderRadius: 0 } } }}>
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: isIncome ? '#D1FAE5' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              {transaction.category?.icon || '💸'}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'text.primary', mb: 0.25 }}>{transaction.category?.name || '未分类'}</Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>{transaction.note}</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: amountColor }}>
          {amountPrefix}¥{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Typography>
      </Box>

      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
          {[{ label: '日期', value: transaction.occurred_at?.slice(0, 16) || '' }, { label: '账户', value: transaction.account?.name || '' }, { label: '分类', value: transaction.category?.name || '未分类' }, { label: '类型', value: transaction.type === 'income' ? '收入' : transaction.type === 'expense' ? '支出' : '转账' }].map((row) => (
            <Box key={row.label}>
              <Typography sx={{ fontSize: '0.625rem', color: '#A5A2AD', mb: 0.25 }}>{row.label}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.primary', fontWeight: 500 }}>{row.value}</Typography>
            </Box>
          ))}
        </Box>

        {transaction.tags && transaction.tags.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.625rem', color: '#A5A2AD', mb: 0.75 }}>标签</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {transaction.tags.map((tag) => <Typography key={tag.id} sx={{ fontSize: '0.625rem', bgcolor: '#EEECFF', color: '#6D5DFC', px: 1, py: 0.375, borderRadius: 1 }}>{tag.name}</Typography>)}
            </Box>
          </Box>
        )}

        {transaction.note && (
          <Box sx={{ mb: 2.5, bgcolor: '#F9FAFB', borderRadius: 2, p: 1.5 }}>
            <Typography sx={{ fontSize: '0.625rem', color: '#A5A2AD', mb: 0.5 }}>备注</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.primary' }}>{transaction.note}</Typography>
          </Box>
        )}

        {hasSubs && (
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.625rem', color: '#A5A2AD', mb: 0.75 }}>子交易</Typography>
            {transaction.split_items!.map((sub) => (
              <Box key={sub.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid', borderColor: '#F3F4F6', fontSize: '0.75rem' }}>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.primary' }}>{sub.note || ''}</Typography>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#EF4444' }}>-¥{Number(sub.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Divider />
      <Box sx={{ px: 2.5, py: 2, display: 'flex', gap: 1 }}>
        <Button variant="outlined" onClick={onClose} fullWidth sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', color: 'text.secondary', borderColor: 'divider' }}>关闭</Button>
        <Button variant="outlined" onClick={() => onDelete(transaction.id)} fullWidth sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', color: '#EF4444', borderColor: '#FEE2E2' }}>删除</Button>
        <Button variant="contained" onClick={() => { onClose(); onEdit(transaction); }} fullWidth sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', boxShadow: 'none' }}>编辑</Button>
      </Box>
    </Drawer>
  );
}
