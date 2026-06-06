import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import { MarkerIcon } from '@/components/shared/MarkerPicker';
import type { CategoryDataItem } from '@/lib/financeTypes';

interface CategoryDonutProps {
  data: CategoryDataItem[];
}

const DONUT_CHART_SIZE = 120;
const DONUT_INNER_RADIUS = 28;
const DONUT_OUTER_RADIUS = 54;
const DONUT_CENTER = DONUT_CHART_SIZE / 2;

export default function CategoryDonut({ data }: CategoryDonutProps) {
  const total = data.reduce((sum, d) => sum + Number(d.total), 0);

  const chartData = data.map((d) => ({
    id: d.category_name,
    value: Number(d.total),
    color: d.color,
  }));

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3.5, p: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid', borderColor: '#EDECF0' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>📊 分类支出占比</Typography>
        <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', bgcolor: '#F5F6FA', px: 1.25, py: 0.375, borderRadius: 1.5 }}>本月</Typography>
      </Box>
      {data.length === 0 ? (
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center', py: 4 }}>暂无分类数据</Typography>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.75, sm: 2 } }}>
          <Box sx={{ width: DONUT_CHART_SIZE, height: DONUT_CHART_SIZE, flex: '0 0 auto', position: 'relative' }}>
            <PieChart
              hideLegend
              series={[{ data: chartData, innerRadius: DONUT_INNER_RADIUS, outerRadius: DONUT_OUTER_RADIUS, paddingAngle: 1, cornerRadius: 2, cx: DONUT_CENTER, cy: DONUT_CENTER }]}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              width={DONUT_CHART_SIZE} height={DONUT_CHART_SIZE}
              sx={{ width: DONUT_CHART_SIZE, height: DONUT_CHART_SIZE }}
            />
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.1 }}>¥{total.toLocaleString()}</Typography>
              <Typography sx={{ fontSize: '0.5625rem', color: 'text.secondary' }}>总支出</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875, flex: 1, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
            {data.map((d) => (
              <Box key={d.category_name} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.6875rem' }}>
                <Box sx={{ width: 10, height: 10, bgcolor: d.color, borderRadius: 0.5, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MarkerIcon type={d.category_icon_type} value={d.category_icon} size={14} />
                  <Typography noWrap sx={{ minWidth: 0, fontSize: '0.6875rem', color: 'text.primary' }}>
                    {d.category_name}
                  </Typography>
                </Box>
                <Typography sx={{ flexShrink: 0, fontSize: '0.6875rem', color: 'text.secondary', fontWeight: 500 }}>¥{Number(d.total).toLocaleString()}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
