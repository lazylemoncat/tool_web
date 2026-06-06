# 记账模块 UX 重构设计

## 目标

将 Open Design 原型（`154de47d`）的设计风格迁移到 tool_web 前端，全量重写记账模块的 React 组件，保留现有 hooks/API 层和全局框架。

## 决策汇总

| 决策 | 选择 | 理由 |
|------|------|------|
| 布局结构 | 侧边栏导航 | 与原型一致，提供专属导航空间 |
| 视觉风格 | 原型参考 + 现有 token | 三主题自动兼容，改动可控 |
| 组件策略 | 全量重写 | 保留 hooks/API 层不动 |
| 交易列表 | 统一行式布局 | 信息密度高，视觉一致 |
| 侧边栏集成 | 进入记账替换全局侧边栏 | 避免三层结构，干净切换 |

## 架构

```
AppLayout (不变)
├── AppTopBar (不变 — 全局导航 + Logo)
└── <Outlet>
    └── FinanceLayout (重写)
        ├── FinanceSidebar   ← 替换全局 Sidebar
        │   ├── brand: 📒 记账
        │   ├── nav: 仪表盘 / 交易记录 / 预算管理 / 事件管理
        │   └── CTA: + 记一笔
        └── MainContent
            ├── FinanceHeader (标题 + 账本选择器)
            ├── FinanceSubNav (tabs)
            └── <Outlet> → 4 Pages
                ├── DashboardPage
                ├── TransactionsPage
                ├── BudgetsPage
                └── EventsPage
```

## 不变的部分

- `hooks/finance/` — 全部 9 hooks
- `api/client.ts` — Axios + JWT refresh
- 后端 API — 零改动
- `FinanceContext` 接口 — 不变
- `.umirc.ts` 路由 — 不变
- `layouts/index.tsx` — AppLayout 不变

## 重写范围

### FinanceLayout.tsx（重写）
- 新增 side-by-side 布局：FinanceSidebar + MainContent
- 侧边栏切换：mount → `data-sidebar="finance"` 隐藏全局侧边栏
- 子导航联动：FinanceSubNav 与 FinanceSidebar nav 同步 active
- 保持现有 FinanceContext 提供方式

### 4 个 Page 组件（重写）
- `DashboardPage` — 统计卡片 / 预算进度条 / SVG 环形图 / 趋势柱状图 / 最近交易 / 月导航
- `TransactionsPage` — 筛选栏(类型/账户/分类/标签/事件/搜索) / 快速筛选 chips / 交易行列表(含子账单缩进) / 详情 modal
- `BudgetsPage` — 预算卡片网格(进度条/超支预警) / 新建/编辑/删除 modal
- `EventsPage` — 事件卡片(颜色/关联交易数/金额) / 详情 modal

### 18 个 Component（重写）
按原型视觉重写全部组件，保留 props 接口兼容

### CSS
- `finance.css` → 重写为原型风格 token 引用
- 新增 `FinanceSidebar.css`

## 视觉 Token 映射

| 原型 | tool_web token |
|------|---------------|
| `--bg: #f5f5f4` | `--color-bg` (`#fcfcfd`) — 沿用现有 |
| `--accent: #2563eb` | `--color-accent` (`#3e63dd`) — 沿用现有 |
| `--expense: #dc2626` | `--color-expense` (`#dc3b5d`) — 沿用现有 |
| `--income: #16a34a` | `--color-income` (`#30a46c`) — 沿用现有 |
| 圆角 6px | `--radius-md` (8px) — 沿用现有 |
| 侧边栏 220px | `--sidebar-w: 220px` — 新增 |
| 字体 system-ui | `--font-body` — 沿用现有 |

## 侧边栏切换机制

```
FinanceLayout mount:
  document.documentElement.dataset.sidebar = 'finance'
  (CSS: [data-sidebar="finance"] .sidebar-panel { display: none })
  (CSS: [data-sidebar="finance"] .finance-sidebar { display: flex })

FinanceLayout unmount:
  delete document.documentElement.dataset.sidebar
  (恢复全局侧边栏)
```

## 响应式

- 桌面端 (≥768px): 侧边栏 + 主内容
- 移动端 (<768px): 隐藏侧边栏，底部导航栏替代，子导航横向滚动

## 验证方式

1. `pnpm dev` 启动前端
2. 导航到 `/finance/dashboard` → 确认侧边栏替换 + 统计卡片渲染
3. `/finance/transactions` → 筛选/添加/编辑/删除/子账单完整流程
4. `/finance/budgets` → 预算 CRUD
5. `/finance/events` → 事件 CRUD
6. 切换主题（light/dark/matcha）→ 确认三主题正常
7. 移动端视口 → 确认底部导航
8. 从记账返回 Todo → 确认全局侧边栏恢复
