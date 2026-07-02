'use client';

import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import dayjs, { type Dayjs } from 'dayjs';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { DATE_PICKER_DISPLAY_FORMAT } from '@/lib/dateFormats';
import { deleteFocusSession, listFocusSessions, updateFocusSession } from '@/lib/api/focus';
import type {
  FocusFolderOut,
  FocusMode,
  FocusSessionOut,
  FocusSessionUpdate,
  FocusTag,
} from '@/lib/focusTypes';
import FocusSessionEditDialog from './FocusSessionEditDialog';
import { formatDuration } from './focusUtils';

interface FocusRecordsProps {
  folders: FocusFolderOut[];
  tags: FocusTag[];
  refreshKey: number;
  onChanged: () => void;
  onCreateTag: (name: string) => Promise<FocusTag>;
}

type ModeFilter = 'all' | FocusMode;
type StatusFilter = 'all' | 'completed' | 'abandoned';
type FolderFilter = 'all' | 'unfiled' | string;

const ALL_FOLDER_FILTER = 'all';
const UNFILED_FOLDER_FILTER = 'unfiled';

interface FolderNavItem {
  id: string;
  label: string;
  depth: number;
}

function buildFolderNavItems(folders: FocusFolderOut[], depth = 0): FolderNavItem[] {
  return folders.flatMap((folder) => [
    { id: String(folder.id), label: folder.name, depth },
    ...buildFolderNavItems(folder.children ?? [], depth + 1),
  ]);
}

function FolderFilterButton({
  active,
  depth = 0,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  depth?: number;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      fullWidth
      variant="text"
      startIcon={icon}
      onClick={onClick}
      sx={{
        justifyContent: 'flex-start',
        minHeight: 36,
        px: 1.25,
        pl: 1.25 + depth * 1.5,
        borderRadius: 2,
        color: active ? 'primary.main' : 'text.primary',
        bgcolor: active ? 'action.selected' : 'transparent',
        fontWeight: active ? 800 : 600,
        textTransform: 'none',
        '&:hover': { bgcolor: active ? 'action.selected' : 'action.hover' },
        '& .MuiButton-startIcon': {
          color: active ? 'primary.main' : 'text.secondary',
          mr: 0.75,
        },
      }}
    >
      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
    </Button>
  );
}

export default function FocusRecords({
  folders,
  tags,
  refreshKey,
  onChanged,
  onCreateTag,
}: FocusRecordsProps) {
  const folderItems = useMemo(() => buildFolderNavItems(folders), [folders]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<ModeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [folderFilter, setFolderFilter] = useState<FolderFilter>(ALL_FOLDER_FILTER);
  const [tagId, setTagId] = useState('');
  const [startedFrom, setStartedFrom] = useState<Dayjs | null>(null);
  const [startedTo, setStartedTo] = useState<Dayjs | null>(null);
  const [sessions, setSessions] = useState<FocusSessionOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FocusSessionOut | null>(null);
  const [editTarget, setEditTarget] = useState<FocusSessionOut | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const selectedFolderId = folderFilter !== ALL_FOLDER_FILTER && folderFilter !== UNFILED_FOLDER_FILTER
          ? Number(folderFilter)
          : undefined;
        const result = await listFocusSessions({
          search: search.trim() || undefined,
          mode: mode === 'all' ? undefined : mode,
          abandoned: status === 'all' ? undefined : status === 'abandoned',
          folder_id: selectedFolderId,
          tag_id: tagId ? Number(tagId) : undefined,
          started_from: startedFrom ? startedFrom.format('YYYY-MM-DD') : undefined,
          started_to: startedTo ? startedTo.format('YYYY-MM-DD') : undefined,
          limit: 500,
        });
        const visibleItems = folderFilter === UNFILED_FOLDER_FILTER
          ? result.items.filter((session) => session.folder_id === null)
          : result.items;
        setSessions(visibleItems);
        setTotal(folderFilter === UNFILED_FOLDER_FILTER ? visibleItems.length : result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载专注记录失败');
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [folderFilter, mode, refreshKey, search, startedFrom, startedTo, status, tagId]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFocusSession(deleteTarget.id);
      setDeleteTarget(null);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除记录失败');
    }
  };

  const handleEditSave = async (payload: FocusSessionUpdate) => {
    if (!editTarget) return;
    setEditSaving(true);
    setError(null);
    try {
      await updateFocusSession(editTarget.id, payload);
      setEditTarget(null);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新记录失败');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.625rem', color: 'text.primary', mb: 0.5 }}>
            专注记录
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            共 {total} 条记录
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '220px minmax(0, 1fr)' }, gap: 2, alignItems: 'start' }}>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            p: 1.25,
            bgcolor: 'background.paper',
            position: { lg: 'sticky' },
            top: { lg: 16 },
          }}
        >
          <Typography sx={{ px: 1, pb: 1, fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary' }}>
            文件夹
          </Typography>
          <Stack spacing={0.25}>
            <FolderFilterButton
              active={folderFilter === ALL_FOLDER_FILTER}
              icon={<Inventory2RoundedIcon fontSize="small" />}
              label="全部记录"
              onClick={() => setFolderFilter(ALL_FOLDER_FILTER)}
            />
            <FolderFilterButton
              active={folderFilter === UNFILED_FOLDER_FILTER}
              icon={<FolderRoundedIcon fontSize="small" />}
              label="未整理"
              onClick={() => setFolderFilter(UNFILED_FOLDER_FILTER)}
            />
            {folderItems.map((folder) => (
              <FolderFilterButton
                key={folder.id}
                active={folderFilter === folder.id}
                depth={folder.depth}
                icon={<FolderRoundedIcon fontSize="small" />}
                label={folder.label}
                onClick={() => setFolderFilter(folder.id)}
              />
            ))}
          </Stack>
        </Paper>

        <Box sx={{ minWidth: 0 }}>
          <Paper variant="outlined" sx={{ borderRadius: 2, px: 2, py: 1.75, display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center', mb: 2, bgcolor: 'background.paper' }}>
            <TextField
              size="small"
              placeholder="搜索名称或复盘..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 220 } }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="focus-mode-filter-label">模式</InputLabel>
              <Select labelId="focus-mode-filter-label" label="模式" value={mode} onChange={(event) => setMode(event.target.value as ModeFilter)}>
                <MenuItem value="all">全部模式</MenuItem>
                <MenuItem value="pomodoro">番茄钟</MenuItem>
                <MenuItem value="free">自由计时</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="focus-status-filter-label">状态</InputLabel>
              <Select labelId="focus-status-filter-label" label="状态" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
                <MenuItem value="all">全部状态</MenuItem>
                <MenuItem value="completed">已完成</MenuItem>
                <MenuItem value="abandoned">已放弃</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel id="focus-tag-filter-label">标签</InputLabel>
              <Select labelId="focus-tag-filter-label" label="标签" value={tagId} onChange={(event) => setTagId(event.target.value)}>
                <MenuItem value="">全部标签</MenuItem>
                {tags.map((tag) => <MenuItem key={tag.id} value={String(tag.id)}>{tag.name}</MenuItem>)}
              </Select>
            </FormControl>
            <DatePicker
              label="开始日期"
              value={startedFrom}
              onChange={setStartedFrom}
              format={DATE_PICKER_DISPLAY_FORMAT}
              slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
            />
            <DatePicker
              label="结束日期"
              value={startedTo}
              onChange={setStartedTo}
              format={DATE_PICKER_DISPLAY_FORMAT}
              slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
            />
          </Paper>

          {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <CircularProgress />
            </Box>
          ) : sessions.length === 0 ? (
            <Paper variant="outlined" sx={{ borderRadius: 2, p: 6, textAlign: 'center', bgcolor: 'background.paper' }}>
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>暂无专注记录</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>完成一次计时后会出现在这里.</Typography>
            </Paper>
          ) : (
            <Stack spacing={1.25}>
              {sessions.map((session) => (
                <Paper key={session.id} variant="outlined" sx={{ borderRadius: 2, p: 1.75, bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75, flexWrap: 'wrap', rowGap: 0.75 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem' }}>{session.name}</Typography>
                        <Chip size="small" label={session.mode === 'pomodoro' ? '番茄钟' : '自由计时'} color={session.mode === 'pomodoro' ? 'primary' : 'default'} />
                        {session.abandoned && <Chip size="small" label="已放弃" color="error" variant="outlined" />}
                      </Stack>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        {dayjs(session.started_at).format('YYYY-MM-DD HH:mm')} · {session.folder_name || '未整理'}
                      </Typography>
                      {session.tags.length > 0 && (
                        <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 0.75 }}>
                          {session.tags.map((tag) => <Chip key={tag.id} size="small" label={`#${tag.name}`} />)}
                        </Stack>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ color: session.abandoned ? 'text.secondary' : 'primary.main', fontWeight: 900, fontSize: '1.25rem' }}>
                          {formatDuration(session.focus_seconds)}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.6875rem' }}>
                          暂停 {session.pause_count} 次
                        </Typography>
                      </Box>
                      <Button variant="text" size="small" startIcon={<EditRoundedIcon />} onClick={() => setEditTarget(session)}>
                        编辑
                      </Button>
                      <Button color="error" variant="text" size="small" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setDeleteTarget(session)}>
                        删除
                      </Button>
                    </Stack>
                  </Box>
                  {session.summary && (
                    <Box sx={{ mt: 1.25, pt: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem', lineHeight: 1.7 }}>
                        {session.summary}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除专注记录?"
        message={<>确定要删除 <strong>{deleteTarget?.name}</strong> 吗? 此操作不可撤销.</>}
        confirmLabel="删除"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <FocusSessionEditDialog
        open={!!editTarget}
        session={editTarget}
        folders={folders}
        tags={tags}
        saving={editSaving}
        onClose={() => setEditTarget(null)}
        onSave={handleEditSave}
        onCreateTag={onCreateTag}
      />
    </Box>
  );
}
