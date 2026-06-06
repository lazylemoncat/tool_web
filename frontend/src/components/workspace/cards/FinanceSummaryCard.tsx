'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { DashboardSummary } from '@/lib/financeTypes';
import { CARD_DEFINITIONS } from '../constants';

interface FinanceSummaryCardProps {
  dashboard: DashboardSummary | null;
  hasLedger: boolean;
  loading: boolean;
  isManageMode: boolean;
  onDelete: () => void;
  onClick: () => void;
}

function FinanceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export default function FinanceSummaryCard({
  dashboard,
  hasLedger,
  isManageMode,
  onClick,
}: FinanceSummaryCardProps) {
  const def = CARD_DEFINITIONS.finance;
  const monthIncome = dashboard ? Number(dashboard.month_income) : null;
  const monthExpense = dashboard ? Number(dashboard.month_expense) : null;
  const totalAssets = dashboard ? Number(dashboard.total_assets) : null;

  return (
    <Box
      component="a"
      onClick={(e: React.MouseEvent) => {
        if (isManageMode) { e.preventDefault(); return; }
        onClick();
      }}
      href="/finance"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        textDecoration: 'none',
        color: 'inherit',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1.5px solid',
        borderColor: isManageMode ? 'primary.main' : 'divider',
        p: 2.5,
        cursor: isManageMode ? 'default' : 'pointer',
        transition: 'all 0.15s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 10px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
        },
      }}
    >
      {/* 图标 */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          bgcolor: def.iconBg,
          color: def.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.5,
          flexShrink: 0,
        }}
      >
        <FinanceIcon />
      </Box>

      {/* 标题 */}
      <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary', mb: 0.5 }}>
        {def.label}
      </Typography>

      {/* 描述 */}
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 1.5, lineHeight: 1.5 }}>
        {def.description}
      </Typography>

      {/* 统计标签 */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 'auto' }}>
        {hasLedger && dashboard ? (
          <>
            <Box
              sx={{
                px: 1.25,
                py: 0.375,
                borderRadius: 999,
                fontSize: '0.6875rem',
                fontWeight: 600,
                bgcolor: '#D1FAE5',
                color: '#065F46',
              }}
            >
              本月收入 +¥{monthIncome?.toLocaleString()}
            </Box>
            <Box
              sx={{
                px: 1.25,
                py: 0.375,
                borderRadius: 999,
                fontSize: '0.6875rem',
                fontWeight: 600,
                bgcolor: '#FEE2E2',
                color: '#991B1B',
              }}
            >
              本月支出 -¥{monthExpense?.toLocaleString()}
            </Box>
            <Box
              sx={{
                px: 1.25,
                py: 0.375,
                borderRadius: 999,
                fontSize: '0.6875rem',
                fontWeight: 600,
                bgcolor: 'action.hover',
                color: 'text.secondary',
              }}
            >
              总资产 ¥{totalAssets?.toLocaleString()}
            </Box>
          </>
        ) : (
          <Box
            component="span"
            sx={{
              px: 1.25,
              py: 0.375,
              borderRadius: 999,
              fontSize: '0.6875rem',
              fontWeight: 600,
              bgcolor: 'action.hover',
              color: 'text.secondary',
            }}
          >
            {hasLedger ? '加载中...' : '创建第一个账本'}
          </Box>
        )}
      </Box>
    </Box>
  );
}
