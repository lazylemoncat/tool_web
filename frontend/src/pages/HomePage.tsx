/*
 HomePage — 登录后首页仪表盘.
 结构对齐 Figma Home dashboard: 顶部管理工具条, 可管理大模块, 数据图表和底部小模块.
*/

import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'umi'
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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLocale } from '../i18n'
import HomeModuleCard from '../components/home/HomeModuleCard'
import RecentTodosWidget from '../components/home/RecentTodosWidget'
import MonthlyFinanceWidget from '../components/home/MonthlyFinanceWidget'

type DashboardItemId = 'todo' | 'bookkeeping' | 'recentTodos' | 'monthlyBookkeeping' | 'settings' | 'help'
type DashboardItemKind = 'module' | 'widget' | 'compact'
type DashboardAccent = 'todo' | 'bookkeeping' | 'settings' | 'help'

interface DashboardItemConfig {
  id: DashboardItemId
  kind: DashboardItemKind
  titleKey: string
  descriptionKey: string
  path?: string
  accent: DashboardAccent
}

const DASHBOARD_ITEMS: DashboardItemConfig[] = [
  {
    id: 'todo',
    kind: 'module',
    titleKey: 'home.todoTitle',
    descriptionKey: 'home.todoDescription',
    path: '/todo',
    accent: 'todo',
  },
  {
    id: 'bookkeeping',
    kind: 'module',
    titleKey: 'home.bookkeepingTitle',
    descriptionKey: 'home.bookkeepingDescription',
    path: '/finance',
    accent: 'bookkeeping',
  },
  {
    id: 'recentTodos',
    kind: 'widget',
    titleKey: 'home.recentTodos',
    descriptionKey: 'home.recentTodosDescription',
    accent: 'todo',
  },
  {
    id: 'monthlyBookkeeping',
    kind: 'widget',
    titleKey: 'home.monthlyBookkeeping',
    descriptionKey: 'home.monthlyBookkeepingDescription',
    accent: 'bookkeeping',
  },
  {
    id: 'settings',
    kind: 'compact',
    titleKey: 'app.settings',
    descriptionKey: 'settings.description',
    path: '/settings',
    accent: 'settings',
  },
  {
    id: 'help',
    kind: 'compact',
    titleKey: 'app.help',
    descriptionKey: 'help.description',
    path: '/help',
    accent: 'help',
  },
]

const DEFAULT_ORDER = DASHBOARD_ITEMS.map((item) => item.id)
const itemById = new Map(DASHBOARD_ITEMS.map((item) => [item.id, item]))
const STORAGE_KEY = 'toolweb.homeDashboard'

interface StoredDashboardState {
  order?: DashboardItemId[]
  visible?: DashboardItemId[]
  managementMode?: boolean
}

function loadDashboardState(): StoredDashboardState {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as StoredDashboardState
    const validIds = new Set(DEFAULT_ORDER)
    return {
      order: parsed.order?.filter((id) => validIds.has(id)),
      visible: parsed.visible?.filter((id) => validIds.has(id)),
      managementMode: parsed.managementMode,
    }
  } catch {
    return {}
  }
}

function mergeStoredOrder(order?: DashboardItemId[]): DashboardItemId[] {
  if (!order?.length) return DEFAULT_ORDER
  const ordered = order.filter((id, index) => order.indexOf(id) === index)
  const missing = DEFAULT_ORDER.filter((id) => !ordered.includes(id))
  return [...ordered, ...missing]
}

function TodoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12" />
      <path d="M14 24l6 6 14-14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BookkeepingIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12" />
      <circle cx="24" cy="24" r="13" stroke="currentColor" strokeWidth="3" />
      <path d="M24 14v20M17 20h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function CompactMark({ accent }: { accent: DashboardAccent }) {
  return <span className={`home-compact-mark home-compact-mark-${accent}`} aria-hidden="true" />
}

interface ControlsProps {
  title: string
  onRemove: () => void
  dragAttributes?: any
  dragListeners?: any
}

function DashboardControls({
  title,
  onRemove,
  dragAttributes,
  dragListeners,
}: ControlsProps) {
  const { t } = useLocale()

  return (
    <div className="home-card-controls" aria-label={t('home.manageItem', { name: title })}>
      <span className="home-drag-handle" {...dragAttributes} {...dragListeners} aria-label={t('home.dragItem')} role="button" tabIndex={0}>
        ⠿
      </span>
      <button type="button" className="home-card-control-danger" onClick={onRemove} aria-label={t('home.removeItem')}>
        <span aria-hidden="true">x</span>
      </button>
    </div>
  )
}

interface SortableDashboardCardProps {
  item: DashboardItemConfig
  managementMode: boolean
  children: (sortable: {
    controls?: React.ReactNode
    isDragging: boolean
    style: React.CSSProperties
    setNodeRef: (node: HTMLElement | null) => void
  }) => React.ReactNode
  onRemove: (id: DashboardItemId) => void
}

const SortableDashboardCard: React.FC<SortableDashboardCardProps> = ({ item, managementMode, children, onRemove }) => {
  const { t } = useLocale()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !managementMode,
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.68 : undefined,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <>
      {children({
        controls: managementMode ? (
          <DashboardControls
            title={t(item.titleKey)}
            onRemove={() => onRemove(item.id)}
            dragAttributes={attributes}
            dragListeners={listeners}
          />
        ) : undefined,
        isDragging,
        style,
        setNodeRef,
      })}
    </>
  )
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLocale()
  const [managementMode, setManagementMode] = useState(() => Boolean(loadDashboardState().managementMode))
  const [order, setOrder] = useState<DashboardItemId[]>(() => mergeStoredOrder(loadDashboardState().order))
  const [visible, setVisible] = useState<Set<DashboardItemId>>(() => {
    const storedVisible = loadDashboardState().visible
    return new Set(storedVisible?.length ? storedVisible : DEFAULT_ORDER)
  })

  const visibleItems = useMemo(
    () => order.reduce<DashboardItemConfig[]>((items, id) => {
      const item = itemById.get(id)
      if (item && visible.has(item.id)) items.push(item)
      return items
    }, []),
    [order, visible],
  )
  const hiddenItems = DASHBOARD_ITEMS.filter((item) => !visible.has(item.id))
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        order,
        visible: Array.from(visible),
        managementMode,
      }),
    )
  }, [managementMode, order, visible])

  const hideItem = (id: DashboardItemId) => {
    setVisible((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }

  const showItem = (id: DashboardItemId) => {
    setVisible((current) => new Set(current).add(id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeId = active.id as DashboardItemId
    const overId = over.id as DashboardItemId
    const visibleOrder = order.filter((id) => visible.has(id))
    const oldIndex = visibleOrder.indexOf(activeId)
    const newIndex = visibleOrder.indexOf(overId)
    if (oldIndex === -1 || newIndex === -1) return
    const reorderedVisible = [...visibleOrder]
    const [moved] = reorderedVisible.splice(oldIndex, 1)
    reorderedVisible.splice(newIndex, 0, moved)
    const hiddenOrder = order.filter((id) => !visible.has(id))
    setOrder([...reorderedVisible, ...hiddenOrder])
  }

  const renderModule = (item: DashboardItemConfig) => (
    <SortableDashboardCard key={item.id} item={item} managementMode={managementMode} onRemove={hideItem}>
      {({ controls, isDragging, setNodeRef, style }) => (
        <div ref={setNodeRef} style={style} className={`home-sortable-card home-sortable-card-${item.kind} ${isDragging ? 'sortable-dragging' : ''}`}>
          <HomeModuleCard
            title={t(item.titleKey)}
            description={t(item.descriptionKey)}
            icon={item.id === 'todo' ? <TodoIcon /> : <BookkeepingIcon />}
            accent={item.accent}
            managing={managementMode}
            controls={controls}
            onOpen={() => { if (item.path) navigate(item.path) }}
          />
        </div>
      )}
    </SortableDashboardCard>
  )

  const renderWidget = (item: DashboardItemConfig) => (
    <SortableDashboardCard key={item.id} item={item} managementMode={managementMode} onRemove={hideItem}>
      {({ controls, isDragging, setNodeRef, style }) => (
        <section
          ref={setNodeRef}
          style={style}
          className={`home-sortable-card home-sortable-card-${item.kind} home-dashboard-card home-widget-card home-widget-card-${item.accent} ${managementMode ? 'is-managing' : ''} ${isDragging ? 'sortable-dragging' : ''}`}
        >
          {controls}
          <header className="home-widget-header">
            <div>
              <h2>{t(item.titleKey)}</h2>
              <p>{t(item.descriptionKey)}</p>
            </div>
          </header>
          {item.id === 'recentTodos' ? <RecentTodosWidget /> : <MonthlyFinanceWidget />}
        </section>
      )}
    </SortableDashboardCard>
  )

  const renderCompact = (item: DashboardItemConfig) => (
    <SortableDashboardCard key={item.id} item={item} managementMode={managementMode} onRemove={hideItem}>
      {({ controls, isDragging, setNodeRef, style }) => (
        <section
          ref={setNodeRef}
          style={style}
          className={`home-sortable-card home-sortable-card-${item.kind} home-dashboard-card home-compact-card ${managementMode ? 'is-managing' : ''} ${isDragging ? 'sortable-dragging' : ''}`}
          onClick={() => { if (!managementMode && item.path) navigate(item.path) }}
        >
          {controls}
          <div>
            <h2>{t(item.titleKey)}</h2>
            <p>{t(item.descriptionKey)}</p>
          </div>
          <CompactMark accent={item.accent} />
        </section>
      )}
    </SortableDashboardCard>
  )

  const renderDashboardItem = (item: DashboardItemConfig) => {
    if (item.kind === 'module') return renderModule(item)
    if (item.kind === 'widget') return renderWidget(item)
    return renderCompact(item)
  }

  const sidebarItems = [
    { id: 'home', label: t('app.home'), path: '/' },
    { id: 'todo', label: t('sidebar.todo'), path: '/todo' },
    { id: 'bookkeeping', label: t('sidebar.finance'), path: '/finance' },
    { id: 'settings', label: t('app.settings'), path: '/settings' },
    { id: 'help', label: t('app.help'), path: '/help' },
  ]

  return (
    <main className="home-shell">
      <aside className="home-sidebar" aria-label={t('home.sidebarLabel')}>
        <div className="home-sidebar-brand">
          Tool<span>Web</span>
        </div>
        <nav className="home-sidebar-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}
              onClick={() => navigate(item.path)}
            >
              <span className={`home-sidebar-dot home-sidebar-dot-${item.id}`} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="home-page">
        <header className="home-header">
          <div>
            <h1>{t('home.title')}</h1>
            <p>{t('home.subtitle')}</p>
          </div>
          <button
            type="button"
            className={`home-manage-toggle home-manage-toggle-mobile ${managementMode ? 'active' : ''}`}
            onClick={() => setManagementMode((value) => !value)}
            aria-pressed={managementMode}
          >
            <span className="home-manage-toggle-knob" aria-hidden="true" />
            <span>{t('home.managementMode')}</span>
          </button>
        </header>

        <section className="home-management-toolbar" aria-label={t('home.dashboardManagement')}>
          <span className="home-management-title">{t('home.dashboardManagement')}</span>
          <div className="home-management-actions" aria-hidden="true">
            <span className="home-management-action home-management-action-primary">+ {t('home.addModule')}</span>
            <span className="home-management-action home-management-action-neutral">:: {t('home.moveLayout')}</span>
            <span className="home-management-action home-management-action-danger">- {t('home.deleteModule')}</span>
          </div>
          <button
            type="button"
            className={`home-manage-toggle home-manage-toggle-desktop ${managementMode ? 'active' : ''}`}
            onClick={() => setManagementMode((value) => !value)}
            aria-pressed={managementMode}
          >
            <span className="home-manage-toggle-knob" aria-hidden="true" />
            <span>{t('home.managementMode')}</span>
          </button>
        </section>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleItems.map((item) => item.id)} strategy={rectSortingStrategy}>
            <div className="home-dashboard-grid">
              {visibleItems.map(renderDashboardItem)}
            </div>
          </SortableContext>
        </DndContext>

        {managementMode && (
          <section className="home-hidden-panel">
            <div>
              <h2>{t('home.hiddenModules')}</h2>
              <p>{t('home.hiddenModulesDescription')}</p>
            </div>
            <div className="home-hidden-actions">
              {hiddenItems.length === 0 ? (
                <span>{t('home.noHiddenModules')}</span>
              ) : (
                hiddenItems.map((item) => (
                  <button key={item.id} type="button" onClick={() => showItem(item.id)}>
                    + {t(item.titleKey)}
                  </button>
                ))
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}

export default HomePage
