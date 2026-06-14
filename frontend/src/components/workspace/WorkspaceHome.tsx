'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import WorkspaceHeader from './WorkspaceHeader';
import ManagementToolbar from './ManagementToolbar';
import CardGrid from './CardGrid';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import AddCardDialog from './dialogs/AddCardDialog';
import HelpDialog from './dialogs/HelpDialog';
import TodoSummaryCard from './cards/TodoSummaryCard';
import FinanceSummaryCard from './cards/FinanceSummaryCard';
import MonthlyOverviewCard from './cards/MonthlyOverviewCard';
import RecentTasksCard from './cards/RecentTasksCard';
import SettingsEntryCard from './cards/SettingsEntryCard';
import HelpEntryCard from './cards/HelpEntryCard';

import { loadCardsState, saveCardsState } from './utils';
import { CARD_DEFINITIONS } from './constants';
import type { CardId, WorkspaceCardsState } from './types';

import * as api from '@/lib/api';
import type { TodoOut, TodoListResponse } from '@/lib/types';
import type { LedgerOut, DashboardSummary, StatsResponse } from '@/lib/financeTypes';

export default function WorkspaceHome() {
  const router = useRouter();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;

  // 管理模式状态
  const [isManageMode, setIsManageMode] = useState(false);
  const [cardsState, setCardsState] = useState<WorkspaceCardsState>(loadCardsState);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<CardId | null>(null);

  // 添加卡片对话框
  const [addCardOpen, setAddCardOpen] = useState(false);

  // 帮助对话框
  const [helpOpen, setHelpOpen] = useState(false);

  // API 数据
  const [todoData, setTodoData] = useState<{ total: number; active: number } | null>(null);
  const [recentTasks, setRecentTasks] = useState<TodoOut[]>([]);
  const [ledgers, setLedgers] = useState<LedgerOut[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 提示
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // 数据获取
  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const results = await Promise.allSettled([
        api.listTodos(),
        api.listTodos({ status: 'active', limit: 5 }),
        api.listLedgers(),
      ]);

      // TODO 列表
      if (results[0].status === 'fulfilled') {
        const todoRes: TodoListResponse = results[0].value;
        const activeCount = todoRes.items.filter((t) => !t.is_completed).length;
        setTodoData({ total: todoRes.total, active: activeCount });
      }

      // 最近任务
      if (results[1].status === 'fulfilled') {
        const recentRes: TodoListResponse = results[1].value;
        setRecentTasks(recentRes.items.slice(0, 5));
      }

      // 账本列表
      if (results[2].status === 'fulfilled') {
        const ledgerList: LedgerOut[] = results[2].value;
        setLedgers(ledgerList);

        if (ledgerList.length > 0) {
          const activeLedger = ledgerList[0];
          const [dashResult, statsResult] = await Promise.allSettled([
            api.getDashboard(activeLedger.id),
            api.getStats(activeLedger.id),
          ]);

          if (dashResult.status === 'fulfilled') setDashboard(dashResult.value);
          if (statsResult.status === 'fulfilled') setStats(statsResult.value);
        }
      }
    } catch {
      setFetchError('数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Data is loaded from the backend after the client page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // 持久化卡片状态
  useEffect(() => {
    saveCardsState(cardsState);
  }, [cardsState]);

  // 管理模式切换
  const handleToggleManage = () => {
    setIsManageMode((prev) => !prev);
  };

  // 拖拽处理
  const handleDragStart = useCallback((e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingCardId(cardId);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggingCardId && draggingCardId !== targetId) {
        setCardsState((prev) => {
          const newOrder = [...prev.order];
          const dragIdx = newOrder.indexOf(draggingCardId as CardId);
          const targetIdx = newOrder.indexOf(targetId as CardId);
          if (dragIdx === -1 || targetIdx === -1) return prev;
          newOrder.splice(dragIdx, 1);
          newOrder.splice(targetIdx, 0, draggingCardId as CardId);
          return { ...prev, order: newOrder };
        });
      }
    },
    [draggingCardId],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingCardId(null);
  }, []);

  // 删除卡片
  const handleDeleteCard = useCallback((cardId: CardId) => {
    setDeleteTarget(cardId);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setCardsState((prev) => ({
      ...prev,
      visible: prev.visible.filter((id) => id !== deleteTarget),
    }));
    setDeleteTarget(null);
    setSnackbar({ open: true, message: `"${CARD_DEFINITIONS[deleteTarget].label}" 已从工作台移除` });
  }, [deleteTarget]);

  // 添加卡片
  const handleAddCard = useCallback((cardId: CardId) => {
    setCardsState((prev) => {
      if (prev.visible.includes(cardId)) return prev;
      return {
        order: prev.order.includes(cardId) ? prev.order : [...prev.order, cardId],
        visible: [...prev.visible, cardId],
      };
    });
    setSnackbar({ open: true, message: `"${CARD_DEFINITIONS[cardId].label}" 已添加到工作台` });
  }, []);

  // 渲染卡片元素映射
  const renderCard = useCallback(
    (cardId: CardId) => {
      const commonProps = {
        isManageMode,
        onDelete: () => handleDeleteCard(cardId),
      };

      switch (cardId) {
        case 'todo':
          return (
            <TodoSummaryCard
              {...commonProps}
              todoCount={todoData?.total ?? null}
              activeCount={todoData?.active ?? null}
              onClick={() => router.push('/todo')}
            />
          );
        case 'finance':
          return (
            <FinanceSummaryCard
              {...commonProps}
              dashboard={dashboard}
              hasLedger={ledgers.length > 0}
              loading={loading}
              onClick={() => router.push('/finance')}
            />
          );
        case 'monthly':
          return (
            <MonthlyOverviewCard
              {...commonProps}
              stats={stats}
              dashboard={dashboard}
              hasLedger={ledgers.length > 0}
              loading={loading}
            />
          );
        case 'recent':
          return (
            <RecentTasksCard
              {...commonProps}
              tasks={recentTasks}
              loading={loading}
              onClick={() => router.push('/todo')}
            />
          );
        case 'settings':
          return (
            <SettingsEntryCard
              {...commonProps}
            />
          );
        case 'help':
          return (
            <HelpEntryCard
              {...commonProps}
              onClick={() => setHelpOpen(true)}
            />
          );
        default:
          return null;
      }
    },
    [isManageMode, loading, todoData, recentTasks, dashboard, stats, ledgers, handleDeleteCard, router],
  );

  // 构建 cardElements map
  const cardElements: Record<string, React.ReactNode> = {};
  cardsState.order.forEach((id) => {
    if (cardsState.visible.includes(id)) {
      cardElements[id] = renderCard(id);
    }
  });

  // 加载中状态
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        bgcolor: 'background.default',
        pt: 4,
      }}
    >
      {/* 页面头部 */}
      <WorkspaceHeader isManageMode={isManageMode} onToggleManage={handleToggleManage} appVersion={appVersion} />

      {/* 管理模式工具栏 */}
      {isManageMode && (
        <ManagementToolbar
          onAddCard={() => setAddCardOpen(true)}
          onExitManage={() => setIsManageMode(false)}
        />
      )}

      {/* 错误提示 */}
      {fetchError && (
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, mb: 2 }}>
          <Alert severity="warning" onClose={() => setFetchError(null)} sx={{ borderRadius: 2 }}>
            {fetchError}，部分卡片可能无法显示完整数据。
          </Alert>
        </Box>
      )}

      {/* 卡片网格 */}
      <CardGrid
        isManageMode={isManageMode}
        cardOrder={cardsState.order}
        visibleCards={cardsState.visible}
        draggingCardId={draggingCardId}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDeleteCard={handleDeleteCard}
        cardElements={cardElements}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="移除卡片"
        message={deleteTarget ? `确认将 "${CARD_DEFINITIONS[deleteTarget].label}" 从工作台移除？你可以稍后在管理模式下重新添加。` : ''}
        confirmLabel="移除"
        cancelLabel="取消"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* 添加卡片对话框 */}
      <AddCardDialog
        open={addCardOpen}
        visibleCards={cardsState.visible}
        onAddCard={handleAddCard}
        onClose={() => setAddCardOpen(false)}
      />

      {/* 帮助对话框 */}
      <HelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      {/* 操作提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: 'text.primary',
            color: 'background.paper',
            borderRadius: 2,
            fontSize: '0.8125rem',
          },
        }}
      >
        <Alert
          severity="success"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2, fontSize: '0.8125rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
