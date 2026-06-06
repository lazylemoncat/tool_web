'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import * as api from '@/lib/api';
import type { FinanceTagOut } from '@/lib/financeTypes';

interface TagsTabProps {
  tags: FinanceTagOut[];
  activeLedgerId: number | null;
  onRefresh: () => void;
}

const TAG_BG_COLORS = ['#E8E0FF', '#D1FAE5', '#FEE2E2', '#DBEAFE', '#FEF3C7', '#EDE9FE'];

export default function TagsTab({ tags, activeLedgerId, onRefresh }: TagsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => { setName(''); setError(''); };

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) return;
    if (!activeLedgerId) { setError('未选择账本'); return; }
    setSaving(true);
    try {
      await api.createFinanceTag({ ledger_id: activeLedgerId, name: name.trim() });
      setDialogOpen(false); resetForm(); onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setDialogOpen(false); resetForm(); };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteFinanceTag(id);
      onRefresh();
    } catch { /* ignore */ }
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: '#F5F6FA', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>标签管理</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#4B5563' }}>管理交易标签</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={() => setDialogOpen(true)}
          sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none', bgcolor: '#6D5DFC', '&:hover': { bgcolor: '#5A4DE0' } }}>
          + 新建标签
        </Button>
      </Box>
      {tags.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>🔖</Typography>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>暂无标签</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>点击"新建标签"开始</Typography>
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid', borderColor: '#EDECF0' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tags.map((tag, i) => (
              <Typography key={tag.id} sx={{ bgcolor: TAG_BG_COLORS[i % TAG_BG_COLORS.length], color: '#1E1C24', px: 1.5, py: 0.625, borderRadius: 2, fontSize: '0.6875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {tag.name}
                <Typography component="span" onClick={() => handleDelete(tag.id)} sx={{ fontSize: '0.8125rem', opacity: 0.4, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>×</Typography>
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)', color: '#fff', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700 }}>新建标签</Typography>
          <IconButton size="small" onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.8)' }}>✕</IconButton>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
          <TextField fullWidth label="名称" size="small" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="text" onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>取消</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || saving} sx={{ borderRadius: 4, px: 3, boxShadow: 'none', textTransform: 'none' }}>保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
