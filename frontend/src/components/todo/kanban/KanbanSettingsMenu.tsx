'use client';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';

interface KanbanSettingsMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onManageColumns: () => void;
  onManageSprints: () => void;
}

export default function KanbanSettingsMenu({ anchorEl, onClose, onManageColumns, onManageSprints }: KanbanSettingsMenuProps) {
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuItem onClick={() => { onManageColumns(); onClose(); }}>
        <Box component="span" sx={{ mr: 1, fontSize: '1rem' }}>📋</Box> 列管理
      </MenuItem>
      <MenuItem onClick={() => { onManageSprints(); onClose(); }}>
        <Box component="span" sx={{ mr: 1, fontSize: '1rem' }}>🔄</Box> Sprint 管理
      </MenuItem>
    </Menu>
  );
}
