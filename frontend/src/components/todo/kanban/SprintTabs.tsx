'use client';

import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import type { Sprint } from '@/lib/types';

interface SprintTabsProps {
  sprints: Sprint[];
  activeSprintId: number | null;
  onSprintChange: (sprintId: number) => void;
  onNewSprint: () => void;
  onOpenSettings: () => void;
}

export default function SprintTabs({
  sprints, activeSprintId, onSprintChange, onNewSprint, onOpenSettings,
}: SprintTabsProps) {
  const activeSprint = sprints.find(s => s.id === activeSprintId);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
      <Tabs
        value={activeSprintId ?? false}
        onChange={(_, value) => onSprintChange(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ flex: 1, minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0.75, fontSize: '0.8rem' } }}
      >
        {sprints.map((s) => (
          <Tab key={s.id} label={s.name} value={s.id} />
        ))}
      </Tabs>

      <IconButton size="small" onClick={onOpenSettings} title="Kanban 设置" sx={{ flexShrink: 0 }}>
        <SettingsIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={onNewSprint} title="新建 Sprint" sx={{ flexShrink: 0 }}>
        <AddCircleIcon fontSize="small" />
      </IconButton>

      {activeSprint && (
        <Box sx={{
          display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1.5,
          fontSize: '0.75rem', color: 'text.secondary', flexShrink: 0, mr: 1,
        }}>
          {activeSprint.goal && (
            <>
              <Box component="span">🎯 {activeSprint.goal}</Box>
              <Box component="span" sx={{ color: 'divider' }}>|</Box>
            </>
          )}
          {activeSprint.start_date && (
            <Box component="span">📅 {activeSprint.start_date} ~ {activeSprint.end_date || ''}</Box>
          )}
        </Box>
      )}
    </Box>
  );
}
