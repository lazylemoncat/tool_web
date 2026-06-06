# 布局组件

## AppTopBar
- 文件: `AppTopBar.tsx`
- 桌面端顶栏 (≥768px), <768px 隐藏, 由移动端 Header 接管
- 左侧: logo + 模块切换 nav (Todo/Finance/Settings/Help)
- 右侧: 主题循环按钮 + 语言 select + 账号 DropdownMenu
- 响应式: ≥1024px 全量文字, 768-1023px 紧凑仅图标
- Token: `--color-bg-elevated`, `--color-border`, `--z-fixed`
- 依赖: ThemeContext (useTheme), I18nContext (useI18n), DropdownMenu

## Header
- 文件: `Header.tsx`
- 移动端顶栏 (<768px): 汉堡键 + 页面标题 + 头像下拉
- Props: `title`, `onMenuClick`, `username?`, `onLogout?`

## Sidebar
- 文件: `Sidebar.tsx`
- 侧边栏: 文件夹列表(dnd-kit 拖拽排序) + 全部视图 + 新建文件夹 + 账号 + help/settings 入口
- 主题切换已移至 AppTopBar (Phase 3), sidebar-theme-toggle 仅保留 help/settings 按钮
