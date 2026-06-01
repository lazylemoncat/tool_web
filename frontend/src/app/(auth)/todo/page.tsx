'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DriveFileMoveRoundedIcon from '@mui/icons-material/DriveFileMoveRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import UpcomingRoundedIcon from '@mui/icons-material/UpcomingRounded';
import { apiRequest, getErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Folder, Todo, TodoListResponse, TodoTag } from '@/lib/types';

type ViewKey = 'all' | 'today' | 'upcoming' | 'completed';
type StatusFilter = 'all' | 'active' | 'completed';
type PriorityFilter = 'all' | '1' | '2' | '3';

interface TodoForm {
  title: string;
  note: string;
  priority: number;
  due_date: string;
  folder_id: string;
  tag_ids: number[];
}

interface FolderForm {
  id: number | null;
  parent_id: string;
  name: string;
  color: string;
}

const EMPTY_TODO_FORM: TodoForm = {
  title: '',
  note: '',
  priority: 2,
  due_date: '',
  folder_id: '',
  tag_ids: [],
};

const EMPTY_FOLDER_FORM: FolderForm = {
  id: null,
  parent_id: '',
  name: '',
  color: '#6366f1',
};

function flattenFolders(folders: Folder[]): Folder[] {
  return folders.flatMap((folder) => [folder, ...flattenFolders(folder.children ?? [])]);
}

function isToday(date: string | null) {
  if (!date) return false;
  return date === new Date().toISOString().slice(0, 10);
}

function isUpcoming(date: string | null) {
  if (!date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return date > today;
}

function priorityMeta(priority: number) {
  if (priority === 1) return { label: '高', color: 'error' as const };
  if (priority === 2) return { label: '中', color: 'warning' as const };
  return { label: '低', color: 'success' as const };
}

export default function TodoPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<TodoTag[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [view, setView] = useState<ViewKey>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [expandedTodo, setExpandedTodo] = useState<number | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [multiSelect, setMultiSelect] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [todoForm, setTodoForm] = useState<TodoForm>(EMPTY_TODO_FORM);
  const [folderForm, setFolderForm] = useState<FolderForm>(EMPTY_FOLDER_FORM);
  const [moveFolderId, setMoveFolderId] = useState('');

  const flatFolders = useMemo(() => flattenFolders(folders), [folders]);

  const visibleTodos = useMemo(() => {
    if (view === 'today') return todos.filter((todo) => isToday(todo.due_date));
    if (view === 'upcoming') return todos.filter((todo) => isUpcoming(todo.due_date));
    return todos;
  }, [todos, view]);

  const activeTitle = useMemo(() => {
    if (selectedFolder) return flatFolders.find((folder) => String(folder.id) === selectedFolder)?.name ?? '文件夹';
    if (view === 'today') return '今天';
    if (view === 'upcoming') return '即将到期';
    if (view === 'completed') return '已完成';
    return '所有任务';
  }, [flatFolders, selectedFolder, view]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (selectedFolder) params.set('folder_id', selectedFolder);
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter === 'completed' || view === 'completed') params.set('status', 'completed');
      if (statusFilter === 'active' || view === 'today' || view === 'upcoming') params.set('status', 'active');
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (tagFilter !== 'all') params.set('tag_id', tagFilter);
      const [folderResponse, tagResponse, todoResponse] = await Promise.all([
        apiRequest<Folder[]>('/api/v1/folders'),
        apiRequest<TodoTag[]>('/api/v1/tags'),
        apiRequest<TodoListResponse>(`/api/v1/todos?${params.toString()}`),
      ]);
      setFolders(folderResponse);
      setTags(tagResponse);
      setTodos(todoResponse.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, search, selectedFolder, statusFilter, tagFilter, view]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const openCreateTask = () => {
    setEditingTodo(null);
    setTodoForm({ ...EMPTY_TODO_FORM, folder_id: selectedFolder });
    setTaskDialogOpen(true);
  };

  const openEditTask = (todo: Todo) => {
    setEditingTodo(todo);
    setTodoForm({
      title: todo.title,
      note: todo.note ?? '',
      priority: todo.priority,
      due_date: todo.due_date ?? '',
      folder_id: todo.folder_id ? String(todo.folder_id) : '',
      tag_ids: todo.tags.map((tag) => tag.id),
    });
    setTaskDialogOpen(true);
  };

  const saveTodo = async () => {
    if (!todoForm.title.trim()) {
      setError('任务标题不能为空');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      title: todoForm.title.trim(),
      note: todoForm.note.trim() || null,
      priority: todoForm.priority,
      due_date: todoForm.due_date || null,
      folder_id: todoForm.folder_id ? Number(todoForm.folder_id) : null,
      tag_ids: todoForm.tag_ids,
    };
    try {
      if (editingTodo) {
        await apiRequest<Todo>(`/api/v1/todos/${editingTodo.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest<Todo>('/api/v1/todos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setTaskDialogOpen(false);
      setToast(editingTodo ? '任务已更新' : '任务已创建');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    try {
      await apiRequest<Todo>(`/api/v1/todos/${todo.id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ complete_children: false }),
      });
      setToast(todo.is_completed ? '已取消完成' : '已标记为完成');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteTodo = async (todo: Todo) => {
    if (!window.confirm(`删除任务 "${todo.title}"?`)) return;
    try {
      await apiRequest<void>(`/api/v1/todos/${todo.id}`, { method: 'DELETE' });
      setToast('任务已删除');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const openCreateFolder = (parentId = '') => {
    setFolderForm({ ...EMPTY_FOLDER_FORM, parent_id: parentId });
    setFolderDialogOpen(true);
  };

  const openEditFolder = (folder: Folder) => {
    setFolderForm({
      id: folder.id,
      parent_id: folder.parent_id ? String(folder.parent_id) : '',
      name: folder.name,
      color: folder.color,
    });
    setFolderDialogOpen(true);
  };

  const saveFolder = async () => {
    if (!folderForm.name.trim()) {
      setError('文件夹名称不能为空');
      return;
    }
    const payload = {
      parent_id: folderForm.parent_id ? Number(folderForm.parent_id) : null,
      name: folderForm.name.trim(),
      color: folderForm.color,
    };
    try {
      if (folderForm.id) {
        await apiRequest<Folder>(`/api/v1/folders/${folderForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest<Folder>('/api/v1/folders', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setFolderDialogOpen(false);
      setToast(folderForm.id ? '文件夹已更新' : '文件夹已创建');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteFolder = async (folder: Folder) => {
    if (!window.confirm(`删除文件夹 "${folder.name}"? 文件夹内任务会先移出到所有任务.`)) return;
    try {
      const response = await apiRequest<TodoListResponse>(`/api/v1/todos?folder_id=${folder.id}&limit=500`);
      await Promise.all(response.items.map((todo) => apiRequest<Todo>(`/api/v1/todos/${todo.id}`, {
        method: 'PUT',
        body: JSON.stringify({ folder_id: null }),
      })));
      await apiRequest<void>(`/api/v1/folders/${folder.id}`, { method: 'DELETE' });
      if (selectedFolder === String(folder.id)) setSelectedFolder('');
      setToast('文件夹已删除, 任务已保留在所有任务中');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleTaskSelection = (todoId: number) => {
    setSelectedTasks((current) => {
      const next = new Set(current);
      if (next.has(todoId)) next.delete(todoId);
      else next.add(todoId);
      return next;
    });
  };

  const runBulkAction = async (action: 'complete' | 'delete' | 'move') => {
    const ids = Array.from(selectedTasks);
    if (ids.length === 0) return;
    try {
      await apiRequest('/api/v1/todos/bulk', {
        method: 'POST',
        body: JSON.stringify({
          ids,
          action,
          folder_id: action === 'move' && moveFolderId ? Number(moveFolderId) : null,
        }),
      });
      setSelectedTasks(new Set());
      setMultiSelect(false);
      setMoveDialogOpen(false);
      setDeleteDialogOpen(false);
      setToast(action === 'complete' ? '批量完成成功' : action === 'delete' ? '批量删除成功' : '批量移动成功');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const sidebar = (
    <Box sx={{ width: 300, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRight: { md: 1 }, borderColor: 'divider' }}>
      <Stack spacing={1.5} sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>TODO</Typography>
        <Button fullWidth variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreateTask}>新建任务</Button>
      </Stack>
      <Divider />
      <Box sx={{ overflow: 'auto', flex: 1, p: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, fontWeight: 700 }}>视图</Typography>
        <List dense>
          {[
            { key: 'all' as ViewKey, label: '所有任务', icon: <CheckCircleRoundedIcon />, count: todos.length },
            { key: 'today' as ViewKey, label: '今天', icon: <TodayRoundedIcon />, count: todos.filter((todo) => isToday(todo.due_date)).length },
            { key: 'upcoming' as ViewKey, label: '即将到期', icon: <UpcomingRoundedIcon />, count: todos.filter((todo) => isUpcoming(todo.due_date)).length },
            { key: 'completed' as ViewKey, label: '已完成', icon: <CheckCircleRoundedIcon />, count: todos.filter((todo) => todo.is_completed).length },
          ].map((item) => (
            <ListItemButton
              key={item.key}
              selected={view === item.key && !selectedFolder}
              onClick={() => {
                setView(item.key);
                setSelectedFolder('');
                setStatusFilter(item.key === 'completed' ? 'completed' : item.key === 'all' ? 'active' : 'active');
                setMobileDrawerOpen(false);
              }}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
              <Chip size="small" label={item.count} />
            </ListItemButton>
          ))}
        </List>
        <Stack direction="row" sx={{ px: 1.5, mt: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>文件夹</Typography>
          <IconButton size="small" onClick={() => openCreateFolder()}>
            <AddRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
        <List dense>
          {flatFolders.map((folder) => (
            <ListItem
              key={folder.id}
              disablePadding
              secondaryAction={
                <Stack direction="row" spacing={0.25}>
                  <IconButton edge="end" size="small" onClick={() => openCreateFolder(String(folder.id))}>
                    <AddRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton edge="end" size="small" onClick={() => openEditFolder(folder)}>
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton edge="end" size="small" color="error" onClick={() => void deleteFolder(folder)}>
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              <ListItemButton
                selected={selectedFolder === String(folder.id)}
                onClick={() => {
                  setSelectedFolder(String(folder.id));
                  setView('all');
                  setStatusFilter('active');
                  setMobileDrawerOpen(false);
                }}
                sx={{ borderRadius: 2, pl: folder.parent_id ? 4 : 2, pr: 12 }}
              >
                <ListItemIcon sx={{ minWidth: 34 }}>
                  <FolderRoundedIcon sx={{ color: folder.color }} />
                </ListItemIcon>
                <ListItemText primary={folder.name} />
                <Chip size="small" label={folder.todo_count} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: 'calc(100vh - var(--nav-h))', display: 'flex', bgcolor: 'background.default' }}>
      {isMobile ? (
        <Drawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)}>
          {sidebar}
        </Drawer>
      ) : sidebar}

      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 3 } }}>
        <Stack direction="row" sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {isMobile && (
              <IconButton onClick={() => setMobileDrawerOpen(true)} aria-label="打开侧边栏">
                <MenuRoundedIcon />
              </IconButton>
            )}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{activeTitle}</Typography>
              <Typography variant="body2" color="text.secondary">{loading ? '加载中' : `${visibleTodos.length} 个待办`}</Typography>
            </Box>
          </Stack>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreateTask}>新建任务</Button>
        </Stack>

        {error && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', lg: 'center' } }}>
            <TextField
              size="small"
              placeholder="搜索任务..."
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') setSearch(searchDraft); }}
              slotProps={{ input: { startAdornment: <SearchRoundedIcon color="disabled" sx={{ mr: 1 }} /> } }}
              sx={{ minWidth: { lg: 260 } }}
            />
            <ToggleButtonGroup size="small" exclusive value={statusFilter} onChange={(_, value: StatusFilter | null) => { if (value) { setStatusFilter(value); if (value === 'completed') setView('completed'); else setView('all'); } }}>
              <ToggleButton value="all">全部</ToggleButton>
              <ToggleButton value="active">未完成</ToggleButton>
              <ToggleButton value="completed">已完成</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup size="small" exclusive value={priorityFilter} onChange={(_, value: PriorityFilter | null) => { if (value) setPriorityFilter(value); }}>
              <ToggleButton value="all">所有优先级</ToggleButton>
              <ToggleButton value="1">高</ToggleButton>
              <ToggleButton value="2">中</ToggleButton>
              <ToggleButton value="3">低</ToggleButton>
            </ToggleButtonGroup>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>标签</InputLabel>
              <Select label="标签" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
                <MenuItem value="all">全部标签</MenuItem>
                {tags.map((tag) => <MenuItem key={tag.id} value={String(tag.id)}>{tag.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={() => setSearch(searchDraft)}>搜索</Button>
            <Button variant={multiSelect ? 'contained' : 'outlined'} onClick={() => { setMultiSelect((value) => !value); setSelectedTasks(new Set()); }}>多选</Button>
          </Stack>
        </Paper>

        {multiSelect && (
          <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
              <Typography sx={{ mr: 'auto' }}>已选择 {selectedTasks.size} 个任务</Typography>
              <Button disabled={selectedTasks.size === 0} startIcon={<CheckCircleRoundedIcon />} onClick={() => void runBulkAction('complete')}>全部完成</Button>
              <Button disabled={selectedTasks.size === 0} startIcon={<DriveFileMoveRoundedIcon />} onClick={() => setMoveDialogOpen(true)}>移动到...</Button>
              <Button disabled={selectedTasks.size === 0} color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setDeleteDialogOpen(true)}>删除</Button>
              <Button onClick={() => { setMultiSelect(false); setSelectedTasks(new Set()); }}>取消选择</Button>
            </Stack>
          </Paper>
        )}

        <Stack spacing={1.5}>
          {loading && <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>正在加载任务...</Paper>}
          {!loading && visibleTodos.length === 0 && (
            <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h6">还没有任务</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>创建一个任务后, 它会显示在这里.</Typography>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreateTask}>新建任务</Button>
            </Paper>
          )}
          {!loading && visibleTodos.map((todo) => {
            const meta = priorityMeta(todo.priority);
            const isExpanded = expandedTodo === todo.id;
            return (
              <Paper key={todo.id} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: todo.is_completed ? 'action.hover' : 'background.paper' }}>
                <Stack direction="row" spacing={1.5} sx={{ p: 1.5, alignItems: 'center' }}>
                  {multiSelect ? (
                    <Checkbox checked={selectedTasks.has(todo.id)} onChange={() => toggleTaskSelection(todo.id)} />
                  ) : (
                    <Checkbox checked={todo.is_completed} onChange={() => void toggleTodo(todo)} />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip size="small" color={meta.color} label={meta.label} />
                      <Typography sx={{ fontWeight: 700, textDecoration: todo.is_completed ? 'line-through' : 'none' }}>{todo.title}</Typography>
                      {todo.due_date && <Chip size="small" variant="outlined" label={formatDate(todo.due_date)} />}
                      {todo.children.length > 0 && <Chip size="small" label={`${todo.children.filter((child) => child.is_completed).length}/${todo.children.length} 子任务`} />}
                      {todo.tags.map((tag) => <Chip key={tag.id} size="small" variant="outlined" label={tag.name} />)}
                    </Stack>
                    {todo.note && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap={!isExpanded}>{todo.note}</Typography>}
                  </Box>
                  <IconButton onClick={() => setExpandedTodo(isExpanded ? null : todo.id)} aria-label="展开详情">
                    <ExpandMoreRoundedIcon />
                  </IconButton>
                  <IconButton onClick={() => openEditTask(todo)} aria-label="编辑任务">
                    <EditRoundedIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => void deleteTodo(todo)} aria-label="删除任务">
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                  <IconButton aria-label="更多操作">
                    <MoreHorizRoundedIcon />
                  </IconButton>
                </Stack>
                {isExpanded && (
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1}>
                      <Typography variant="body2"><strong>备注:</strong> {todo.note || '无备注'}</Typography>
                      <Typography variant="body2"><strong>截止日期:</strong> {formatDate(todo.due_date)}</Typography>
                      <Typography variant="body2"><strong>更新时间:</strong> {formatDate(todo.updated_at)}</Typography>
                    </Stack>
                  </Box>
                )}
              </Paper>
            );
          })}
        </Stack>
      </Box>

      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingTodo ? '编辑任务' : '新建任务'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="任务标题" required value={todoForm.title} onChange={(event) => setTodoForm((prev) => ({ ...prev, title: event.target.value }))} autoFocus />
            <TextField label="备注" multiline minRows={4} value={todoForm.note} onChange={(event) => setTodoForm((prev) => ({ ...prev, note: event.target.value }))} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>优先级</InputLabel>
                <Select label="优先级" value={String(todoForm.priority)} onChange={(event) => setTodoForm((prev) => ({ ...prev, priority: Number(event.target.value) }))}>
                  <MenuItem value="1">高</MenuItem>
                  <MenuItem value="2">中</MenuItem>
                  <MenuItem value="3">低</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth type="date" label="截止日期" value={todoForm.due_date} onChange={(event) => setTodoForm((prev) => ({ ...prev, due_date: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <FormControl fullWidth>
              <InputLabel>文件夹</InputLabel>
              <Select label="文件夹" value={todoForm.folder_id} onChange={(event) => setTodoForm((prev) => ({ ...prev, folder_id: event.target.value }))}>
                <MenuItem value="">无文件夹</MenuItem>
                {flatFolders.map((folder) => <MenuItem key={folder.id} value={String(folder.id)}>{folder.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>标签</InputLabel>
              <Select
                multiple
                label="标签"
                value={todoForm.tag_ids.map(String)}
                onChange={(event) => {
                  const value = event.target.value;
                  const ids = typeof value === 'string' ? value.split(',') : value;
                  setTodoForm((prev) => ({ ...prev, tag_ids: ids.map(Number) }));
                }}
                renderValue={(selected) => selected.map((id) => tags.find((tag) => String(tag.id) === id)?.name ?? id).join(', ')}
              >
                {tags.map((tag) => <MenuItem key={tag.id} value={String(tag.id)}>{tag.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => void saveTodo()} disabled={saving}>{saving ? '保存中' : '保存'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{folderForm.id ? '编辑文件夹' : '新建文件夹'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="文件夹名称" value={folderForm.name} onChange={(event) => setFolderForm((prev) => ({ ...prev, name: event.target.value }))} autoFocus />
            <TextField label="颜色" value={folderForm.color} onChange={(event) => setFolderForm((prev) => ({ ...prev, color: event.target.value }))} />
            <FormControl fullWidth>
              <InputLabel>父文件夹</InputLabel>
              <Select label="父文件夹" value={folderForm.parent_id} onChange={(event) => setFolderForm((prev) => ({ ...prev, parent_id: event.target.value }))}>
                <MenuItem value="">顶级文件夹</MenuItem>
                {flatFolders.filter((folder) => folder.id !== folderForm.id).map((folder) => <MenuItem key={folder.id} value={String(folder.id)}>{folder.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => void saveFolder()}>{folderForm.id ? '保存' : '创建'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>移动到文件夹</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>目标文件夹</InputLabel>
            <Select label="目标文件夹" value={moveFolderId} onChange={(event) => setMoveFolderId(event.target.value)}>
              <MenuItem value="">无文件夹</MenuItem>
              {flatFolders.map((folder) => <MenuItem key={folder.id} value={String(folder.id)}>{folder.name}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => void runBulkAction('move')}>移动</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">确定要删除选中的 {selectedTasks.size} 个任务吗? 此操作不可撤销.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button color="error" variant="contained" onClick={() => void runBulkAction('delete')}>删除</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={2600} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
