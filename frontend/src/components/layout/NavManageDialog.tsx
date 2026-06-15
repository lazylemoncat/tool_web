'use client';

import Dialog from '@mui/material/Dialog';
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
import Tooltip from '@mui/material/Tooltip';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import ReorderRoundedIcon from '@mui/icons-material/ReorderRounded';
import DialogHeader from '@/components/shared/DialogHeader';
import type { NavItem } from './GlobalNav';

interface NavManageDialogProps {
  open: boolean;
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function NavManageDialog({
  open,
  items,
  onChange,
  onReset,
  onClose,
}: NavManageDialogProps) {
  const visibleCount = items.filter((item) => item.visible).length;

  const updateItem = (id: string, patch: Partial<Pick<NavItem, 'label' | 'visible'>>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}
    >
      <DialogHeader title="导航管理" icon={<ReorderRoundedIcon fontSize="small" />} onClose={onClose} />

      <DialogContent sx={{ pt: 2.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8125rem' }}>
          管理顶部导航栏的模块顺序, 显示状态和名称.
        </Typography>

        <List disablePadding>
          {items.map((item, index) => (
            <ListItem
              key={item.id}
              sx={{
                px: 1.5,
                py: 1,
                mb: 0.75,
                gap: 1,
                borderRadius: 2,
                bgcolor: 'action.hover',
              }}
            >
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                <Tooltip title="上移">
                  <span>
                    <IconButton
                      size="small"
                      disabled={index === 0}
                      onClick={() => moveItem(index, -1)}
                      aria-label={`${item.label} 上移`}
                    >
                      <KeyboardArrowUpRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="下移">
                  <span>
                    <IconButton
                      size="small"
                      disabled={index === items.length - 1}
                      onClick={() => moveItem(index, 1)}
                      aria-label={`${item.label} 下移`}
                    >
                      <KeyboardArrowDownRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              <TextField
                size="small"
                label="名称"
                value={item.label}
                onChange={(event) => updateItem(item.id, { label: event.target.value })}
                sx={{ flex: 1, minWidth: 120 }}
              />

              <Switch
                checked={item.visible}
                onChange={() => {
                  if (item.visible && visibleCount <= 1) return;
                  updateItem(item.id, { visible: !item.visible });
                }}
                size="small"
                color="primary"
                slotProps={{ input: { 'aria-label': `${item.label} 显示状态` } }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          variant="text"
          onClick={onReset}
          sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.875rem' }}
        >
          恢复默认
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ px: 3, boxShadow: 'none', fontWeight: 600, fontSize: '0.875rem' }}
        >
          完成
        </Button>
      </DialogActions>
    </Dialog>
  );
}
