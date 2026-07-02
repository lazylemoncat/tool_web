'use client';

import { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import type {
  FocusFolderOut,
  FocusMode,
  FocusSessionOut,
  FocusSessionUpdate,
  FocusTag,
} from '@/lib/focusTypes';
import FocusTagPicker from './FocusTagPicker';
import { flattenFolders } from './focusUtils';

interface FocusSessionEditDialogProps {
  open: boolean;
  session: FocusSessionOut | null;
  folders: FocusFolderOut[];
  tags: FocusTag[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: FocusSessionUpdate) => Promise<void>;
  onCreateTag: (name: string) => Promise<FocusTag>;
}

function secondsToMinutes(seconds: number | null | undefined): string {
  if (!seconds) return '';
  return String(Math.round(seconds / 60));
}

function minutesToSeconds(value: string): number {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes < 0) return 0;
  return Math.round(minutes * 60);
}

export default function FocusSessionEditDialog({
  open,
  session,
  folders,
  tags,
  saving,
  onClose,
  onSave,
  onCreateTag,
}: FocusSessionEditDialogProps) {
  const folderOptions = useMemo(() => flattenFolders(folders), [folders]);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [plannedMinutes, setPlannedMinutes] = useState('');
  const [focusMinutes, setFocusMinutes] = useState('');
  const [pauseCount, setPauseCount] = useState('0');
  const [pauseMinutes, setPauseMinutes] = useState('0');
  const [restMinutes, setRestMinutes] = useState('0');
  const [folderId, setFolderId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [abandoned, setAbandoned] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !session) return;
    // Edit form mirrors the selected persisted record each time it opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(session.name);
    setMode(session.mode);
    setPlannedMinutes(secondsToMinutes(session.planned_seconds));
    setFocusMinutes(secondsToMinutes(session.focus_seconds));
    setPauseCount(String(session.pause_count));
    setPauseMinutes(secondsToMinutes(session.pause_seconds) || '0');
    setRestMinutes(secondsToMinutes(session.rest_seconds) || '0');
    setFolderId(session.folder_id ? String(session.folder_id) : '');
    setSelectedTagIds(session.tags.map((tag) => String(tag.id)));
    setSummary(session.summary ?? '');
    setAbandoned(session.abandoned);
    setError('');
  }, [open, session]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('请输入专注名称');
      return;
    }

    setError('');
    await onSave({
      name: name.trim(),
      mode,
      planned_seconds: mode === 'pomodoro' ? minutesToSeconds(plannedMinutes) : null,
      focus_seconds: minutesToSeconds(focusMinutes),
      pause_count: Math.max(0, Math.round(Number(pauseCount) || 0)),
      pause_seconds: minutesToSeconds(pauseMinutes),
      rest_seconds: minutesToSeconds(restMinutes),
      folder_id: folderId ? Number(folderId) : null,
      tag_ids: selectedTagIds.map(Number),
      summary: summary.trim() || null,
      abandoned,
    });
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography component="span" variant="h2" sx={{ fontSize: '1.125rem' }}>
          编辑专注记录
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {error && (
          <Typography sx={{ color: 'error.main', fontSize: '0.8125rem' }}>
            {error}
          </Typography>
        )}

        <TextField
          label="专注名称"
          value={name}
          onChange={(event) => setName(event.target.value)}
          size="small"
          fullWidth
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel id="focus-edit-mode-label">模式</InputLabel>
            <Select
              labelId="focus-edit-mode-label"
              label="模式"
              value={mode}
              onChange={(event) => setMode(event.target.value as FocusMode)}
            >
              <MenuItem value="pomodoro">番茄钟</MenuItem>
              <MenuItem value="free">自由计时</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="计划分钟"
            size="small"
            value={plannedMinutes}
            disabled={mode !== 'pomodoro'}
            onChange={(event) => setPlannedMinutes(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
            sx={{ flex: 1 }}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            label="专注分钟"
            size="small"
            value={focusMinutes}
            onChange={(event) => setFocusMinutes(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="暂停次数"
            size="small"
            value={pauseCount}
            onChange={(event) => setPauseCount(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
            sx={{ flex: 1 }}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            label="暂停分钟"
            size="small"
            value={pauseMinutes}
            onChange={(event) => setPauseMinutes(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="休息分钟"
            size="small"
            value={restMinutes}
            onChange={(event) => setRestMinutes(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
            sx={{ flex: 1 }}
          />
        </Stack>

        <FormControl size="small" fullWidth>
          <InputLabel id="focus-edit-folder-label">文件夹</InputLabel>
          <Select
            labelId="focus-edit-folder-label"
            label="文件夹"
            value={folderId}
            onChange={(event) => setFolderId(event.target.value)}
          >
            <MenuItem value="">未整理</MenuItem>
            {folderOptions.map((folder) => (
              <MenuItem key={folder.id} value={String(folder.id)}>
                {folder.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FocusTagPicker
          id="focus-edit-tags"
          label="标签"
          tags={tags}
          selectedTagIds={selectedTagIds}
          onChange={setSelectedTagIds}
          onCreateTag={onCreateTag}
        />

        <TextField
          label="复盘"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          multiline
          minRows={3}
          fullWidth
        />

        <FormControlLabel
          control={<Checkbox checked={abandoned} onChange={(event) => setAbandoned(event.target.checked)} />}
          label="标记为已放弃"
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button disabled={saving} onClick={onClose} variant="text" sx={{ color: 'text.secondary' }}>
          取消
        </Button>
        <Button
          disabled={saving}
          onClick={() => void handleSave()}
          variant="contained"
          startIcon={<SaveRoundedIcon />}
        >
          保存修改
        </Button>
      </DialogActions>
    </Dialog>
  );
}
