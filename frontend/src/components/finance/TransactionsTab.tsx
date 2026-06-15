'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FilterBar, { ALL_TAG_FILTER_VALUE } from './Transactions/FilterBar';
import TransactionRow from './Transactions/TransactionRow';
import type { TransactionOut, AccountOut, CategoryOut, FinanceTagOut } from '@/lib/financeTypes';

interface TransactionsTabProps {
  transactions: TransactionOut[];
  total: number;
  accounts: AccountOut[];
  categories: CategoryOut[];
  tags: FinanceTagOut[];
  onNewTransaction?: () => void;
  onRowClick?: (tx: TransactionOut) => void;
}

export default function TransactionsTab({
  transactions, total, accounts, categories, tags, onNewTransaction, onRowClick,
}: TransactionsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('全部');
  const [accountFilter, setAccountFilter] = useState('全部账户');
  const [categoryFilter, setCategoryFilter] = useState('全部分类');
  const [tagFilter, setTagFilter] = useState(ALL_TAG_FILTER_VALUE);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter === '支出' && tx.type !== 'expense') return false;
      if (typeFilter === '收入' && tx.type !== 'income') return false;
      if (typeFilter === '转账' && tx.type !== 'transfer') return false;
      if (accountFilter !== '全部账户' && tx.account?.name !== accountFilter) return false;
      if (categoryFilter !== '全部分类' && tx.category?.name !== categoryFilter) return false;
      if (tagFilter !== ALL_TAG_FILTER_VALUE && !tx.tags?.some((tag) => String(tag.id) === tagFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNote = tx.note?.toLowerCase().includes(q);
        const matchCat = tx.category?.name?.toLowerCase().includes(q);
        const matchTag = tx.tags?.some((tag) => tag.name.toLowerCase().includes(q));
        if (!matchNote && !matchCat && !matchTag) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, accountFilter, categoryFilter, tagFilter, searchQuery]);

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>交易记录</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>日常账本 · 共 {total} 笔交易</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={onNewTransaction}
          sx={{ borderRadius: 2.5, px: 2.75, py: 1, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none', height: 40 }}>
          + 记一笔
        </Button>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ mb: 2 }}>
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          accounts={accounts}
          accountFilter={accountFilter}
          onAccountFilterChange={setAccountFilter}
          categories={categories}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          tags={tags}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
        />
      </Box>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 8, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '2rem', mb: 1 }}>💳</Typography>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>暂无交易记录</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 2 }}>点击“记一笔”开始记录</Typography>
          <Button variant="contained" size="small" onClick={onNewTransaction} sx={{ borderRadius: 2 }}>记一笔</Button>
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
          {filtered.map((tx, i) => (
            <Box key={tx.id} sx={{ cursor: 'pointer' }} onClick={() => onRowClick?.(tx)}>
              {i > 0 && <Divider sx={{ mx: 2.25 }} />}
              <TransactionRow transaction={tx} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
