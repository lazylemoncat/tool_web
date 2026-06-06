/*
 themeBridge.ts - window.toolweb 运行时桥

 在 Umi 运行时入口 app.tsx 调用 installThemeBridge() 挂载 window.toolweb. 提供给:
 - 主题文件中的 scripts 块 (执行时第一个参数即此桥)
 - 主题按钮 action (themeEngine 调用 ui.* / api.* / events.*)
 - 进阶用户在 DevTools 控制台操控

 三个层面的桥接:
 - ui: 命令式 UI 入口 (confirm/toast/openModal/openDrawer). 阶段 1 用事件总线占位,
       阶段 2 通用组件库就绪后, ToastProvider/ConfirmDialogProvider 调 registerUi()
       替换具体实现.
 - i18n: 暴露翻译函数与当前语言. LocaleProvider 在 mount 时 registerI18n().
 - api: 直接复用项目的 axios client.
 - events: 极薄事件总线 (基于 EventTarget).
 - theme: 重导出 themeEngine 的查询/切换 API.
 - scripts: 用户脚本注册命名空间 (避免污染 window 顶层).
*/

import api from '../api/client'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ConfirmOptions {
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export interface ToastOptions {
  message: string
  variant?: ToastVariant
  duration?: number
}

export interface ThemeBridgeUI {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  toast: (opts: ToastOptions) => void
  openModal: (id: string, payload?: unknown) => void
  openDrawer: (id: string, payload?: unknown) => void
}

export interface ThemeBridgeI18n {
  locale: string
  t: (key: string, vars?: Record<string, string | number>) => string
}

export interface ThemeBridgeEvents {
  on: (name: string, handler: (e: CustomEvent) => void) => void
  off: (name: string, handler: (e: CustomEvent) => void) => void
  emit: (name: string, detail?: unknown) => void
}

export interface ThemeBridge {
  ui: ThemeBridgeUI
  i18n: ThemeBridgeI18n
  api: typeof api
  events: ThemeBridgeEvents
  theme: {
    getActiveConfig: () => unknown
    getCurrentPage: () => string | null
    switchPage: (page: string | null) => void
  }
  scripts: Record<string, (...args: unknown[]) => unknown>
}

/* ─── Default impls (overridden when providers mount) ────────── */

const defaultUI: ThemeBridgeUI = {
  confirm: ({ title, description }) => {
    // 阶段 1 占位: 用浏览器原生 confirm. 阶段 2 由 ConfirmDialogProvider 注册替换.
    const msg = [title, description].filter(Boolean).join('\n\n')
    return Promise.resolve(window.confirm(msg || 'Confirm?'))
  },
  toast: ({ message, variant = 'info' }) => {
    // 阶段 1 占位: 派发事件让现有 ToastProvider (兼容期) 捕获或退化为 console.
    window.dispatchEvent(
      new CustomEvent('toolweb:toast', { detail: { message, variant } }),
    )
    if (variant === 'error') console.error('[toast]', message)
    else console.info('[toast]', message)
  },
  openModal: (id, payload) => {
    window.dispatchEvent(new CustomEvent('toolweb:openModal', { detail: { id, payload } }))
  },
  openDrawer: (id, payload) => {
    window.dispatchEvent(new CustomEvent('toolweb:openDrawer', { detail: { id, payload } }))
  },
}

const defaultI18n: ThemeBridgeI18n = {
  locale: 'zh',
  t: (key) => key,
}

const eventTarget = new EventTarget()
const eventHandlerMap = new WeakMap<
  (e: CustomEvent) => void,
  EventListener
>()

const events: ThemeBridgeEvents = {
  on(name, handler) {
    const adapter: EventListener = (e) => handler(e as CustomEvent)
    eventHandlerMap.set(handler, adapter)
    eventTarget.addEventListener(name, adapter)
  },
  off(name, handler) {
    const adapter = eventHandlerMap.get(handler)
    if (adapter) {
      eventTarget.removeEventListener(name, adapter)
      eventHandlerMap.delete(handler)
    }
  },
  emit(name, detail) {
    eventTarget.dispatchEvent(new CustomEvent(name, { detail }))
  },
}

/* ─── The bridge object ────────────────────────────────────────── */

export const themeBridge: ThemeBridge = {
  ui: { ...defaultUI },
  i18n: { ...defaultI18n },
  api,
  events,
  theme: {
    getActiveConfig: () => null,
    getCurrentPage: () => null,
    switchPage: () => {},
  },
  scripts: {},
}

/** Provider 在 mount 时调用此函数把真实 UI 实现注册进来 */
export function registerUI(impl: Partial<ThemeBridgeUI>): void {
  Object.assign(themeBridge.ui, impl)
}

/** Provider 在 mount/locale 切换时调用 */
export function registerI18n(impl: ThemeBridgeI18n): void {
  themeBridge.i18n.locale = impl.locale
  themeBridge.i18n.t = impl.t
}

/** 把 themeEngine 的查询 API 挂到 bridge.theme (themeEngine 反向依赖会循环, 由 app.tsx wire) */
export function registerTheme(impl: ThemeBridge['theme']): void {
  themeBridge.theme = impl
}

/** 启动时挂 window.toolweb. 幂等. */
export function installThemeBridge(): void {
  ;(window as unknown as { toolweb: ThemeBridge }).toolweb = themeBridge
}
