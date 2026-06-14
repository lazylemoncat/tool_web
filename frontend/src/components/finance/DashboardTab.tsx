'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import StatCard from './Dashboard/StatCard';
import BudgetProgress from './Dashboard/BudgetProgress';
import CategoryDonut from './Dashboard/CategoryDonut';
import TrendChart from './Dashboard/TrendChart';
import RecentTransactions from './Dashboard/RecentTransactions';
import type { LedgerOut, DashboardSummary, StatsResponse } from '@/lib/financeTypes';

interface DashboardTabProps {
  dashboard: DashboardSummary | null;
  stats: StatsResponse | null;
  activeLedger: LedgerOut | null;
  onNewTransaction?: () => void;
}

export default function DashboardTab({ dashboard, stats, activeLedger, onNewTransaction }: DashboardTabProps) {
  const ledgerName = activeLedger?.name || '账本';
  const now = new Date();
  const dateStr = `截至 ${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;

  const totalAssets = dashboard ? Number(dashboard.total_assets) : 0;
  const monthIncome = dashboard ? Number(dashboard.month_income) : 0;
  const monthExpense = dashboard ? Number(dashboard.month_expense) : 0;
  const monthBalance = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? Math.round((monthBalance / monthIncome) * 100) : 0;

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>
            记账仪表盘
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            {ledgerName} · {dateStr}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{ display: 'flex', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            {['周', '月', '年'].map((t) => (
              <Typography key={t} sx={{ px: 1.75, py: 0.625, fontSize: '0.75rem', fontWeight: t === '月' ? 600 : 400, color: t === '月' ? 'primary.contrastText' : 'text.secondary', bgcolor: t === '月' ? 'primary.main' : 'transparent', cursor: 'pointer', '&:not(:last-child)': { borderRight: '1px solid', borderColor: 'divider' } }}>
                {t}
              </Typography>
            ))}
          </Box>
          <Button variant="contained" size="small" onClick={onNewTransaction}
            sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}>
            + 记一笔
          </Button>
          <Button variant="outlined" size="small"
            sx={{ borderRadius: 2, px: 1.5, py: 0.75, fontSize: '0.75rem', fontWeight: 500, textTransform: 'none', color: 'text.secondary', borderColor: 'divider' }}>
            管理仪表盘
          </Button>
        </Box>
      </Box>

      {/* Row 1: 4 Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <StatCard icon="💰" label="总资产" amount={`¥${totalAssets.toLocaleString()}`} delta={`较上月 +¥3,200`} color="text.primary" />
        <StatCard icon="📈" label="本月收入" amount={`+¥${monthIncome.toLocaleString()}`} delta="较上月 +8%" color="#10B981" />
        <StatCard icon="📉" label="本月支出" amount={`-¥${monthExpense.toLocaleString()}`} delta="较上月 -12%" color="#EF4444" />
        <StatCard icon="✅" label="本月结余" amount={`+¥${monthBalance.toLocaleString()}`} delta={`储蓄率 ${savingsRate}%`} color="#6C5CE7" />
      </Box>

      {/* Row 2: Budget + Donut */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <BudgetProgress budgets={dashboard?.budgets || []} />
        <CategoryDonut data={stats?.category_data || []} />
      </Box>

      {/* Row 3: Trend Chart */}
      <Box sx={{ mb: 2 }}>
        <TrendChart data={stats?.trend_data || []} />
      </Box>

      {/* Row 4: Recent Transactions */}
      <Box>
        <RecentTransactions transactions={dashboard?.recent_transactions || []} />
      </Box>
    </Box>
  );
}
