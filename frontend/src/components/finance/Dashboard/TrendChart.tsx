import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';
import type { TrendDataItem } from '@/lib/financeTypes';

interface TrendChartProps {
  data: TrendDataItem[];
}

export default function TrendChart({ data }: TrendChartProps) {
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3.5, p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', mb: 1 }}>📈 月度收支趋势</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center', py: 4 }}>暂无趋势数据</Typography>
      </Box>
    );
  }

  const dataset = data.map((d, i) => ({
    month: d.month,
    income: Number(d.income),
    expense: Number(d.expense),
  }));

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3.5, p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>📈 月度收支趋势</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.625rem', color: 'text.secondary' }}>
            <Box sx={{ width: 8, height: 8, bgcolor: '#10B981', borderRadius: 0.25 }} /> 收入
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.625rem', color: 'text.secondary' }}>
            <Box sx={{ width: 8, height: 8, bgcolor: '#EF4444', borderRadius: 0.25 }} /> 支出
          </Box>
          <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', bgcolor: 'action.hover', px: 1.25, py: 0.375, borderRadius: 1.5, ml: 0.5 }}>近 6 个月</Typography>
        </Box>
      </Box>
      <Box sx={{ px: 3, pt: 2 }}>
        <BarChart
          dataset={dataset}
          xAxis={[{ scaleType: 'band', dataKey: 'month', tickLabelStyle: { fontSize: 10, fill: theme.palette.text.secondary } }]}
          yAxis={[{ tickLabelStyle: { fontSize: 10, fill: theme.palette.text.secondary }, tickMinStep: 5000 }]}
          series={[
            { dataKey: 'income', color: '#10B981', label: '收入' },
            { dataKey: 'expense', color: '#EF4444', label: '支出' },
          ]}
          height={180}
          borderRadius={4}
          margin={{ top: 8, right: 16, bottom: 24, left: 40 }}
        />
      </Box>
    </Box>
  );
}
