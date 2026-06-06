'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TodoSidebar from '@/components/layout/TodoSidebar';
import ContentHeader from '@/components/layout/ContentHeader';
import TaskToolbar from '@/components/todo/TaskToolbar';
import TaskList from '@/components/todo/TaskList';
import BatchBar from '@/components/todo/BatchBar';
import TaskDialog, { type TaskFormData } from '@/components/todo/TaskDialog';
import FolderDialog from '@/components/todo/FolderDialog';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';
import Skeleton from '@/components/shared/Skeleton';
import type { TodoOut, FolderOut, APITag } from '@/lib/types';
import { RECUR_TO_RRULE } from '@/lib/types';
import {
  listTodos, createTodo, updateTodo, deleteTodo, toggleTodo, bulkAction,
  listFolders, createFolder, deleteFolder as apiDeleteFolder, updateFolder,
  listTags, createTag, ApiError,
} from '@/lib/api';
import dayjs from 'dayjs';

type TodoQueryParams = NonNullable<Parameters<typeof listTodos>[0]>;

function findFolderById(folders: FolderOut[], folderId: number): FolderOut | undefined {
  for (const folder of folders) {
    if (folder.id === folderId) return folder;
    const child = findFolderById(folder.children ?? [], folderId);
    if (child) return child;
  }
  return undefined;
}

export default function TodoPage() {
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('all');
  const [activeFolder, setActiveFolder] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'incomplete' | 'completed'>('incomplete');
  const [priorityFilter, setPriorityFilter] = useState<'all' | number>('all');
  const [tagFilter, setTagFilter] = useState<number | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  // API Data
  const [todos, setTodos] = useState<TodoOut[]>([]);
  const [folders, setFolders] = useState<FolderOut[]>([]);
  const [tags, setTags] = useState<APITag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Dialog State
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogMode, setTaskDialogMode] = useState<'create' | 'edit'>('create');
  const [editingTask, setEditingTask] = useState<TaskFormData | undefined>(undefined);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<TodoOut | null>(null);
  const [folderDeleteDialogOpen, setFolderDeleteDialogOpen] = useState(false);
  const [folderDeleteTarget, setFolderDeleteTarget] = useState<number | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'info',
  });
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Debounce ref for search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===== Data Fetching =====
  const fetchAllData = useCallback(async (params?: TodoQueryParams) => {
    try {
      setFetchError(null);
      const [todoRes, folderRes, tagRes] = await Promise.all([
        listTodos(params),
        listFolders(),
        listTags(),
      ]);
      setTodos(todoRes.items);
      setFolders(folderRes);
      setTags(tagRes);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '加载数据失败';
      setFetchError(msg);
      showSnackbar(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // ===== Filters =====
  // Build query params for re-fetch based on filter state
  useEffect(() => {
    if (isLoading) return;
    const params: TodoQueryParams = {};
    if (activeFolder !== null) params.folder_id = activeFolder;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (typeof priorityFilter === 'number') params.priority = priorityFilter;
    if (statusFilter === 'completed') params.status = 'completed';
    else if (statusFilter === 'incomplete') params.status = 'active';
    if (tagFilter) params.tag_id = tagFilter;
    fetchAllData(params);
  }, [activeFolder, priorityFilter, tagFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (isLoading) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const params: TodoQueryParams = {};
      if (activeFolder !== null) params.folder_id = activeFolder;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (typeof priorityFilter === 'number') params.priority = priorityFilter;
      if (statusFilter === 'completed') params.status = 'completed';
      else if (statusFilter === 'incomplete') params.status = 'active';
      if (tagFilter) params.tag_id = tagFilter;
      fetchAllData(params);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps


  // ===== Dynamic Counts =====
  const viewCounts = useMemo(() => ({
    all: todos.length,
    today: todos.filter((t) => t.due_date === dayjs().format('YYYY-MM-DD') && !t.is_completed).length,
    upcoming: todos.filter((t) => t.due_date && dayjs(t.due_date).isAfter(dayjs(), 'day') && !t.is_completed).length,
    completed: todos.filter((t) => t.is_completed).length,
  }), [todos]);

  // ===== Handlers =====
  const handleToggleComplete = useCallback(async (taskId: number) => {
    const todo = todos.find((t) => t.id === taskId);
    if (!todo) return;
    try {
      await toggleTodo(taskId);
      setTodos((prev) => prev.map((t) => t.id === taskId ? { ...t, is_completed: !t.is_completed } : t));
      showSnackbar(todo.is_completed ? '已取消完成' : '✅ 已标记为完成', todo.is_completed ? 'info' : 'success');
    } catch (err) {
      showSnackbar('操作失败', 'error');
    }
  }, [todos]);

  const handleToggleSelect = useCallback((taskId: number) => {
    setSelectedTasks((prev) => { const n = new Set(prev); if (n.has(taskId)) n.delete(taskId); else n.add(taskId); return n; });
  }, []);

  const handleExpand = useCallback((taskId: number) => {
    setExpandedTask((prev) => (prev === taskId ? null : taskId));
  }, []);

  const handleSelectTask = useCallback((taskId: number) => {
    if (multiSelectMode) handleToggleSelect(taskId);
    else handleExpand(taskId);
  }, [multiSelectMode, handleToggleSelect, handleExpand]);

  const handleViewChange = useCallback((viewId: string) => {
    setActiveView(viewId);
    setActiveFolder(null);
  }, []);

  const handleFolderChange = useCallback((folderId: number) => {
    setActiveFolder(folderId);
    setActiveView('');
  }, []);

  const handleToggleMultiSelect = useCallback(() => {
    setMultiSelectMode((prev) => { if (prev) setSelectedTasks(new Set()); return !prev; });
  }, []);

  // ===== Task CRUD =====
  const handleNewTask = useCallback(() => {
    setEditingTask({
      title: '',
      note: '',
      priority: 2,
      due_date: '',
      folder_id: activeFolder,
      tag_ids: [],
      recurrence: '不重复',
    });
    setTaskDialogMode('create');
    setTaskDialogOpen(true);
  }, [activeFolder]);

  const handleEditTask = useCallback((todo: TodoOut) => {
    setEditingTask({
      id: todo.id,
      title: todo.title,
      note: todo.note || '',
      priority: todo.priority,
      due_date: todo.due_date || '',
      folder_id: todo.folder_id,
      tag_ids: todo.tags?.map((t) => t.id) || [],
      recurrence: '',
    });
    setTaskDialogMode('edit');
    setTaskDialogOpen(true);
  }, []);

  const handleDeleteTask = useCallback((todo: TodoOut) => {
    setDeleteTaskTarget(todo);
    setDeleteDialogOpen(true);
  }, []);

  const handleCreateSubTask = useCallback((parentTask: TodoOut) => {
    setEditingTask({
      title: '',
      note: '',
      priority: 2,
      due_date: '',
      folder_id: parentTask.folder_id,
      tag_ids: [],
      recurrence: '不重复',
      parent_id: parentTask.id,
    });
    setTaskDialogMode('create');
    setTaskDialogOpen(true);
  }, []);

  const handleSaveTask = useCallback(async (data: TaskFormData) => {
    try {
      const rrules = data.recurrence && data.recurrence !== '不重复' ? [RECUR_TO_RRULE[data.recurrence] || ''] : [];
      if (data.id) {
        await updateTodo(data.id, {
          title: data.title,
          note: data.note || undefined,
          priority: data.priority,
          due_date: data.due_date || null,
          folder_id: data.folder_id,
          tag_ids: data.tag_ids,
          recurrence_rules: rrules.filter(Boolean),
        });
        setTaskDialogOpen(false);
        showSnackbar('✅ 任务已更新', 'success');
      } else {
        await createTodo({
          title: data.title,
          note: data.note || undefined,
          priority: data.priority,
          due_date: data.due_date || null,
          folder_id: data.folder_id,
          parent_id: data.parent_id,
          tag_ids: data.tag_ids,
          recurrence_rules: rrules.filter(Boolean),
        });
        setTaskDialogOpen(false);
        showSnackbar('✅ 任务已创建', 'success');
      }
      // Re-fetch after save
      fetchAllData(activeFolder !== null ? { folder_id: activeFolder } : undefined);
    } catch (err) {
      showSnackbar(err instanceof ApiError ? err.message : '保存失败', 'error');
    }
  }, [activeFolder, fetchAllData]);

  const handleSaveAndNew = useCallback(async (data: TaskFormData) => {
    try {
      const rrules = data.recurrence && data.recurrence !== '不重复' ? [RECUR_TO_RRULE[data.recurrence] || ''] : [];
      await createTodo({
        title: data.title,
        note: data.note || undefined,
        priority: data.priority,
        due_date: data.due_date || null,
        folder_id: data.folder_id,
        parent_id: data.parent_id,
        tag_ids: data.tag_ids,
        recurrence_rules: rrules.filter(Boolean),
      });
      showSnackbar('✅ 任务已创建，继续新建', 'success');
      fetchAllData(activeFolder !== null ? { folder_id: activeFolder } : undefined);
    } catch (err) {
      showSnackbar(err instanceof ApiError ? err.message : '保存失败', 'error');
    }
  }, [activeFolder, fetchAllData]);

  const handleConfirmDeleteTask = useCallback(async () => {
    if (!deleteTaskTarget) return;
    try {
      await deleteTodo(deleteTaskTarget.id);
      setTodos((prev) => prev.filter((t) => t.id !== deleteTaskTarget.id));
      setDeleteDialogOpen(false);
      setDeleteTaskTarget(null);
      showSnackbar('🗑️ 任务已删除', 'error');
    } catch (err) {
      showSnackbar('删除失败', 'error');
    }
  }, [deleteTaskTarget]);

  // ===== Batch Operations =====
  const handleBatchComplete = useCallback(async () => {
    const ids = Array.from(selectedTasks);
    try {
      await bulkAction({ ids, action: 'complete' });
      setSelectedTasks(new Set());
      showSnackbar(`✅ 已完成 ${ids.length} 个任务`, 'success');
      fetchAllData();
    } catch (err) {
      showSnackbar('批量操作失败', 'error');
    }
  }, [selectedTasks, fetchAllData]);

  const handleBatchDelete = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmBatchDelete = useCallback(async () => {
    const ids = Array.from(selectedTasks);
    try {
      await bulkAction({ ids, action: 'delete' });
      setDeleteDialogOpen(false);
      setMultiSelectMode(false);
      setSelectedTasks(new Set());
      showSnackbar(`已删除 ${ids.length} 个任务`, 'error');
      fetchAllData();
    } catch (err) {
      showSnackbar('批量删除失败', 'error');
    }
  }, [selectedTasks, fetchAllData]);

  const handleBatchCancel = useCallback(() => {
    setSelectedTasks(new Set());
    setMultiSelectMode(false);
  }, []);

  const handleBatchMove = useCallback(async () => {
    const ids = Array.from(selectedTasks);
    // For now, show snackbar. TODO: add folder picker dialog
    showSnackbar('请选择目标文件夹', 'info');
  }, []);

  // ===== Folder Operations =====
  const handleSaveFolder = useCallback(async (name: string, color: string) => {
    try {
      await createFolder({ name, color });
      setFolderDialogOpen(false);
      showSnackbar(`✅ 文件夹「${name}」已创建`, 'success');
      fetchAllData();
    } catch (err) {
      showSnackbar(err instanceof ApiError ? err.message : '创建文件夹失败', 'error');
    }
  }, [fetchAllData]);

  const handleDeleteFolder = useCallback((folderId: number) => {
    setFolderDeleteTarget(folderId);
    setFolderDeleteDialogOpen(true);
  }, []);

  const handleConfirmDeleteFolder = useCallback(async () => {
    if (folderDeleteTarget === null) return;
    try {
      await apiDeleteFolder(folderDeleteTarget);
      setFolderDeleteDialogOpen(false);
      setFolderDeleteTarget(null);
      showSnackbar('文件夹已删除', 'info');
      fetchAllData();
    } catch (err) {
      showSnackbar('删除文件夹失败', 'error');
    }
  }, [folderDeleteTarget, fetchAllData]);

  const handleRenameFolder = useCallback(async (folderId: number, newName: string) => {
    try {
      await updateFolder(folderId, { name: newName });
      showSnackbar('文件夹已重命名', 'success');
      fetchAllData();
    } catch (err) {
      showSnackbar('重命名失败', 'error');
    }
  }, [fetchAllData]);

  const handleNewSubFolder = useCallback(async (parentId: number, name: string) => {
    try {
      await createFolder({ name, parent_id: parentId });
      showSnackbar(`✅ 已创建子文件夹「${name}」`, 'success');
      fetchAllData();
    } catch (err) {
      showSnackbar(err instanceof ApiError ? err.message : '创建子文件夹失败', 'error');
    }
  }, [fetchAllData]);

  // View title
  const viewTitle = useMemo(() => {
    if (activeFolder !== null) return findFolderById(folders, activeFolder)?.name || '文件夹';
    const labels: Record<string, string> = { all: '所有任务', today: '今天', upcoming: '即将到期', completed: '已完成' };
    return labels[activeView] || '所有任务';
  }, [activeView, activeFolder, folders]);

  const subtitle = `${todos.filter((t) => !t.is_completed).length} 个待办`;

  const isBatchDeleteDialog = deleteDialogOpen && selectedTasks.size > 0;
  const isSingleDeleteDialog = deleteDialogOpen && deleteTaskTarget !== null;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTaskDialogOpen(false); setFolderDialogOpen(false); setDeleteDialogOpen(false);
        setFolderDeleteDialogOpen(false); setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <TodoSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeFolder ? '' : activeView}
        activeFolder={activeFolder}
        onViewChange={handleViewChange}
        onFolderChange={handleFolderChange}
        onNewFolder={() => setFolderDialogOpen(true)}
        viewCounts={viewCounts}
        folders={folders}
        onDeleteFolder={handleDeleteFolder}
        onRenameFolder={handleRenameFolder}
        onNewSubFolder={handleNewSubFolder}
      />

      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ContentHeader title={viewTitle} subtitle={`· ${subtitle}`} showMenu onMenuClick={() => setSidebarOpen(true)} />

        <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3 }, py: 2.5 }}>
          {isLoading ? (
            <Skeleton />
          ) : (
            <>
              <TaskToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                priorityFilter={priorityFilter}
                onPriorityChange={setPriorityFilter}
                tagFilter={tagFilter}
                onTagFilterChange={setTagFilter}
                allTags={tags}
                multiSelectMode={multiSelectMode}
                onToggleMultiSelect={handleToggleMultiSelect}
                onNewTask={handleNewTask}
              />

              <BatchBar
                count={selectedTasks.size}
                onCompleteAll={handleBatchComplete}
                onMove={handleBatchMove}
                onDelete={handleBatchDelete}
                onCancel={handleBatchCancel}
              />

              {todos.length > 0 ? (
                <TaskList
                  filteredTodos={todos}
                  selectedTasks={selectedTasks}
                  expandedTask={expandedTask}
                  multiSelectMode={multiSelectMode}
                  onToggleComplete={handleToggleComplete}
                  onToggleSelect={handleToggleSelect}
                  onExpand={handleExpand}
                  onSelectTask={handleSelectTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onCreateSubTask={handleCreateSubTask}
                  folders={folders}
                />
              ) : (
                <EmptyState onNewTask={handleNewTask} />
              )}
            </>
          )}
        </Box>
      </Box>

      <TaskDialog
        open={taskDialogOpen}
        mode={taskDialogMode}
        onClose={() => setTaskDialogOpen(false)}
        onSave={handleSaveTask}
        onSaveAndNew={taskDialogMode === 'create' ? handleSaveAndNew : undefined}
        initialData={editingTask}
        allTags={tags}
      />

      <FolderDialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} onSave={handleSaveFolder} />

      <ConfirmDialog
        open={isSingleDeleteDialog}
        title="确认删除"
        message={<>确定要删除任务 <strong>"{deleteTaskTarget?.title}"</strong> 吗？此操作不可撤销。</>}
        confirmLabel="删除" confirmColor="error"
        onConfirm={handleConfirmDeleteTask}
        onCancel={() => { setDeleteDialogOpen(false); setDeleteTaskTarget(null); }}
      />

      <ConfirmDialog
        open={isBatchDeleteDialog}
        title="确认删除"
        message={<>确定要删除选中的 <strong>{selectedTasks.size}</strong> 个任务吗？此操作不可撤销。</>}
        confirmLabel="删除" confirmColor="error"
        onConfirm={handleConfirmBatchDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <ConfirmDialog
        open={folderDeleteDialogOpen}
        title="删除文件夹？"
        message={<>删除文件夹 <strong>{folderDeleteTarget ? folders.find(f => f.id === folderDeleteTarget)?.name : ''}</strong> 后，其中的任务将保留在「所有任务」中。</>}
        confirmLabel="删除" confirmColor="error"
        onConfirm={handleConfirmDeleteFolder}
        onCancel={() => { setFolderDeleteDialogOpen(false); setFolderDeleteTarget(null); }}
      />

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} variant="filled"
          sx={{ borderRadius: 2, fontWeight: 500, fontSize: '0.875rem', '& .MuiAlert-icon': { fontSize: '1rem' } }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
