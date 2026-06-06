'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

interface KanbanPreferencesProps {
  onSave: (prefs: Record<string, unknown>) => void;
}

export default function KanbanPreferences({ onSave }: KanbanPreferencesProps) {
  const [showArchived, setShowArchived] = useState(true);
  const [allowDrag, setAllowDrag] = useState(true);
  const [rememberView, setRememberView] = useState(true);

  useEffect(() => {
    onSave({ show_archived: showArchived, allow_drag: allowDrag, remember_view: rememberView });
  }, [showArchived, allowDrag, rememberView]);

  return (
    <Box>
      <FormControlLabel control={<Checkbox checked={showArchived} onChange={(_, v) => setShowArchived(v)} />} label="显示归档任务" />
      <FormControlLabel control={<Checkbox checked={allowDrag} onChange={(_, v) => setAllowDrag(v)} />} label="允许拖拽移动" />
      <FormControlLabel control={<Checkbox checked={rememberView} onChange={(_, v) => setRememberView(v)} />} label="记住该文件夹的最后筛选状态" />
    </Box>
  );
}
