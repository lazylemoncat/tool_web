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
import MarkerPicker, { MARKER_EMOJIS, MarkerIcon, type MarkerValue } from '@/components/shared/MarkerPicker';
import * as api from '@/lib/api';
import type { CategoryOut } from '@/lib/financeTypes';

function CategoryNode({
  category,
  onEdit,
  onDelete,
}: {
  category: CategoryOut;
  onEdit: (category: CategoryOut) => void;
  onDelete: (category: CategoryOut) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <Box>
      <Box onClick={() => hasChildren && setExpanded(!expanded)}
        sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 1, px: 1, borderRadius: 1.5, cursor: hasChildren ? 'pointer' : 'default', '&:hover': { bgcolor: 'action.hover' } }}>
        <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', width: 14, textAlign: 'center' }}>{hasChildren ? (expanded ? '▼' : '▶') : ''}</Typography>
        <MarkerIcon type={category.icon_type} value={category.icon_value} size={16} />
        <Typography sx={{ fontWeight: 500, fontSize: '0.8125rem', color: 'text.primary', flex: 1 }}>{category.name}</Typography>
        {hasChildren && <Typography sx={{ fontSize: '0.5625rem', color: '#A5A2AD' }}>{category.children.length} 个子分类</Typography>}
        <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" variant="text" onClick={() => onEdit(category)} sx={{ minWidth: 0, px: 0.75, fontSize: '0.6875rem' }}>编辑</Button>
          <Button size="small" color="error" variant="text" onClick={() => onDelete(category)} sx={{ minWidth: 0, px: 0.75, fontSize: '0.6875rem' }}>删除</Button>
        </Box>
      </Box>
      {hasChildren && (
        <Collapse in={expanded}>
          <Box sx={{ pl: 3 }}>
            {category.children.map((child) => (
              <CategoryNode key={child.id} category={child} onEdit={onEdit} onDelete={onDelete} />
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
  onRefresh: () => void | Promise<unknown>;
}

export default function CategoriesTab({ categories, activeLedgerId, onRefresh }: CategoriesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryOut | null>(null);
  const [name, setName] = useState('');
  const [marker, setMarker] = useState<MarkerValue>({ type: 'emoji', value: MARKER_EMOJIS[1] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setEditingCategory(null);
    setName('');
    setMarker({ type: 'emoji', value: MARKER_EMOJIS[1] });
    setError('');
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (category: CategoryOut) => {
    setEditingCategory(category);
    setName(category.name);
    setMarker({ type: category.icon_type, value: category.icon_value });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) return;
    if (!activeLedgerId) { setError('未选择账本'); return; }
    setSaving(true);
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, {
          name: name.trim(),
          icon_type: marker.type,
          icon_value: marker.value,
        });
      } else {
        await api.createCategory({
          ledger_id: activeLedgerId,
          name: name.trim(),
          icon_type: marker.type,
          icon_value: marker.value,
          sort_order: categories.length,
        });
      }
      setDialogOpen(false);
      resetForm();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: CategoryOut) => {
    const childText = category.children?.length ? '，其子分类也会被删除' : '';
    if (!window.confirm(`确定删除分类“${category.name}”${childText}？`)) return;
    try {
      await api.deleteCategory(category.id);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleClose = () => { setDialogOpen(false); resetForm(); };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: '#F5F6FA', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.625rem', color: 'text.primary', letterSpacing: '-0.5px', mb: 0.5 }}>分类管理</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#4B5563' }}>新增、编辑和删除收支分类</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={openCreate}
          sx={{ borderRadius: 2, px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', boxShadow: 'none', bgcolor: '#6D5DFC', '&:hover': { bgcolor: '#5A4DE0' } }}>
          + 新建分类
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
      {categories.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>🏷</Typography>
          <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>暂无分类</Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>点击“新建分类”开始</Typography>
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid', borderColor: '#EDECF0' }}>
          {categories.map((cat) => <CategoryNode key={cat.id} category={cat} onEdit={openEdit} onDelete={handleDelete} />)}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #6C5CE7, #A78BFA)', color: '#fff', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700 }}>{editingCategory ? '编辑分类' : '新建分类'}</Typography>
          <IconButton size="small" onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.8)' }}>✕</IconButton>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>{error}</Alert>}
          <TextField fullWidth label="名称" size="small" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} autoFocus />
          <MarkerPicker marker={marker} onChange={setMarker} label="分类标识" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="text" onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>取消</Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim() || saving} sx={{ borderRadius: 4, px: 3, boxShadow: 'none', textTransform: 'none' }}>{saving ? '保存中...' : '保存'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
