'use client';

import { useState, useEffect, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { DATE_PICKER_DISPLAY_FORMAT } from '@/lib/dateFormats';
import type { FieldDef, KanbanTaskOut } from '@/lib/types';
import { resolveKanbanFields } from './templateDefaults';

export interface KanbanTaskFormData {
  id?: number;
  title: string;
  version: string;
  task_type: string;
  priority: string;
  requirement_desc: string;
  technical_desc: string;
  acceptance_criteria: string;
  custom_fields: Record<string, string>;
  sprint_id: number | null;
  column_id?: number | null;
}

interface KanbanTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: KanbanTaskFormData) => Promise<void>;
  fields: FieldDef[];
  defaultSprintId?: number | null;
  editTask?: KanbanTaskOut | null;
}

export default function KanbanTaskDialog({
  open, onClose, onSave, fields,
  defaultSprintId, editTask,
}: KanbanTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [taskType, setTaskType] = useState('');
  const [priority, setPriority] = useState('P2');
  const [requirementDesc, setRequirementDesc] = useState('');
  const [technicalDesc, setTechnicalDesc] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formFields = useMemo(() => resolveKanbanFields(fields), [fields]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      if (editTask) {
        // Edit mode: pre-fill from existing task
        setTitle(editTask.title);
        setVersion(editTask.version ?? '');
        setTaskType(editTask.task_type ?? '');
        setPriority(editTask.priority ?? 'P2');
        setRequirementDesc(editTask.requirement_desc ?? '');
        setTechnicalDesc(editTask.technical_desc ?? '');
        setAcceptanceCriteria(editTask.acceptance_criteria ?? '');
        setCustomFields(
          editTask.custom_fields
            ? Object.fromEntries(
                Object.entries(editTask.custom_fields).map(([k, v]) => [k, String(v ?? '')])
              )
            : {}
        );
      } else {
        // Create mode: initialize with defaults
        const defaults = new Map(
          formFields.map((field) => [field.key, field.default_value ?? '']),
        );
        const defaultCustomFields: Record<string, string> = {};
        formFields
          .filter((field) => !field.system && field.default_value)
          .forEach((field) => {
            defaultCustomFields[field.key] = field.default_value ?? '';
          });

        setTitle('');
        setVersion(defaults.get('version') ?? '');
        setTaskType(defaults.get('task_type') ?? '');
        setPriority(defaults.get('priority') || 'P2');
        setRequirementDesc(defaults.get('requirement_desc') ?? '');
        setTechnicalDesc(defaults.get('technical_desc') ?? '');
        setAcceptanceCriteria(defaults.get('acceptance_criteria') ?? '');
        setCustomFields(defaultCustomFields);
      }
      setErrors({});
    }
  }, [open, editTask, defaultSprintId, formFields]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const customFieldDefs = formFields.filter(f => !f.system);
  const sortedFields = [...formFields].sort((a, b) => a.order - b.order);

  const getFieldValue = (f: FieldDef): string => {
    if (!f.system) return customFields[f.key] || '';
    if (f.key === 'title') return title;
    if (f.key === 'version') return version;
    if (f.key === 'task_type') return taskType;
    if (f.key === 'priority') return priority;
    if (f.key === 'requirement_desc') return requirementDesc;
    if (f.key === 'technical_desc') return technicalDesc;
    if (f.key === 'acceptance_criteria') return acceptanceCriteria;
    return '';
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = '请输入任务名称';
    sortedFields.forEach((field) => {
      if (!field.required || field.key === 'title') return;
      const value = getFieldValue(field);
      if (!String(value).trim()) nextErrors[field.key] = `请输入${field.label}`;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        id: editTask?.id,
        title: title.trim(),
        version,
        task_type: taskType,
        priority,
        requirement_desc: requirementDesc,
        technical_desc: technicalDesc,
        acceptance_criteria: acceptanceCriteria,
        custom_fields: customFields,
        sprint_id: editTask?.sprint_id ?? defaultSprintId ?? null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    setCustomFields(prev => ({ ...prev, [key]: value }));
  };

  const renderField = (f: FieldDef) => {
    if (f.system && f.key === 'title') return null; // handled separately

    const value = getFieldValue(f);
    const error = errors[f.key];

    const setValue = f.system
      ? f.key === 'version' ? setVersion
        : f.key === 'task_type' ? setTaskType
          : f.key === 'priority' ? setPriority
            : f.key === 'requirement_desc' ? setRequirementDesc
              : f.key === 'technical_desc' ? setTechnicalDesc
                : f.key === 'acceptance_criteria' ? setAcceptanceCriteria
                  : () => {}
      : (v: string) => handleCustomFieldChange(f.key, v);

    if (f.type === 'select') {
      return (
        <FormControl fullWidth size="small" sx={{ mb: 1.5 }} key={f.key} error={!!error}>
          <InputLabel>{f.label}{f.required ? ' *' : ''}</InputLabel>
          <Select
            value={value}
            label={f.label + (f.required ? ' *' : '')}
            onChange={e => setValue(e.target.value)}
          >
            {!f.required && <MenuItem value=""><em>无</em></MenuItem>}
            {(f.options || []).map(opt => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
          {error && <FormHelperText>{error}</FormHelperText>}
        </FormControl>
      );
    }

    if (f.type === 'textarea') {
      return (
        <TextField
          key={f.key}
          label={f.label}
          value={value}
          onChange={e => setValue(e.target.value)}
          fullWidth
          required={f.required}
          error={!!error}
          helperText={error}
          multiline
          minRows={3}
          size="small"
          sx={{ mb: 1.5 }}
        />
      );
    }

    if (f.type === 'number') {
      return (
        <TextField
          key={f.key}
          label={f.label}
          value={value}
          onChange={e => setValue(e.target.value)}
          fullWidth
          required={f.required}
          error={!!error}
          helperText={error}
          type="number"
          size="small"
          sx={{ mb: 1.5 }}
        />
      );
    }

    if (f.type === 'date') {
      return (
        <DatePicker
          key={f.key}
          label={f.label}
          value={value ? dayjs(value) : null}
          onChange={(date) => setValue(date ? date.format('YYYY-MM-DD') : '')}
          format={DATE_PICKER_DISPLAY_FORMAT}
          slotProps={{
            textField: {
              fullWidth: true,
              required: f.required,
              error: !!error,
              helperText: error,
              size: 'small',
              sx: { mb: 1.5 },
            },
          }}
        />
      );
    }

    // default: text
    return (
      <TextField
        key={f.key}
        label={f.label}
        value={value}
        onChange={e => setValue(e.target.value)}
        fullWidth
        required={f.required}
        error={!!error}
        helperText={error}
        size="small"
        sx={{ mb: 1.5 }}
      />
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {editTask ? '编辑任务' : '新建任务'}
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Title (always first) */}
        <TextField
          label="任务名称"
          value={title}
          onChange={e => setTitle(e.target.value)}
          fullWidth
          size="small"
          required
          error={!!errors.title}
          helperText={errors.title}
          sx={{ mb: 1.5, mt: 1 }}
        />

        {/* System fields rendered in order */}
        {sortedFields
          .filter(f => f.system && f.key !== 'title')
          .map(f => renderField(f))}

        {/* Custom fields */}
        {customFieldDefs.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
              自定义字段
            </Typography>
            {customFieldDefs.map(f => renderField(f))}
          </>
        )}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained" disabled={!title.trim() || saving}>
          {saving ? '保存中…' : (editTask ? '保存' : '创建')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
