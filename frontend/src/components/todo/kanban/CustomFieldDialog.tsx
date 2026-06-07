'use client';

import { useEffect, useState } from 'react';
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
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import type { FieldDef } from '@/lib/types';

interface CustomFieldDialogProps {
  open: boolean;
  field: FieldDef | null;
  onSave: (field: FieldDef) => void;
  onClose: () => void;
}

function fieldKeyFromLabel(label: string): string {
  const normalized = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `fld_${normalized || Date.now()}`;
}

export default function CustomFieldDialog({ open, field, onSave, onClose }: CustomFieldDialogProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldDef['type']>('text');
  const [options, setOptions] = useState('');
  const [required, setRequired] = useState(false);
  const [showOnCard, setShowOnCard] = useState(true);
  const [showInDetail, setShowInDetail] = useState(true);

  useEffect(() => {
    if (field) {
      setLabel(field.label);
      setType(field.type);
      setOptions(field.options?.join(', ') || '');
      setRequired(field.required);
      setShowOnCard(field.show_on_card);
      setShowInDetail(field.show_in_detail);
    } else {
      setLabel('');
      setType('text');
      setOptions('');
      setRequired(false);
      setShowOnCard(true);
      setShowInDetail(true);
    }
  }, [field, open]);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      key: field?.key || fieldKeyFromLabel(label),
      label: label.trim(),
      type,
      show_on_card: showOnCard,
      show_in_detail: showInDetail,
      required,
      order: field?.order || 0,
      system: field?.system ?? false,
      editable: true,
      default_value: field?.default_value ?? '',
      options: type === 'select' ? options.split(',').map((item) => item.trim()).filter(Boolean) : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{field ? '编辑字段' : '新增字段'}</DialogTitle>
      <DialogContent>
        <TextField label="字段名称" fullWidth size="small" sx={{ mt: 1 }}
          value={label} onChange={(event) => setLabel(event.target.value)} />
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel>字段类型</InputLabel>
          <Select value={type} label="字段类型" onChange={(event) => setType(event.target.value as FieldDef['type'])}>
            <MenuItem value="text">文本</MenuItem>
            <MenuItem value="textarea">多行文本</MenuItem>
            <MenuItem value="select">下拉选择</MenuItem>
            <MenuItem value="number">数字</MenuItem>
            <MenuItem value="date">日期</MenuItem>
          </Select>
        </FormControl>
        {type === 'select' && (
          <TextField label="选项, 用逗号分隔" fullWidth size="small" sx={{ mt: 1 }}
            value={options} onChange={(event) => setOptions(event.target.value)} />
        )}
        <FormControlLabel control={<Switch checked={required} onChange={(event) => setRequired(event.target.checked)} />} label="必填" />
        <FormControlLabel control={<Switch checked={showOnCard} onChange={(event) => setShowOnCard(event.target.checked)} />} label="显示在卡片" />
        <FormControlLabel control={<Switch checked={showInDetail} onChange={(event) => setShowInDetail(event.target.checked)} />} label="显示在详情" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained">保存</Button>
      </DialogActions>
    </Dialog>
  );
}
