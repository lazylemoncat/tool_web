'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { DATE_PICKER_DISPLAY_FORMAT } from '@/lib/dateFormats';
import type { AccountOut, CategoryOut, FinanceTagOut } from '@/lib/financeTypes';

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
  tags: FinanceTagOut[];
  tagFilter: string;
  onTagFilterChange: (v: string) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
}

const TYPE_OPTIONS = ['全部', '支出', '收入', '转账'];
export const ALL_TAG_FILTER_VALUE = '__all_tags__';
const selectSx = {
  py: '7px',
  px: '12px',
  fontSize: '0.6875rem',
  color: 'text.secondary',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '8px',
  bgcolor: 'background.paper',
  cursor: 'pointer',
  fontFamily: 'inherit',
  flexShrink: 0,
  outline: 'none',
  '&:hover': { borderColor: 'text.secondary' },
  '&:focus': { borderColor: 'primary.main' },
};

export default function FilterBar({
  searchQuery, onSearchChange, typeFilter, onTypeFilterChange,
  accounts, accountFilter, onAccountFilterChange,
  categories, categoryFilter, onCategoryFilterChange,
  tags, tagFilter, onTagFilterChange,
  startDate, onStartDateChange, endDate, onEndDateChange,
}: FilterBarProps) {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, px: 2, py: 1.75, display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: { xs: 'wrap', lg: 'nowrap' }, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 220 }, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'action.hover', borderRadius: 2, px: 1.75, height: 38, border: '1px solid transparent' }}>
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', flexShrink: 0 }}>🔍</Typography>
        <Box component="input" placeholder="搜索备注..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
          sx={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.75rem', color: 'text.primary', width: '100%', fontFamily: 'inherit', '::placeholder': { color: 'text.secondary' } }} />
      </Box>

      {/* Type filter */}
      <Box sx={{ display: 'flex', bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
        {TYPE_OPTIONS.map((t) => {
          const isActive = typeFilter === t;
          return (
            <Typography key={t} onClick={() => onTypeFilterChange(t)}
              sx={{ px: 1.625, py: 0.75, fontSize: '0.6875rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'primary.main' : 'text.secondary', bgcolor: isActive ? 'action.selected' : 'transparent', cursor: 'pointer', transition: 'all 0.15s', '&:not(:last-child)': { borderRight: '1px solid', borderColor: 'divider' }, userSelect: 'none' }}>
              {t}
            </Typography>
          );
        })}
      </Box>

      <DatePicker
        label="开始日期"
        value={startDate ? dayjs(startDate) : null}
        onChange={(date) => onStartDateChange(date ? date.format('YYYY-MM-DD') : '')}
        format={DATE_PICKER_DISPLAY_FORMAT}
        slotProps={{ textField: { size: 'small', sx: { width: 136, flexShrink: 0 } } }}
      />

      <DatePicker
        label="结束日期"
        value={endDate ? dayjs(endDate) : null}
        onChange={(date) => onEndDateChange(date ? date.format('YYYY-MM-DD') : '')}
        format={DATE_PICKER_DISPLAY_FORMAT}
        slotProps={{ textField: { size: 'small', sx: { width: 136, flexShrink: 0 } } }}
      />

      {(startDate || endDate) && (
        <Button
          size="small"
          variant="text"
          onClick={() => {
            onStartDateChange('');
            onEndDateChange('');
          }}
          sx={{ flexShrink: 0, minWidth: 0, px: 1, fontSize: '0.6875rem', color: 'text.secondary' }}
        >
          清除日期
        </Button>
      )}

      {/* Account filter */}
      <Box component="select" value={accountFilter} onChange={(e) => onAccountFilterChange(e.target.value)}
        sx={selectSx}>
        <option>全部账户</option>
        {accounts.map((a) => <option key={a.id}>{a.name}</option>)}
      </Box>

      {/* Category filter */}
      <Box component="select" value={categoryFilter} onChange={(e) => onCategoryFilterChange(e.target.value)}
        sx={selectSx}>
        <option>全部分类</option>
        {categories.map((c) => <option key={c.id}>{c.name}</option>)}
      </Box>

      {/* Tag filter */}
      <Box component="select" value={tagFilter} onChange={(e) => onTagFilterChange(e.target.value)}
        sx={selectSx}>
        <option value={ALL_TAG_FILTER_VALUE}>全部标签</option>
        {tags.map((tag) => <option key={tag.id} value={String(tag.id)}>{tag.name}</option>)}
      </Box>

      <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', cursor: 'pointer', flexShrink: 0, px: 0.5 }}>⚙</Typography>
    </Box>
  );
}
