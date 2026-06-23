'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { FocusRange, FocusSummaryResponse } from '@/lib/focusTypes';
import { formatDuration } from './focusUtils';

interface FocusOverviewProps {
  range: FocusRange;
  summary: FocusSummaryResponse | null;
  loading: boolean;
  onRangeChange: (range: FocusRange) => void;
  onRefresh: () => void;
}

const RANGE_OPTIONS: { value: FocusRange; label: string }[] = [
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: '7d', label: '最近 7 天' },
  { value: '30d', label: '最近 30 天' },
  { value: 'all', label: '全部' },
];

const HEAT_CELL_SIZE = 20;
const HEAT_CELL_GAP = 5;
const HEATMAP_COLUMNS = 13;
const HEAT_LEVEL_COLORS = ['action.hover', 'primary.light', 'primary.main', 'primary.dark', 'success.dark'];

export default function FocusOverview({
  range,
  summary,
  loading,
  onRangeChange,
  onRefresh,
}: FocusOverviewProps) {
  const maxTrend = Math.max(1, ...(summary?.trend.map((item) => item.focus_seconds) ?? [1]));

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.625rem', color: 'text.primary', mb: 0.5 }}>
            专注数据总览
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            统计专注时长, 连续学习和近期记录
          </Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={onRefresh} sx={{ height: 36 }}>
          刷新
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5, mb: 2, bgcolor: 'background.paper' }}>
        <ToggleButtonGroup
          value={range}
          exclusive
          onChange={(_, value) => value && onRangeChange(value)}
          size="small"
          sx={{ minHeight: 36, flexWrap: 'wrap' }}
        >
          {RANGE_OPTIONS.map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Paper>

      {loading && !summary ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
          <CircularProgress />
        </Box>
      ) : summary ? (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
            <StatCard label="专注时长" value={formatDuration(summary.total_focus_seconds)} sub={`${summary.completed_count} 次完成`} accent />
            <StatCard label="平均单次" value={formatDuration(summary.average_focus_seconds)} sub={`${summary.session_count} 次记录`} />
            <StatCard label="连续学习" value={`${summary.streak_days} 天`} sub={`最长 ${summary.longest_streak_days} 天`} color="success.main" />
            <StatCard label="休息时长" value={formatDuration(summary.rest_seconds)} sub={`暂停 ${formatDuration(summary.pause_seconds)}`} color="warning.main" />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.25fr 1fr' }, gap: 2, mb: 2 }}>
            <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
              <SectionTitle title="趋势" subtitle="按天汇总专注时长" />
              <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, summary.trend.length)}, minmax(28px, 1fr))`, gap: 1, height: 190, alignItems: 'end', mt: 2 }}>
                {summary.trend.map((item) => {
                  const pct = Math.max(4, (item.focus_seconds / maxTrend) * 100);
                  const label = item.date.slice(5).replace('-', '/');
                  return (
                    <Box key={item.date} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 0.75 }}>
                      <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {formatDuration(item.focus_seconds)}
                      </Typography>
                      <Box sx={{ width: '70%', height: `${pct}%`, minHeight: 5, borderRadius: 999, bgcolor: item.focus_seconds === maxTrend ? 'primary.main' : 'primary.light', opacity: item.focus_seconds ? 1 : 0.28, transition: 'height 0.2s' }} />
                      <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>{label}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
              <SectionTitle title="最近记录" subtitle={`${summary.recent_sessions.length} 条`} />
              <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>
                {summary.recent_sessions.length === 0 ? (
                  <Typography sx={{ py: 5, textAlign: 'center', color: 'text.secondary', fontSize: '0.8125rem' }}>
                    暂无专注记录
                  </Typography>
                ) : summary.recent_sessions.slice(0, 6).map((session) => (
                  <Box key={session.id} sx={{ py: 1, display: 'grid', gridTemplateColumns: '1fr auto', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session.abandoned ? '已放弃 · ' : ''}{session.name}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.6875rem' }}>
                        {session.folder_name || '未整理'} · {session.mode === 'pomodoro' ? '番茄钟' : '自由计时'}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 800, color: session.abandoned ? 'text.secondary' : 'primary.main', fontSize: '0.8125rem' }}>
                      {formatDuration(session.focus_seconds)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Box>

          <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: 'background.paper', mb: 2 }}>
            <SectionTitle title="90 天热力图" subtitle="按每日专注时长分级" />
            <Box sx={{ overflowX: 'auto', pt: 2.25, pb: 0.75 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateRows: `repeat(7, ${HEAT_CELL_SIZE}px)`,
                  gridAutoFlow: 'column',
                  gridAutoColumns: `${HEAT_CELL_SIZE}px`,
                  gap: `${HEAT_CELL_GAP}px`,
                  width: 'max-content',
                  minWidth: HEATMAP_COLUMNS * HEAT_CELL_SIZE + (HEATMAP_COLUMNS - 1) * HEAT_CELL_GAP,
                  mx: 'auto',
                }}
              >
                {summary.heatmap.map((item) => (
                  <Box
                    key={item.date}
                    title={`${item.date} · ${item.focus_seconds ? formatDuration(item.focus_seconds) : '无记录'}`}
                    sx={{
                      width: HEAT_CELL_SIZE,
                      height: HEAT_CELL_SIZE,
                      borderRadius: '5px',
                      bgcolor: HEAT_LEVEL_COLORS[item.level] ?? HEAT_LEVEL_COLORS[0],
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <DistributionPanel title="标签分布" items={summary.tag_distribution} />
            <DistributionPanel title="文件夹分布" items={summary.folder_distribution} />
          </Box>
        </>
      ) : null}
    </Box>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
  color = 'primary.main',
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  color?: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        p: 2,
        bgcolor: accent ? 'action.selected' : 'background.paper',
        borderColor: accent ? 'primary.main' : 'divider',
      }}
    >
      <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 700, mb: 0.75 }}>
        {label}
      </Typography>
      <Typography sx={{ color, fontSize: '1.625rem', fontWeight: 800, lineHeight: 1.15 }}>
        {value}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', mt: 0.75 }}>
        {sub}
      </Typography>
    </Paper>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>{title}</Typography>
      {subtitle && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{subtitle}</Typography>}
    </Box>
  );
}

function DistributionPanel({ title, items }: { title: string; items: { name: string; focus_seconds: number; session_count: number }[] }) {
  const maxSeconds = Math.max(1, ...items.map((item) => item.focus_seconds));
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
      <SectionTitle title={title} subtitle={`${items.length} 项`} />
      <Stack spacing={1.25} sx={{ mt: 2 }}>
        {items.length === 0 ? (
          <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary', fontSize: '0.8125rem' }}>
            暂无数据
          </Typography>
        ) : items.slice(0, 8).map((item) => (
          <Box key={item.name}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{item.name}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{formatDuration(item.focus_seconds)}</Typography>
            </Box>
            <Box sx={{ height: 7, borderRadius: 999, bgcolor: 'action.hover', overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${Math.max(4, (item.focus_seconds / maxSeconds) * 100)}%`, bgcolor: 'primary.main', borderRadius: 999 }} />
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
