'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
}

const INITIAL_NAV: NavItem[] = [
  { id: 'home', label: '首页', icon: '🏠', visible: true },
  { id: 'todo', label: '任务', icon: '✅', visible: true },
  { id: 'finance', label: '记账', icon: '💰', visible: true },
  { id: 'calendar', label: '日历', icon: '📅', visible: false },
  { id: 'settings', label: '设置', icon: '⚙️', visible: true },
  { id: 'help', label: '帮助', icon: '❓', visible: true },
];

interface NavManageDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function NavManageDialog({ open, onClose }: NavManageDialogProps) {
  const [items, setItems] = useState(INITIAL_NAV);
  const [newName, setNewName] = useState('');

  const toggleVisible = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)));
  };

  const addItem = () => {
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/\s+/g, '-');
    setItems((prev) => [...prev, { id, label: newName.trim(), icon: '📌', visible: true }]);
    setNewName('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)',
          color: '#fff',
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="span" sx={{ fontSize: '1.25rem' }}>📋</Box>
          <Typography variant="h2" sx={{ color: '#fff', fontSize: '1.25rem' }}>
            导航管理
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 2.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8125rem' }}>
          管理顶部导航栏的模块顺序、显示状态和名称。拖拽使用按钮调整顺序。
        </Typography>

        <List disablePadding>
          {items.map((item) => (
            <ListItem
              key={item.id}
              sx={{
                px: 1.5,
                py: 1,
                mb: 0.75,
                borderRadius: 2,
                bgcolor: 'action.hover',
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, fontSize: '1.125rem' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: { fontSize: '0.875rem', fontWeight: 500 },
                }}
              />
              <Switch
                checked={item.visible}
                onChange={() => toggleVisible(item.id)}
                size="small"
                color="primary"
              />
            </ListItem>
          ))}
        </List>

        {/* Add new nav item */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="添加新导航项"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <Button variant="contained" size="small" onClick={addItem} sx={{ borderRadius: 2, flexShrink: 0 }}>
            添加
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="text"
          onClick={onClose}
          sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.875rem' }}
        >
          完成
        </Button>
      </DialogActions>
    </Dialog>
  );
}
