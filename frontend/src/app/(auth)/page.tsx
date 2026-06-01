'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { apiRequest, getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { DashboardSummary, TodoListResponse } from '@/lib/types';

interface HomeStats {
  activeTodos: number;
  finance: DashboardSummary | null;
}

type CardKey = 'todo' | 'finance' | 'monthly' | 'recent' | 'calendar' | 'settings' | 'help';

interface DashboardCard {
  key: CardKey;
  title: string;
  description: string;
  href?: string;
  size: 'medium' | 'wide';
  icon: React.ReactNode;
}

const dashboardCards: DashboardCard[] = [
  {
    key: 'todo',
    title: 'TODO',
    description: '管理任务, 文件夹, 优先级和标签.',
    href: '/todo',
    size: 'medium',
    icon: <CheckCircleRoundedIcon />,
  },
  {
    key: 'finance',
    title: '记账',
    description: '记录收入支出, 查看月度收支.',
    href: '/finance',
    size: 'medium',
    icon: <AttachMoneyRoundedIcon />,
  },
  {
    key: 'monthly',
    title: '本月记账',
    description: '2026 年 6 月 · 月度收支概览',
    href: '/finance',
    size: 'wide',
    icon: <AttachMoneyRoundedIcon />,
  },
  {
    key: 'recent',
    title: '最近任务',
    description: '查看近期需要处理的重点事项.',
    href: '/todo',
    size: 'medium',
    icon: <CheckCircleRoundedIcon />,
  },
  {
    key: 'calendar',
    title: '日历',
    description: '查看截止日期和即将开始的事项.',
    size: 'medium',
    icon: <CalendarMonthRoundedIcon />,
  },
  {
    key: 'settings',
    title: '设置',
    description: '管理账号, 外观和偏好.',
    href: '/settings',
    size: 'medium',
    icon: <SettingsRoundedIcon />,
  },
  {
    key: 'help',
    title: '帮助',
    description: '查看功能文档和使用指南.',
    href: '/help',
    size: 'medium',
    icon: <HelpOutlineRoundedIcon />,
  },
];

const defaultVisibleCards: CardKey[] = ['todo', 'finance', 'monthly', 'recent', 'calendar', 'settings', 'help'];

const monthlyBars = [
  { month: '1月', income: 9000, expense: 6300 },
  { month: '2月', income: 9500, expense: 6800 },
  { month: '3月', income: 9200, expense: 6100 },
  { month: '4月', income: 9700, expense: 7000 },
  { month: '5月', income: 9400, expense: 6500 },
  { month: '6月', income: 8500, expense: 5600, active: true },
];

function cardMetric(key: CardKey, loading: boolean, stats: HomeStats) {
  if (loading) return '加载中';
  if (key === 'todo') return `${stats.activeTodos} 个待办`;
  if (key === 'finance') return stats.finance ? '已连接账本' : '暂无账本';
  if (key === 'monthly') {
    const income = Number(stats.finance?.month_income ?? 0);
    const expense = Number(stats.finance?.month_expense ?? 0);
    return `结余 ${formatMoney(income - expense)}`;
  }
  if (key === 'recent') return `${stats.activeTodos} 个待处理`;
  return '已启用';
}

export default function HomePage() {
  const [stats, setStats] = useState<HomeStats>({ activeTodos: 0, finance: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [managementMode, setManagementMode] = useState(false);
  const [visibleCards, setVisibleCards] = useState<CardKey[]>(defaultVisibleCards);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<CardKey | null>(null);
  const [navDialogOpen, setNavDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [startPage, setStartPage] = useState('home');

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      setLoading(true);
      setError('');
      try {
        const todos = await apiRequest<TodoListResponse>('/api/v1/todos?status=active&limit=1');
        const ledgers = await apiRequest<{ id: number }[]>('/api/v1/finance/ledgers');
        const finance = ledgers[0]
          ? await apiRequest<DashboardSummary>(`/api/v1/finance/dashboard?ledger_id=${ledgers[0].id}`)
          : null;
        if (!cancelled) setStats({ activeTodos: todos.total, finance });
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleDashboardCards = useMemo(
    () => dashboardCards.filter((card) => visibleCards.includes(card.key)),
    [visibleCards],
  );
  const hiddenCards = useMemo(
    () => dashboardCards.filter((card) => !visibleCards.includes(card.key)),
    [visibleCards],
  );

  const monthIncome = Number(stats.finance?.month_income ?? 0);
  const monthExpense = Number(stats.finance?.month_expense ?? 0);
  const monthBalance = monthIncome - monthExpense;

  const addCard = (key: CardKey) => {
    setVisibleCards((current) => [...current, key]);
  };

  const removeCard = () => {
    if (!removeTarget) return;
    setVisibleCards((current) => current.filter((key) => key !== removeTarget));
    setRemoveTarget(null);
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - var(--nav-h))', bgcolor: 'background.default', px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>工作台</Typography>
          <Typography color="text.secondary">把任务管理和个人记账放在同一个清晰入口.</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Button variant={managementMode ? 'contained' : 'outlined'} startIcon={<TuneRoundedIcon />} onClick={() => setManagementMode((value) => !value)}>
            {managementMode ? '退出管理模式' : '管理模式'}
          </Button>
          {managementMode && (
            <>
              <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setAddDialogOpen(true)}>添加卡片</Button>
              <Button variant="outlined" onClick={() => setNavDialogOpen(true)}>导航管理</Button>
              <Button variant="outlined" onClick={() => setSettingsDialogOpen(true)}>偏好设置</Button>
            </>
          )}
        </Stack>
      </Stack>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {visibleDashboardCards.map((card) => {
          const content = (
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center' }}>
                  {card.icon}
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  {managementMode && <DragIndicatorRoundedIcon color="disabled" fontSize="small" />}
                  {managementMode && (
                    <IconButton size="small" color="error" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setRemoveTarget(card.key); }}>
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Stack>
              <Box>
                <Typography variant="h6">{card.title}</Typography>
                <Typography variant="body2" color="text.secondary">{card.description}</Typography>
              </Box>

              {card.key === 'monthly' ? (
                <Stack spacing={2} sx={{ mt: 'auto' }}>
                  <Box sx={{ height: 160, display: 'grid', gridTemplateColumns: `repeat(${monthlyBars.length}, 1fr)`, gap: 1, alignItems: 'end' }}>
                    {monthlyBars.map((bar) => (
                      <Stack key={bar.month} spacing={0.5} sx={{ height: '100%', justifyContent: 'end', alignItems: 'center' }}>
                        <Stack direction="row" spacing={0.4} sx={{ height: 118, alignItems: 'end' }}>
                          <Box sx={{ width: 10, height: `${(bar.income / 10000) * 100}%`, borderRadius: 1, bgcolor: 'success.main', opacity: bar.active ? 1 : 0.45 }} />
                          <Box sx={{ width: 10, height: `${(bar.expense / 10000) * 100}%`, borderRadius: 1, bgcolor: 'error.main', opacity: bar.active ? 1 : 0.45 }} />
                        </Stack>
                        <Typography variant="caption" color={bar.active ? 'primary.main' : 'text.secondary'}>{bar.month}</Typography>
                      </Stack>
                    ))}
                  </Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Chip color="success" label={`本月收入 ${formatMoney(monthIncome || 8000)}`} />
                    <Chip color="error" label={`本月支出 ${formatMoney(monthExpense || 4200)}`} />
                    <Chip color="primary" label={`本月结余 ${formatMoney(monthBalance || 3800)}`} />
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={1.5} sx={{ mt: 'auto' }}>
                  <Chip color={card.key === 'finance' ? 'secondary' : 'primary'} label={cardMetric(card.key, loading, stats)} sx={{ alignSelf: 'flex-start' }} />
                  {card.key === 'recent' && (
                    <Stack spacing={1}>
                      {['优化首页加载性能', '整理发票和收据', '检查月度预算'].map((task) => (
                        <Stack key={task} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                          <Typography variant="body2">{task}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                  {card.key === 'calendar' && <LinearProgress variant="determinate" value={62} sx={{ borderRadius: 1 }} />}
                </Stack>
              )}
            </CardContent>
          );

          return (
            <Card
              key={card.key}
              variant="outlined"
              sx={{
                minHeight: card.key === 'monthly' ? 320 : 210,
                gridColumn: { xs: 'span 1', md: card.size === 'wide' ? 'span 4' : 'span 2', lg: card.size === 'wide' ? 'span 4' : 'span 1' },
                borderColor: managementMode ? 'primary.light' : 'divider',
              }}
            >
              {card.href && !managementMode ? (
                <CardActionArea component={Link} href={card.href} sx={{ height: '100%' }}>
                  {content}
                </CardActionArea>
              ) : content}
            </Card>
          );
        })}
      </Box>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>添加卡片到工作台</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {hiddenCards.length === 0 && <Alert severity="info">所有卡片都已显示.</Alert>}
            {hiddenCards.map((card) => (
              <Stack key={card.key} direction="row" spacing={2} sx={{ py: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box sx={{ color: 'primary.main' }}>{card.icon}</Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{card.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{card.description}</Typography>
                  </Box>
                </Stack>
                <Button startIcon={<AddRoundedIcon />} onClick={() => addCard(card.key)}>添加</Button>
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>完成</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(removeTarget)} onClose={() => setRemoveTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>移除卡片</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">确定要从工作台移除「{dashboardCards.find((card) => card.key === removeTarget)?.title}」吗? 之后可以从添加卡片中恢复.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveTarget(null)}>取消</Button>
          <Button color="error" variant="contained" startIcon={<DeleteOutlineRoundedIcon />} onClick={removeCard}>移除</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={navDialogOpen} onClose={() => setNavDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>导航管理</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {['首页', 'TODO', '记账', '设置', '帮助'].map((item) => (
              <Stack key={item} direction="row" sx={{ py: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700 }}>{item}</Typography>
                <Switch defaultChecked={item !== '帮助'} />
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNavDialogOpen(false)}>完成</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>偏好设置</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>默认起始页</InputLabel>
              <Select label="默认起始页" value={startPage} onChange={(event) => setStartPage(event.target.value)}>
                <MenuItem value="home">工作台(首页)</MenuItem>
                <MenuItem value="todo">TODO</MenuItem>
                <MenuItem value="finance">记账</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>紧凑卡片间距</Typography>
              <Switch />
            </Stack>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>显示图表动画</Typography>
              <Checkbox defaultChecked />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => setSettingsDialogOpen(false)}>保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
