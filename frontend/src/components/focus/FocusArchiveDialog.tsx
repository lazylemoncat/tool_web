'use client';

import { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import type { APITag, FolderOut } from '@/lib/types';
import type { FocusMode, FocusSessionCreate } from '@/lib/focusTypes';
import FocusTagPicker from './FocusTagPicker';
import { flattenFolders, formatDuration } from './focusUtils';

export interface PendingFocusSession {
  name: string;
  mode: FocusMode;
  plannedSeconds: number | null;
  focusSeconds: number;
  pauseCount: number;
  pauseSeconds: number;
  restSeconds: number;
  startedAt: string;
  endedAt: string;
  folderId: number | null;
  abandoned: boolean;
}

interface FocusArchiveDialogProps {
  open: boolean;
  pending: PendingFocusSession | null;
  folders: FolderOut[];
  tags: APITag[];
  initialTagIds?: string[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: FocusSessionCreate) => Promise<void>;
  onCreateTag: (name: string) => Promise<APITag>;
}

export default function FocusArchiveDialog({
  open,
  pending,
  folders,
  tags,
  initialTagIds,
  saving,
  onClose,
  onSave,
  onCreateTag,
}: FocusArchiveDialogProps) {
  const folderOptions = useMemo(() => flattenFolders(folders), [folders]);
  const [name, setName] = useState('');
  const [folderId, setFolderId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (!pending) return;
    // Archive form resets from the completed timer payload whenever it opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(pending.name || '未命名专注');
    setFolderId(pending.folderId ? String(pending.folderId) : '');
    setSelectedTagIds([...(initialTagIds ?? [])]);
    setSummary('');
  }, [initialTagIds, pending]);

  const buildPayload = (includeReview: boolean): FocusSessionCreate | null => {
    if (!pending) return null;
    return {
      name: name.trim() || '未命名专注',
      mode: pending.mode,
      planned_seconds: pending.plannedSeconds,
      focus_seconds: pending.focusSeconds,
      pause_count: pending.pauseCount,
      pause_seconds: pending.pauseSeconds,
      rest_seconds: pending.restSeconds,
      folder_id: folderId ? Number(folderId) : null,
      tag_ids: selectedTagIds.map(Number),
      summary: includeReview && summary.trim() ? summary.trim() : null,
      started_at: pending.startedAt,
      ended_at: pending.endedAt,
      abandoned: pending.abandoned,
    };
  };

  const handleSave = async (includeReview: boolean) => {
    const payload = buildPayload(includeReview);
    if (!payload) return;
    await onSave(payload);
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography component="span" variant="h2" sx={{ fontSize: '1.125rem' }}>
          归档本次专注
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {pending && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', color: 'text.secondary', fontSize: '0.75rem' }}>
            <Box component="span">专注 {formatDuration(pending.focusSeconds)}</Box>
            <Box component="span">暂停 {pending.pauseCount} 次</Box>
            {pending.restSeconds > 0 && <Box component="span">休息 {formatDuration(pending.restSeconds)}</Box>}
          </Box>
        )}

        <TextField
          label="专注名称"
          value={name}
          onChange={(event) => setName(event.target.value)}
          size="small"
          fullWidth
        />

        <FormControl size="small" fullWidth>
          <InputLabel id="focus-archive-folder-label">文件夹</InputLabel>
          <Select
            labelId="focus-archive-folder-label"
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
          id="focus-archive-tags"
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
          minRows={4}
          placeholder="记录本次专注的产出, 分心原因或下一步计划"
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button disabled={saving} onClick={onClose} variant="text" sx={{ color: 'text.secondary' }}>
          取消
        </Button>
        <Button disabled={saving} onClick={() => handleSave(false)} variant="outlined">
          稍后整理
        </Button>
        <Button
          disabled={saving}
          onClick={() => handleSave(true)}
          variant="contained"
          startIcon={<SaveRoundedIcon />}
        >
          保存记录
        </Button>
      </DialogActions>
    </Dialog>
  );
}
