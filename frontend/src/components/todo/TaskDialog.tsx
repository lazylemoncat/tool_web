'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { DATE_PICKER_DISPLAY_FORMAT } from '@/lib/dateFormats';
import type { APITag } from '@/lib/types';

interface TaskDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
  onSaveAndNew?: (data: TaskFormData) => void;
  initialData?: TaskFormData;
  allTags?: APITag[];
  onCreateTag?: (name: string) => Promise<APITag>;
}

export interface TaskFormData {
  title: string;
  note: string;
  priority: number;
  due_date: string;
  due_time: string;
  folder_id: number | null;
  tag_ids: number[];
  recurrence: string;
  id?: number;
  parent_id?: number;
  sprint_id?: number | null;
  column_id?: number | null;
}

const RECUR_OPTIONS = ['不重复', '每天', '每周', '每月', '每年'];
const CUSTOM_RECUR_OPTION = 'RRULE';

function toTimeInputValue(value?: string | null): string {
  return value ? value.slice(0, 5) : '';
}

export default function TaskDialog({
  open, mode, onClose, onSave, onSaveAndNew, initialData,
  allTags = [],
}: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<number>(2);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [folderId, setFolderId] = useState<number | null>(null);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [recurrence, setRecurrence] = useState('不重复');
  const [customRrule, setCustomRrule] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Dialog state mirrors the selected task when the form opens.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(initialData?.title || '');
      setNote(initialData?.note || '');
      setPriority(initialData?.priority || 2);
      setDueDate(initialData?.due_date || '');
      setDueTime(toTimeInputValue(initialData?.due_time));
      setFolderId(initialData?.folder_id ?? null);
      setTagIds(initialData?.tag_ids || []);
      const initialRecurrence = initialData?.recurrence || '不重复';
      if (RECUR_OPTIONS.includes(initialRecurrence)) {
        setRecurrence(initialRecurrence);
        setCustomRrule('');
      } else {
        setRecurrence(CUSTOM_RECUR_OPTION);
        setCustomRrule(initialRecurrence);
      }
      setErrors({});
      setSubmitting(false);
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = '请输入任务标题';
    if (recurrence === CUSTOM_RECUR_OPTION && !customRrule.trim()) {
      newErrors.recurrence = '请输入 RRULE，例如 FREQ=WEEKLY;INTERVAL=2';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFormData = (): TaskFormData => ({
    title: title.trim(), note, priority, due_date: dueDate,
    due_time: dueDate ? dueTime : '',
    folder_id: folderId, tag_ids: tagIds,
    recurrence: recurrence === CUSTOM_RECUR_OPTION ? customRrule.trim() : recurrence,
    ...(initialData?.id ? { id: initialData.id } : {}),
    ...(initialData?.parent_id ? { parent_id: initialData.parent_id } : {}),
    ...(initialData?.sprint_id ? { sprint_id: initialData.sprint_id } : {}),
    ...(initialData?.column_id ? { column_id: initialData.column_id } : {}),
  });

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try { onSave(getFormData()); } finally { setSubmitting(false); }
  };

  const handleSaveAndNew = () => {
    if (!validate()) return;
    if (onSaveAndNew) {
      onSaveAndNew(getFormData());
      setTitle(''); setNote(''); setTagIds([]); setDueDate(''); setDueTime(''); setRecurrence('不重复'); setCustomRrule('');
    }
  };

  // Tag autocomplete helpers
  const selectedTags = allTags.filter((t) => tagIds.includes(t.id));
  const tagOptions = allTags.filter((t) => !tagIds.includes(t.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { maxWidth: 560, borderRadius: 4, maxHeight: '90vh', overflow: 'hidden' } } }}>
      <Box sx={{ background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)', color: '#fff', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="span" sx={{ fontSize: '1.25rem' }}>📝</Box>
          <Typography variant="h2" sx={{ color: '#fff', fontSize: '1.25rem' }}>{mode === 'create' ? '新建任务' : '编辑任务'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </IconButton>
      </Box>
      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        {/* Title */}
        <Box sx={{ mb: 2.25 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>任务标题 <Box component="span" sx={{ color: 'error.main' }}>*</Box></Typography>
          <TextField fullWidth placeholder="输入任务标题" value={title} onChange={(e) => setTitle(e.target.value)} error={!!errors.title} helperText={errors.title || ' '} size="small" />
        </Box>
        {/* Note */}
        <Box sx={{ mb: 2.25 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>备注</Typography>
          <TextField fullWidth multiline minRows={3} placeholder="添加备注（支持 Markdown 格式）" value={note} onChange={(e) => setNote(e.target.value)} variant="outlined" size="small" />
        </Box>
        {/* Priority + Due Date */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.25, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>优先级</Typography>
            <Select fullWidth value={priority} onChange={(e) => setPriority(e.target.value as number)} size="small">
              <MenuItem value={1}>🔴 高优先级</MenuItem>
              <MenuItem value={2}>🟡 中优先级</MenuItem>
              <MenuItem value={3}>⚪ 低优先级</MenuItem>
            </Select>
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>截止日期</Typography>
            <DatePicker
              value={dueDate ? dayjs(dueDate) : null}
              onChange={(date) => {
                const nextDate = date ? date.format('YYYY-MM-DD') : '';
                setDueDate(nextDate);
                if (!nextDate) setDueTime('');
              }}
              format={DATE_PICKER_DISPLAY_FORMAT}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 130 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>截止时间</Typography>
            <TextField
              fullWidth
              size="small"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              disabled={!dueDate}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </Box>
        {/* Tags */}
        <Box sx={{ mb: 2.25 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>标签</Typography>
          <Autocomplete
            multiple
            size="small"
            options={tagOptions}
            getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.name}
            value={selectedTags}
            onChange={(_, newValue) => setTagIds(newValue.map((v) => typeof v === 'string' ? 0 : v.id))}
            freeSolo
            renderValue={(value, getItemProps) =>
              value.map((option, index) => {
                const { key, ...props } = getItemProps({ index });
                const label = typeof option === 'string' ? option : option.name;
                return <Chip key={key} label={`#${label}`} size="small" {...props}
                  sx={{ fontSize: '0.75rem', fontWeight: 500, borderRadius: '999px', bgcolor: 'oklch(92% 0.06 300)', color: 'oklch(22% 0.08 300)' }} />;
              })
            }
            renderInput={(params) => (
              <TextField {...params} placeholder="搜索或输入新标签" size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            )}
          />
          {/* Selected tags display */}
          {selectedTags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
              {selectedTags.map((tag) => (
                <Chip key={tag.id} label={`#${tag.name}`} onDelete={() => setTagIds(tagIds.filter((id) => id !== tag.id))} size="small"
                  sx={{ fontSize: '0.75rem', fontWeight: 500, borderRadius: '999px', bgcolor: 'oklch(92% 0.06 300)', color: 'oklch(22% 0.08 300)', '& .MuiChip-deleteIcon': { fontSize: '0.875rem' } }} />
              ))}
            </Box>
          )}
        </Box>
        {/* Recurrence */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>周期性</Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {[...RECUR_OPTIONS, CUSTOM_RECUR_OPTION].map((opt) => (
              <Button key={opt} variant={recurrence === opt ? 'contained' : 'outlined'} size="small" onClick={() => setRecurrence(opt)}
                sx={{ borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, px: 1.75, py: 0.5, minWidth: 'auto',
                  ...(recurrence !== opt && { borderColor: 'oklch(82% 0.01 275)', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }),
                }}>
                {opt === CUSTOM_RECUR_OPTION ? '自定义 RRULE' : opt}
              </Button>
            ))}
          </Box>
          {recurrence === CUSTOM_RECUR_OPTION && (
            <TextField
              fullWidth
              size="small"
              label="RRULE"
              placeholder="例如：FREQ=WEEKLY;INTERVAL=2"
              value={customRrule}
              onChange={(e) => setCustomRrule(e.target.value)}
              error={!!errors.recurrence}
              helperText={errors.recurrence || '使用 iCalendar RRULE 格式，例如 FREQ=MONTHLY;BYMONTHDAY=1'}
              sx={{ mt: 1.25 }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, borderTop: '1px solid', borderColor: 'divider', gap: 1, justifyContent: 'space-between' }}>
        <Button variant="text" onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.875rem' }} disabled={submitting}>取消</Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {mode === 'create' && onSaveAndNew && (
            <Button variant="outlined" onClick={handleSaveAndNew} disabled={submitting}
              sx={{ borderRadius: 4, borderColor: 'oklch(82% 0.01 275)', color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600, px: 3, '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}>
              保存并再建
            </Button>
          )}
          <Button variant="contained" onClick={handleSave} disabled={submitting} sx={{ borderRadius: 4, fontSize: '0.875rem', fontWeight: 600, px: 3 }}>
            {submitting ? '保存中…' : mode === 'create' ? '保存' : '更新'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
