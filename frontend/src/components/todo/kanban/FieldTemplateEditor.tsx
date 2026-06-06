'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import type { FieldDef } from '@/lib/types';
import CustomFieldDialog from './CustomFieldDialog';
import { resolveKanbanFields } from './templateDefaults';

interface FieldTemplateEditorProps {
  fields: FieldDef[];
  onSave: (fields: FieldDef[]) => void;
}

export default function FieldTemplateEditor({ fields, onSave }: FieldTemplateEditorProps) {
  const [localFields, setLocalFields] = useState(() => resolveKanbanFields(fields).sort((a, b) => a.order - b.order));
  const [editingField, setEditingField] = useState<{ index: number; field: FieldDef } | null>(null);
  const [addingField, setAddingField] = useState(false);

  const handleEdit = (index: number) => setEditingField({ index, field: { ...localFields[index] } });
  const handleDelete = (index: number) => {
    const updated = localFields.filter((_, i) => i !== index);
    setLocalFields(updated);
    onSave(updated);
  };
  const handleSaveField = (field: FieldDef) => {
    let updated: FieldDef[];
    if (editingField) {
      updated = localFields.map((f, i) => i === editingField.index ? { ...f, ...field, key: f.key } : f);
      setLocalFields(updated);
      setEditingField(null);
    } else {
      updated = [...localFields, { ...field, order: localFields.length + 1 }];
      setLocalFields(updated);
      setAddingField(false);
    }
    onSave(updated);
  };
  const handleReset = () => {
    if (confirm('恢复默认模板将重置所有自定义字段，确认？')) {
      setLocalFields(resolveKanbanFields());
    }
  };

  return (
    <Box>
      {localFields.map((f, i) => (
        <Box key={f.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
              {f.label}
              {f.required && <Chip label="必填" size="small" color="error" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {f.type}{f.system ? ' · 系统字段' : ' · 自定义'}
              {f.options?.length ? ` · [${f.options.join(', ')}]` : ''}
            </Typography>
          </Box>
          {!f.system && (
            <>
              <IconButton size="small" onClick={() => handleEdit(i)}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleDelete(i)}><DeleteIcon fontSize="small" color="error" /></IconButton>
            </>
          )}
        </Box>
      ))}
      <Button size="small" sx={{ mt: 1 }} onClick={() => setAddingField(true)}>+ 新增字段</Button>
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
