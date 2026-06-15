'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import InputAdornment from '@mui/material/InputAdornment';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
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
}

const TYPE_OPTIONS = ['全部', '支出', '收入', '转账'];
export const ALL_TAG_FILTER_VALUE = '__all_tags__';

export default function FilterBar({
  searchQuery, onSearchChange, typeFilter, onTypeFilterChange,
  accounts, accountFilter, onAccountFilterChange,
  categories, categoryFilter, onCategoryFilterChange,
  tags, tagFilter, onTagFilterChange,
}: FilterBarProps) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        px: 2,
        py: 1.75,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        flexWrap: { xs: 'wrap', lg: 'nowrap' },
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <TextField
        label="搜索备注"
        placeholder="搜索备注, 分类或标签"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        size="small"
        sx={{ flex: 1, minWidth: { xs: '100%', sm: 220 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <ToggleButtonGroup
        value={typeFilter}
        exclusive
        size="small"
        aria-label="交易类型筛选"
        onChange={(_, value: string | null) => {
          if (value) onTypeFilterChange(value);
        }}
        sx={{ flexShrink: 0, height: 40 }}
      >
        {TYPE_OPTIONS.map((type) => (
          <ToggleButton key={type} value={type} aria-label={`筛选${type}交易`}>
            {type}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <TextField
        select
        label="账户"
        value={accountFilter}
        onChange={(event) => onAccountFilterChange(event.target.value)}
        size="small"
        sx={{ minWidth: 136, flexShrink: 0 }}
      >
        <MenuItem value="全部账户">全部账户</MenuItem>
        {accounts.map((account) => (
          <MenuItem key={account.id} value={account.name}>{account.name}</MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="分类"
        value={categoryFilter}
        onChange={(event) => onCategoryFilterChange(event.target.value)}
        size="small"
        sx={{ minWidth: 136, flexShrink: 0 }}
      >
        <MenuItem value="全部分类">全部分类</MenuItem>
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.name}>{category.name}</MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="标签"
        value={tagFilter}
        onChange={(event) => onTagFilterChange(event.target.value)}
        size="small"
        sx={{ minWidth: 136, flexShrink: 0 }}
      >
        <MenuItem value={ALL_TAG_FILTER_VALUE}>全部标签</MenuItem>
        {tags.map((tag) => (
          <MenuItem key={tag.id} value={String(tag.id)}>{tag.name}</MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
