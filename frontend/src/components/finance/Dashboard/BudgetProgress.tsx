import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { BudgetSummary } from '@/lib/financeTypes';

interface BudgetProgressProps {
  budgets: BudgetSummary[];
}

function getProgressColor(pct: number): string {
  if (pct > 100) return '#EF4444';
  if (pct > 70) return '#F59E0B';
  return '#10B981';
}

function getStatusText(used: number, pct: number): string {
  if (pct > 100) return `超支 · ${Math.round(pct)}%`;
  return `剩余 · ${Math.round(pct)}%`;
}

export default function BudgetProgress({ budgets }: BudgetProgressProps) {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3.5, p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: '#EDECF0' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>💰 预算使用率</Typography>
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', bgcolor: '#F5F6FA', px: 1.25, py: 0.375, borderRadius: 1.5 }}>月度预算</Typography>
      </Box>
      {budgets.length === 0 ? (
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center', py: 4 }}>暂无预算数据</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {budgets.map((b) => {
            const used = Number(b.current_spent || 0);
            const total = Number(b.amount);
            const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
            const barColor = getProgressColor(b.progress_pct ?? pct);
            return (
              <Box key={b.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary' }}>{b.name}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>¥{used.toLocaleString()} / ¥{total.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ height: 8, bgcolor: '#F0EFF4', borderRadius: 4, overflow: 'hidden' }}>
                  <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: barColor, borderRadius: 4 }} />
                </Box>
                <Typography sx={{ fontSize: '0.6875rem', color: barColor, mt: 0.5 }}>{getStatusText(used, b.progress_pct ?? pct)}</Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
