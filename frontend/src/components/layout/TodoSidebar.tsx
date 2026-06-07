'use client';

import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useTheme } from '@mui/material/styles';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import type { FolderOut } from '@/lib/types';
import MarkerPicker, {
  MARKER_COLORS,
  MarkerIcon,
  type MarkerValue,
} from '@/components/shared/MarkerPicker';

interface SidebarView {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface TodoSidebarProps {
  open: boolean;
  onClose: () => void;
  activeView: string;
  activeFolder: number | null;
  onViewChange: (viewId: string) => void;
  onFolderChange: (folderId: number) => void;
  onNewFolder: () => void;
  viewCounts: Record<string, number>;
  folders: FolderOut[];
  onDeleteFolder: (folderId: number) => void;
  onRenameFolder: (folderId: number, newName: string) => void;
  onNewSubFolder: (parentId: number, name: string, marker: MarkerValue, mode: 'todo' | 'kanban') => void;
  onReorderFolders: (parentId: number | null, orderedIds: number[]) => void;
}

type PopoverPosition = {
  top: number;
  left: number;
};

const SIDEBAR_WIDTH = 280;

const VIEWS: SidebarView[] = [
  { id: 'all', label: '所有任务', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg> },
  { id: 'today', label: '今天', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg> },
  { id: 'upcoming', label: '即将到期', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v4M6 2v4" /><path d="M2 10h20" /><rect x="2" y="4" width="20" height="18" rx="2" /><path d="M9 16l2 2 4-4" /></svg> },
  { id: 'completed', label: '已完成', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg> },
];

const VIEW_STORAGE_KEY = 'tool_web.todo.sidebar_views';
const DEFAULT_VIEW_IDS = VIEWS.map((view) => view.id);

type FolderDropPosition = 'before' | 'after';

function normalizeViewIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return DEFAULT_VIEW_IDS;
  const allowed = new Set(DEFAULT_VIEW_IDS);
  const normalized = ids.filter((id): id is string => typeof id === 'string' && allowed.has(id));
  return normalized.length > 0 ? normalized : DEFAULT_VIEW_IDS;
}

function loadViewIds(): string[] {
  if (typeof window === 'undefined') return DEFAULT_VIEW_IDS;
  try {
    return normalizeViewIds(JSON.parse(window.localStorage.getItem(VIEW_STORAGE_KEY) ?? 'null'));
  } catch {
    return DEFAULT_VIEW_IDS;
  }
}

function moveId(ids: string[], id: string, direction: -1 | 1): string[] {
  const index = ids.indexOf(id);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

function findFolder(folders: FolderOut[], folderId: number): FolderOut | null {
  for (const folder of folders) {
    if (folder.id === folderId) return folder;
    const child = findFolder(folder.children ?? [], folderId);
    if (child) return child;
  }
  return null;
}

function getSiblingIds(folders: FolderOut[], parentId: number | null): number[] {
  if (parentId === null) {
    return folders.filter((folder) => folder.parent_id === null).map((folder) => folder.id);
  }
  return findFolder(folders, parentId)?.children?.map((folder) => folder.id) ?? [];
}

function moveFolderId(ids: number[], draggedId: number, targetId: number, position: FolderDropPosition): number[] {
  const withoutDragged = ids.filter((id) => id !== draggedId);
  const targetIndex = withoutDragged.indexOf(targetId);
  if (targetIndex < 0) return ids;
  const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
  const next = [...withoutDragged];
  next.splice(insertIndex, 0, draggedId);
  return next;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transformOrigin: 'center', color: 'oklch(82% 0.01 275)', flexShrink: 0 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
    </Box>
  );
}

export default function TodoSidebar({
  open, onClose, activeView, activeFolder, onViewChange, onFolderChange,
  onNewFolder, viewCounts, folders, onDeleteFolder, onRenameFolder, onNewSubFolder,
  onReorderFolders,
}: TodoSidebarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [collapsedFolders, setCollapsedFolders] = useState<Set<number>>(new Set());
  const [visibleViewIds, setVisibleViewIds] = useState<string[]>(loadViewIds);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [subPopoverPosition, setSubPopoverPosition] = useState<PopoverPosition | null>(null);
  const [subPopoverParent, setSubPopoverParent] = useState<number | null>(null);
  const [subPopoverName, setSubPopoverName] = useState('');
  const [subPopoverMarker, setSubPopoverMarker] = useState<MarkerValue>({
    type: 'color',
    value: MARKER_COLORS[0],
  });
  const [subPopoverMode, setSubPopoverMode] = useState<'todo' | 'kanban'>('todo');

  const [folderMenuAnchor, setFolderMenuAnchor] = useState<null | HTMLElement>(null);
  const [folderMenuTarget, setFolderMenuTarget] = useState<number | null>(null);

  const [renamingFolder, setRenamingFolder] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [draggingFolderId, setDraggingFolderId] = useState<number | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<{ id: number; position: FolderDropPosition } | null>(null);

  const toggleFolder = (id: number) => {
    setCollapsedFolders((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const visibleViews = useMemo(
    () => visibleViewIds.map((id) => VIEWS.find((view) => view.id === id)).filter((view): view is SidebarView => Boolean(view)),
    [visibleViewIds],
  );
  const hiddenViews = useMemo(
    () => VIEWS.filter((view) => !visibleViewIds.includes(view.id)),
    [visibleViewIds],
  );
  const rootFolders = folders.filter((f) => f.parent_id === null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(visibleViewIds));
    }
  }, [visibleViewIds]);

  useEffect(() => {
    if (activeFolder !== null || !activeView || visibleViewIds.includes(activeView)) return;
    onViewChange(visibleViewIds[0] ?? 'all');
  }, [activeFolder, activeView, onViewChange, visibleViewIds]);

  return (
    <>
      <DrawerContent
        isDesktop={isDesktop}
        open={open}
        onClose={onClose}
        activeView={activeView}
        activeFolder={activeFolder}
        onViewChange={onViewChange}
        onFolderChange={onFolderChange}
        onNewFolder={onNewFolder}
        viewCounts={viewCounts}
        views={visibleViews}
        hiddenViews={hiddenViews}
        visibleViewIds={visibleViewIds}
        setVisibleViewIds={setVisibleViewIds}
        viewDialogOpen={viewDialogOpen}
        setViewDialogOpen={setViewDialogOpen}
        folders={folders}
        rootFolders={rootFolders}
        collapsedFolders={collapsedFolders}
        onToggleFolder={toggleFolder}
        draggingFolderId={draggingFolderId}
        setDraggingFolderId={setDraggingFolderId}
        dragOverFolder={dragOverFolder}
        setDragOverFolder={setDragOverFolder}
        onReorderFolders={onReorderFolders}
        subPopoverPosition={subPopoverPosition}
        setSubPopoverPosition={setSubPopoverPosition}
        subPopoverParent={subPopoverParent}
        setSubPopoverParent={setSubPopoverParent}
        subPopoverName={subPopoverName}
        setSubPopoverName={setSubPopoverName}
        subPopoverMarker={subPopoverMarker}
        setSubPopoverMarker={setSubPopoverMarker}
        subPopoverMode={subPopoverMode}
        setSubPopoverMode={setSubPopoverMode}
        onNewSubFolder={onNewSubFolder}
        folderMenuAnchor={folderMenuAnchor}
        setFolderMenuAnchor={setFolderMenuAnchor}
        folderMenuTarget={folderMenuTarget}
        setFolderMenuTarget={setFolderMenuTarget}
        renamingFolder={renamingFolder}
        setRenamingFolder={setRenamingFolder}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
      />
    </>
  );
}

function DrawerContent({
  isDesktop, open, onClose, activeView, activeFolder, onViewChange, onFolderChange,
  onNewFolder, viewCounts, views, hiddenViews, visibleViewIds, setVisibleViewIds,
  viewDialogOpen, setViewDialogOpen, folders, rootFolders, collapsedFolders, onToggleFolder,
  draggingFolderId, setDraggingFolderId, dragOverFolder, setDragOverFolder, onReorderFolders,
  subPopoverPosition, setSubPopoverPosition, subPopoverParent, setSubPopoverParent,
  subPopoverName, setSubPopoverName, subPopoverMarker, setSubPopoverMarker,
  subPopoverMode, setSubPopoverMode, onNewSubFolder,
  folderMenuAnchor, setFolderMenuAnchor, folderMenuTarget, setFolderMenuTarget,
  renamingFolder, setRenamingFolder, renameValue, setRenameValue,
  onRenameFolder, onDeleteFolder,
}: {
  isDesktop: boolean; open: boolean; onClose: () => void;
  activeView: string; activeFolder: number | null;
  onViewChange: (id: string) => void; onFolderChange: (id: number) => void;
  onNewFolder: () => void; viewCounts: Record<string, number>;
  views: SidebarView[]; hiddenViews: SidebarView[];
  visibleViewIds: string[]; setVisibleViewIds: (ids: string[]) => void;
  viewDialogOpen: boolean; setViewDialogOpen: (open: boolean) => void;
  folders: FolderOut[]; rootFolders: FolderOut[];
  collapsedFolders: Set<number>; onToggleFolder: (id: number) => void;
  draggingFolderId: number | null; setDraggingFolderId: (id: number | null) => void;
  dragOverFolder: { id: number; position: FolderDropPosition } | null;
  setDragOverFolder: (value: { id: number; position: FolderDropPosition } | null) => void;
  onReorderFolders: (parentId: number | null, orderedIds: number[]) => void;
  subPopoverPosition: PopoverPosition | null; setSubPopoverPosition: (position: PopoverPosition | null) => void;
  subPopoverParent: number | null; setSubPopoverParent: (p: number | null) => void;
  subPopoverName: string; setSubPopoverName: (n: string) => void;
  subPopoverMarker: MarkerValue; setSubPopoverMarker: (m: MarkerValue) => void;
  subPopoverMode: 'todo' | 'kanban'; setSubPopoverMode: (mode: 'todo' | 'kanban') => void;
  onNewSubFolder: (pid: number, name: string, marker: MarkerValue, mode: 'todo' | 'kanban') => void;
  folderMenuAnchor: HTMLElement | null; setFolderMenuAnchor: (a: HTMLElement | null) => void;
  folderMenuTarget: number | null; setFolderMenuTarget: (t: number | null) => void;
  renamingFolder: number | null; setRenamingFolder: (f: number | null) => void;
  renameValue: string; setRenameValue: (v: string) => void;
  onRenameFolder: (id: number, name: string) => void;
  onDeleteFolder: (id: number) => void;
}) {
  const closeIfMobile = () => { if (!isDesktop) onClose(); };
  const resetSubPopover = () => {
    setSubPopoverPosition(null);
    setSubPopoverParent(null);
    setSubPopoverName('');
    setSubPopoverMarker({ type: 'color', value: MARKER_COLORS[0] });
    setSubPopoverMode('todo');
  };

  const handleFolderDragStart = (folderId: number) => {
    setDraggingFolderId(folderId);
  };

  const handleFolderDragOver = (event: React.DragEvent<HTMLElement>, folder: FolderOut) => {
    if (draggingFolderId === null || draggingFolderId === folder.id) return;
    const draggedFolder = findFolder(folders, draggingFolderId);
    if (!draggedFolder || draggedFolder.parent_id !== folder.parent_id) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const rect = event.currentTarget.getBoundingClientRect();
    const position: FolderDropPosition = event.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
    setDragOverFolder({ id: folder.id, position });
  };

  const handleFolderDrop = (event: React.DragEvent<HTMLElement>, folder: FolderOut) => {
    event.preventDefault();
    if (draggingFolderId === null || draggingFolderId === folder.id) {
      setDraggingFolderId(null);
      setDragOverFolder(null);
      return;
    }
    const draggedFolder = findFolder(folders, draggingFolderId);
    if (!draggedFolder || draggedFolder.parent_id !== folder.parent_id) {
      setDraggingFolderId(null);
      setDragOverFolder(null);
      return;
    }
    const siblingIds = getSiblingIds(folders, folder.parent_id);
    const orderedIds = moveFolderId(siblingIds, draggingFolderId, folder.id, dragOverFolder?.position ?? 'before');
    if (orderedIds.join(',') !== siblingIds.join(',')) {
      onReorderFolders(folder.parent_id, orderedIds);
    }
    setDraggingFolderId(null);
    setDragOverFolder(null);
  };

  const renderFolder = (folder: FolderOut, depth = 0): React.ReactNode => {
    const isCollapsed = collapsedFolders.has(folder.id);
    return (
      <FolderItem key={folder.id} folder={folder} depth={depth}
        isActive={activeFolder === folder.id} isCollapsed={isCollapsed}
        onToggle={() => onToggleFolder(folder.id)}
        onSelect={() => { onFolderChange(folder.id); closeIfMobile(); }}
        renamingFolder={renamingFolder} setRenamingFolder={setRenamingFolder}
        renameValue={renameValue} setRenameValue={setRenameValue}
        onRenameFolder={onRenameFolder}
        dragOverPosition={dragOverFolder?.id === folder.id ? dragOverFolder.position : null}
        onDragStart={() => handleFolderDragStart(folder.id)}
        onDragOver={(event) => handleFolderDragOver(event, folder)}
        onDrop={(event) => handleFolderDrop(event, folder)}
        onDragEnd={() => { setDraggingFolderId(null); setDragOverFolder(null); }}
        setSubPopoverPosition={setSubPopoverPosition}
        setSubPopoverParent={setSubPopoverParent}
        setFolderMenuAnchor={setFolderMenuAnchor}
        setFolderMenuTarget={setFolderMenuTarget}
      >
        {(folder.children ?? []).map((child) => renderFolder(child, depth + 1))}
      </FolderItem>
    );
  };

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box component="span" sx={{ color: 'primary.main', display: 'flex' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
        </Box>
        <Typography variant="h2" sx={{ fontSize: '0.9375rem' }}>TODO</Typography>
      </Box>

      <Box sx={{ px: 2, py: 1.5 }}>
        <TextField fullWidth size="small" placeholder="搜索侧边栏…"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8125rem', height: 36, bgcolor: 'action.hover', '& fieldset': { border: 'none' } } }} />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', opacity: 0.6, flex: 1 }}>视图</Typography>
          <Tooltip title="编辑视图">
            <IconButton size="small" onClick={() => setViewDialogOpen(true)} sx={{ width: 26, height: 26, color: 'text.secondary' }}>
              <EditRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <List disablePadding>
          {views.map((view) => {
            const count = viewCounts[view.id] ?? 0;
            return (
              <ListItemButton key={view.id} selected={activeView === view.id && activeFolder === null}
                onClick={() => { onViewChange(view.id); closeIfMobile(); }}
                sx={{ py: 1, px: 2.5, gap: 1,
                  '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', borderRadius: '24px', mx: 1, width: 'auto', '&:hover': { bgcolor: 'primary.main' }, '& .badge': { bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' } },
                  borderRadius: '24px', mx: 1, width: 'auto',
              }}>
                <Box component="span" sx={{ display: 'flex', width: 20, height: 20, flexShrink: 0 }}>{view.icon}</Box>
                <ListItemText primary={view.label} slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: 'inherit' } } }} />
                <Typography component="span" className="badge" sx={{ fontSize: '0.6875rem', fontWeight: 600, ml: 'auto', bgcolor: 'action.hover', color: 'text.secondary', px: 1, borderRadius: '999px', minWidth: 22, textAlign: 'center' }}>{count}</Typography>
              </ListItemButton>
            );
          })}
        </List>

        <Typography sx={{ px: 2.5, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', opacity: 0.6, mt: 1.5, mb: 0.5 }}>文件夹</Typography>
        <List disablePadding>
          {rootFolders.map((folder) => renderFolder(folder))}
        </List>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button fullWidth onClick={onNewFolder} sx={{ justifyContent: 'flex-start', gap: 1, py: 1.25, px: 2, borderRadius: 2, fontSize: '0.8125rem', fontWeight: 600, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
          </svg>
          新建文件夹
        </Button>
      </Box>
    </Box>
  );

  // Popover for subfolder creation
  const subPopover = (
    <Popover open={Boolean(subPopoverPosition)}
      anchorReference="anchorPosition"
      anchorPosition={subPopoverPosition ?? undefined}
      onClose={resetSubPopover}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { p: 1.5, minWidth: 220, mt: 0.5, borderRadius: 3 } } }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>新建子文件夹</Typography>
      <TextField fullWidth size="small" placeholder="输入子文件夹名称" value={subPopoverName}
        onChange={(e) => setSubPopoverName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && subPopoverName.trim() && subPopoverParent !== null) { onNewSubFolder(subPopoverParent, subPopoverName.trim(), subPopoverMarker, subPopoverMode); resetSubPopover(); } }} autoFocus />
      <ToggleButtonGroup
        value={subPopoverMode}
        exclusive
        fullWidth
        size="small"
        onChange={(_, mode) => { if (mode) setSubPopoverMode(mode); }}
        sx={{ mt: 1, '& .MuiToggleButton-root': { py: 0.75, fontSize: '0.75rem' } }}
      >
        <ToggleButton value="todo">TODO</ToggleButton>
        <ToggleButton value="kanban">Kanban</ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ mt: 1 }}>
        <MarkerPicker marker={subPopoverMarker} onChange={setSubPopoverMarker} label="子文件夹标识" />
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end', mt: 1 }}>
        <Button size="small" onClick={resetSubPopover} sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>取消</Button>
        <Button size="small" variant="contained" onClick={() => { if (subPopoverName.trim() && subPopoverParent !== null) { onNewSubFolder(subPopoverParent, subPopoverName.trim(), subPopoverMarker, subPopoverMode); resetSubPopover(); } }} sx={{ fontSize: '0.75rem', fontWeight: 600, borderRadius: 2 }}>创建</Button>
      </Box>
    </Popover>
  );

  const viewDialog = (
    <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>编辑视图</DialogTitle>
      <DialogContent>
        <List disablePadding>
          {views.map((view, index) => (
            <Box key={view.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.75 }}>
              <Box component="span" sx={{ display: 'flex', width: 20, color: 'text.secondary' }}>{view.icon}</Box>
              <Typography sx={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{view.label}</Typography>
              <Tooltip title="上移">
                <span>
                  <IconButton size="small" disabled={index === 0} onClick={() => setVisibleViewIds(moveId(visibleViewIds, view.id, -1))}>
                    <KeyboardArrowUpRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="下移">
                <span>
                  <IconButton size="small" disabled={index === views.length - 1} onClick={() => setVisibleViewIds(moveId(visibleViewIds, view.id, 1))}>
                    <KeyboardArrowDownRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="隐藏">
                <span>
                  <IconButton
                    size="small"
                    disabled={visibleViewIds.length <= 1}
                    onClick={() => setVisibleViewIds(visibleViewIds.filter((id) => id !== view.id))}
                    color="error"
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          ))}
        </List>

        {hiddenViews.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
            {hiddenViews.map((view) => (
              <Button
                key={view.id}
                size="small"
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={() => setVisibleViewIds([...visibleViewIds, view.id])}
                sx={{ borderRadius: 2, fontSize: '0.75rem' }}
              >
                {view.label}
              </Button>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setVisibleViewIds(DEFAULT_VIEW_IDS)} size="small">重置</Button>
        <Button onClick={() => setViewDialogOpen(false)} variant="contained" size="small">完成</Button>
      </DialogActions>
    </Dialog>
  );

  // Folder context menu
  const folderMenu = (
    <Menu anchorEl={folderMenuAnchor} open={Boolean(folderMenuAnchor)}
      onClose={() => { setFolderMenuAnchor(null); setFolderMenuTarget(null); }}>
      <MenuItem onClick={() => { if (folderMenuTarget) { setRenamingFolder(folderMenuTarget); const f = findFolder(folders, folderMenuTarget); if (f) setRenameValue(f.name); } setFolderMenuAnchor(null); }}>
        <Box component="span" sx={{ mr: 1, fontSize: '1rem' }}>✏️</Box>重命名
      </MenuItem>
      <MenuItem onClick={() => { if (folderMenuTarget) onDeleteFolder(folderMenuTarget); setFolderMenuAnchor(null); setFolderMenuTarget(null); }} sx={{ color: 'error.main' }}>
        <Box component="span" sx={{ mr: 1, fontSize: '1rem' }}>🗑️</Box>删除文件夹
      </MenuItem>
    </Menu>
  );

  if (isDesktop) {
    return (
      <Box component="aside" sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', zIndex: 30 }}>
        {content}
        {subPopover}
        {viewDialog}
        {folderMenu}
      </Box>
    );
  }

  return (
    <SwipeableDrawer anchor="left" open={open} onClose={onClose} onOpen={() => {}}
      sx={{ '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, bgcolor: 'background.paper', boxShadow: '0 16px 48px rgba(0,0,0,0.12)' } }}>
      {content}
      {subPopover}
      {viewDialog}
      {folderMenu}
    </SwipeableDrawer>
  );
}

function FolderItem({
  folder, depth, isActive, isCollapsed, onToggle, onSelect,
  renamingFolder, setRenamingFolder, renameValue, setRenameValue, onRenameFolder,
  dragOverPosition, onDragStart, onDragOver, onDrop, onDragEnd,
  setSubPopoverPosition, setSubPopoverParent,
  setFolderMenuAnchor, setFolderMenuTarget,
  children,
}: {
  folder: FolderOut; depth: number; isActive: boolean; isCollapsed: boolean;
  onToggle: () => void; onSelect: () => void;
  renamingFolder: number | null; setRenamingFolder: (f: number | null) => void;
  renameValue: string; setRenameValue: (v: string) => void; onRenameFolder: (id: number, name: string) => void;
  dragOverPosition: FolderDropPosition | null;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  setSubPopoverPosition: (position: PopoverPosition | null) => void; setSubPopoverParent: (p: number | null) => void;
  setFolderMenuAnchor: (a: HTMLElement | null) => void; setFolderMenuTarget: (t: number | null) => void;
  children?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const hasChildren = (folder.children?.length ?? 0) > 0;

  return (
    <>
      <Box onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} sx={{ position: 'relative' }}>
        <ListItemButton
          onClick={onSelect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          selected={isActive}
          sx={{ py: 1, px: 2, pl: 2 + depth * 3, gap: 0.75, height: 44,
            '&.Mui-selected': { bgcolor: 'oklch(90% 0.08 285)', color: 'oklch(20% 0.10 285)', borderRadius: '24px', '&:hover': { bgcolor: 'oklch(90% 0.08 285)' } },
            borderRadius: '24px',
            ...(dragOverPosition === 'before' ? { borderTop: '2px solid', borderTopColor: 'primary.main' } : {}),
            ...(dragOverPosition === 'after' ? { borderBottom: '2px solid', borderBottomColor: 'primary.main' } : {}),
          }}>
          <Box component="span"
            draggable={renamingFolder !== folder.id}
            onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(folder.id)); onDragStart(); }}
            onDragEnd={onDragEnd}
            sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: 'transparent', transition: 'color 0.15s', cursor: 'grab', '&:hover': { color: 'oklch(82% 0.01 275)' }, '&:active': { cursor: 'grabbing' } }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
            </svg>
          </Box>
          {hasChildren ? (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggle(); }} aria-label={isCollapsed ? '展开文件夹' : '收起文件夹'}
              sx={{ width: 20, height: 20, p: 0, flexShrink: 0, '&:hover': { bgcolor: 'action.hover' } }}>
              <ChevronIcon expanded={!isCollapsed} />
            </IconButton>
          ) : (
            <Box sx={{ width: 20, flexShrink: 0 }} />
          )}
          <MarkerIcon type={folder.icon_type} value={folder.icon_value} size={16} />
          {renamingFolder === folder.id ? (
            <TextField size="small" value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => { if (renameValue.trim()) onRenameFolder(folder.id, renameValue.trim()); setRenamingFolder(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { if (renameValue.trim()) onRenameFolder(folder.id, renameValue.trim()); setRenamingFolder(null); } if (e.key === 'Escape') setRenamingFolder(null); }}
              autoFocus onClick={(e) => e.stopPropagation()}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { fontSize: '0.875rem', fontWeight: 500, height: 32, borderRadius: 1, '& fieldset': { borderColor: 'primary.main', borderWidth: '1.5px' } } }} />
          ) : (
            <>
              <ListItemText primary={folder.name} slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } } }} />
              {folder.mode === 'kanban' && (
                <Tooltip title="Kanban 看板">
                  <Box component="span" aria-label="Kanban 看板" sx={{ display: 'inline-flex', alignItems: 'center', color: 'text.secondary', opacity: 0.7, flexShrink: 0, ml: 0.5 }}>
                    <ViewKanbanRoundedIcon sx={{ fontSize: 16 }} />
                  </Box>
                </Tooltip>
              )}
            </>
          )}
          {!renamingFolder && hovered && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0, ml: 'auto' }}>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setSubPopoverPosition({ top: rect.bottom, left: rect.left }); setSubPopoverParent(folder.id); }} title="新建子文件夹"
                sx={{ width: 26, height: 26, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </IconButton>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setFolderMenuAnchor(e.currentTarget); setFolderMenuTarget(folder.id); }} title="更多操作"
                sx={{ width: 26, height: 26, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
              </IconButton>
            </Box>
          )}
        </ListItemButton>
      </Box>
      {hasChildren && <Collapse in={!isCollapsed}>{children}</Collapse>}
    </>
  );
}
