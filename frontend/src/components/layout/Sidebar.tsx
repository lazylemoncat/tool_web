/*
 侧边栏: 文件夹列表(支持拖拽排序) + "全部"视图 + 新建文件夹 + 账号信息 + 主题切换.
*/

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import type { Folder } from '../../hooks/useFolders'
import { useLocale } from '../../i18n'
import CustomButtons from '../common/CustomButtons'

interface Props {
  folders: Folder[]
  activeFolderId: number | null
  onSelectFolder: (id: number | null) => void
  onCreateFolder: (name: string, color: string, parentId?: number | null) => void
  onDeleteFolder: (id: number) => void
  onUpdateFolder: (id: number, fields: Partial<Folder>) => void
  onReorderFolders: (items: { id: number; sort_order: number }[]) => void
  username?: string
  onLogout?: () => void
  onLogoutRequest?: () => void
}

interface SortableFolderItemProps {
  folder: Folder
  depth: number
  activeFolderId: number | null
  onSelectFolder: (id: number) => void
  onDeleteFolder: (id: number) => void
  onUpdateFolder: (id: number, fields: Partial<Folder>) => void
  onAddSubFolder: (parentId: number) => void
  onReorderFolders: (items: { id: number; sort_order: number }[]) => void
  sensors: ReturnType<typeof useSensors>
  editingFolderId: number | null
  setEditingFolderId: (id: number | null) => void
  editName: string
  setEditName: (name: string) => void
}

const FolderItemContent: React.FC<{
  folder: Folder
  depth: number
  activeFolderId: number | null
  onSelectFolder: (id: number) => void
  onDeleteFolder: (id: number) => void
  onUpdateFolder: (id: number, fields: Partial<Folder>) => void
  onAddSubFolder: (parentId: number) => void
  onReorderFolders: (items: { id: number; sort_order: number }[]) => void
  sensors: ReturnType<typeof useSensors>
  editingFolderId: number | null
  setEditingFolderId: (id: number | null) => void
  editName: string
  setEditName: (name: string) => void
}> = ({ folder, depth, activeFolderId, onSelectFolder, onDeleteFolder, onUpdateFolder, onAddSubFolder, onReorderFolders, sensors, editingFolderId, setEditingFolderId, editName, setEditName }) => {
  const { t } = useLocale()
  const [expanded, setExpanded] = React.useState(true)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const hasChildren = folder.children && folder.children.length > 0

  const handleSaveRename = () => {
    if (editName.trim() && editName.trim() !== folder.name) {
      onUpdateFolder(folder.id, { name: editName.trim() })
    }
    setEditingFolderId(null)
  }

  const handleChildrenDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const children = folder.children
    const oldIndex = children.findIndex((f) => f.id === active.id)
    const newIndex = children.findIndex((f) => f.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...children]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    onReorderFolders(reordered.map((f, i) => ({ id: f.id, sort_order: i })))
  }

  const childrenCount = folder.children?.length || 0

  return (
    <>
      <div
        className={`sidebar-item ${activeFolderId === folder.id ? 'active' : ''}`}
        style={{ paddingLeft: `${14 + depth * 16}px` }}
        onClick={() => onSelectFolder(folder.id)}
      >
        {hasChildren && (
          <span
            className="sidebar-expand-toggle"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          >
            {expanded ? '▾' : '▸'}
          </span>
        )}
        <span className="dot" style={{ background: folder.color }} />
        {editingFolderId === folder.id ? (
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setEditingFolderId(null) }}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '2px 4px',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
            }}
          />
        ) : (
          <>
            {folder.name}
            <span className="count">{folder.todo_count}</span>
          </>
        )}
        <button
          className="sidebar-folder-add-btn"
          onClick={(e) => { e.stopPropagation(); onAddSubFolder(folder.id) }}
          title={t('sidebar.addSubFolder')}
        >
          ＋
        </button>
        {editingFolderId !== folder.id && (
          <>
            {confirmDelete ? (
              <>
                <span style={{ fontSize: '0.7rem', color: 'var(--priority-high)', marginLeft: 4 }}>
                  确定删除文件夹 '{folder.name}'? 该文件夹包含 {folder.todo_count} 个任务{childrenCount > 0 ? `和 ${childrenCount} 个子文件夹` : ''}, 删除后不可恢复.
                </span>
                <button
                  style={{ fontSize: '0.7rem', padding: '2px 5px', color: 'var(--priority-high)' }}
                  onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); setConfirmDelete(false) }}
                >
                  确认
                </button>
                <button
                  style={{ fontSize: '0.7rem', padding: '2px 5px', color: 'var(--text-muted)' }}
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
                >
                  取消
                </button>
              </>
            ) : (
              <>
                <button
                  className="sidebar-delete-btn"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                  title={t('sidebar.deleteFolder')}
                >
                  ✕
                </button>
                <button
                  className="sidebar-edit-btn"
                  onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditName(folder.name) }}
                  title="重命名文件夹"
                >
                  ✎
                </button>
              </>
            )}
          </>
        )}
      </div>
      {expanded && hasChildren && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChildrenDragEnd}>
          <SortableContext items={folder.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {folder.children.map((child) => (
              <SortableFolderItem
                key={child.id}
                folder={child}
                depth={depth + 1}
                activeFolderId={activeFolderId}
                onSelectFolder={onSelectFolder}
                onDeleteFolder={onDeleteFolder}
                onUpdateFolder={onUpdateFolder}
                onAddSubFolder={onAddSubFolder}
                onReorderFolders={onReorderFolders}
                sensors={sensors}
                editingFolderId={editingFolderId}
                setEditingFolderId={setEditingFolderId}
                editName={editName}
                setEditName={setEditName}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </>
  )
}

const SortableFolderItem: React.FC<SortableFolderItemProps> = ({ folder, depth, activeFolderId, onSelectFolder, onDeleteFolder, onUpdateFolder, onAddSubFolder, onReorderFolders, sensors, editingFolderId, setEditingFolderId, editName, setEditName }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: folder.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    position: 'relative',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'sortable-dragging' : ''}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className="sidebar-drag-handle" {...attributes} {...listeners}>
          ⠿
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FolderItemContent
            folder={folder}
            depth={depth}
            activeFolderId={activeFolderId}
            onSelectFolder={onSelectFolder}
            onDeleteFolder={onDeleteFolder}
            onUpdateFolder={onUpdateFolder}
            onAddSubFolder={onAddSubFolder}
            onReorderFolders={onReorderFolders}
            sensors={sensors}
            editingFolderId={editingFolderId}
            setEditingFolderId={setEditingFolderId}
            editName={editName}
            setEditName={setEditName}
          />
        </div>
      </div>
    </div>
  )
}

const COLORS = ['#4a7c59', '#6b8cce', '#c4943a', '#e07050', '#8b6f9e', '#5ba4a4']

const Sidebar: React.FC<Props> = ({ folders, activeFolderId, onSelectFolder, onCreateFolder, onDeleteFolder, onUpdateFolder, onReorderFolders, username, onLogout, onLogoutRequest }) => {
  const [adding, setAdding] = useState(false)
  const [addingParentId, setAddingParentId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const navigate = useNavigate()
  const { t } = useLocale()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const sidebarWidthRef = useRef(260)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-width')
    if (saved) {
      const w = Number(saved)
      if (w >= 180 && w <= 500) {
        setSidebarWidth(w)
        sidebarWidthRef.current = w
        document.documentElement.style.setProperty('--sidebar-width', `${w}px`)
      }
    }
    const onResize = () => {
      if (window.innerWidth < 768) {
        document.documentElement.style.removeProperty('--sidebar-width')
      } else {
        document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidthRef.current}px`)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const startWidth = sidebarWidthRef.current
    const onMove = (ev: MouseEvent | TouchEvent) => {
      const x = 'touches' in ev ? (ev as TouchEvent).touches[0].clientX : (ev as MouseEvent).clientX
      const delta = x - clientX
      const newW = Math.max(180, Math.min(500, startWidth + delta))
      sidebarWidthRef.current = newW
      setSidebarWidth(newW)
      document.documentElement.style.setProperty('--sidebar-width', `${newW}px`)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
      localStorage.setItem('sidebar-width', String(sidebarWidthRef.current))
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove)
    document.addEventListener('touchend', onUp)
  }, [])

  const handleAddSubFolder = useCallback((parentId: number) => {
    setAddingParentId(parentId)
    setAdding(true)
  }, [])

  const handleAdd = () => {
    if (name.trim()) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      onCreateFolder(name.trim(), color, addingParentId)
      setName('')
      setAdding(false)
      setAddingParentId(null)
    }
  }

  const handleCancelAdd = () => {
    setName('')
    setAdding(false)
    setAddingParentId(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = folders.findIndex((f) => f.id === active.id)
    const newIndex = folders.findIndex((f) => f.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...folders]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    onReorderFolders(reordered.map((f, i) => ({ id: f.id, sort_order: i })))
  }

  const ids = folders.map((f) => f.id)

  return (
    <aside className="sidebar-panel">
      <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} title="Home">
        Tool<span>Web</span>
      </div>

      {username && (
        <button className="sidebar-user-btn" onClick={() => onLogoutRequest?.()}>
          {username}
        </button>
      )}

      <nav className="sidebar-nav">
        <div
          className={`sidebar-item ${activeFolderId === null ? 'active' : ''}`}
          onClick={() => onSelectFolder(null)}
        >
          <span className="dot" style={{ background: '#b8b0a4' }} />
          {t('app.allFolders')}
        </div>

        <div
          className="sidebar-item"
          onClick={() => navigate('/finance')}
        >
          <span className="dot" style={{ background: '#c4943a' }} />
          {t('sidebar.finance')}
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {folders.map((f) => (
              <SortableFolderItem
                key={f.id}
                folder={f}
                depth={0}
                activeFolderId={activeFolderId}
                onSelectFolder={(id) => onSelectFolder(id)}
                onDeleteFolder={onDeleteFolder}
                onUpdateFolder={onUpdateFolder}
                onAddSubFolder={handleAddSubFolder}
                onReorderFolders={onReorderFolders}
                sensors={sensors}
                editingFolderId={editingFolderId}
                setEditingFolderId={setEditingFolderId}
                editName={editName}
                setEditName={setEditName}
              />
            ))}
          </SortableContext>
        </DndContext>

      </nav>

      {adding ? (
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={t('sidebar.folderName')}
            autoFocus
            style={{
              flex: 1,
              minWidth: 0,
              padding: '8px 8px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              outline: 'none',
              background: 'var(--bg-card)',
            }}
          />
          <button
            onClick={handleAdd}
            style={{
              padding: '8px 10px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
            }}
          >
            {t('app.confirm')}
          </button>
          <button
            onClick={handleCancelAdd}
            style={{
              padding: '8px 10px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            {t('app.cancel')}
          </button>
        </div>
      ) : (
        <button className="sidebar-add-btn" onClick={() => { setAddingParentId(null); setAdding(true) }}>
          ＋ {t('sidebar.newFolder')}
        </button>
      )}

      <div className="sidebar-theme-toggle">
        <CustomButtons position="sidebar" />
        <div className="sidebar-bottom-btns">
          <button className="sidebar-help-btn" onClick={() => navigate('/help')} title={t('app.help')}>
            ?
          </button>
          <button className="sidebar-settings-btn" onClick={() => navigate('/settings')}>
            ⚙ {t('app.settings')}
          </button>
        </div>
      </div>

      <div
        className="sidebar-resize-handle"
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
      />

    </aside>
  )
}

export default Sidebar
