import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import type { APITag } from '@/lib/types';

interface TaskToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'incomplete' | 'completed';
  onStatusChange: (value: 'all' | 'incomplete' | 'completed') => void;
  priorityFilter: 'all' | number;
  onPriorityChange: (value: 'all' | number) => void;
  tagFilter: number | null;
  onTagFilterChange: (value: number | null) => void;
  allTags: APITag[];
  multiSelectMode: boolean;
  onToggleMultiSelect: () => void;
  onNewTask: () => void;
}

export default function TaskToolbar({
  searchQuery, onSearchChange, statusFilter, onStatusChange,
  priorityFilter, onPriorityChange, tagFilter, onTagFilterChange,
  allTags, multiSelectMode, onToggleMultiSelect, onNewTask,
}: TaskToolbarProps) {
  const selectedTagValue = tagFilter === null ? '' : String(tagFilter);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2, minHeight: 42, flexWrap: 'wrap' }}>
      <TextField placeholder="搜索任务…" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} size="small"
        slotProps={{ input: { startAdornment: <InputAdornment position="start">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'oklch(40% 0.02 275)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </InputAdornment> } }}
        sx={{ flex: 1, minWidth: 200, maxWidth: 480, '& .MuiOutlinedInput-root': { borderRadius: 7, height: 42, bgcolor: 'background.paper' } }}
      />

      <ToggleButtonGroup value={statusFilter} exclusive onChange={(_, val) => val && onStatusChange(val)} size="small" sx={{ height: 36, flexShrink: 0 }}>
        <ToggleButton value="all">全部</ToggleButton>
        <ToggleButton value="incomplete">未完成</ToggleButton>
        <ToggleButton value="completed">已完成</ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup value={priorityFilter} exclusive onChange={(_, val) => val !== null && onPriorityChange(val)} size="small" sx={{ height: 36, flexShrink: 0 }}>
        <ToggleButton value="all">所有优先级</ToggleButton>
        <ToggleButton value={1}>
          <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'error.main', mr: 0.5 }} />高
        </ToggleButton>
        <ToggleButton value={2}>
          <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'warning.main', mr: 0.5 }} />中
        </ToggleButton>
        <ToggleButton value={3}>
          <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'oklch(82% 0.01 275)', mr: 0.5 }} />低
        </ToggleButton>
      </ToggleButtonGroup>

      <Select value={selectedTagValue} onChange={(e) => onTagFilterChange(e.target.value === '' ? null : Number(e.target.value))} displayEmpty size="small"
        sx={{ height: 36, minWidth: 120, flexShrink: 0, fontSize: '0.8125rem', fontWeight: 500,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'oklch(82% 0.01 275)', borderWidth: '1.5px' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'oklch(82% 0.01 275)' },
          borderRadius: 7 }}
        MenuProps={{ slotProps: { paper: { sx: { borderRadius: 2 } } } }}>
        <MenuItem value=""><em>按标签筛选</em></MenuItem>
        {allTags.map((tag) => <MenuItem key={tag.id} value={String(tag.id)}>#{tag.name}</MenuItem>)}
      </Select>

      <Button variant="contained" startIcon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>} onClick={onNewTask} sx={{ height: 36, px: 2.25, flexShrink: 0, fontSize: '0.8125rem' }}>
        新建任务
      </Button>

      <Button variant="outlined" onClick={onToggleMultiSelect}
        sx={{ height: 36, px: 2.25, flexShrink: 0, fontSize: '0.8125rem',
          borderColor: multiSelectMode ? 'primary.main' : 'oklch(82% 0.01 275)',
          color: multiSelectMode ? 'oklch(20% 0.10 285)' : 'text.secondary',
          bgcolor: multiSelectMode ? 'oklch(90% 0.08 285)' : 'transparent',
          '&:hover': { bgcolor: multiSelectMode ? 'oklch(90% 0.08 285)' : 'oklch(93% 0.01 275)', borderColor: multiSelectMode ? 'primary.main' : 'oklch(82% 0.01 275)' },
      }}>
        多选
      </Button>
    </Box>
  );
}
