import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import { MarkerIcon } from '@/components/shared/MarkerPicker';
import type { TransactionOut } from '@/lib/financeTypes';

interface RecentTransactionsProps {
  transactions: TransactionOut[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 5);

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3.5, p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>最近交易</Typography>
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', bgcolor: 'action.hover', px: 1.25, py: 0.375, borderRadius: 1.5 }}>最近 5 笔</Typography>
      </Box>
      {recent.length === 0 ? (
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center', py: 3 }}>暂无交易</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {recent.map((tx, i) => {
            const isIncome = tx.type === 'income';
            const amount = Number(tx.amount);
            return (
              <Box key={tx.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: i < recent.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                <Box sx={(theme) => ({ width: 32, height: 32, borderRadius: 2, bgcolor: alpha(isIncome ? theme.palette.success.main : theme.palette.error.main, theme.palette.mode === 'dark' ? 0.22 : 0.16), color: isIncome ? 'success.main' : 'error.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9375rem', flexShrink: 0 })}>
                  {tx.category ? (
                    <MarkerIcon type={tx.category.icon_type} value={tx.category.icon_value} size={18} />
                  ) : (
                    <MarkerIcon type="emoji" value={isIncome ? '💰' : '💸'} size={18} />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary' }}>{tx.category?.name || '未分类'}</Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>{tx.note || ''}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right', minWidth: 48 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{tx.occurred_at?.slice(5, 10) || ''}</Typography>
                  <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>{tx.account?.name || ''}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: isIncome ? 'success.main' : 'error.main', minWidth: 72, textAlign: 'right' }}>
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
