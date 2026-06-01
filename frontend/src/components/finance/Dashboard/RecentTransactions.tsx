import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { TransactionOut } from '@/lib/financeTypes';

interface RecentTransactionsProps {
  transactions: TransactionOut[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 5);

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3.5, p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: '#EDECF0' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>最近交易</Typography>
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', bgcolor: '#F5F6FA', px: 1.25, py: 0.375, borderRadius: 1.5 }}>最近 5 笔</Typography>
      </Box>
      {recent.length === 0 ? (
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center', py: 3 }}>暂无交易</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {recent.map((tx, i) => {
            const isIncome = tx.type === 'income';
            const amount = Number(tx.amount);
            return (
              <Box key={tx.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: i < recent.length - 1 ? '1px solid' : 'none', borderColor: '#F3F4F6' }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: isIncome ? '#D1FAE5' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9375rem', flexShrink: 0 }}>
                  {tx.category?.icon || (isIncome ? '💰' : '💸')}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary' }}>{tx.category?.name || '未分类'}</Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: '#4B5563' }}>{tx.note || ''}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right', minWidth: 48 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{tx.occurred_at?.slice(5, 10) || ''}</Typography>
                  <Typography sx={{ fontSize: '0.625rem', color: '#9CA3AF' }}>{tx.account?.name || ''}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: isIncome ? '#10B981' : '#EF4444', minWidth: 72, textAlign: 'right' }}>
                  {isIncome ? '+' : '-'}¥{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
