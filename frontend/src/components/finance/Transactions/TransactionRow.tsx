'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import { MarkerIcon } from '@/components/shared/MarkerPicker';
import type { TransactionOut } from '@/lib/financeTypes';
import SubTransaction from './SubTransaction';

interface TransactionRowProps {
  transaction: TransactionOut;
}

export default function TransactionRow({ transaction }: TransactionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasSubs = (transaction.split_items && transaction.split_items.length > 0) || (transaction.children && transaction.children.length > 0);
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';
  const amount = Number(transaction.amount);
  const amountColor = isIncome ? '#10B981' : '#EF4444';
  const amountPrefix = isIncome ? '+' : '-';
  const iconBg = isIncome ? '#D1FAE5' : isExpense ? '#FEE2E2' : '#DBEAFE';

  // Determine sub-items: either split_items or children
  const subItems = transaction.split_items || [];
  const childItems = transaction.children || [];
  const allSubs = [...subItems, ...childItems];

  return (
    <>
      <Box
        onClick={() => hasSubs && setExpanded(!expanded)}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2, px: 2.25, cursor: hasSubs ? 'pointer' : 'default', transition: 'background 0.1s', '&:hover': { bgcolor: '#FAFAFC' }, ...(hasSubs && expanded && { bgcolor: '#FAFAFC' }) }}
      >
        <Box sx={{ width: 38, height: 38, borderRadius: 2.5, bgcolor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.0625rem', flexShrink: 0 }}>
          {transaction.category ? (
            <MarkerIcon type={transaction.category.icon_type} value={transaction.category.icon_value} size={20} />
          ) : (
            <MarkerIcon type="emoji" value="💸" size={20} />
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: 'text.primary' }}>{transaction.category?.name || '未分类'}</Typography>
            {hasSubs && <Typography sx={{ fontSize: '0.5625rem', color: '#9CA3AF', fontWeight: 400 }}>{expanded ? '▲' : '▼'}</Typography>}
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: '#4B5563', mt: 0.25 }}>{transaction.note || ''}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.375 }}>
            <Typography sx={{ fontSize: '0.625rem', color: '#9CA3AF' }}>
              {transaction.occurred_at?.slice(5) || ''} · {transaction.account?.name || ''}
            </Typography>
            {transaction.tags?.map((tag) => (
              <Typography key={tag.id} sx={{ fontSize: '0.5625rem', bgcolor: '#EEECFF', color: '#6D5DFC', px: 0.875, py: 0.125, borderRadius: 1 }}>{tag.name}</Typography>
            ))}
            {hasSubs && <Typography sx={{ fontSize: '0.5625rem', bgcolor: '#F3F4F6', color: '#636068', px: 0.875, py: 0.125, borderRadius: 1 }}>{allSubs.length} 子单</Typography>}
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, color: amountColor, flexShrink: 0, textAlign: 'right', minWidth: 80 }}>
          {amountPrefix}¥{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Typography>
      </Box>

      {hasSubs && (
        <Collapse in={expanded}>
          <Box sx={{ bgcolor: '#F9FAFB', borderTop: '1px solid', borderColor: '#F3F4F6' }}>
            {allSubs.map((sub, i) => {
              const subAmount = Number('amount' in sub ? sub.amount : 0);
              const subNote = 'note' in sub ? (sub.note || '') : '';
              return (
                <SubTransaction key={i} note={subNote} amount={subAmount} isLast={i === allSubs.length - 1} />
              );
            })}
          </Box>
        </Collapse>
      )}
    </>
  );
}
