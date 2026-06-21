'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
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
import {
  SprintTabs, KanbanBoard, KanbanTaskDrawer,
  KanbanSettingsDialog, KanbanTaskDialog, CapacityExceededDialog,
} from '@/components/todo/kanban';
import { getKanbanSubtasks, type KanbanSubtask } from '@/components/todo/kanban/KanbanTaskDrawer';
import type {
  TodoOut, FolderOut, APITag, Sprint, KanbanColumnData, KanbanTaskOut,
  FieldDef, KanbanConfig,
} from '@/lib/types';
import { getRecurrenceLabel, toRRule } from '@/lib/types';
import type { KanbanTaskFormData } from '@/components/todo/kanban/KanbanTaskDialog';
import {
  listTodos, createTodo, updateTodo, deleteTodo, toggleTodo, bulkAction,
  reorderTodos,
  listFolders, createFolder, deleteFolder as apiDeleteFolder, updateFolder, reorderFolders,
  listTags, createTag, ApiError,
} from '@/lib/api';
import {
  listSprints,
  createSprint, updateSprint, deleteSprint,
  listKanbanColumns,
  createKanbanColumn, updateKanbanColumn, deleteKanbanColumn,
} from '@/lib/api';
import dayjs from 'dayjs';
import {
  listKanbanTasks, createKanbanTask, updateKanbanTask, deleteKanbanTask, moveKanbanTask,
} from '@/lib/api/kanbanTask';
import { resolveKanbanFields } from '@/components/todo/kanban/templateDefaults';
import { getLatestSprintId } from '@/components/todo/kanban/sprintSelection';
import { MARKER_COLORS, type MarkerValue } from '@/components/shared/MarkerPicker';

type TodoQueryParams = NonNullable<Parameters<typeof listTodos>[0]>;
type TaskStatusFilter = 'all' | 'incomplete' | 'completed';
type FolderMode = 'todo' | 'kanban';
type FolderModeOverrides = Record<number, FolderMode>;

const SIDEBAR_VIEW_STATUS_FILTERS: Record<string, TaskStatusFilter> = {
  all: 'all',
  today: 'incomplete',
  upcoming: 'incomplete',
  completed: 'completed',
};

function applyFolderModeOverrides(folders: FolderOut[], overrides: FolderModeOverrides): FolderOut[] {
  return folders.map((folder) => ({
    ...folder,
    mode: overrides[folder.id] ?? folder.mode,
    children: applyFolderModeOverrides(folder.children ?? [], overrides),
  }));
}

function compareFolders(a: FolderOut, b: FolderOut): number {
  return a.sort_order - b.sort_order || a.id - b.id;
}

function upsertRootFolder(folders: FolderOut[], folder: FolderOut): FolderOut[] {
  return [...folders.filter((item) => item.id !== folder.id), folder].sort(compareFolders);
}

function replaceFolderById(folders: FolderOut[], updatedFolder: FolderOut): FolderOut[] {
  return folders.map((folder) => {
    if (folder.id === updatedFolder.id) return updatedFolder;
    return {
      ...folder,
      children: replaceFolderById(folder.children ?? [], updatedFolder),
    };
  });
}

function reorderFolderSiblings(
  folders: FolderOut[],
  parentId: number | null,
  orderedIds: number[],
): FolderOut[] {
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
  const sortSiblings = (items: FolderOut[]) => (
    [...items].sort((a, b) => (orderMap.get(a.id) ?? a.sort_order) - (orderMap.get(b.id) ?? b.sort_order) || a.id - b.id)
      .map((folder, index) => ({ ...folder, sort_order: index }))
  );

  if (parentId === null) {
    return sortSiblings(folders);
  }

  return folders.map((folder) => {
    if (folder.id === parentId) {
      return { ...folder, children: sortSiblings(folder.children ?? []) };
    }
    return {
      ...folder,
      children: reorderFolderSiblings(folder.children ?? [], parentId, orderedIds),
    };
  });
}

function reorderTodoSiblings(
  todos: TodoOut[],
  parentId: number | null,
  orderedIds: number[],
): TodoOut[] {
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
  const sortSiblings = (items: TodoOut[]) => (
    [...items].sort((a, b) => (orderMap.get(a.id) ?? a.sort_order) - (orderMap.get(b.id) ?? b.sort_order) || a.id - b.id)
      .map((todo, index) => ({ ...todo, sort_order: index }))
  );

  if (parentId === null) {
    return sortSiblings(todos);
  }

  return todos.map((todo) => {
    if (todo.id === parentId) {
      return { ...todo, children: sortSiblings(todo.children ?? []) };
    }
    return {
      ...todo,
      children: reorderTodoSiblings(todo.children ?? [], parentId, orderedIds),
    };
  });
}

function replaceTodoById(todos: TodoOut[], updated: TodoOut): TodoOut[] {
  return todos.map((todo) => {
    if (todo.id === updated.id) {
      const previousChildren = todo.children ?? [];
      const updatedChildren = updated.children?.length ? updated.children : previousChildren;
      return { ...updated, children: updatedChildren };
    }
    return {
      ...todo,
      children: replaceTodoById(todo.children ?? [], updated),
    };
  });
}

function findFolderById(folders: FolderOut[], folderId: number): FolderOut | undefined {
  for (const folder of folders) {
    if (folder.id === folderId) return folder;
    const child = findFolderById(folder.children ?? [], folderId);
    if (child) return child;
  }
  return undefined;
}

function buildTodoQueryParams({
  activeFolder,
  activeView,
  searchQuery,
  priorityFilter,
  statusFilter,
  tagFilter,
}: {
  activeFolder: number | null;
  activeView: string;
  searchQuery: string;
  priorityFilter: 'all' | number;
  statusFilter: TaskStatusFilter;
  tagFilter: number | null;
}): TodoQueryParams {
  const params: TodoQueryParams = {};
  if (activeFolder !== null) params.folder_id = activeFolder;
  if (searchQuery.trim()) params.search = searchQuery.trim();
  if (typeof priorityFilter === 'number') params.priority = priorityFilter;
  if (tagFilter) params.tag_id = tagFilter;

  if (activeFolder === null && activeView === 'completed') {
    params.status = 'completed';
    return params;
  }

  if (activeFolder === null && activeView === 'today') {
    const today = dayjs().format('YYYY-MM-DD');
    params.status = 'active';
    params.due_from = today;
    params.due_to = today;
    return params;
  }

  if (activeFolder === null && activeView === 'upcoming') {
    params.status = 'active';
    params.due_from = dayjs().add(1, 'day').format('YYYY-MM-DD');
    return params;
  }

  if (statusFilter === 'completed') params.status = 'completed';
  else if (statusFilter === 'incomplete') params.status = 'active';
  return params;
}

function isKanbanCapacityError(err: unknown): err is ApiError {
  return err instanceof ApiError && (
    err.message.includes('capacity') || err.message.includes('容量')
  );
}

export default function TodoPage() {
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('all');
  const [activeFolder, setActiveFolder] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('incomplete');
  const [priorityFilter, setPriorityFilter] = useState<'all' | number>('all');
  const [tagFilter, setTagFilter] = useState<number | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  // API Data
  const [todos, setTodos] = useState<TodoOut[]>([]);
  const [viewCountTodos, setViewCountTodos] = useState<TodoOut[]>([]);
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

  // Kanban state
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprintId, setActiveSprintId] = useState<number | null>(null);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumnData[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTask, setDrawerTask] = useState<KanbanTaskOut | null>(null);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [deleteSprintTarget, setDeleteSprintTarget] = useState<Sprint | null>(null);
  const [capacityExceededOpen, setCapacityExceededOpen] = useState(false);
  const [capacityMessage, setCapacityMessage] = useState('');

  // KanbanTemplate state
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTaskOut[]>([]);
  const [kanbanFields, setKanbanFields] = useState<FieldDef[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [kanbanTaskDialogOpen, setKanbanTaskDialogOpen] = useState(false);
  const [kanbanNewTaskCol, setKanbanNewTaskCol] = useState<number | null>(null);
  const [editingKanbanTask, setEditingKanbanTask] = useState<KanbanTaskOut | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'info',
  });
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Debounce ref for search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const folderModeOverridesRef = useRef<FolderModeOverrides>({});
  const kanbanColsRef = useRef<KanbanColumnData[]>(kanbanColumns);
  const sprintsRef = useRef<Sprint[]>(sprints);

  // ===== Data Fetching =====
  const fetchAllData = useCallback(async (params?: TodoQueryParams) => {
    try {
      setFetchError(null);
      const [todoRes, countRes, folderRes, tagRes] = await Promise.all([
        listTodos(params),
        listTodos({ limit: 500 }),
        listFolders(),
        listTags(),
      ]);
      setTodos(todoRes.items);
      setViewCountTodos(countRes.items);
      setFolders(applyFolderModeOverrides(folderRes, folderModeOverridesRef.current));
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

  const currentFolder = useMemo(() => {
    if (activeFolder === null) return undefined;
    return findFolderById(folders, activeFolder);
  }, [activeFolder, folders]);
  const effectiveKanbanFields = useMemo(
    () => resolveKanbanFields(kanbanFields),
    [kanbanFields],
  );

  const fetchKanbanData = useCallback(async (folderId: number) => {
    try {
      const sprintList = await listSprints(folderId);
      setSprints(sprintList);
      const latestSprintId = getLatestSprintId(sprintList);
      if (latestSprintId !== null) {
        setActiveSprintId(latestSprintId);
      } else {
        setActiveSprintId(null);
        setKanbanColumns([]);
        setKanbanTasks([]);
      }
    } catch (err) {
      showSnackbar('加载 Sprint 失败', 'error');
    }
  }, []);

  const fetchColumns = useCallback(async (sprintId: number) => {
    try {
      const cols = await listKanbanColumns(sprintId);
      setKanbanColumns(cols);
    } catch (err) {
      showSnackbar('加载看板列失败', 'error');
    }
  }, []);

  const fetchKanbanTasks = useCallback(async (folderId: number, sprintId: number) => {
    try {
      const tasks = await listKanbanTasks(folderId, sprintId);
      setKanbanTasks(tasks);
    } catch (err) {
      showSnackbar(err instanceof ApiError ? err.message : '加载看板任务失败', 'error');
    }
  }, []);

  const refreshKanbanBoard = useCallback(async (folderId: number, sprintId: number) => {
    await Promise.all([
      fetchColumns(sprintId),
      fetchKanbanTasks(folderId, sprintId),
    ]);
  }, [fetchColumns, fetchKanbanTasks]);

  // ===== Filters =====
  // Build query params for re-fetch based on filter state
  useEffect(() => {
    if (isLoading) return;
    if (currentFolder?.mode === 'kanban') return;
    fetchAllData(buildTodoQueryParams({
      activeFolder,
      activeView,
      searchQuery,
      priorityFilter,
      statusFilter,
      tagFilter,
    }));
  }, [
    activeFolder,
    activeView,
    currentFolder?.mode,
    priorityFilter,
    tagFilter,
    statusFilter,
    isLoading,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (isLoading) return;
    if (currentFolder?.mode === 'kanban') return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchAllData(buildTodoQueryParams({
        activeFolder,
        activeView,
        searchQuery,
        priorityFilter,
        statusFilter,
        tagFilter,
      }));
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery, currentFolder?.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load kanban data when entering a kanban folder
  useEffect(() => {
    if (currentFolder?.mode === 'kanban' && activeFolder !== null) {
      setActiveSprintId(null);
      setKanbanColumns([]);
      setKanbanTasks([]);
      fetchKanbanData(activeFolder);
      setKanbanFields(resolveKanbanFields(
        currentFolder.kanban_config?.kanban_template?.fields,
      ));
    }
  }, [currentFolder?.mode, activeFolder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load columns and tasks when sprint changes
  useEffect(() => {
    if (currentFolder?.mode !== 'kanban' || activeFolder === null) return;
    if (activeSprintId) {
      refreshKanbanBoard(activeFolder, activeSprintId);
    } else {
      setKanbanColumns([]);
      setKanbanTasks([]);
    }
  }, [activeSprintId, activeFolder, currentFolder?.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Dynamic Counts =====
  const viewCounts = useMemo(() => ({
    all: viewCountTodos.length,
    today: viewCountTodos.filter((t) => t.due_date === dayjs().format('YYYY-MM-DD') && !t.is_completed).length,
    upcoming: viewCountTodos.filter((t) => t.due_date && dayjs(t.due_date).isAfter(dayjs(), 'day') && !t.is_completed).length,
    completed: viewCountTodos.filter((t) => t.is_completed).length,
  }), [viewCountTodos]);

  // ===== Handlers =====
  const handleToggleComplete = useCallback(async (taskId: number) => {
    const todo = todos.find((t) => t.id === taskId);
    if (!todo) return;
    try {
      await toggleTodo(taskId);
      setTodos((prev) => prev.map((t) => t.id === taskId ? { ...t, is_completed: !t.is_completed } : t));
      setViewCountTodos((prev) => prev.map((t) => t.id === taskId ? { ...t, is_completed: !t.is_completed } : t));
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
    setStatusFilter(SIDEBAR_VIEW_STATUS_FILTERS[viewId] ?? 'all');
  }, []);

  const handleFolderChange = useCallback((folderId: number) => {
    setActiveFolder(folderId);
    setActiveView('');
    setStatusFilter('incomplete');
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
      due_time: '',
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
      due_time: todo.due_time || '',
      folder_id: todo.folder_id,
      tag_ids: todo.tags?.map((t) => t.id) || [],
      recurrence: getRecurrenceLabel(todo.recurrence_rules?.[0]?.rrule_string),
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
      due_time: '',
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
      const rrule = toRRule(data.recurrence);
      const refreshParams = buildTodoQueryParams({
        activeFolder,
        activeView,
        searchQuery,
        priorityFilter,
        statusFilter,
        tagFilter,
      });
      if (data.id) {
        const updated = await updateTodo(data.id, {
          title: data.title,
          note: data.note || undefined,
          priority: data.priority,
          due_date: data.due_date || null,
          due_time: data.due_date && data.due_time ? data.due_time : null,
          folder_id: data.folder_id,
          tag_ids: data.tag_ids,
          recurrence_rules: rrule ? [rrule] : [],
        });
        setTodos((prev) => replaceTodoById(prev, updated));
        setViewCountTodos((prev) => replaceTodoById(prev, updated));
        setTaskDialogOpen(false);
        showSnackbar('✅ 任务已更新', 'success');
      } else {
        await createTodo({
          title: data.title,
          note: data.note || undefined,
          priority: data.priority,
          due_date: data.due_date || null,
          due_time: data.due_date && data.due_time ? data.due_time : null,
          folder_id: data.folder_id,
          sprint_id: data.sprint_id,
          column_id: data.column_id,
          parent_id: data.parent_id,
          tag_ids: data.tag_ids,
          recurrence_rules: rrule ? [rrule] : [],
        });
        setTaskDialogOpen(false);
        showSnackbar('✅ 任务已创建', 'success');
      }
      await fetchAllData(refreshParams);
    } catch (err) {
      showSnackbar(err instanceof ApiError ? err.message : '保存失败', 'error');
    }
  }, [
    activeFolder,
    activeView,
    fetchAllData,
    priorityFilter,
    searchQuery,
    statusFilter,
    tagFilter,
  ]);

  const handleSaveAndNew = useCallback(async (data: TaskFormData) => {
    try {
      const rrule = toRRule(data.recurrence);
      await createTodo({
        title: data.title,
        note: data.note || undefined,
        priority: data.priority,
        due_date: data.due_date || null,
        due_time: data.due_date && data.due_time ? data.due_time : null,
        folder_id: data.folder_id,
        sprint_id: data.sprint_id,
        column_id: data.column_id,
        parent_id: data.parent_id,
        tag_ids: data.tag_ids,
        recurrence_rules: rrule ? [rrule] : [],
      });
      showSnackbar('✅ 任务已创建，继续新建', 'success');
      await fetchAllData(buildTodoQueryParams({
        activeFolder,
        activeView,
        searchQuery,
        priorityFilter,
        statusFilter,
        tagFilter,
      }));
    } catch (err) {
      showSnackbar(err instanceof ApiError ? err.message : '保存失败', 'error');
    }
  }, [activeFolder, activeView, fetchAllData, priorityFilter, searchQuery, statusFilter, tagFilter]);

  const handleConfirmDeleteTask = useCallback(async () => {
    if (!deleteTaskTarget) return;
    try {
      await deleteTodo(deleteTaskTarget.id);
      setTodos((prev) => prev.filter((t) => t.id !== deleteTaskTarget.id));
      setViewCountTodos((prev) => prev.filter((t) => t.id !== deleteTaskTarget.id));
      setDeleteDialogOpen(false);
      setDeleteTaskTarget(null);
      showSnackbar('🗑️ 任务已删除', 'error');
    } catch (err) {
      showSnackbar('删除失败', 'error');
    }
  }, [deleteTaskTarget]);

  const handleReorderTasks = useCallback(async (parentId: number | null, orderedIds: number[]) => {
    setTodos((prev) => reorderTodoSiblings(prev, parentId, orderedIds));
    setViewCountTodos((prev) => reorderTodoSiblings(prev, parentId, orderedIds));
    try {
      await reorderTodos(orderedIds.map((id, index) => ({ id, sort_order: index })));
    } catch (err) {
      showSnackbar(err instanceof ApiError ? err.message : '任务排序失败', 'error');
      fetchAllData(buildTodoQueryParams({
        activeFolder,
        activeView,
        searchQuery,
        priorityFilter,
        statusFilter,
        tagFilter,
      }));
    }
  }, [
    activeFolder,
    activeView,
    fetchAllData,
    priorityFilter,
    searchQuery,
    statusFilter,
    tagFilter,
  ]);

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
  const handleSaveFolder = useCallback(async (name: string, marker: MarkerValue, mode: 'todo' | 'kanban') => {
    try {
      const newFolder = await createFolder({
        name,
        color: marker.type === 'color' ? marker.value : MARKER_COLORS[0],
        icon_type: marker.type,
        icon_value: marker.value,
        mode,
      });
      const folderWithSelectedMode = { ...newFolder, mode };
      folderModeOverridesRef.current[newFolder.id] = mode;
      setFolderDialogOpen(false);
      setFolders((prev) => {
        return upsertRootFolder(prev, folderWithSelectedMode);
      });
      showSnackbar(`✅ 文件夹「${name}」已创建`, 'success');
      if (mode === 'kanban') {
        // Auto-switch to the new kanban folder
        handleFolderChange(newFolder.id);
      } else {
        fetchAllData();
      }
    } catch (err) {
      showSnackbar(err instanceof ApiError ? err.message : '创建文件夹失败', 'error');
    }
  }, [fetchAllData, handleFolderChange]);

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

  const handleNewSubFolder = useCallback(async (parentId: number, name: string, marker: MarkerValue, mode: 'todo' | 'kanban' = 'todo') => {
    try {
      const newFolder = await createFolder({
        name,
        parent_id: parentId,
        color: marker.type === 'color' ? marker.value : MARKER_COLORS[0],
        icon_type: marker.type,
        icon_value: marker.value,
        mode,
      });
      folderModeOverridesRef.current[newFolder.id] = mode;
      showSnackbar(`✅ 已创建子文件夹「${name}」`, 'success');
      fetchAllData();
    } catch (err) {
      showSnackbar(err instanceof ApiError ? err.message : '创建子文件夹失败', 'error');
    }
  }, [fetchAllData]);

  const handleReorderFolders = useCallback(async (parentId: number | null, orderedIds: number[]) => {
    const items = orderedIds.map((id, index) => ({ id, sort_order: index }));
    const previousFolders = folders;
    setFolders((prev) => reorderFolderSiblings(prev, parentId, orderedIds));
    try {
      await reorderFolders(items);
    } catch (err) {
      setFolders(previousFolders);
      showSnackbar(err instanceof ApiError ? err.message : '文件夹排序失败', 'error');
    }
  }, [folders]);

  // ===== Kanban Handlers =====
  const handleConfirmFlow = useCallback(async (task: KanbanTaskOut, fromColId: number) => {
    try {
      const sortedCols = [...kanbanColumns].sort((a, b) => a.sort_order - b.sort_order);
      const fromIdx = sortedCols.findIndex(c => c.id === fromColId);
      if (fromIdx < 0 || fromIdx >= sortedCols.length - 1) return;
      const nextCol = sortedCols[fromIdx + 1];
      await moveKanbanTask(task.id, {
        target_column_id: nextCol.id,
        target_sprint_id: activeSprintId,
      });
      showSnackbar(`✅ 已移至「${nextCol.name}」`, 'success');
      if (activeFolder !== null && activeSprintId !== null) {
        await refreshKanbanBoard(activeFolder, activeSprintId);
      }
    } catch (err) {
      if (isKanbanCapacityError(err)) {
        setCapacityMessage(err.message);
        setCapacityExceededOpen(true);
      } else {
        showSnackbar('流转失败', 'error');
      }
    }
  }, [kanbanColumns, activeFolder, activeSprintId, refreshKanbanBoard]);

  const handleBackFlow = useCallback(async (taskId: number, toColId: number) => {
    try {
      await moveKanbanTask(taskId, {
        target_column_id: toColId,
        target_sprint_id: activeSprintId,
      });
      showSnackbar('✅ 已 Back', 'success');
      setDrawerOpen(false);
      if (activeFolder !== null && activeSprintId !== null) {
        await refreshKanbanBoard(activeFolder, activeSprintId);
      }
    } catch (err) {
      if (isKanbanCapacityError(err)) {
        setCapacityMessage(err.message);
        setCapacityExceededOpen(true);
      } else {
        showSnackbar('Back 操作失败', 'error');
      }
    }
  }, [activeFolder, activeSprintId, refreshKanbanBoard]);

  const handleDeleteKanbanTask = useCallback(async (taskId: number) => {
    try {
      await deleteKanbanTask(taskId);
      setKanbanTasks((prev) => prev.filter((task) => task.id !== taskId));
      setDrawerOpen(false);
      setDrawerTask(null);
      showSnackbar('🗑️ 任务已删除', 'error');
      if (activeFolder !== null && activeSprintId !== null) {
        await refreshKanbanBoard(activeFolder, activeSprintId);
      }
    } catch (err) {
      showSnackbar('删除失败', 'error');
    }
  }, [activeFolder, activeSprintId, refreshKanbanBoard]);

  const handleMoveKanbanTask = useCallback(async (taskId: number, fromColId: number, toColId: number) => {
    if (fromColId === toColId) return;
    try {
      await moveKanbanTask(taskId, {
        target_column_id: toColId,
        target_sprint_id: activeSprintId,
      });
      if (activeFolder !== null && activeSprintId !== null) {
        await refreshKanbanBoard(activeFolder, activeSprintId);
      }
    } catch (err) {
      if (isKanbanCapacityError(err)) {
        setCapacityMessage(err.message);
        setCapacityExceededOpen(true);
      } else {
        showSnackbar('移动失败', 'error');
      }
    }
  }, [activeFolder, activeSprintId, refreshKanbanBoard]);

  const handleKanbanNewTask = useCallback((colId: number) => {
    setKanbanNewTaskCol(colId);
    setKanbanTaskDialogOpen(true);
  }, []);

  const handleEditKanbanTask = useCallback((task: KanbanTaskOut) => {
    setEditingKanbanTask(task);
    setKanbanNewTaskCol(task.column_id);
    setKanbanTaskDialogOpen(true);
  }, []);

  const handleSaveKanbanTask = useCallback(async (data: KanbanTaskFormData) => {
    try {
      if (editingKanbanTask) {
        // Edit mode
        const targetSprintId = data.sprint_id ?? activeSprintId ?? editingKanbanTask.sprint_id;
        await updateKanbanTask(editingKanbanTask.id, {
          title: data.title,
          version: data.version || undefined,
          task_type: data.task_type || undefined,
          priority: data.priority || undefined,
          requirement_desc: data.requirement_desc || undefined,
          technical_desc: data.technical_desc || undefined,
          acceptance_criteria: data.acceptance_criteria || undefined,
          sprint_id: targetSprintId,
          custom_fields: Object.keys(data.custom_fields).length > 0 ? data.custom_fields : undefined,
        });
        setKanbanTaskDialogOpen(false);
        setEditingKanbanTask(null);
        setKanbanNewTaskCol(null);
        showSnackbar('✅ 任务已更新', 'success');
        if (activeFolder !== null && activeSprintId !== null) {
          await refreshKanbanBoard(activeFolder, activeSprintId);
        }
      } else {
        // Create mode
        const targetSprintId = activeSprintId;
        const targetColumnId = data.column_id ?? kanbanNewTaskCol;
        if (targetSprintId === null) {
          showSnackbar('请先选择 Sprint', 'error');
          return;
        }
        if (!targetColumnId) {
          showSnackbar('请先选择目标列', 'error');
          return;
        }
        await createKanbanTask({
          folder_id: activeFolder!,
          sprint_id: targetSprintId,
          column_id: targetColumnId,
          title: data.title,
          version: data.version || undefined,
          task_type: data.task_type || undefined,
          priority: data.priority || undefined,
          requirement_desc: data.requirement_desc || undefined,
          technical_desc: data.technical_desc || undefined,
          acceptance_criteria: data.acceptance_criteria || undefined,
          custom_fields: Object.keys(data.custom_fields).length > 0 ? data.custom_fields : undefined,
        });
        setKanbanTaskDialogOpen(false);
        setKanbanNewTaskCol(null);
        showSnackbar('✅ 任务已创建', 'success');
        if (activeFolder !== null && targetSprintId !== null) {
          if (targetSprintId !== activeSprintId) {
            setActiveSprintId(targetSprintId);
          } else {
            await refreshKanbanBoard(activeFolder, targetSprintId);
          }
        }
      }
    } catch (err) {
      showSnackbar(
        err instanceof ApiError ? err.message : (editingKanbanTask ? '更新失败' : '创建失败'),
        'error',
      );
    }
  }, [activeFolder, activeSprintId, kanbanNewTaskCol, refreshKanbanBoard, editingKanbanTask]);

  const persistKanbanSubtasks = useCallback(async (task: KanbanTaskOut, subtasks: KanbanSubtask[]) => {
    const customFields = {
      ...(task.custom_fields ?? {}),
      __subtasks: subtasks,
    };
    const updatedTask = await updateKanbanTask(task.id, { custom_fields: customFields });
    setKanbanTasks((prev) => prev.map((item) => (item.id === updatedTask.id ? updatedTask : item)));
    setDrawerTask(updatedTask);
  }, []);

  const handleAddKanbanSubtask = useCallback(async (task: KanbanTaskOut, title: string) => {
    const subtasks = [
      ...getKanbanSubtasks(task),
      { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, title, completed: false },
    ];
    try {
      await persistKanbanSubtasks(task, subtasks);
    } catch (err) {
      showSnackbar(err instanceof ApiError ? err.message : '新增子任务失败', 'error');
    }
  }, [persistKanbanSubtasks]);

  const handleToggleKanbanSubtask = useCallback(async (task: KanbanTaskOut, subtaskId: string) => {
    const subtasks = getKanbanSubtasks(task).map((subtask) => (
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
    ));
    try {
      await persistKanbanSubtasks(task, subtasks);
    } catch (err) {
      showSnackbar(err instanceof ApiError ? err.message : '更新子任务失败', 'error');
    }
  }, [persistKanbanSubtasks]);

  // View title
  const viewTitle = useMemo(() => {
    if (activeFolder !== null) return findFolderById(folders, activeFolder)?.name || '文件夹';
    const labels: Record<string, string> = { all: '所有任务', today: '今天', upcoming: '即将到期', completed: '已完成' };
    return labels[activeView] || '所有任务';
  }, [activeView, activeFolder, folders]);

  const subtitle = currentFolder?.mode === 'kanban'
    ? `${kanbanTasks.length} 个看板任务`
    : `${todos.filter((t) => !t.is_completed).length} 个待办`;

  const isBatchDeleteDialog = deleteDialogOpen && selectedTasks.size > 0;
  const isSingleDeleteDialog = deleteDialogOpen && deleteTaskTarget !== null;

  // Keep refs in sync for kanban settings persistence
  kanbanColsRef.current = kanbanColumns;
  sprintsRef.current = sprints;

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

  // Virtual "Unassigned" column for tasks with null column_id
  const kanbanDisplayColumns = useMemo<KanbanColumnData[]>(() => {
    if (currentFolder?.mode !== 'kanban' || kanbanColumns.length === 0) {
      return kanbanColumns;
    }
    const hasUnassigned = kanbanTasks.some(t => t.column_id === null);
    if (!hasUnassigned) return kanbanColumns;

    return [
      ...kanbanColumns,
      {
        id: -1,
        sprint_id: activeSprintId ?? 0,
        name: '未分配',
        color: '#9E9E9E',
        capacity: null,
        sort_order: kanbanColumns.length,
        is_archived: false,
        task_count: 0,
        created_at: '',
        updated_at: '',
      },
    ];
  }, [kanbanColumns, kanbanTasks, currentFolder?.mode, activeSprintId]);

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
        onReorderFolders={handleReorderFolders}
      />

      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {currentFolder?.mode !== 'kanban' && (
          <ContentHeader title={viewTitle} subtitle={`· ${subtitle}`} showMenu onMenuClick={() => setSidebarOpen(true)} />
        )}

        {isLoading ? (
          <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3 }, py: 2.5 }}>
            <Skeleton />
          </Box>
        ) : currentFolder?.mode === 'kanban' ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', px: { xs: 2, sm: 3 }, py: 2.5 }}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {viewTitle}
              </Typography>
              <Chip label="Kanban" size="small" sx={{ bgcolor: '#EADDFF', color: '#21005D', fontSize: '0.7rem' }} />
            </Box>
            <SprintTabs
              sprints={sprints}
              activeSprintId={activeSprintId}
              onSprintChange={setActiveSprintId}
              onNewSprint={() => setSettingsOpen(true)}
              onOpenSettings={() => setSettingsOpen(true)}
            />

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <KanbanBoard
                columns={kanbanDisplayColumns}
                tasks={kanbanTasks}
                fields={effectiveKanbanFields}
                onTaskClick={(task) => { setDrawerTask(task); setDrawerOpen(true); }}
                onConfirm={handleConfirmFlow}
                onMoveTask={handleMoveKanbanTask}
                onNewTask={handleKanbanNewTask}
              />
            </Box>
          </Box>
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

              <Box sx={{ flex: 1, overflowY: 'auto' }}>
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
                    onReorderTasks={handleReorderTasks}
                    folders={folders}
                  />
                ) : (
                  <EmptyState onNewTask={handleNewTask} />
                )}
              </Box>
            </>
          )}
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

      {currentFolder?.mode === 'kanban' && (
        <KanbanTaskDialog
          open={kanbanTaskDialogOpen}
          onClose={() => { setKanbanTaskDialogOpen(false); setKanbanNewTaskCol(null); setEditingKanbanTask(null); }}
          onSave={handleSaveKanbanTask}
          fields={effectiveKanbanFields}
          defaultSprintId={activeSprintId}
          editTask={editingKanbanTask}
        />
      )}

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

      {/* Kanban Task Drawer */}
      <KanbanTaskDrawer
        open={drawerOpen}
        task={drawerTask}
        columns={kanbanColumns}
        fields={effectiveKanbanFields}
        onClose={() => { setDrawerOpen(false); setDrawerTask(null); }}
        onMove={handleBackFlow}
        onDelete={(taskId) => handleDeleteKanbanTask(taskId)}
        onEdit={handleEditKanbanTask}
        onAddSubtask={handleAddKanbanSubtask}
        onToggleSubtask={handleToggleKanbanSubtask}
      />

      {/* Kanban Settings Dialog */}
      {currentFolder?.mode === 'kanban' && (
        <KanbanSettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          columns={kanbanColumns}
          sprints={sprints}
          fields={effectiveKanbanFields}
          kanbanConfig={currentFolder?.kanban_config ?? null}
          onSaveColumns={async (cols) => {
            const prev = kanbanColsRef.current;
            setKanbanColumns(cols);
            // Delete removed columns
            for (const oldCol of prev) {
              if (!cols.some(c => c.id === oldCol.id)) {
                try { await deleteKanbanColumn(oldCol.id); }
                catch (err) { showSnackbar(err instanceof ApiError ? err.message : '删除列失败', 'error'); }
              }
            }
            // Update changed columns
            for (const col of cols) {
              const oldCol = prev.find(c => c.id === col.id);
              if (oldCol && (oldCol.name !== col.name || oldCol.capacity !== col.capacity || oldCol.color !== col.color)) {
                try { await updateKanbanColumn(col.id, { name: col.name, capacity: col.capacity, color: col.color ?? undefined }); }
                catch (err) { showSnackbar(err instanceof ApiError ? err.message : '更新列失败', 'error'); }
              }
            }
          }}
          onSaveFields={async (fields) => {
            const resolvedFields = resolveKanbanFields(fields);
            setKanbanFields(resolvedFields);
            if (activeFolder) {
              try {
                const updatedFolder = await updateFolder(activeFolder, {
                  kanban_config: {
                    kanban_template: { fields: resolvedFields },
                  } as KanbanConfig,
                });
                setFolders((prev) => replaceFolderById(prev, updatedFolder));
              } catch (err) {
                showSnackbar(
                  err instanceof ApiError ? err.message : '保存模板失败',
                  'error',
                );
              }
            }
          }}
          onSaveSprints={async (sprints) => {
            const prev = sprintsRef.current;
            setSprints(sprints);
            // Delete removed sprints
            for (const oldS of prev) {
              if (!sprints.some(s => s.id === oldS.id) && oldS.id > 0) {
                try { await deleteSprint(oldS.id); }
                catch (err) { showSnackbar(err instanceof ApiError ? err.message : '删除 Sprint 失败', 'error'); }
              }
            }
            // Update changed / create new sprints
            for (const sprint of sprints) {
              const oldS = prev.find(s => s.id === sprint.id);
              if (oldS) {
                const changed = oldS.name !== sprint.name || oldS.goal !== sprint.goal
                  || oldS.start_date !== sprint.start_date || oldS.end_date !== sprint.end_date
                  || oldS.status !== sprint.status;
                if (changed) {
                  try { await updateSprint(sprint.id, { name: sprint.name, goal: sprint.goal, start_date: sprint.start_date, end_date: sprint.end_date, status: sprint.status }); }
                  catch (err) { showSnackbar(err instanceof ApiError ? err.message : '更新 Sprint 失败', 'error'); }
                }
              } else if (!sprint.id || sprint.id <= 0) {
                // New sprint
                try {
                  const created = await createSprint({ folder_id: activeFolder!, name: sprint.name, goal: sprint.goal, start_date: sprint.start_date, end_date: sprint.end_date, status: sprint.status, sort_order: sprint.sort_order });
                  setSprints(prev => prev.map(s => s === sprint ? created : s));
                } catch (err) { showSnackbar(err instanceof ApiError ? err.message : '创建 Sprint 失败', 'error'); }
              }
            }
          }}
          onSavePreferences={async (prefs) => {
            if (!activeFolder) return;
            try {
              const updatedFolder = await updateFolder(activeFolder, {
                kanban_config: {
                  ...currentFolder?.kanban_config,
                  prefs,
                } as KanbanConfig,
              });
              setFolders((prev) => replaceFolderById(prev, updatedFolder));
            } catch (err) {
              showSnackbar(err instanceof ApiError ? err.message : '保存偏好设置失败', 'error');
            }
          }}
        />
      )}

      {/* Capacity Exceeded Dialog */}
      <CapacityExceededDialog
        open={capacityExceededOpen}
        message={capacityMessage}
        onClose={() => setCapacityExceededOpen(false)}
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
