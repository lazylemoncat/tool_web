'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { createFocusSession } from '@/lib/api/focus';
import type { APITag, FolderOut } from '@/lib/types';
import type { FocusMode, FocusSessionCreate } from '@/lib/focusTypes';
import FocusArchiveDialog, { type PendingFocusSession } from './FocusArchiveDialog';
import FocusTagPicker from './FocusTagPicker';
import { flattenFolders, formatClock, formatDuration, formatElapsed } from './focusUtils';

type TimerStatus = 'idle' | 'counting' | 'paused' | 'completed' | 'rest';

interface FocusTimerProps {
  folders: FolderOut[];
  tags: APITag[];
  onSessionSaved: (message: string) => void;
  onCreateTag: (name: string) => Promise<APITag>;
}

interface SavedTimerState {
  mode: FocusMode;
  status: 'counting' | 'paused';
  plannedSeconds: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  pauseCount: number;
  pauseSeconds: number;
  startedAt: string;
  lastTick: number;
  pauseStartedAt: number | null;
  name: string;
  folderId: number | null;
  tagIds?: number[];
  autoRest: boolean;
}

const STORAGE_KEY = 'toolweb-focus-timer-state';
const PRESETS = [5, 15, 25, 30, 45, 60];
const DEFAULT_SECONDS = 25 * 60;
const REST_SECONDS = 15 * 60;
const RING_RADIUS = 130;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function FocusTimer({ folders, tags, onSessionSaved, onCreateTag }: FocusTimerProps) {
  const folderOptions = useMemo(() => flattenFolders(folders), [folders]);
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [plannedSeconds, setPlannedSeconds] = useState(DEFAULT_SECONDS);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_SECONDS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [pauseSeconds, setPauseSeconds] = useState(0);
  const [sessionName, setSessionName] = useState('');
  const [folderId, setFolderId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [autoRest, setAutoRest] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingFocusSession | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoverable, setRecoverable] = useState<SavedTimerState | null>(null);
  const [restRemaining, setRestRemaining] = useState(REST_SECONDS);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const pauseStartedAtRef = useRef<number | null>(null);
  const remainingRef = useRef(remainingSeconds);
  const elapsedRef = useRef(elapsedSeconds);
  const restRemainingRef = useRef(restRemaining);

  useEffect(() => { remainingRef.current = remainingSeconds; }, [remainingSeconds]);
  useEffect(() => { elapsedRef.current = elapsedSeconds; }, [elapsedSeconds]);
  useEffect(() => { restRemainingRef.current = restRemaining; }, [restRemaining]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const clearRestTimer = useCallback(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    restIntervalRef.current = null;
  }, []);

  const currentPauseSeconds = useCallback(() => {
    if (status !== 'paused' || pauseStartedAtRef.current === null) {
      return pauseSeconds;
    }
    return pauseSeconds + Math.floor((Date.now() - pauseStartedAtRef.current) / 1000);
  }, [pauseSeconds, status]);

  const clearSavedState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const buildPending = useCallback((options: {
    abandoned: boolean;
    focusSeconds?: number;
    restSeconds?: number;
  }): PendingFocusSession => {
    const focusSeconds = options.focusSeconds ?? (
      mode === 'pomodoro'
        ? Math.max(0, plannedSeconds - remainingRef.current)
        : elapsedRef.current
    );
    return {
      name: sessionName.trim() || '未命名专注',
      mode,
      plannedSeconds: mode === 'pomodoro' ? plannedSeconds : null,
      focusSeconds,
      pauseCount,
      pauseSeconds: currentPauseSeconds(),
      restSeconds: options.restSeconds ?? 0,
      startedAt: startedAt ?? new Date().toISOString(),
      endedAt: new Date().toISOString(),
      folderId: folderId ? Number(folderId) : null,
      abandoned: options.abandoned,
    };
  }, [currentPauseSeconds, folderId, mode, pauseCount, plannedSeconds, sessionName, startedAt]);

  const resetTimer = useCallback(() => {
    clearTimer();
    clearRestTimer();
    setStatus('idle');
    setElapsedSeconds(0);
    setPauseCount(0);
    setPauseSeconds(0);
    setStartedAt(null);
    pauseStartedAtRef.current = null;
    lastTickRef.current = null;
    if (mode === 'pomodoro') {
      setRemainingSeconds(plannedSeconds);
    } else {
      setRemainingSeconds(0);
    }
  }, [clearRestTimer, clearTimer, mode, plannedSeconds]);

  const startRest = useCallback((basePending: PendingFocusSession) => {
    setPending(basePending);
    setStatus('rest');
    setRestRemaining(REST_SECONDS);
    restRemainingRef.current = REST_SECONDS;
    restIntervalRef.current = setInterval(() => {
      const next = Math.max(0, restRemainingRef.current - 1);
      restRemainingRef.current = next;
      setRestRemaining(next);
      if (next <= 0) {
        clearRestTimer();
        setPending((previous) => previous ? { ...previous, restSeconds: REST_SECONDS } : previous);
        setArchiveOpen(true);
        setStatus('completed');
      }
    }, 1000);
  }, [clearRestTimer]);

  const completeSession = useCallback((focusSeconds?: number) => {
    clearTimer();
    const basePending = buildPending({ abandoned: false, focusSeconds });
    clearSavedState();
    if (autoRest && mode === 'pomodoro') {
      startRest(basePending);
      return;
    }
    setPending(basePending);
    setArchiveOpen(true);
    setStatus('completed');
  }, [autoRest, buildPending, clearSavedState, clearTimer, mode, startRest]);

  const startInterval = useCallback(() => {
    clearTimer();
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      if (lastTickRef.current === null) return;
      const now = Date.now();
      const delta = Math.floor((now - lastTickRef.current) / 1000);
      if (delta < 1) return;
      lastTickRef.current += delta * 1000;

      if (mode === 'pomodoro') {
        const next = Math.max(0, remainingRef.current - delta);
        remainingRef.current = next;
        setRemainingSeconds(next);
        setElapsedSeconds(Math.max(0, plannedSeconds - next));
        if (next <= 0) {
          completeSession(plannedSeconds);
        }
      } else {
        const next = elapsedRef.current + delta;
        elapsedRef.current = next;
        setElapsedSeconds(next);
      }
    }, 250);
  }, [clearTimer, completeSession, mode, plannedSeconds]);

  useEffect(() => {
    if (status !== 'counting' && status !== 'paused') return;
    if (!startedAt) return;
    const payload: SavedTimerState = {
      mode,
      status,
      plannedSeconds,
      remainingSeconds,
      elapsedSeconds,
      pauseCount,
      pauseSeconds,
      startedAt,
      lastTick: Date.now(),
      pauseStartedAt: pauseStartedAtRef.current,
      name: sessionName,
      folderId: folderId ? Number(folderId) : null,
      tagIds: selectedTagIds.map(Number),
      autoRest,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    autoRest,
    elapsedSeconds,
    folderId,
    mode,
    pauseCount,
    pauseSeconds,
    plannedSeconds,
    remainingSeconds,
    selectedTagIds,
    sessionName,
    startedAt,
    status,
  ]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedTimerState;
      if (saved.status === 'counting' || saved.status === 'paused') {
        // Recovery state is hydrated once from localStorage on mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRecoverable(saved);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    return () => {
      clearTimer();
      clearRestTimer();
    };
  }, [clearRestTimer, clearTimer]);

  const handleStart = () => {
    setError(null);
    const now = new Date().toISOString();
    setStartedAt(now);
    setStatus('counting');
    setElapsedSeconds(0);
    setPauseCount(0);
    setPauseSeconds(0);
    pauseStartedAtRef.current = null;
    if (mode === 'pomodoro') {
      setRemainingSeconds(plannedSeconds);
      remainingRef.current = plannedSeconds;
    } else {
      setRemainingSeconds(0);
      setElapsedSeconds(0);
      elapsedRef.current = 0;
    }
    startInterval();
  };

  const handlePause = () => {
    clearTimer();
    setStatus('paused');
    setPauseCount((value) => value + 1);
    pauseStartedAtRef.current = Date.now();
  };

  const handleResume = () => {
    if (pauseStartedAtRef.current !== null) {
      setPauseSeconds((value) => value + Math.floor((Date.now() - pauseStartedAtRef.current!) / 1000));
      pauseStartedAtRef.current = null;
    }
    setStatus('counting');
    startInterval();
  };

  const handleAbandon = async () => {
    setSaving(true);
    setError(null);
    try {
      const abandoned = buildPending({ abandoned: true });
      await createFocusSession({
        name: abandoned.name,
        mode: abandoned.mode,
        planned_seconds: abandoned.plannedSeconds,
        focus_seconds: abandoned.focusSeconds,
        pause_count: abandoned.pauseCount,
        pause_seconds: abandoned.pauseSeconds,
        rest_seconds: 0,
        folder_id: abandoned.folderId,
        tag_ids: selectedTagIds.map(Number),
        summary: null,
        started_at: abandoned.startedAt,
        ended_at: abandoned.endedAt,
        abandoned: true,
      });
      clearSavedState();
      resetTimer();
      setAbandonOpen(false);
      onSessionSaved('已放弃并保留记录');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存放弃记录失败');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveSave = async (payload: FocusSessionCreate) => {
    setSaving(true);
    setError(null);
    try {
      await createFocusSession(payload);
      setArchiveOpen(false);
      setPending(null);
      resetTimer();
      onSessionSaved('专注记录已保存');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存记录失败');
    } finally {
      setSaving(false);
    }
  };

  const handleRestDone = () => {
    clearRestTimer();
    const restSeconds = REST_SECONDS - restRemainingRef.current;
    setPending((previous) => previous ? { ...previous, restSeconds } : previous);
    setArchiveOpen(true);
    setStatus('completed');
  };

  const handleRecoveryResume = () => {
    if (!recoverable) return;
    const elapsedOffline = recoverable.status === 'counting'
      ? Math.max(0, Math.floor((Date.now() - recoverable.lastTick) / 1000))
      : 0;
    const restoredRemaining = recoverable.mode === 'pomodoro'
      ? Math.max(0, recoverable.remainingSeconds - elapsedOffline)
      : 0;
    const restoredElapsed = recoverable.mode === 'free'
      ? recoverable.elapsedSeconds + elapsedOffline
      : Math.max(0, recoverable.plannedSeconds - restoredRemaining);

    setMode(recoverable.mode);
    setPlannedSeconds(recoverable.plannedSeconds);
    setRemainingSeconds(restoredRemaining);
    setElapsedSeconds(restoredElapsed);
    setPauseCount(recoverable.pauseCount);
    setPauseSeconds(recoverable.pauseSeconds);
    setStartedAt(recoverable.startedAt);
    setSessionName(recoverable.name);
    setFolderId(recoverable.folderId ? String(recoverable.folderId) : '');
    setSelectedTagIds((recoverable.tagIds ?? []).map(String));
    setAutoRest(recoverable.autoRest);
    pauseStartedAtRef.current = recoverable.pauseStartedAt;
    remainingRef.current = restoredRemaining;
    elapsedRef.current = restoredElapsed;
    setRecoverable(null);

    if (recoverable.mode === 'pomodoro' && restoredRemaining <= 0) {
      setStatus('completed');
      setPending({
        name: recoverable.name || '未命名专注',
        mode: recoverable.mode,
        plannedSeconds: recoverable.plannedSeconds,
        focusSeconds: recoverable.plannedSeconds,
        pauseCount: recoverable.pauseCount,
        pauseSeconds: recoverable.pauseSeconds,
        restSeconds: 0,
        startedAt: recoverable.startedAt,
        endedAt: new Date().toISOString(),
        folderId: recoverable.folderId,
        abandoned: false,
      });
      setArchiveOpen(true);
      return;
    }

    setStatus(recoverable.status);
    if (recoverable.status === 'counting') startInterval();
  };

  const handleRecoveryArchive = () => {
    if (!recoverable) return;
    setSelectedTagIds((recoverable.tagIds ?? []).map(String));
    setPending({
      name: recoverable.name || '未命名专注',
      mode: recoverable.mode,
      plannedSeconds: recoverable.mode === 'pomodoro' ? recoverable.plannedSeconds : null,
      focusSeconds: recoverable.mode === 'pomodoro'
        ? Math.max(0, recoverable.plannedSeconds - recoverable.remainingSeconds)
        : recoverable.elapsedSeconds,
      pauseCount: recoverable.pauseCount,
      pauseSeconds: recoverable.pauseSeconds,
      restSeconds: 0,
      startedAt: recoverable.startedAt,
      endedAt: new Date().toISOString(),
      folderId: recoverable.folderId,
      abandoned: false,
    });
    setRecoverable(null);
    clearSavedState();
    setArchiveOpen(true);
  };

  const activeSeconds = mode === 'pomodoro' ? remainingSeconds : elapsedSeconds;
  const progress = mode === 'pomodoro'
    ? remainingSeconds / plannedSeconds
    : Math.min(elapsedSeconds / (8 * 60 * 60), 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - Math.min(progress, 1));
  const focusSoFar = mode === 'pomodoro' ? plannedSeconds - remainingSeconds : elapsedSeconds;
  const canEdit = status === 'idle' || status === 'completed';

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ maxWidth: 960, mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {recoverable && (
          <Alert
            severity="info"
            sx={{ width: '100%', mb: 2, borderRadius: 2, alignItems: 'center' }}
            action={(
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={handleRecoveryResume}>继续</Button>
                <Button size="small" onClick={handleRecoveryArchive}>结束</Button>
                <Button size="small" color="error" onClick={() => { clearSavedState(); setRecoverable(null); }}>放弃</Button>
              </Stack>
            )}
          >
            检测到未完成的计时
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, value) => {
            if (!value || !canEdit) return;
            setMode(value);
            if (value === 'pomodoro') {
              setPlannedSeconds(DEFAULT_SECONDS);
              setRemainingSeconds(DEFAULT_SECONDS);
            } else {
              setRemainingSeconds(0);
              setElapsedSeconds(0);
            }
          }}
          size="small"
          sx={{ mb: 3, height: 38 }}
        >
          <ToggleButton value="pomodoro">番茄钟</ToggleButton>
          <ToggleButton value="free">自由计时</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ position: 'relative', width: { xs: 240, sm: 300 }, height: { xs: 240, sm: 300 }, mb: 1 }}>
          <Box component="svg" viewBox="0 0 280 280" sx={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="140" cy="140" r={RING_RADIUS} fill="none" stroke="currentColor" strokeWidth="7" style={{ color: 'var(--mui-palette-divider)' }} />
            <circle
              cx="140"
              cy="140"
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ color: status === 'rest' ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-primary-main)', transition: 'stroke-dashoffset 0.25s ease' }}
            />
          </Box>
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: { xs: '2.75rem', sm: '3.5rem' }, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: 'text.primary' }}>
              {status === 'rest' ? formatClock(restRemaining) : (mode === 'pomodoro' ? formatClock(activeSeconds) : formatElapsed(activeSeconds))}
            </Typography>
            <Chip
              size="small"
              label={status === 'counting' ? '专注中' : status === 'paused' ? '已暂停' : status === 'rest' ? '休息中' : '准备开始'}
              color={status === 'counting' ? 'primary' : status === 'rest' ? 'success' : 'default'}
              sx={{ mt: 1.5, fontWeight: 700 }}
            />
          </Box>
        </Box>

        {mode === 'pomodoro' && canEdit && (
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', justifyContent: 'center', rowGap: 1 }}>
            {PRESETS.map((minutes) => {
              const selected = plannedSeconds === minutes * 60;
              return (
                <Button
                  key={minutes}
                  variant={selected ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    setPlannedSeconds(minutes * 60);
                    setRemainingSeconds(minutes * 60);
                  }}
                  sx={{ minWidth: 56, borderRadius: 999 }}
                >
                  {minutes}
                </Button>
              );
            })}
          </Stack>
        )}

        <Stack direction="row" spacing={1} sx={{ mb: 2, justifyContent: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          {status === 'idle' || status === 'completed' ? (
            <Button variant="contained" size="large" startIcon={<PlayArrowRoundedIcon />} onClick={handleStart} sx={{ minWidth: 132 }}>
              开始
            </Button>
          ) : null}
          {status === 'counting' && (
            <>
              <Button variant="outlined" startIcon={<PauseRoundedIcon />} onClick={handlePause}>暂停</Button>
              <Button variant="outlined" startIcon={<StopRoundedIcon />} onClick={() => completeSession()}>结束</Button>
              <Button color="error" variant="outlined" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setAbandonOpen(true)}>放弃</Button>
            </>
          )}
          {status === 'paused' && (
            <>
              <Button variant="contained" startIcon={<PlayArrowRoundedIcon />} onClick={handleResume}>继续</Button>
              <Button variant="outlined" startIcon={<StopRoundedIcon />} onClick={() => completeSession()}>结束</Button>
              <Button color="error" variant="outlined" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setAbandonOpen(true)}>放弃</Button>
            </>
          )}
          {status === 'rest' && (
            <>
              <Button variant="contained" color="success" onClick={handleRestDone}>结束休息</Button>
              <Button variant="outlined" onClick={handleRestDone}>跳过休息</Button>
            </>
          )}
          {status === 'completed' && (
            <Button variant="outlined" startIcon={<ReplayRoundedIcon />} onClick={resetTimer}>重置</Button>
          )}
        </Stack>

        {(status === 'counting' || status === 'paused') && (
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', justifyContent: 'center', color: 'text.secondary' }}>
            <Chip size="small" label={`已专注 ${formatDuration(focusSoFar)}`} />
            <Chip size="small" label={`暂停 ${pauseCount} 次`} />
          </Stack>
        )}

        <Paper
          variant="outlined"
          sx={{
            width: '100%',
            maxWidth: 680,
            borderRadius: 2,
            p: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="专注名称"
              size="small"
              value={sessionName}
              onChange={(event) => setSessionName(event.target.value)}
              disabled={!canEdit}
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
              <InputLabel id="focus-folder-label">文件夹</InputLabel>
              <Select
                labelId="focus-folder-label"
                label="文件夹"
                value={folderId}
                disabled={!canEdit}
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
          </Stack>
          <Box sx={{ mt: 1.5 }}>
            <FocusTagPicker
              id="focus-timer-tags"
              label="标签"
              tags={tags}
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
              onCreateTag={onCreateTag}
            />
          </Box>
          <FormControlLabel
            sx={{ mt: 1.25 }}
            control={<Switch checked={autoRest} disabled={!canEdit || mode !== 'pomodoro'} onChange={(event) => setAutoRest(event.target.checked)} />}
            label={<Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>番茄钟结束后进入 15 分钟休息</Typography>}
          />
        </Paper>
      </Box>

      <FocusArchiveDialog
        open={archiveOpen}
        pending={pending}
        folders={folders}
        tags={tags}
        initialTagIds={selectedTagIds}
        saving={saving}
        onClose={() => setArchiveOpen(false)}
        onSave={handleArchiveSave}
        onCreateTag={onCreateTag}
      />

      <ConfirmDialog
        open={abandonOpen}
        title="放弃本次计时?"
        message="放弃记录会被保存, 但不会参与专注统计."
        confirmLabel="放弃"
        confirmColor="error"
        onConfirm={handleAbandon}
        onCancel={() => setAbandonOpen(false)}
      />
    </Box>
  );
}
