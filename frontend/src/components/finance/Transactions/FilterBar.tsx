'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { AccountOut, CategoryOut } from '@/lib/financeTypes';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
  accounts: AccountOut[];
  accountFilter: string;
  onAccountFilterChange: (v: string) => void;
  categories: CategoryOut[];
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
}

const TYPE_OPTIONS = ['全部', '支出', '收入', '转账'];

export default function FilterBar({
  searchQuery, onSearchChange, typeFilter, onTypeFilterChange,
  accounts, accountFilter, onAccountFilterChange,
  categories, categoryFilter, onCategoryFilterChange,
}: FilterBarProps) {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, px: 2, py: 1.75, display: 'flex', alignItems: 'center', gap: 1.25, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid', borderColor: '#EDECF0' }}>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F3F4F6', borderRadius: 2, px: 1.75, height: 38, border: '1px solid transparent' }}>
        <Typography sx={{ fontSize: '0.875rem', color: '#9CA3AF', flexShrink: 0 }}>🔍</Typography>
        <Box component="input" placeholder="搜索备注..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.75rem', color: '#1E1C24', width: '100%', fontFamily: 'inherit' }} />
      </Box>

      {/* Type filter */}
      <Box sx={{ display: 'flex', bgcolor: '#F3F4F6', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
        {TYPE_OPTIONS.map((t) => {
          const isActive = typeFilter === t;
          return (
            <Typography key={t} onClick={() => onTypeFilterChange(t)}
              sx={{ px: 1.625, py: 0.75, fontSize: '0.6875rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'primary.main' : 'text.secondary', bgcolor: isActive ? '#EEECFF' : 'transparent', cursor: 'pointer', transition: 'all 0.15s', '&:not(:last-child)': { borderRight: '1px solid', borderColor: '#E0DEE5' }, userSelect: 'none' }}>
              {t}
            </Typography>
          );
        })}
      </Box>

      {/* Account filter */}
      <Box component="select" value={accountFilter} onChange={(e) => onAccountFilterChange(e.target.value)}
        style={{ padding: '7px 12px', fontSize: '0.6875rem', color: '#636068', border: '1px solid #EDECF0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
        <option>全部账户</option>
        {accounts.map((a) => <option key={a.id}>{a.name}</option>)}
      </Box>

      {/* Category filter */}
      <Box component="select" value={categoryFilter} onChange={(e) => onCategoryFilterChange(e.target.value)}
        style={{ padding: '7px 12px', fontSize: '0.6875rem', color: '#636068', border: '1px solid #EDECF0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
        <option>全部分类</option>
        {categories.map((c) => <option key={c.id}>{c.name}</option>)}
      </Box>

      <Typography sx={{ fontSize: '0.875rem', color: '#9CA3AF', cursor: 'pointer', flexShrink: 0, px: 0.5 }}>⚙</Typography>
    </Box>
  );
}
