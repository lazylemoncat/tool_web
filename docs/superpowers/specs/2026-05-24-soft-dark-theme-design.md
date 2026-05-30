# Soft Dark Theme — 设计文档

## Context

当前深色主题 (`[data-theme="dark"]`) 使用 Radix Slate 冷灰 + Indigo 靛蓝，背景 `#111113` 接近纯黑，用户反馈太黑太冷。需要增加一个"柔和深色"主题作为第三个内置选项（不替代现有的 `dark`）。

## Design

### 命名

- **英文**: Soft Dark
- **中文**: 柔和深色
- **i18n key**: `settings.softDark`

### 颜色体系

| Token 层 | Dark (现有) | Soft Dark (新增) |
|----------|-----------|-----------------|
| 灰色阶 | Radix Slate | Radix Olive |
| 强调色阶 | Radix Indigo | Radix Grass |
| `--color-bg` | `#111113` (slate-1) | `#161e11` (olive-1) |
| `--color-bg-elevated` | `#1a1b1e` (slate-2) | `#1c2019` (olive-2) |
| `--color-bg-sunken` | `#0c0d0f` | `#111712` |
| `--color-fg` | `#edeef0` (slate-12) | `#f3f5f2` (olive-12) |
| `--color-accent` | `#4a6cf7` (indigo-9) | `#2eb15c` (grass-9) |
| `--color-accent-hover` | `#3358d4` (indigo-10) | `#1f8a40` (grass-10) |
| `--color-accent-subtle` | `indigo-3` | `grass-3` |
| `--color-success` | `#30a46c` (grass-9) | `#2eb15c` (grass-9) |
| `--color-danger` | `#e5484d` (red-9) | `#e5484d` (不变) |
| `--color-income` | `#30a46c` | `#2eb15c` |
| `--color-expense` | `#e5484d` | `#e5484d` |

### 技术方案

修改 6 个文件：

1. **`frontend/src/theme.ts`** — `Theme` 类型加 `'soft-dark'`，`applyTheme()` 处理新值（直接设置 `data-theme="soft-dark"`，不做 system 解析）
2. **`frontend/src/styles/tokens/semantic.css`** — 新增 `[data-theme="soft-dark"]` 块，重定义 gray 和 accent 原子 token + 语义 token
3. **`frontend/src/components/settings/ThemeManager.tsx`** — 加第四个单选按钮 `soft-dark`
4. **`frontend/src/components/layout/Sidebar.tsx`** — 加第四个快速切换按钮
5. **`frontend/src/locales/en.json` + `zh.json`** — 加 `settings.softDark`
6. **`frontend/src/themeEngine.ts`** — `switchPage()` 已有兼容逻辑，无需改动（它读取 `data-theme` 属性值来匹配选择器，`soft-dark` 直接作为字符串通过）

### Token 源

直接使用 Radix Colors 官方色值。参考：
- [Radix Olive](https://www.radix-ui.com/colors/custom/olive) — 12 阶绿灰
- [Radix Grass](https://www.radix-ui.com/colors/custom/grass) — 12 阶草绿

### 不涉及

- 不修改现有 `dark` 主题
- 不修改 `themeEngine` 的自定义主题流程
- 不修改 `atoms.css`
- 不影响页面级覆盖 (`pages.finance` 等)

## Verification

1. `npm run build` — tsc + vite build 通过
2. 设置页出现 4 个主题选项: Light / Soft Dark / Dark / System
3. 侧边栏快速切换 4 个按钮
4. 选中 Soft Dark → 背景变暗绿 `#161e11`、accent 变草绿 `#2eb15c`
5. 切回 Dark → 恢复冷灰背景
6. `localStorage('theme')` = `'soft-dark'`，刷新后恢复
7. Finance/Todo 页面在 Soft Dark 下组件色值正常
