/*
 主应用组件: 认证状态, 路由, 布局编排, 数据流控制.
*/

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LocaleProvider, useLocale } from './i18n'
import { initTheme } from './theme'
import { applyThemeConfig } from './themeEngine'
import api from './api/client'
import { useTodos, type Todo } from './hooks/useTodos'
import { useFolders } from './hooks/useFolders'
import { useTags } from './hooks/useTags'
import ErrorBoundary from './components/common/ErrorBoundary'
import { ToastProvider, useToast } from './components/common/Toast'
import {
  ToastProvider as UIToastProvider,
  TooltipProvider,
  ConfirmDialogProvider,
} from './components/ui'
import { ThemeProvider } from './context/ThemeContext'
import { useErrorDisplay } from './hooks/useErrorDisplay'
import { useConfirm, Skeleton, Button } from './components/ui'
import CustomButtons from './components/common/CustomButtons'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import SearchBar from './components/common/SearchBar'
import TodoList from './components/todo/TodoList'
import TodoForm, { type TodoFormData } from './components/todo/TodoForm'
import TaskDetail from './components/todo/TaskDetail'
import SubTaskDrawer from './components/todo/SubTaskDrawer'
import AppTopBar from './components/layout/AppTopBar'
import AuthPage from './components/auth/AuthPage'
import SettingsPage from './components/settings/SettingsPage'
import AccountSection from './components/settings/sections/AccountSection'
import AppearanceSection from './components/settings/sections/AppearanceSection'
import LocaleSection from './components/settings/sections/LocaleSection'
import NotificationsSection from './components/settings/sections/NotificationsSection'
import DataSection from './components/settings/sections/DataSection'
import PasswordPage from './pages/settings/PasswordPage'
import DeleteAccountPage from './pages/settings/DeleteAccountPage'
import CustomThemePage from './pages/settings/CustomThemePage'
import HelpPage from './pages/HelpPage'
import FinanceLayout from './pages/finance/FinanceLayout'
import DashboardPage from './pages/finance/DashboardPage'
import TransactionsPage from './pages/finance/TransactionsPage'
import BudgetsPage from './pages/finance/BudgetsPage'
import EventsPage from './pages/finance/EventsPage'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import UIPreviewPage from './pages/UIPreviewPage'

const AppContent: React.FC = () => {
  const { token, preferences, sessionChecked } = useAuth()

  const lang = (preferences.language as 'zh' | 'en') || 'zh'

  useEffect(() => {
    initTheme(preferences)
  }, [preferences])

  useEffect(() => {
    const customId = (preferences as any).custom_theme_id
    if (customId) {
      api.get(`/themes/${customId}`).then((data: any) => {
        try { applyThemeConfig(JSON.parse(data.config_json)) }
        catch { /* ignore */ }
      }).catch(() => {})
    }
  }, [])

  if (!sessionChecked) {
    return (
      <LocaleProvider initial={lang}>
        <div className="app-layout">
          <main className="main-area">
            <div className="empty-state"><p>Loading...</p></div>
          </main>
        </div>
      </LocaleProvider>
    )
  }

  if (!token) {
    // Dev: 不强制登录访问 /ui-preview
    if (import.meta.env.DEV && window.location.pathname === '/ui-preview') {
      return (
        <LocaleProvider initial={lang}>
          <ConfirmDialogProvider>
            <UIPreviewPage />
          </ConfirmDialogProvider>
        </LocaleProvider>
      )
    }
    return (
      <LocaleProvider initial={lang}>
        <AuthPage />
      </LocaleProvider>
    )
  }

  return (
    <LocaleProvider initial={lang}>
      <ThemeProvider>
        <ConfirmDialogProvider>
          <AppContentAuthenticated />
        </ConfirmDialogProvider>
      </ThemeProvider>
    </LocaleProvider>
  )
}

const AppContentAuthenticated: React.FC = () => {
  const { username, logout } = useAuth()

  return (
    <>
      <AppTopBar username={username!} onLogout={logout} />
      <div className="app-main-content">
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/todo" element={<TodoApp />} />
        <Route path="/settings" element={<SettingsPage />}>
          <Route index element={<Navigate to="/settings/account" replace />} />
          <Route path="account" element={<AccountSection />} />
          <Route path="appearance" element={<AppearanceSection />} />
          <Route path="locale" element={<LocaleSection />} />
          <Route path="notifications" element={<NotificationsSection />} />
          <Route path="data" element={<DataSection />} />
        </Route>
        <Route path="/settings/account/password" element={<PasswordPage />} />
        <Route path="/settings/account/delete" element={<DeleteAccountPage />} />
        <Route path="/settings/appearance/custom" element={<CustomThemePage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/finance" element={<FinanceLayout />}>
          <Route index element={<Navigate to="/finance/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="events" element={<EventsPage />} />
        </Route>
        {import.meta.env.DEV && <Route path="/ui-preview" element={<UIPreviewPage />} />}
      </Routes>
      </div>
    </>
  )
}

function findFolderById(folders: any[], id: number): any | undefined {
  for (const f of folders) {
    if (f.id === id) return f
    if (f.children?.length) {
      const found = findFolderById(f.children, id)
      if (found) return found
    }
  }
  return undefined
}

const TodoApp: React.FC = () => {
  const { username, logout, preferences } = useAuth()
  const { folders, createFolder, deleteFolder, updateFolder, reorderFolders } = useFolders()
  const { fetchTags } = useTags()
  const { t } = useLocale()
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeFolderId, setActiveFolderId] = useState<number | null>(
    () => searchParams.get('folder_id') ? Number(searchParams.get('folder_id')) : null
  )
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState<string | null>(() => {
    const fromParam = searchParams.get('status')
    if (fromParam) return fromParam
    const fromPref = preferences.default_status_filter
    if (fromPref && fromPref !== 'all') return fromPref
    return null
  })
  const [priorityFilter, setPriorityFilter] = useState<number | null>(
    () => searchParams.get('priority') ? Number(searchParams.get('priority')) : null
  )
  const [tagFilter, setTagFilter] = useState<number | null>(
    () => searchParams.get('tag_id') ? Number(searchParams.get('tag_id')) : null
  )
  const [showForm, setShowForm] = useState(false)
  const [formParentId, setFormParentId] = useState<number | null>(null)
  const [editTodo, setEditTodo] = useState<Todo | null>(null)
  const [detailTodo, setDetailTodo] = useState<Todo | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [availableTags, setAvailableTags] = useState<{ id: number; name: string }[]>([])
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [subtaskDrawerTodo, setSubtaskDrawerTodo] = useState<Todo | null>(null)

  useEffect(() => {
    fetchTags(undefined, activeFolderId).then(setAvailableTags).catch(() => {})
  }, [fetchTags, activeFolderId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setShowForm(true)
        setFormParentId(null)
        setEditTodo(null)
      }
      if (e.key === '/') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('.search-bar input')?.focus()
      }
      if (e.key === 'Escape') {
        setShowForm(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filters = useMemo(() => ({
    folder_id: activeFolderId,
    search,
    priority: priorityFilter,
    status: statusFilter,
    tag_id: tagFilter,
  }), [activeFolderId, search, priorityFilter, statusFilter, tagFilter])

  useEffect(() => {
    const params = new URLSearchParams()
    if (activeFolderId) params.set('folder_id', String(activeFolderId))
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', String(priorityFilter))
    if (tagFilter) params.set('tag_id', String(tagFilter))
    setSearchParams(params, { replace: true })
  }, [activeFolderId, search, statusFilter, priorityFilter, tagFilter])

  const { todos, loading, createTodo, updateTodo, deleteTodo, toggleTodo, reorderTodos, refresh } = useTodos(filters)
  const { toast } = useToast()
  const { displayError } = useErrorDisplay()
  const confirm = useConfirm()

  const activeFolderName = activeFolderId !== null
    ? findFolderById(folders, activeFolderId)?.name || t('todo.folder')
    : t('app.allTasks')

  const handleCreateTodo = useCallback(async (data: {
    title: string
    folder_id: number | null
    parent_id: number | null
    priority: number
    due_date: string
    note: string
    tag_ids: number[]
    recurrence_rules: string[]
  }) => {
    await createTodo({
      ...data,
      due_date: data.due_date || undefined,
    })
    setShowForm(false)
    setFormParentId(null)
  }, [createTodo])

  const handleEditTodo = useCallback(async (data: {
    title: string
    folder_id: number | null
    parent_id: number | null
    priority: number
    due_date: string
    note: string
    tag_ids: number[]
    recurrence_rules: string[]
  }) => {
    if (!editTodo) return
    await updateTodo(editTodo.id, data as TodoFormData)
    setEditTodo(null)
  }, [editTodo, updateTodo])

  const handleAddSub = useCallback((parentId: number) => {
    setFormParentId(parentId)
    setShowForm(true)
  }, [])

  const handleSelectFolder = useCallback((id: number | null) => {
    setActiveFolderId(id)
    setSidebarOpen(false)
  }, [])

  const handleCloseForm = useCallback(() => {
    setShowForm(false)
    setFormParentId(null)
    setEditTodo(null)
  }, [])

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBulkAction = async (action: 'complete' | 'delete' | 'move', folderId?: number) => {
    try {
      await api.post('/todos/bulk', { ids: Array.from(selectedIds), action, folder_id: folderId })
      setSelectMode(false)
      setSelectedIds(new Set())
      refresh()
    } catch (err) {
      toast(displayError(err), 'error')
    }
  }

  return (
    <div className="app-layout">
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar
          folders={folders}
          activeFolderId={activeFolderId}
          onSelectFolder={handleSelectFolder}
          onCreateFolder={createFolder}
          onDeleteFolder={deleteFolder}
          onUpdateFolder={updateFolder}
          onReorderFolders={reorderFolders}
          username={username!}
          onLogout={logout}
          onLogoutRequest={() => setShowLogout(true)}
        />
      </div>

      <main className="main-area">
        <Header title={activeFolderName} onMenuClick={() => setSidebarOpen(true)} username={username!} onLogout={logout} />

        <div className="toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder={t('todo.searchPlaceholder')} />

          <div className="filter-group">
            <button
              className={`filter-btn ${statusFilter === null ? 'active' : ''}`}
              onClick={() => setStatusFilter(null)}
            >
              {t('todo.all')}
            </button>
            <button
              className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              {t('todo.active')}
            </button>
            <button
              className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              {t('todo.completed')}
            </button>
          </div>

          <div className="filter-group">
            <button
              className={`filter-btn ${priorityFilter === null ? 'active' : ''}`}
              onClick={() => setPriorityFilter(null)}
            >
              {t('todo.allPriority')}
            </button>
            <button
              className={`filter-btn ${priorityFilter === 1 ? 'active' : ''}`}
              onClick={() => setPriorityFilter(1)}
            >
              {t('priority.high')}
            </button>
            <button
              className={`filter-btn ${priorityFilter === 2 ? 'active' : ''}`}
              onClick={() => setPriorityFilter(2)}
            >
              {t('priority.mid')}
            </button>
            <button
              className={`filter-btn ${priorityFilter === 3 ? 'active' : ''}`}
              onClick={() => setPriorityFilter(3)}
            >
              {t('priority.low')}
            </button>
          </div>

          <select
            className="tag-filter-select"
            value={tagFilter ?? ''}
            onChange={(e) => setTagFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t('tag.filterByTag')}</option>
            {availableTags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>

          <Button onClick={() => setShowForm(true)}>
            ＋ {t('todo.newTask')}
          </Button>

          <div className="filter-group">
            <button className={`filter-btn ${selectMode ? 'active' : ''}`} onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()) }}>
              {selectMode ? t('app.cancel') : t('app.bulkSelect')}
            </button>
          </div>

          <CustomButtons position="toolbar" />

        </div>

        {loading ? (
          <div className="todo-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="todo-item" style={{ pointerEvents: 'none' }}>
                <Skeleton variant="circle" width={22} height={22} />
                <Skeleton variant="text" width="60%" />
              </div>
            ))}
          </div>
        ) : (
          <TodoList
            todos={todos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onAddSub={handleAddSub}
            onEdit={setEditTodo}
            onReorder={reorderTodos}
            onDetail={setDetailTodo}
            onOpenSubtasks={setSubtaskDrawerTodo}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        )}
        {selectMode && selectedIds.size > 0 && (
          <div className="bulk-bar">
            <span>{t('app.selectedCount', { n: selectedIds.size })}</span>
            <button className="btn-submit" onClick={() => handleBulkAction('complete')}>✓ {t('todo.completed')}</button>
            <button className="btn-danger" onClick={async () => {
              const ok = await confirm({ title: t('app.confirmDelete'), danger: true })
              if (ok) handleBulkAction('delete')
            }}>{t('app.delete')}</button>
          </div>
        )}
      </main>

      {(showForm || editTodo) && (
        <TodoForm
          folders={folders}
          defaultFolderId={activeFolderId}
          parentId={editTodo ? null : formParentId}
          editTodo={editTodo}
          onSubmit={editTodo ? handleEditTodo : handleCreateTodo}
          onClose={handleCloseForm}
        />
      )}

      {showLogout && (
        <div className="modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p>{t('app.confirmLogout')}</p>
            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setShowLogout(false)}>
                {t('app.cancel')}
              </button>
              <button className="btn-submit" onClick={logout}>
                {t('app.logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailTodo && (
        <TaskDetail
          todo={detailTodo}
          onClose={() => setDetailTodo(null)}
          onEdit={(t) => { setDetailTodo(null); setEditTodo(t); setShowForm(true) }}
        />
      )}

      {subtaskDrawerTodo && (
        <SubTaskDrawer
          open={!!subtaskDrawerTodo}
          onOpenChange={(o) => { if (!o) setSubtaskDrawerTodo(null) }}
          parentTodo={subtaskDrawerTodo}
          subtasks={subtaskDrawerTodo.children || []}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onAddSub={handleAddSub}
          onEdit={setEditTodo}
          onReorder={reorderTodos}
          onDetail={setDetailTodo}
        />
      )}
    </div>
  )
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <UIToastProvider>
          <ToastProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ToastProvider>
        </UIToastProvider>
      </TooltipProvider>
    </ErrorBoundary>
  )
}

export default App
