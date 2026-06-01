'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import WalletRoundedIcon from '@mui/icons-material/WalletRounded';
import { apiRequest, getErrorMessage } from '@/lib/api';
import { formatDate, formatMoney, toDateTimeInput, todayISO } from '@/lib/format';
import type {
  Account,
  Attachment,
  Budget,
  DashboardSummary,
  FinanceCategory,
  FinanceEvent,
  FinanceStats,
  FinanceTag,
  Ledger,
  TodoListResponse,
  Transaction,
  TransactionListResponse,
} from '@/lib/types';

type FinanceTab = 'dashboard' | 'transactions' | 'books' | 'accounts' | 'categories' | 'tags' | 'budgets' | 'events';
type DialogKey = 'transaction' | 'ledger' | 'account' | 'category' | 'tag' | 'budget' | 'event' | null;

interface TransactionForm {
  type: 'expense' | 'income' | 'transfer';
  amount: string;
  note: string;
  account_id: string;
  category_id: string;
  occurred_at: string;
  event_id: string;
  tag_ids: number[];
  linked_todo_ids: number[];
  attachment_ids: number[];
  split_items: { amount: string; category_id: string; note: string }[];
}

interface LedgerForm {
  name: string;
  icon: string;
  currency: string;
}

interface AccountForm {
  name: string;
  type: string;
  initial_balance: string;
  currency: string;
  archived: boolean;
}

interface CategoryForm {
  parent_id: string;
  name: string;
  icon: string;
}

interface TagForm {
  name: string;
}

interface BudgetForm {
  name: string;
  amount: string;
  alert_threshold: number;
  category_id: string;
}

interface EventForm {
  name: string;
  description: string;
  start_at: string;
  end_at: string;
  color: string;
}

const tabs: { id: FinanceTab; label: string; icon: React.ReactElement }[] = [
  { id: 'dashboard', label: '仪表盘', icon: <TrendingUpRoundedIcon /> },
  { id: 'transactions', label: '交易', icon: <ReceiptLongRoundedIcon /> },
  { id: 'books', label: '账本', icon: <AccountBalanceRoundedIcon /> },
  { id: 'accounts', label: '账户', icon: <WalletRoundedIcon /> },
  { id: 'categories', label: '分类管理', icon: <CategoryRoundedIcon /> },
  { id: 'tags', label: '标签', icon: <LocalOfferRoundedIcon /> },
  { id: 'budgets', label: '预算', icon: <SavingsRoundedIcon /> },
  { id: 'events', label: '事件', icon: <EventRoundedIcon /> },
];

const EMPTY_TRANSACTION: TransactionForm = {
  type: 'expense',
  amount: '',
  note: '',
  account_id: '',
  category_id: '',
  occurred_at: todayISO(),
  event_id: '',
  tag_ids: [],
  linked_todo_ids: [],
  attachment_ids: [],
  split_items: [],
};

const EMPTY_LEDGER: LedgerForm = { name: '', icon: '💰', currency: 'CNY' };
const EMPTY_ACCOUNT: AccountForm = { name: '', type: 'cash', initial_balance: '0', currency: 'CNY', archived: false };
const EMPTY_CATEGORY: CategoryForm = { parent_id: '', name: '', icon: '📂' };
const EMPTY_TAG: TagForm = { name: '' };
const EMPTY_BUDGET: BudgetForm = { name: '', amount: '', alert_threshold: 80, category_id: '' };
const EMPTY_EVENT: EventForm = { name: '', description: '', start_at: todayISO(), end_at: todayISO(), color: '#6366f1' };

function flattenCategories(categories: FinanceCategory[]): FinanceCategory[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children ?? [])]);
}

function txAmount(transaction: Transaction) {
  const sign = transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '';
  return `${sign}${formatMoney(transaction.amount, transaction.currency)}`;
}

function typeLabel(type: Transaction['type']) {
  if (type === 'income') return '收入';
  if (type === 'transfer') return '转账';
  return '支出';
}

function typeColor(type: Transaction['type']) {
  if (type === 'income') return 'success.main';
  if (type === 'transfer') return 'info.main';
  return 'error.main';
}

export default function FinancePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState<FinanceTab>('dashboard');
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [ledgerId, setLedgerId] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [tags, setTags] = useState<FinanceTag[]>([]);
  const [events, setEvents] = useState<FinanceEvent[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [stats, setStats] = useState<FinanceStats>({ category_data: [], trend_data: [] });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [todoOptions, setTodoOptions] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKey>(null);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingEvent, setEditingEvent] = useState<FinanceEvent | null>(null);
  const [transactionForm, setTransactionForm] = useState<TransactionForm>(EMPTY_TRANSACTION);
  const [ledgerForm, setLedgerForm] = useState<LedgerForm>(EMPTY_LEDGER);
  const [accountForm, setAccountForm] = useState<AccountForm>(EMPTY_ACCOUNT);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(EMPTY_CATEGORY);
  const [tagForm, setTagForm] = useState<TagForm>(EMPTY_TAG);
  const [budgetForm, setBudgetForm] = useState<BudgetForm>(EMPTY_BUDGET);
  const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [txAccountFilter, setTxAccountFilter] = useState('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState('all');
  const [txTagFilter, setTxTagFilter] = useState('all');
  const [txEventFilter, setTxEventFilter] = useState('all');

  const selectedLedger = useMemo(() => ledgers.find((ledger) => String(ledger.id) === ledgerId), [ledgerId, ledgers]);
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const loadLedgers = useCallback(async () => {
    const response = await apiRequest<Ledger[]>('/api/v1/finance/ledgers');
    setLedgers(response);
    setLedgerId((current) => current || (response[0] ? String(response[0].id) : ''));
    if (response.length === 0) setLedgerId('');
    return response;
  }, []);

  const loadFinance = useCallback(async (id: string) => {
    if (!id) {
      setAccounts([]);
      setCategories([]);
      setTags([]);
      setEvents([]);
      setBudgets([]);
      setDashboard(null);
      setStats({ category_data: [], trend_data: [] });
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ ledger_id: id, limit: '200' });
    if (txSearch.trim()) params.set('search', txSearch.trim());
    if (txTypeFilter !== 'all') params.set('type', txTypeFilter);
    if (txAccountFilter !== 'all') params.set('account_id', txAccountFilter);
    if (txCategoryFilter !== 'all') params.set('category_id', txCategoryFilter);
    if (txTagFilter !== 'all') params.set('tag_id', txTagFilter);
    if (txEventFilter !== 'all') params.set('event_id', txEventFilter);
    try {
      const [accountResponse, categoryResponse, tagResponse, eventResponse, budgetResponse, dashboardResponse, statsResponse, transactionResponse, todoResponse] = await Promise.all([
        apiRequest<Account[]>(`/api/v1/finance/accounts?ledger_id=${id}`),
        apiRequest<FinanceCategory[]>(`/api/v1/finance/categories?ledger_id=${id}`),
        apiRequest<FinanceTag[]>(`/api/v1/finance/tags?ledger_id=${id}`),
        apiRequest<FinanceEvent[]>(`/api/v1/finance/events?ledger_id=${id}`),
        apiRequest<Budget[]>(`/api/v1/finance/budgets?ledger_id=${id}`),
        apiRequest<DashboardSummary>(`/api/v1/finance/dashboard?ledger_id=${id}`),
        apiRequest<FinanceStats>(`/api/v1/finance/stats?ledger_id=${id}&period=${period}`),
        apiRequest<TransactionListResponse>(`/api/v1/finance/transactions?${params.toString()}`),
        apiRequest<TodoListResponse>('/api/v1/todos?status=active&limit=100'),
      ]);
      setAccounts(accountResponse);
      setCategories(categoryResponse);
      setTags(tagResponse);
      setEvents(eventResponse);
      setBudgets(budgetResponse);
      setDashboard(dashboardResponse);
      setStats(statsResponse);
      setTransactions(transactionResponse.items);
      setTodoOptions(todoResponse.items.map((todo) => ({ id: todo.id, title: todo.title })));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [period, txAccountFilter, txCategoryFilter, txEventFilter, txSearch, txTagFilter, txTypeFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadLedgers().catch((err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadLedgers]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadFinance(ledgerId);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [ledgerId, loadFinance]);

  const refreshAll = async () => {
    await loadLedgers();
    await loadFinance(ledgerId);
  };

  const openTransactionDialog = (transaction?: Transaction) => {
    setEditingTransaction(transaction ?? null);
    setTransactionForm(transaction ? {
      type: transaction.type,
      amount: transaction.amount,
      note: transaction.note ?? '',
      account_id: String(transaction.account_id),
      category_id: transaction.category_id ? String(transaction.category_id) : '',
      occurred_at: transaction.occurred_at.slice(0, 10),
      event_id: transaction.event_id ? String(transaction.event_id) : '',
      tag_ids: transaction.tags.map((tag) => tag.id),
      linked_todo_ids: transaction.linked_todos.map((todo) => Number(todo.id)).filter(Boolean),
      attachment_ids: transaction.attachments.map((attachment) => attachment.id),
      split_items: transaction.split_items.map((item) => ({
        amount: item.amount,
        category_id: item.category_id ? String(item.category_id) : '',
        note: item.note ?? '',
      })),
    } : { ...EMPTY_TRANSACTION, account_id: accounts[0] ? String(accounts[0].id) : '' });
    setDialog('transaction');
  };

  const saveTransaction = async () => {
    if (!ledgerId || !transactionForm.account_id || !transactionForm.amount) {
      setError('请选择账本, 账户并填写金额');
      return;
    }
    setSaving(true);
    const payload = {
      ledger_id: Number(ledgerId),
      account_id: Number(transactionForm.account_id),
      type: transactionForm.type,
      amount: transactionForm.amount,
      currency: selectedLedger?.currency ?? 'CNY',
      occurred_at: toDateTimeInput(transactionForm.occurred_at),
      category_id: transactionForm.category_id ? Number(transactionForm.category_id) : null,
      note: transactionForm.note.trim() || null,
      event_id: transactionForm.event_id ? Number(transactionForm.event_id) : null,
      tag_ids: transactionForm.tag_ids,
      attachment_ids: transactionForm.attachment_ids,
      linked_todo_ids: transactionForm.linked_todo_ids,
      split_items: transactionForm.split_items
        .filter((item) => item.amount)
        .map((item) => ({
          amount: item.amount,
          category_id: item.category_id ? Number(item.category_id) : null,
          note: item.note.trim() || null,
        })),
    };
    try {
      if (editingTransaction) {
        await apiRequest<Transaction>(`/api/v1/finance/transactions/${editingTransaction.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest<Transaction>('/api/v1/finance/transactions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setDialog(null);
      setDetailTransaction(null);
      setToast(editingTransaction ? '交易已更新' : '交易已保存');
      await loadFinance(ledgerId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = async (transaction: Transaction) => {
    if (!window.confirm('确定删除这笔交易吗?')) return;
    try {
      await apiRequest<void>(`/api/v1/finance/transactions/${transaction.id}`, { method: 'DELETE' });
      setDetailTransaction(null);
      setToast('交易已删除');
      await loadFinance(ledgerId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const uploadAttachment = async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    try {
      const attachment = await apiRequest<Attachment>('/api/v1/finance/attachments/upload', {
        method: 'POST',
        body: data,
      });
      setTransactionForm((current) => ({ ...current, attachment_ids: [...current.attachment_ids, attachment.id] }));
      setToast('附件已上传');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const saveLedger = async () => {
    if (!ledgerForm.name.trim()) return setError('账本名称不能为空');
    try {
      const payload = { name: ledgerForm.name.trim(), icon: ledgerForm.icon || '💰', currency: ledgerForm.currency || 'CNY' };
      const ledger = editingLedger
        ? await apiRequest<Ledger>(`/api/v1/finance/ledgers/${editingLedger.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiRequest<Ledger>('/api/v1/finance/ledgers', { method: 'POST', body: JSON.stringify(payload) });
      setLedgerId(String(ledger.id));
      setDialog(null);
      setToast(editingLedger ? '账本已更新' : '账本已创建');
      await refreshAll();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteLedger = async (ledger: Ledger) => {
    if (!window.confirm(`删除账本 "${ledger.name}"?`)) return;
    try {
      await apiRequest<void>(`/api/v1/finance/ledgers/${ledger.id}`, { method: 'DELETE' });
      setLedgerId('');
      setToast('账本已删除');
      await loadLedgers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const saveAccount = async () => {
    if (!ledgerId || !accountForm.name.trim()) return setError('账户名称不能为空');
    try {
      const payload = {
        ledger_id: Number(ledgerId),
        name: accountForm.name.trim(),
        type: accountForm.type,
        currency: accountForm.currency || selectedLedger?.currency || 'CNY',
        initial_balance: accountForm.initial_balance || '0',
        archived: accountForm.archived,
      };
      if (editingAccount) {
        await apiRequest<Account>(`/api/v1/finance/accounts/${editingAccount.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiRequest<Account>('/api/v1/finance/accounts', { method: 'POST', body: JSON.stringify(payload) });
      }
      setDialog(null);
      setToast(editingAccount ? '账户已更新' : '账户已创建');
      await loadFinance(ledgerId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const saveCategory = async () => {
    if (!ledgerId || !categoryForm.name.trim()) return setError('分类名称不能为空');
    try {
      const payload = {
        ledger_id: Number(ledgerId),
        parent_id: categoryForm.parent_id ? Number(categoryForm.parent_id) : null,
        name: categoryForm.name.trim(),
        icon: categoryForm.icon || '📂',
      };
      if (editingCategory) {
        await apiRequest<FinanceCategory>(`/api/v1/finance/categories/${editingCategory.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiRequest<FinanceCategory>('/api/v1/finance/categories', { method: 'POST', body: JSON.stringify(payload) });
      }
      setDialog(null);
      setToast(editingCategory ? '分类已更新' : '分类已创建');
      await loadFinance(ledgerId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const saveTag = async () => {
    if (!ledgerId || !tagForm.name.trim()) return setError('标签名称不能为空');
    try {
      await apiRequest<FinanceTag>('/api/v1/finance/tags', {
        method: 'POST',
        body: JSON.stringify({ ledger_id: Number(ledgerId), name: tagForm.name.trim() }),
      });
      setDialog(null);
      setToast('标签已创建');
      await loadFinance(ledgerId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const saveBudget = async () => {
    if (!ledgerId || !budgetForm.name.trim() || !budgetForm.amount) return setError('预算名称和金额不能为空');
    try {
      const payload = {
        ledger_id: Number(ledgerId),
        name: budgetForm.name.trim(),
        amount: budgetForm.amount,
        currency: selectedLedger?.currency ?? 'CNY',
        alert_threshold: budgetForm.alert_threshold,
        filters: budgetForm.category_id ? { category_ids: [Number(budgetForm.category_id)] } : null,
      };
      if (editingBudget) {
        await apiRequest<Budget>(`/api/v1/finance/budgets/${editingBudget.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiRequest<Budget>('/api/v1/finance/budgets', { method: 'POST', body: JSON.stringify(payload) });
      }
      setDialog(null);
      setToast(editingBudget ? '预算已更新' : '预算已创建');
      await loadFinance(ledgerId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const saveEvent = async () => {
    if (!ledgerId || !eventForm.name.trim()) return setError('事件名称不能为空');
    try {
      const payload = {
        ledger_id: Number(ledgerId),
        name: eventForm.name.trim(),
        description: eventForm.description.trim() || null,
        start_at: eventForm.start_at ? toDateTimeInput(eventForm.start_at) : null,
        end_at: eventForm.end_at ? toDateTimeInput(eventForm.end_at) : null,
        color: eventForm.color,
      };
      if (editingEvent) {
        await apiRequest<FinanceEvent>(`/api/v1/finance/events/${editingEvent.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiRequest<FinanceEvent>('/api/v1/finance/events', { method: 'POST', body: JSON.stringify(payload) });
      }
      setDialog(null);
      setToast(editingEvent ? '事件已更新' : '事件已创建');
      await loadFinance(ledgerId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteResource = async (path: string, label: string) => {
    if (!window.confirm(`确定删除${label}吗?`)) return;
    try {
      await apiRequest<void>(path, { method: 'DELETE' });
      setToast(`${label}已删除`);
      await loadFinance(ledgerId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openLedgerDialog = (ledger?: Ledger) => {
    setEditingLedger(ledger ?? null);
    setLedgerForm(ledger ? { name: ledger.name, icon: ledger.icon, currency: ledger.currency } : EMPTY_LEDGER);
    setDialog('ledger');
  };

  const openAccountDialog = (account?: Account) => {
    setEditingAccount(account ?? null);
    setAccountForm(account ? {
      name: account.name,
      type: account.type,
      initial_balance: account.initial_balance,
      currency: account.currency,
      archived: account.archived,
    } : { ...EMPTY_ACCOUNT, currency: selectedLedger?.currency ?? 'CNY' });
    setDialog('account');
  };

  const openCategoryDialog = (category?: FinanceCategory, parentId = '') => {
    setEditingCategory(category ?? null);
    setCategoryForm(category ? {
      parent_id: category.parent_id ? String(category.parent_id) : '',
      name: category.name,
      icon: category.icon,
    } : { ...EMPTY_CATEGORY, parent_id: parentId });
    setDialog('category');
  };

  const openBudgetDialog = (budget?: Budget) => {
    const categoryId = Array.isArray(budget?.filters?.category_ids) ? String(budget?.filters?.category_ids[0] ?? '') : '';
    setEditingBudget(budget ?? null);
    setBudgetForm(budget ? {
      name: budget.name,
      amount: budget.amount,
      alert_threshold: budget.alert_threshold,
      category_id: categoryId,
    } : EMPTY_BUDGET);
    setDialog('budget');
  };

  const openEventDialog = (event?: FinanceEvent) => {
    setEditingEvent(event ?? null);
    setEventForm(event ? {
      name: event.name,
      description: event.description ?? '',
      start_at: event.start_at ? event.start_at.slice(0, 10) : '',
      end_at: event.end_at ? event.end_at.slice(0, 10) : '',
      color: event.color,
    } : EMPTY_EVENT);
    setDialog('event');
  };

  const sidebar = (
    <Box sx={{ width: 300, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRight: { md: 1 }, borderColor: 'divider' }}>
      <Stack spacing={1.5} sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800 }}>
            {selectedLedger?.icon ?? '账'}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }} noWrap>{selectedLedger?.name ?? '暂无账本'}</Typography>
            <Typography variant="caption" color="text.secondary">{selectedLedger?.currency ?? 'CNY'} · 默认账本</Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => openTransactionDialog()} disabled={!ledgerId || accounts.length === 0}>记一笔</Button>
      </Stack>
      <Divider />
      <List dense sx={{ p: 1, flex: 1, overflow: 'auto' }}>
        {tabs.map((tab) => (
          <ListItemButton
            key={tab.id}
            selected={activeTab === tab.id}
            onClick={() => { setActiveTab(tab.id); setMobileDrawerOpen(false); }}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon>{tab.icon}</ListItemIcon>
            <ListItemText primary={tab.label} />
            {tab.id === 'transactions' && <Chip size="small" label={transactions.length} />}
            {tab.id === 'books' && <Chip size="small" label={ledgers.length} />}
            {tab.id === 'budgets' && <Chip size="small" label={budgets.length} />}
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  const statCards = [
    { label: '总资产', value: formatMoney(dashboard?.total_assets, selectedLedger?.currency), color: 'primary.main' },
    { label: '本月收入', value: `+${formatMoney(dashboard?.month_income, selectedLedger?.currency)}`, color: 'success.main' },
    { label: '本月支出', value: `-${formatMoney(dashboard?.month_expense, selectedLedger?.currency)}`, color: 'error.main' },
    {
      label: '本月结余',
      value: formatMoney(Number(dashboard?.month_income ?? 0) - Number(dashboard?.month_expense ?? 0), selectedLedger?.currency),
      color: 'success.main',
    },
  ];

  const transactionRows = transactions;

  const renderTransactionList = (rows: Transaction[]) => (
    <Stack spacing={1}>
      {rows.length === 0 && <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>暂无交易</Paper>}
      {rows.map((transaction) => (
        <Paper key={transaction.id} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 42, height: 42, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: typeColor(transaction.type) }}>
              <ReceiptLongRoundedIcon />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 700 }}>{transaction.category?.name || transaction.note || '未分类交易'}</Typography>
                <Chip size="small" label={typeLabel(transaction.type)} />
                {transaction.tags.map((tag) => <Chip key={tag.id} size="small" variant="outlined" label={tag.name} />)}
              </Stack>
              <Typography variant="body2" color="text.secondary" noWrap>{transaction.note || '无备注'} · {transaction.account?.name || '账户'} · {formatDate(transaction.occurred_at)}</Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, color: typeColor(transaction.type) }}>{txAmount(transaction)}</Typography>
            <Button size="small" onClick={() => setDetailTransaction(transaction)}>详情</Button>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );

  const renderDashboard = () => (
    <Stack spacing={2}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
        {statCards.map((card) => (
          <Card key={card.label} variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">{card.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: card.color }}>{card.value}</Typography>
              <Typography variant="caption" color="text.secondary">来自当前账本实时数据</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">预算使用率</Typography>
              <Chip size="small" label="月度预算" />
            </Stack>
            <Stack spacing={1.5}>
              {budgets.length === 0 && <Typography color="text.secondary">还没有预算.</Typography>}
              {budgets.map((budget) => (
                <Box key={budget.id}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 700 }}>{budget.name}</Typography>
                    <Typography color="text.secondary">{formatMoney(budget.current_spent, budget.currency)} / {formatMoney(budget.amount, budget.currency)}</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={Math.min(100, budget.progress_pct)} color={budget.progress_pct > 100 ? 'error' : budget.progress_pct > budget.alert_threshold ? 'warning' : 'success'} sx={{ height: 8, borderRadius: 2, mt: 0.75 }} />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>分类支出占比</Typography>
            <Stack spacing={1}>
              {stats.category_data.length === 0 && <Typography color="text.secondary">暂无分类支出数据.</Typography>}
              {stats.category_data.map((item) => (
                <Stack key={item.name} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
                  <Typography sx={{ flex: 1 }}>{item.name}</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{formatMoney(item.value, selectedLedger?.currency)}</Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ gridColumn: { lg: 'span 2' } }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>月度收支趋势</Typography>
            <Box sx={{ height: 220, display: 'grid', gridTemplateColumns: `repeat(${Math.max(stats.trend_data.length, 1)}, 1fr)`, gap: 1, alignItems: 'end' }}>
              {(stats.trend_data.length ? stats.trend_data : [{ date: '暂无', amount: 0 }]).map((item) => (
                <Stack key={item.date} spacing={0.75} sx={{ height: '100%', justifyContent: 'end', alignItems: 'center' }}>
                  <Box sx={{ width: 18, height: `${Math.min(100, (item.amount / 15000) * 100)}%`, minHeight: 8, borderRadius: 2, bgcolor: 'error.main' }} />
                  <Typography variant="caption" color="text.secondary">{item.date}</Typography>
                </Stack>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">最近交易</Typography>
            <Button onClick={() => setActiveTab('transactions')}>查看全部</Button>
          </Stack>
          {renderTransactionList(dashboard?.recent_transactions ?? [])}
        </CardContent>
      </Card>
    </Stack>
  );

  const renderTransactions = () => (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
          <TextField size="small" placeholder="搜索备注..." value={txSearch} onChange={(event) => setTxSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void loadFinance(ledgerId); }} slotProps={{ input: { startAdornment: <SearchRoundedIcon color="disabled" sx={{ mr: 1 }} /> } }} />
          <ToggleButtonGroup size="small" exclusive value={txTypeFilter} onChange={(_, value) => { if (value) setTxTypeFilter(value); }}>
            <ToggleButton value="all">全部</ToggleButton>
            <ToggleButton value="expense">支出</ToggleButton>
            <ToggleButton value="income">收入</ToggleButton>
            <ToggleButton value="transfer">转账</ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>账户</InputLabel>
            <Select label="账户" value={txAccountFilter} onChange={(event) => setTxAccountFilter(event.target.value)}>
              <MenuItem value="all">全部账户</MenuItem>
              {accounts.map((account) => <MenuItem key={account.id} value={String(account.id)}>{account.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>分类</InputLabel>
            <Select label="分类" value={txCategoryFilter} onChange={(event) => setTxCategoryFilter(event.target.value)}>
              <MenuItem value="all">全部分类</MenuItem>
              {flatCategories.map((category) => <MenuItem key={category.id} value={String(category.id)}>{category.icon} {category.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>标签</InputLabel>
            <Select label="标签" value={txTagFilter} onChange={(event) => setTxTagFilter(event.target.value)}>
              <MenuItem value="all">全部标签</MenuItem>
              {tags.map((tag) => <MenuItem key={tag.id} value={String(tag.id)}>{tag.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>事件</InputLabel>
            <Select label="事件" value={txEventFilter} onChange={(event) => setTxEventFilter(event.target.value)}>
              <MenuItem value="all">全部事件</MenuItem>
              {events.map((event) => <MenuItem key={event.id} value={String(event.id)}>{event.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={() => void loadFinance(ledgerId)}>筛选</Button>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => openTransactionDialog()} disabled={!ledgerId || accounts.length === 0}>记一笔</Button>
        </Stack>
      </Paper>
      {renderTransactionList(transactionRows)}
    </Stack>
  );

  const renderBooks = () => (
    <Stack spacing={2}>
      <Button variant="contained" startIcon={<AddRoundedIcon />} sx={{ alignSelf: 'flex-start' }} onClick={() => openLedgerDialog()}>新建账本</Button>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 2 }}>
        {ledgers.map((ledger) => (
          <Card key={ledger.id} variant="outlined" sx={{ borderColor: String(ledger.id) === ledgerId ? 'primary.main' : 'divider' }}>
            <CardContent>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Typography variant="h4">{ledger.icon}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{ledger.name}</Typography>
                  <Typography color="text.secondary">{ledger.currency}</Typography>
                </Box>
                <Button onClick={() => setLedgerId(String(ledger.id))}>切换</Button>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => openLedgerDialog(ledger)}>编辑</Button>
                <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => void deleteLedger(ledger)}>删除</Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );

  const renderAccounts = () => (
    <Stack spacing={2}>
      <Button variant="contained" startIcon={<AddRoundedIcon />} sx={{ alignSelf: 'flex-start' }} onClick={() => openAccountDialog()} disabled={!ledgerId}>新建账户</Button>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 2 }}>
        {accounts.map((account) => (
          <Card key={account.id} variant="outlined">
            <CardContent>
              <Typography variant="h6">{account.name}</Typography>
              <Typography color="text.secondary">{account.type} · {account.currency}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>{formatMoney(account.current_balance, account.currency)}</Typography>
              {account.archived && <Chip size="small" label="已归档" sx={{ mt: 1 }} />}
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => openAccountDialog(account)}>编辑</Button>
                <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => void deleteResource(`/api/v1/finance/accounts/${account.id}`, '账户')}>删除</Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );

  const renderCategories = () => (
    <Stack spacing={2}>
      <Button variant="contained" startIcon={<AddRoundedIcon />} sx={{ alignSelf: 'flex-start' }} onClick={() => openCategoryDialog()} disabled={!ledgerId}>新建分类</Button>
      <Paper variant="outlined" sx={{ borderRadius: 3 }}>
        <List>
          {flatCategories.length === 0 && <ListItem><ListItemText primary="暂无分类" /></ListItem>}
          {flatCategories.map((category) => (
            <ListItem
              key={category.id}
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => openCategoryDialog(undefined, String(category.id))}><AddRoundedIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => openCategoryDialog(category)}><EditRoundedIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => void deleteResource(`/api/v1/finance/categories/${category.id}`, '分类')}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                </Stack>
              }
            >
              <ListItemIcon><CategoryRoundedIcon color="primary" /></ListItemIcon>
              <ListItemText primary={`${category.icon} ${category.name}`} secondary={category.parent_id ? '子分类' : '顶级分类'} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Stack>
  );

  const renderTags = () => (
    <Stack spacing={2}>
      <Button variant="contained" startIcon={<AddRoundedIcon />} sx={{ alignSelf: 'flex-start' }} onClick={() => { setTagForm(EMPTY_TAG); setDialog('tag'); }} disabled={!ledgerId}>新建标签</Button>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {tags.length === 0 && <Typography color="text.secondary">暂无标签</Typography>}
          {tags.map((tag) => (
            <Chip key={tag.id} label={tag.name} onDelete={() => void deleteResource(`/api/v1/finance/tags/${tag.id}`, '标签')} color="primary" variant="outlined" />
          ))}
        </Stack>
      </Paper>
    </Stack>
  );

  const renderBudgets = () => (
    <Stack spacing={2}>
      <Button variant="contained" startIcon={<AddRoundedIcon />} sx={{ alignSelf: 'flex-start' }} onClick={() => openBudgetDialog()} disabled={!ledgerId}>新建预算</Button>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 2 }}>
        {budgets.map((budget) => (
          <Card key={budget.id} variant="outlined">
            <CardContent>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="h6">{budget.name}</Typography>
                <Chip size="small" label="每月" />
              </Stack>
              <Typography sx={{ mt: 1 }}>{formatMoney(budget.current_spent, budget.currency)} / {formatMoney(budget.amount, budget.currency)}</Typography>
              <LinearProgress variant="determinate" value={Math.min(100, budget.progress_pct)} color={budget.progress_pct > 100 ? 'error' : budget.progress_pct > budget.alert_threshold ? 'warning' : 'success'} sx={{ height: 8, borderRadius: 2, my: 1 }} />
              <Typography color={budget.progress_pct > 100 ? 'error.main' : 'success.main'}>{budget.progress_pct > 100 ? '已超支' : `剩余 ${formatMoney(Number(budget.amount) - Number(budget.current_spent), budget.currency)}`}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => openBudgetDialog(budget)}>编辑</Button>
                <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => void deleteResource(`/api/v1/finance/budgets/${budget.id}`, '预算')}>删除</Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );

  const renderEvents = () => (
    <Stack spacing={2}>
      <Button variant="contained" startIcon={<AddRoundedIcon />} sx={{ alignSelf: 'flex-start' }} onClick={() => openEventDialog()} disabled={!ledgerId}>新建事件</Button>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 2 }}>
        {events.map((event) => (
          <Card key={event.id} variant="outlined" sx={{ borderLeft: `4px solid ${event.color}` }}>
            <CardContent>
              <Typography variant="h6">{event.name}</Typography>
              <Typography color="text.secondary">{event.description || '无描述'}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>{formatDate(event.start_at)} - {formatDate(event.end_at)}</Typography>
              <Typography variant="body2" color="text.secondary">{event.transaction_count} 笔交易 · {formatMoney(event.total_amount, selectedLedger?.currency)}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => openEventDialog(event)}>编辑</Button>
                <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => void deleteResource(`/api/v1/finance/events/${event.id}`, '事件')}>删除</Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );

  const content = (() => {
    if (!ledgerId) {
      return (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6">还没有账本</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>创建账本后即可记录交易和查看预算.</Typography>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => openLedgerDialog()}>创建账本</Button>
        </Paper>
      );
    }
    if (loading) return <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>正在加载记账数据...</Paper>;
    if (activeTab === 'dashboard') return renderDashboard();
    if (activeTab === 'transactions') return renderTransactions();
    if (activeTab === 'books') return renderBooks();
    if (activeTab === 'accounts') return renderAccounts();
    if (activeTab === 'categories') return renderCategories();
    if (activeTab === 'tags') return renderTags();
    if (activeTab === 'budgets') return renderBudgets();
    return renderEvents();
  })();

  return (
    <Box sx={{ minHeight: 'calc(100vh - var(--nav-h))', display: 'flex', bgcolor: 'background.default', pb: { xs: 8, md: 0 } }}>
      {isMobile ? (
        <Drawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)}>
          {sidebar}
        </Drawer>
      ) : sidebar}

      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 3 } }}>
        <Stack direction="row" sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {isMobile && <IconButton onClick={() => setMobileDrawerOpen(true)} aria-label="打开侧栏"><MenuRoundedIcon /></IconButton>}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{activeTab === 'dashboard' ? '记账仪表盘' : tabs.find((tab) => tab.id === activeTab)?.label}</Typography>
              <Typography color="text.secondary">{selectedLedger?.name ?? '未选择账本'} · 截至 2026 年 6 月</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <ToggleButtonGroup size="small" exclusive value={period} onChange={(_, value) => { if (value) setPeriod(value); }} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              <ToggleButton value="week">周</ToggleButton>
              <ToggleButton value="month">月</ToggleButton>
              <ToggleButton value="year">年</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => openTransactionDialog()} disabled={!ledgerId || accounts.length === 0}>记一笔</Button>
          </Stack>
        </Stack>

        {error && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {content}
      </Box>

      {isMobile && (
        <Paper sx={{ position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 20, borderRadius: 4, overflow: 'hidden' }} elevation={6}>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="fullWidth">
            {tabs.slice(0, 4).map((tab) => <Tab key={tab.id} value={tab.id} icon={tab.icon} label={tab.label} />)}
          </Tabs>
        </Paper>
      )}

      <Dialog open={dialog === 'transaction'} onClose={() => setDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>{editingTransaction ? '编辑交易' : '记一笔'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <ToggleButtonGroup exclusive value={transactionForm.type} onChange={(_, value) => { if (value) setTransactionForm((current) => ({ ...current, type: value })); }}>
              <ToggleButton value="expense">支出</ToggleButton>
              <ToggleButton value="income">收入</ToggleButton>
              <ToggleButton value="transfer">转账</ToggleButton>
            </ToggleButtonGroup>
            <TextField label="金额" value={transactionForm.amount} onChange={(event) => setTransactionForm((current) => ({ ...current, amount: event.target.value }))} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>账户</InputLabel>
                <Select label="账户" value={transactionForm.account_id} onChange={(event) => setTransactionForm((current) => ({ ...current, account_id: event.target.value }))}>
                  {accounts.map((account) => <MenuItem key={account.id} value={String(account.id)}>{account.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>分类</InputLabel>
                <Select label="分类" value={transactionForm.category_id} onChange={(event) => setTransactionForm((current) => ({ ...current, category_id: event.target.value }))}>
                  <MenuItem value="">无分类</MenuItem>
                  {flatCategories.map((category) => <MenuItem key={category.id} value={String(category.id)}>{category.icon} {category.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth type="date" label="日期" value={transactionForm.occurred_at} onChange={(event) => setTransactionForm((current) => ({ ...current, occurred_at: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <TextField label="备注" multiline minRows={3} value={transactionForm.note} onChange={(event) => setTransactionForm((current) => ({ ...current, note: event.target.value }))} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>标签</InputLabel>
                <Select
                  multiple
                  label="标签"
                  value={transactionForm.tag_ids.map(String)}
                  onChange={(event) => {
                    const value = event.target.value;
                    const ids = typeof value === 'string' ? value.split(',') : value;
                    setTransactionForm((current) => ({ ...current, tag_ids: ids.map(Number) }));
                  }}
                  renderValue={(selected) => selected.map((id) => tags.find((tag) => String(tag.id) === id)?.name ?? id).join(', ')}
                >
                  {tags.map((tag) => <MenuItem key={tag.id} value={String(tag.id)}>{tag.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>事件</InputLabel>
                <Select label="事件" value={transactionForm.event_id} onChange={(event) => setTransactionForm((current) => ({ ...current, event_id: event.target.value }))}>
                  <MenuItem value="">无事件</MenuItem>
                  {events.map((event) => <MenuItem key={event.id} value={String(event.id)}>{event.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <FormControl fullWidth>
              <InputLabel>关联待办</InputLabel>
              <Select
                multiple
                label="关联待办"
                value={transactionForm.linked_todo_ids.map(String)}
                onChange={(event) => {
                  const value = event.target.value;
                  const ids = typeof value === 'string' ? value.split(',') : value;
                  setTransactionForm((current) => ({ ...current, linked_todo_ids: ids.map(Number) }));
                }}
                renderValue={(selected) => selected.map((id) => todoOptions.find((todo) => String(todo.id) === id)?.title ?? id).join(', ')}
              >
                {todoOptions.map((todo) => <MenuItem key={todo.id} value={String(todo.id)}>{todo.title}</MenuItem>)}
              </Select>
            </FormControl>
            <Box>
              <Stack direction="row" sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700 }}>拆分交易</Typography>
                <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setTransactionForm((current) => ({ ...current, split_items: [...current.split_items, { amount: '', category_id: '', note: '' }] }))}>添加拆分项</Button>
              </Stack>
              <Stack spacing={1}>
                {transactionForm.split_items.map((item, index) => (
                  <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField size="small" label="金额" value={item.amount} onChange={(event) => setTransactionForm((current) => ({ ...current, split_items: current.split_items.map((row, rowIndex) => rowIndex === index ? { ...row, amount: event.target.value } : row) }))} />
                    <TextField size="small" label="备注" value={item.note} onChange={(event) => setTransactionForm((current) => ({ ...current, split_items: current.split_items.map((row, rowIndex) => rowIndex === index ? { ...row, note: event.target.value } : row) }))} />
                    <Button color="error" onClick={() => setTransactionForm((current) => ({ ...current, split_items: current.split_items.filter((_, rowIndex) => rowIndex !== index) }))}>删除</Button>
                  </Stack>
                ))}
              </Stack>
            </Box>
            <Button component="label" variant="outlined" startIcon={<AttachFileRoundedIcon />}>
              上传附件
              <input hidden type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAttachment(file); }} />
            </Button>
            {transactionForm.attachment_ids.length > 0 && <Chip label={`${transactionForm.attachment_ids.length} 个附件已上传`} sx={{ alignSelf: 'flex-start' }} />}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>取消</Button>
          <Button variant="contained" onClick={() => void saveTransaction()} disabled={saving}>{saving ? '保存中' : '保存'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'ledger'} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>{editingLedger ? '编辑账本' : '新建账本'}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="账本名称" value={ledgerForm.name} onChange={(event) => setLedgerForm((current) => ({ ...current, name: event.target.value }))} /><TextField label="图标" value={ledgerForm.icon} onChange={(event) => setLedgerForm((current) => ({ ...current, icon: event.target.value }))} /><TextField label="货币" value={ledgerForm.currency} onChange={(event) => setLedgerForm((current) => ({ ...current, currency: event.target.value }))} /></Stack></DialogContent>
        <DialogActions><Button onClick={() => setDialog(null)}>取消</Button><Button variant="contained" onClick={() => void saveLedger()}>保存</Button></DialogActions>
      </Dialog>

      <Dialog open={dialog === 'account'} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>{editingAccount ? '编辑账户' : '新建账户'}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="账户名称" value={accountForm.name} onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))} /><FormControl><InputLabel>账户类型</InputLabel><Select label="账户类型" value={accountForm.type} onChange={(event) => setAccountForm((current) => ({ ...current, type: event.target.value }))}><MenuItem value="cash">现金</MenuItem><MenuItem value="debit">借记卡</MenuItem><MenuItem value="credit">信用卡</MenuItem><MenuItem value="wallet">电子钱包</MenuItem></Select></FormControl><TextField label="初始余额" value={accountForm.initial_balance} onChange={(event) => setAccountForm((current) => ({ ...current, initial_balance: event.target.value }))} /></Stack></DialogContent>
        <DialogActions><Button onClick={() => setDialog(null)}>取消</Button><Button variant="contained" onClick={() => void saveAccount()}>保存</Button></DialogActions>
      </Dialog>

      <Dialog open={dialog === 'category'} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>{editingCategory ? '编辑分类' : '新建分类'}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="分类名称" value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} /><TextField label="图标" value={categoryForm.icon} onChange={(event) => setCategoryForm((current) => ({ ...current, icon: event.target.value }))} /><FormControl><InputLabel>父分类</InputLabel><Select label="父分类" value={categoryForm.parent_id} onChange={(event) => setCategoryForm((current) => ({ ...current, parent_id: event.target.value }))}><MenuItem value="">顶级分类</MenuItem>{flatCategories.filter((category) => category.id !== editingCategory?.id).map((category) => <MenuItem key={category.id} value={String(category.id)}>{category.icon} {category.name}</MenuItem>)}</Select></FormControl></Stack></DialogContent>
        <DialogActions><Button onClick={() => setDialog(null)}>取消</Button><Button variant="contained" onClick={() => void saveCategory()}>保存</Button></DialogActions>
      </Dialog>

      <Dialog open={dialog === 'tag'} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>新建标签</DialogTitle>
        <DialogContent><TextField fullWidth sx={{ mt: 1 }} label="标签名称" value={tagForm.name} onChange={(event) => setTagForm({ name: event.target.value })} /></DialogContent>
        <DialogActions><Button onClick={() => setDialog(null)}>取消</Button><Button variant="contained" onClick={() => void saveTag()}>保存</Button></DialogActions>
      </Dialog>

      <Dialog open={dialog === 'budget'} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>{editingBudget ? '编辑预算' : '新建预算'}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="预算名称" value={budgetForm.name} onChange={(event) => setBudgetForm((current) => ({ ...current, name: event.target.value }))} /><TextField label="金额" value={budgetForm.amount} onChange={(event) => setBudgetForm((current) => ({ ...current, amount: event.target.value }))} /><FormControl><InputLabel>筛选分类</InputLabel><Select label="筛选分类" value={budgetForm.category_id} onChange={(event) => setBudgetForm((current) => ({ ...current, category_id: event.target.value }))}><MenuItem value="">全部分类</MenuItem>{flatCategories.map((category) => <MenuItem key={category.id} value={String(category.id)}>{category.icon} {category.name}</MenuItem>)}</Select></FormControl><TextField type="number" label="超支提醒阈值" value={budgetForm.alert_threshold} onChange={(event) => setBudgetForm((current) => ({ ...current, alert_threshold: Number(event.target.value) }))} /></Stack></DialogContent>
        <DialogActions><Button onClick={() => setDialog(null)}>取消</Button><Button variant="contained" onClick={() => void saveBudget()}>保存</Button></DialogActions>
      </Dialog>

      <Dialog open={dialog === 'event'} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>{editingEvent ? '编辑事件' : '新建事件'}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="事件名称" value={eventForm.name} onChange={(event) => setEventForm((current) => ({ ...current, name: event.target.value }))} /><TextField label="描述" value={eventForm.description} onChange={(event) => setEventForm((current) => ({ ...current, description: event.target.value }))} /><TextField type="date" label="开始时间" value={eventForm.start_at} onChange={(event) => setEventForm((current) => ({ ...current, start_at: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /><TextField type="date" label="结束时间" value={eventForm.end_at} onChange={(event) => setEventForm((current) => ({ ...current, end_at: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /><TextField label="颜色" value={eventForm.color} onChange={(event) => setEventForm((current) => ({ ...current, color: event.target.value }))} /></Stack></DialogContent>
        <DialogActions><Button onClick={() => setDialog(null)}>取消</Button><Button variant="contained" onClick={() => void saveEvent()}>保存</Button></DialogActions>
      </Dialog>

      <Drawer anchor="right" open={Boolean(detailTransaction)} onClose={() => setDetailTransaction(null)}>
        {detailTransaction && (
          <Box sx={{ width: { xs: 320, sm: 420 }, p: 2 }}>
            <Typography variant="h6">交易详情</Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1.5}>
              <Typography><strong>金额:</strong> {txAmount(detailTransaction)}</Typography>
              <Typography><strong>类型:</strong> {typeLabel(detailTransaction.type)}</Typography>
              <Typography><strong>分类:</strong> {detailTransaction.category?.name ?? '未分类'}</Typography>
              <Typography><strong>账户:</strong> {detailTransaction.account?.name ?? '账户'}</Typography>
              <Typography><strong>日期:</strong> {formatDate(detailTransaction.occurred_at)}</Typography>
              <Typography><strong>备注:</strong> {detailTransaction.note || '无备注'}</Typography>
              <Typography><strong>关联待办:</strong> {detailTransaction.linked_todos.length || 0} 个</Typography>
              <Typography><strong>拆分项:</strong> {detailTransaction.split_items.length || 0} 个</Typography>
              <Typography><strong>附件:</strong> {detailTransaction.attachments.length || 0} 个</Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              <Button onClick={() => setDetailTransaction(null)}>关闭</Button>
              <Button color="error" onClick={() => void deleteTransaction(detailTransaction)}>删除</Button>
              <Button variant="contained" onClick={() => openTransactionDialog(detailTransaction)}>编辑</Button>
            </Stack>
          </Box>
        )}
      </Drawer>

      <Snackbar open={Boolean(toast)} autoHideDuration={2600} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
