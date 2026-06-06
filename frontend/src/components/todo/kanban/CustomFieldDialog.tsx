'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import type { FieldDef } from '@/lib/types';

interface CustomFieldDialogProps {
  open: boolean;
  field: FieldDef | null;
  onSave: (field: FieldDef) => void;
  onClose: () => void;
}

export default function CustomFieldDialog({ open, field, onSave, onClose }: CustomFieldDialogProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldDef['type']>('text');
  const [options, setOptions] = useState('');

  useEffect(() => {
    if (field) {
      setLabel(field.label);
      setType(field.type);
      setOptions(field.options?.join(', ') || '');
    } else {
      setLabel('');
      setType('text');
      setOptions('');
    }
  }, [field, open]);

  const handleSave = () => {
    if (!label.trim()) return;
    const key = field?.key || `fld_${label.toLowerCase().replace(/\s+/g, '_')}`;
    onSave({
      key,
      label: label.trim(),
      type,
      show_on_card: true,
      show_in_detail: true,
      required: false,
      order: field?.order || 0,
      system: false,
      editable: true,
      default_value: '',
      options: type === 'select' ? options.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{field ? '编辑字段' : '新增字段'}</DialogTitle>
      <DialogContent>
        <TextField label="字段名称" fullWidth size="small" sx={{ mt: 1 }}
          value={label} onChange={e => setLabel(e.target.value)} />
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel>字段类型</InputLabel>
          <Select value={type} label="字段类型" onChange={e => setType(e.target.value as FieldDef['type'])}>
            <MenuItem value="text">文本</MenuItem>
            <MenuItem value="textarea">多行文本</MenuItem>
            <MenuItem value="select">下拉选择</MenuItem>
            <MenuItem value="number">数字</MenuItem>
            <MenuItem value="date">日期</MenuItem>
          </Select>
        </FormControl>
        {type === 'select' && (
          <TextField label="选项（逗号分隔）" fullWidth size="small" sx={{ mt: 1 }}
            value={options} onChange={e => setOptions(e.target.value)} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained">保存</Button>
      </DialogActions>
    </Dialog>
  );
}
