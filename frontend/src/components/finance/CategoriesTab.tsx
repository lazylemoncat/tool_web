'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import * as api from '@/lib/api';
import type { CategoryOut } from '@/lib/financeTypes';

function CategoryNode({ category, onRefresh }: { category: CategoryOut; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <Box>
      <Box onClick={() => hasChildren && setExpanded(!expanded)}
        sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 1, px: 1, borderRadius: 1.5, cursor: hasChildren ? 'pointer' : 'default', '&:hover': { bgcolor: 'action.hover' } }}>
        <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', width: 14, textAlign: 'center' }}>{hasChildren ? (expanded ? '▼' : '▶') : ''}</Typography>
        <Typography sx={{ fontSize: '0.875rem' }}>{category.icon || '📂'}</Typography>
        <Typography sx={{ fontWeight: 500, fontSize: '0.8125rem', color: 'text.primary', flex: 1 }}>{category.name}</Typography>
        {hasChildren && <Typography sx={{ fontSize: '0.5625rem', color: '#A5A2AD' }}>{category.children.length} 个子分类</Typography>}
      </Box>
      {hasChildren && (
        <Collapse in={expanded}>
          <Box sx={{ pl: 3 }}>
            {category.children.map((child) => (
              <Box key={child.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.625, px: 1, borderRadius: 1.5, fontSize: '0.6875rem', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
                <Typography sx={{ fontSize: '0.75rem' }}>{child.icon || '📄'}</Typography>
                <Typography sx={{ fontSize: '0.6875rem', flex: 1 }}>{child.name}</Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

interface CategoriesTabProps {
  categories: CategoryOut[];
  activeLedgerId: number | null;
  onRefresh: () => void;
}

export default function CategoriesTab({ categories, activeLedgerId, onRefresh }: CategoriesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => { setName(''); setIcon(''); setError(''); };

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) return;
    if (!activeLedgerId) { setError('未选择账本'); return; }
    setSaving(true);
    try {
      await api.createCategory({ ledger_id: activeLedgerId, name: name.trim(), icon: icon || '📂' });
      setDialogOpen(false); resetForm(); onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setDialogOpen(false); resetForm(); };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: '#F5F6FA', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>分类管理</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#4B5563' }}>管理收支分类</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={() => setDialogOpen(true)}
          sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none', bgcolor: '#6D5DFC', '&:hover': { bgcolor: '#5A4DE0' } }}>
          + 新建分类
        </Button>
      </Box>
      {categories.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>🏷</Typography>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>暂无分类</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>点击"新建分类"开始</Typography>
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid', borderColor: '#EDECF0' }}>
          {categories.map((cat) => <CategoryNode key={cat.id} category={cat} onRefresh={onRefresh} />)}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)', color: '#fff', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700 }}>新建分类</Typography>
          <IconButton size="small" onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.8)' }}>✕</IconButton>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
          <TextField fullWidth label="名称" size="small" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} autoFocus />
          <TextField fullWidth label="图标" size="small" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🍜" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="text" onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>取消</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || saving} sx={{ borderRadius: 4, px: 3, boxShadow: 'none', textTransform: 'none' }}>保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
