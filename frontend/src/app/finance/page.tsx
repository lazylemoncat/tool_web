'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ContentHeader from '@/components/layout/ContentHeader';
import FinanceSidebar from '@/components/finance/FinanceSidebar';
import DashboardTab from '@/components/finance/DashboardTab';
import TransactionsTab from '@/components/finance/TransactionsTab';
import BooksTab from '@/components/finance/BooksTab';
import AccountsTab from '@/components/finance/AccountsTab';
import CategoriesTab from '@/components/finance/CategoriesTab';
import TagsTab from '@/components/finance/TagsTab';
import BudgetsTab from '@/components/finance/BudgetsTab';
import EventsTab from '@/components/finance/EventsTab';
import TransactionFormDialog from '@/components/finance/TransactionFormDialog';
import TransactionDetailDrawer from '@/components/finance/TransactionDetailDrawer';
import EventDetailDrawer from '@/components/finance/EventDetailDrawer';
import * as api from '@/lib/api';
import { ApiError } from '@/lib/api';
import type {
  LedgerOut, AccountOut, CategoryOut, FinanceTagOut,
  BudgetOut, FinanceEventOut, TransactionOut,
  DashboardSummary, StatsResponse,
} from '@/lib/financeTypes';

const TAB_LABELS: Record<string, string> = {
  dashboard: '仪表盘',
  transactions: '交易记录',
  books: '账本管理',
  accounts: '账户管理',
  categories: '分类管理',
  tags: '标签管理',
  budgets: '预算管理',
  events: '事件管理',
};

export default function FinancePage() {
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data
  const [ledgers, setLedgers] = useState<LedgerOut[]>([]);
  const [activeLedgerId, setActiveLedgerId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<AccountOut[]>([]);
  const [categories, setCategories] = useState<CategoryOut[]>([]);
  const [tags, setTags] = useState<FinanceTagOut[]>([]);
  const [budgets, setBudgets] = useState<BudgetOut[]>([]);
  const [events, setEvents] = useState<FinanceEventOut[]>([]);
  const [transactions, setTransactions] = useState<TransactionOut[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  // Loading & error
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionOut | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionOut | null>(null);
  const [eventDrawerOpen, setEventDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FinanceEventOut | null>(null);

  // ===== Data fetching =====
  const fetchLedgers = useCallback(async () => {
    try {
      const data = await api.listLedgers();
      setLedgers(data);
      if (data.length === 0) {
        setActiveLedgerId(null);
        setActiveTab('books');
        setLoading(false);
      } else if (!activeLedgerId || !data.some((ledger) => ledger.id === activeLedgerId)) {
        setActiveLedgerId(data[0].id);
      } else {
        setLoading(false);
      }
      return data;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '加载账本失败';
      setFetchError(msg);
      setLoading(false);
      return [];
    }
  }, [activeLedgerId]);

  const fetchAllData = useCallback(async (lid: number) => {
    setLoading(true);
    setFetchError(null);
    try {
      const [dash, statsData, accts, cats, t, buds, evts, txData] = await Promise.all([
        api.getDashboard(lid).catch(() => null),
        api.getStats(lid).catch(() => null),
        api.listAccounts(lid),
        api.listCategories(lid),
        api.listFinanceTags(lid),
        api.listBudgets(lid),
        api.listEvents(lid),
        api.listTransactions(lid, { limit: 50 }),
      ]);
      setDashboard(dash);
      setStats(statsData);
      setAccounts(accts);
      setCategories(cats);
      setTags(t);
      setBudgets(buds);
      setEvents(evts);
      setTransactions(txData.items);
      setTxTotal(txData.total);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '加载数据失败';
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Finance data is loaded from the backend after the client page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLedgers();
  }, [fetchLedgers]);

  useEffect(() => {
    if (activeLedgerId) {
      // Finance data is loaded from the backend when the selected ledger changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchAllData(activeLedgerId);
    }
  }, [activeLedgerId, fetchAllData]);

  const refreshData = useCallback(() => {
    if (activeLedgerId) fetchAllData(activeLedgerId);
  }, [activeLedgerId, fetchAllData]);

  // ===== Handlers =====
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setFormDialogOpen(true);
  };

  const handleEditTransaction = (tx: TransactionOut) => {
    setEditingTransaction(tx);
    setFormDialogOpen(true);
  };

  const handleTransactionSaved = () => {
    setFormDialogOpen(false);
    setEditingTransaction(null);
    setSnackbar({ message: '交易已保存', severity: 'success' });
    refreshData();
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      await api.deleteTransaction(id);
      setDetailDrawerOpen(false);
      setSnackbar({ message: '交易已删除', severity: 'success' });
      refreshData();
    } catch {
      setSnackbar({ message: '删除失败', severity: 'error' });
    }
  };

  const handleTransactionRowClick = (tx: TransactionOut) => {
    setSelectedTransaction(tx);
    setDetailDrawerOpen(true);
  };

  const handleEventClick = (event: FinanceEventOut) => {
    setSelectedEvent(event);
    setEventDrawerOpen(true);
  };

  const activeLedger = ledgers.find((l) => l.id === activeLedgerId) || null;

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <FinanceSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        ledgers={ledgers}
        activeLedgerId={activeLedgerId}
        onSelectLedger={(id) => setActiveLedgerId(id)}
        onNewLedger={() => { setActiveTab('books'); setMobileSidebarOpen(false); }}
      />

      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ContentHeader
          title={TAB_LABELS[activeTab] || '记账'}
          showMenu
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <CircularProgress />
            </Box>
          ) : fetchError ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, p: 4 }}>
              <Typography color="error">{fetchError}</Typography>
            </Box>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardTab
                  dashboard={dashboard}
                  stats={stats}
                  activeLedger={activeLedger}
                  onNewTransaction={handleNewTransaction}
                />
              )}
              {activeTab === 'transactions' && (
                <TransactionsTab
                  transactions={transactions}
                  total={txTotal}
                  accounts={accounts}
                  categories={categories}
                  tags={tags}
                  events={events}
                  activeLedgerId={activeLedgerId}
                  onNewTransaction={handleNewTransaction}
                  onRowClick={handleTransactionRowClick}
                  onRefresh={refreshData}
                />
              )}
              {activeTab === 'books' && (
                <BooksTab
                  ledgers={ledgers}
                  activeLedgerId={activeLedgerId}
                  onSelect={setActiveLedgerId}
                  onRefresh={fetchLedgers}
                />
              )}
              {activeTab === 'accounts' && (
                <AccountsTab
                  accounts={accounts}
                  activeLedgerId={activeLedgerId}
                  onRefresh={() => activeLedgerId && fetchAllData(activeLedgerId)}
                />
              )}
              {activeTab === 'categories' && (
                <CategoriesTab
                  categories={categories}
                  activeLedgerId={activeLedgerId}
                  onRefresh={() => activeLedgerId && fetchAllData(activeLedgerId)}
                />
              )}
              {activeTab === 'tags' && (
                <TagsTab
                  tags={tags}
                  activeLedgerId={activeLedgerId}
                  onRefresh={() => activeLedgerId && fetchAllData(activeLedgerId)}
                />
              )}
              {activeTab === 'budgets' && (
                <BudgetsTab
                  budgets={budgets}
                  activeLedgerId={activeLedgerId}
                  onRefresh={() => activeLedgerId && fetchAllData(activeLedgerId)}
                />
              )}
              {activeTab === 'events' && (
                <EventsTab
                  events={events}
                  activeLedgerId={activeLedgerId}
                  onEventClick={handleEventClick}
                  onRefresh={() => activeLedgerId && fetchAllData(activeLedgerId)}
                />
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Transaction Form Dialog */}
      <TransactionFormDialog
        open={formDialogOpen}
        onClose={() => { setFormDialogOpen(false); setEditingTransaction(null); }}
        onSaved={handleTransactionSaved}
        accounts={accounts}
        categories={categories}
        tags={tags}
        events={events}
        activeLedgerId={activeLedgerId}
        editTx={editingTransaction}
      />

      {/* Transaction Detail Drawer */}
      <TransactionDetailDrawer
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        transaction={selectedTransaction}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Event Detail Drawer */}
      <EventDetailDrawer
        open={eventDrawerOpen}
        onClose={() => setEventDrawerOpen(false)}
        event={selectedEvent}
      />

      {/* Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)} sx={{ borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
