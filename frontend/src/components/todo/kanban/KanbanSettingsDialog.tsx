'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import type { Sprint, KanbanColumnData, FieldDef, KanbanConfig } from '@/lib/types';
import ColumnListEditor from './ColumnListEditor';
import FieldTemplateEditor from './FieldTemplateEditor';
import SprintListEditor from './SprintListEditor';
import KanbanPreferences from './KanbanPreferences';

interface KanbanSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  columns: KanbanColumnData[];
  sprints: Sprint[];
  fields: FieldDef[];
  kanbanConfig: KanbanConfig | null;
  onSaveColumns: (columns: KanbanColumnData[]) => void;
  onSaveFields: (fields: FieldDef[]) => void;
  onSaveSprints: (sprints: Sprint[]) => void;
  onSavePreferences: (prefs: Record<string, unknown>) => void;
}

export default function KanbanSettingsDialog({
  open, onClose, columns, sprints, fields, kanbanConfig,
  onSaveColumns, onSaveFields, onSaveSprints, onSavePreferences,
}: KanbanSettingsDialogProps) {
  const [tab, setTab] = useState(0);
  const fieldTemplateKey = JSON.stringify(fields);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Kanban 设置
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
        <Tab label="列配置" />
        <Tab label="任务卡模板" />
        <Tab label="Sprint 管理" />
        <Tab label="偏好设置" />
      </Tabs>
      <DialogContent sx={{ minHeight: 320 }}>
        {tab === 0 && <ColumnListEditor columns={columns} onSave={onSaveColumns} />}
        {tab === 1 && (
          <FieldTemplateEditor
            key={fieldTemplateKey}
            fields={fields}
            onSave={onSaveFields}
          />
        )}
        {tab === 2 && <SprintListEditor sprints={sprints} onSave={onSaveSprints} />}
        {tab === 3 && <KanbanPreferences onSave={onSavePreferences} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>完成</Button>
      </DialogActions>
    </Dialog>
  );
}
