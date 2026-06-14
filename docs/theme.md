# Tool Web 主题系统文档

## 功能概述

当前主题系统基于 Next.js,React,MUI 和本地偏好状态实现. 前端支持 `system`, `light`, `dark` 三种主题偏好; 实际渲染模式为 `light` 或 `dark`. 登录页右上角提供主题切换入口,全局 `ThemeRegistry` 为 MUI 组件和 MUI X DatePicker 提供主题上下文.

后端仍保留 `/api/v1/themes` CRUD,用于保存用户自定义主题配置 JSON. 当前前端主流程尚未重新接入旧版自定义主题引擎,因此主题偏好文档和自定义主题 API 需要分开理解.

## 前端文件清单

| 文件 | 作用 |
|------|------|
| `frontend/src/theme.ts` | `createAppTheme(mode)`,定义 light/dark 的 MUI palette,typography,shape 和组件覆写 |
| `frontend/src/components/theme/ThemeRegistry.tsx` | 主题偏好存储,系统主题监听,MUI `ThemeProvider`,MUI X `LocalizationProvider` |
| `frontend/src/app/layout.tsx` | 挂载 `I18nProvider`, `ThemeRegistry`, `AuthProvider`, `AuthGuard` 和全局应用壳层 |
| `frontend/src/app/login/page.tsx` | 登录页主题和语言 Preference Chips |
| `frontend/src/context/I18nContext.tsx` | 当前语言状态,`html lang` 同步和 `localStorage` 持久化 |
| `frontend/src/i18n/messages.ts` | `zh-CN` 与 `en-US` 文案词典,主题偏好文案也在这里维护 |
| `frontend/src/lib/dateFormats.ts` | DatePicker 显示格式共享常量 |

## 主题偏好流程

1. `ThemeRegistry` 从 `localStorage` 的 `toolweb-theme` 读取主题偏好.
2. 偏好为 `system` 时,通过 `(prefers-color-scheme: dark)` 监听系统主题并派生实际模式.
3. 偏好为 `light` 或 `dark` 时,直接使用对应模式.
4. `createAppTheme(mode)` 生成 MUI theme.
5. `ThemeProvider` 和 `CssBaseline` 将 theme 注入全站.
6. 登录页调用 `useThemeCtx().setMode(nextPreference)` 更新偏好,并通过 `toolweb-theme-change` 事件通知同页订阅者刷新.

## 深浅色样式约束

`frontend/src/theme.ts` 的 MUI 全局覆盖必须优先使用 `theme.palette.background`, `theme.palette.text`, `theme.palette.divider`, `theme.palette.action` 和语义色, 不再在输入框, 菜单, 弹窗, 列表选中态中写死浅色边框或背景. 业务组件新增 surface, hover, chip, badge, page background 时也应优先使用 `background.default`, `background.paper`, `action.hover`, `action.selected`, `divider`, `text.secondary` 等 token.

2026-06-14 起, 记账模块页面, 工作区首页, Todo 看板和日历中性 surface 已改为主题感知样式. 日历事件分类色等业务色可保留固定色值, 但容器背景和文字/边框应继续走 MUI theme 或 CSS 变量.

## 语言与 DatePicker

`ThemeRegistry` 同时读取 `I18nContext` 的当前语言,并将其映射到 MUI X DatePicker 的 dayjs adapter locale:

| 语言 | dayjs locale |
|------|--------------|
| `zh-CN` | `zh-cn` |
| `en-US` | `en` |

前端日期选择控件必须使用 MUI X `DatePicker`,输入框显示格式通过 `format={DATE_PICKER_DISPLAY_FORMAT}` 控制,共享常量位于 `frontend/src/lib/dateFormats.ts`.

## 后端主题 API

| 文件 | 作用 |
|------|------|
| `backend/src/models/theme.py` | `UserTheme` ORM,保存用户 id,名称和 `config_json` 文本 |
| `backend/src/schemas/theme.py` | 主题请求和响应 Pydantic schema |
| `backend/src/routers/theme.py` | `/api/v1/themes` CRUD |

后端不解析 `config_json`,只负责按用户隔离存取. 如果后续恢复自定义主题运行时,前端需要重新定义 JSON schema,校验流程和注入边界,并同步更新本文档.

## 类型检查

`UserTheme` ORM 使用 SQLAlchemy 2 `Mapped` 和 `mapped_column` 注解. `config_json` 仍是文本载荷,自定义主题 schema 校验不应放入后端模型层.
