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
  const activeSprint = sprints.find((sprint) => sprint.id === activeSprintId);

  return (
    <Box sx={{ mb: 1.5 }}>
      {activeSprint && (activeSprint.goal || activeSprint.start_date) && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          fontSize: '0.95rem',
          color: 'text.primary',
          mb: 0.75,
        }}>
          {activeSprint.goal && (
            <>
              <Box component="span" sx={{ fontWeight: 700 }}>🎯 {activeSprint.goal}</Box>
              <Box component="span" sx={{ color: 'divider' }}>|</Box>
            </>
          )}
          {activeSprint.start_date && (
            <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              📅 {activeSprint.start_date} ~ {activeSprint.end_date || ''}
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeSprintId ?? false}
          onChange={(_, value) => onSprintChange(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flex: 1, minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0.75, fontSize: '0.8rem' } }}
        >
          {sprints.map((sprint) => (
            <Tab key={sprint.id} label={sprint.name} value={sprint.id} />
          ))}
        </Tabs>

        <IconButton size="small" onClick={onOpenSettings} title="Kanban 设置" sx={{ flexShrink: 0 }}>
          <SettingsIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onNewSprint} title="新建 Sprint" sx={{ flexShrink: 0 }}>
          <AddCircleIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
