'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { BarChart } from '@mui/x-charts/BarChart';
import type { DashboardSummary, StatsResponse } from '@/lib/financeTypes';
import { CARD_DEFINITIONS } from '../constants';

interface MonthlyOverviewCardProps {
  stats: StatsResponse | null;
  dashboard: DashboardSummary | null;
  hasLedger: boolean;
  loading: boolean;
  isManageMode: boolean;
  onDelete: () => void;
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export default function MonthlyOverviewCard({
  stats,
  dashboard,
  hasLedger,
  isManageMode,
}: MonthlyOverviewCardProps) {
  const def = CARD_DEFINITIONS.monthly;
  const hasData = hasLedger && stats && stats.trend_data && stats.trend_data.length > 0;
  const monthIncome = dashboard ? Number(dashboard.month_income) : 0;
  const monthExpense = dashboard ? Number(dashboard.month_expense) : 0;
  const monthBalance = monthIncome - monthExpense;

  const dataset = hasData
    ? stats.trend_data.map((d) => ({
        month: d.month,
        income: Number(d.income),
        expense: Number(d.expense),
      }))
    : [];

  const now = new Date();
  const currentLabel = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: 'inherit',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1.5px solid',
        borderColor: isManageMode ? 'primary.main' : 'divider',
        p: 2.5,
        transition: 'all 0.15s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 10px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
        },
      }}
    >
      {/* 头部 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: def.iconBg,
            color: def.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ChartIcon />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary' }}>
            {def.label}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {currentLabel} · 月度收支概览
          </Typography>
        </Box>
        {/* 图例 */}
        {hasData && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, bgcolor: '#10B981', borderRadius: 0.25 }} />
              <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>收入</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, bgcolor: '#EF4444', borderRadius: 0.25 }} />
              <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>支出</Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* 图表区域 */}
      <Box sx={{ px: { xs: 0, md: 2 }, pt: 2, pb: 1 }}>
        {hasData ? (
          <BarChart
            dataset={dataset}
            xAxis={[{ scaleType: 'band', dataKey: 'month', tickLabelStyle: { fontSize: 10, fill: '#636068' } }]}
            yAxis={[{ tickLabelStyle: { fontSize: 10, fill: '#636068' }, tickMinStep: 5000 }]}
            series={[
              { dataKey: 'income', color: '#10B981', label: '收入' },
              { dataKey: 'expense', color: '#EF4444', label: '支出' },
            ]}
            height={180}
            borderRadius={4}
            margin={{ top: 8, right: 16, bottom: 24, left: 40 }}
          />
        ) : (
          <Box sx={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hasLedger ? (
              <Skeleton variant="rectangular" width="100%" height={160} sx={{ borderRadius: 2 }} />
            ) : (
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                创建账本并记录交易后，这里将显示收支趋势
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* 底部统计行 */}
      {hasLedger && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            mt: 1.5,
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#10B981' }}>
              ¥{monthIncome.toLocaleString()}
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>本月收入</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#EF4444' }}>
              -¥{monthExpense.toLocaleString()}
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>本月支出</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: monthBalance >= 0 ? '#10B981' : '#EF4444',
              }}
            >
              {monthBalance >= 0 ? '+' : '-'}¥{Math.abs(monthBalance).toLocaleString()}
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>本月结余</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
