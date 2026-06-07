'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import type { FieldDef } from '@/lib/types';
import CustomFieldDialog from './CustomFieldDialog';
import { DEFAULT_KANBAN_FIELDS, resolveKanbanFields } from './templateDefaults';

interface FieldTemplateEditorProps {
  fields: FieldDef[];
  onSave: (fields: FieldDef[]) => void;
}

function normalizeOrder(fields: FieldDef[]): FieldDef[] {
  return fields.map((field, index) => ({ ...field, order: index + 1 }));
}

export default function FieldTemplateEditor({ fields, onSave }: FieldTemplateEditorProps) {
  const [localFields, setLocalFields] = useState(() => normalizeOrder(resolveKanbanFields(fields).sort((a, b) => a.order - b.order)));
  const [editingField, setEditingField] = useState<{ index: number; field: FieldDef } | null>(null);
  const [addingField, setAddingField] = useState(false);

  const persist = (nextFields: FieldDef[]) => {
    const normalized = normalizeOrder(nextFields);
    setLocalFields(normalized);
    onSave(normalized);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= localFields.length) return;
    const updated = [...localFields];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    persist(updated);
  };

  const handleDelete = (index: number) => {
    const field = localFields[index];
    if (field.key === 'title') return;
    persist(localFields.filter((_, i) => i !== index));
  };

  const handleSaveField = (field: FieldDef) => {
    if (editingField) {
      persist(localFields.map((item, index) => (
        index === editingField.index ? { ...item, ...field, key: item.key, system: item.system } : item
      )));
      setEditingField(null);
      return;
    }

    persist([...localFields, { ...field, order: localFields.length + 1 }]);
    setAddingField(false);
  };

  const handleReset = () => {
    persist(DEFAULT_KANBAN_FIELDS.map((field) => ({ ...field })));
  };

  return (
    <Box>
      {localFields.map((field, index) => (
        <Box key={field.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
              {field.label}
              {field.required && <Chip label="必填" size="small" color="error" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}
              {!field.show_on_card && <Chip label="卡片隐藏" size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}
              {!field.show_in_detail && <Chip label="详情隐藏" size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {field.type}{field.system ? ' · 系统字段' : ' · 自定义字段'}
              {field.options?.length ? ` · [${field.options.join(', ')}]` : ''}
            </Typography>
          </Box>
          <IconButton size="small" disabled={index === 0} onClick={() => handleMove(index, -1)}>
            <KeyboardArrowUpRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" disabled={index === localFields.length - 1} onClick={() => handleMove(index, 1)}>
            <KeyboardArrowDownRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setEditingField({ index, field: { ...field } })}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" disabled={field.key === 'title'} onClick={() => handleDelete(index)}>
            <DeleteIcon fontSize="small" color={field.key === 'title' ? 'disabled' : 'error'} />
          </IconButton>
        </Box>
      ))}
      <Button size="small" sx={{ mt: 1 }} onClick={() => setAddingField(true)}>新增字段</Button>
      <Button size="small" sx={{ mt: 1, ml: 1, color: 'warning.main' }} onClick={handleReset}>恢复默认模板</Button>
      <CustomFieldDialog
        open={addingField || !!editingField}
        field={editingField?.field || null}
        onSave={handleSaveField}
        onClose={() => { setAddingField(false); setEditingField(null); }}
      />
    </Box>
  );
}
