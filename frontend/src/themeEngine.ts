/*
 themeEngine.ts - 主题运行时 (v1 schema)

 职责:
 - 解析用户上传的主题 JSON (新 schema)
 - 注入 token 到 <style id="theme-custom"> 中, 覆盖 :root / [data-theme="dark"]
 - 处理页面级覆盖 (pages.<page>.{light,dark})
 - 注册自定义按钮 (各 position slot)
 - 执行注入脚本 (在 ThemeBridge 提供的 window.toolweb 上下文中)
 - 派发 theme:changed 事件供 UI 重渲染按钮

 不兼容老 schema (项目未发布, 老 JSON 直接淘汰).
 公开契约: 见 frontend/public/help/theme-schema.md
*/

import { themeBridge } from './runtime/themeBridge'

export type ThemeMode = 'light' | 'dark'

/** 自定义按钮可插入的位置槽 */
export type ButtonPosition =
  | 'toolbar'
  | 'sidebar'
  | 'todoItem'
  | 'financeToolbar'
  | 'txRowAction'
  | 'modalFooter'
  | 'dashboardCard'
  | 'settingsSection'

/** 按钮触发的动作 */
export type ButtonAction =
  | 'runScript'
  | 'callApi'
  | 'navigate'
  | 'toggleFilter'
  | 'openConfirmDialog'
  | 'showToast'
  | 'openModal'

export interface ThemeButton {
  id: string
  label: Record<string, string>
  icon?: string
  position: ButtonPosition
  action: ButtonAction
  /** runScript: 在 window.toolweb.scripts 内查找此名 */
  scriptName?: string
  /** callApi */
  apiUrl?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  onSuccess?: string
  /** navigate: hash 或 path */
  navigateTo?: string
  /** toggleFilter */
  filterKey?: string
  filterValue?: string | number | boolean
  /** openConfirmDialog */
  confirmTitle?: Record<string, string>
  confirmDescription?: Record<string, string>
  confirmDanger?: boolean
  /** showToast */
  toastMessage?: Record<string, string>
  toastVariant?: 'info' | 'success' | 'warning' | 'error'
  /** openModal: 由脚本注册的 modal id */
  modalId?: string
}

/** token 覆盖块: CSS 变量名 → 值 */
export type TokenBlock = Record<string, string>

/** 一对 light/dark token */
export interface ThemeTokens {
  light?: TokenBlock
  dark?: TokenBlock
}

export interface ThemeConfig {
  name?: string
  version?: string
  /** 全局 token 覆盖 */
  tokens?: ThemeTokens
  /** 页面级覆盖, key 为页面名 (与 switchPage 调用一致) */
  pages?: Record<string, ThemeTokens>
  /** 自定义按钮 */
  buttons?: ThemeButton[]
  /** 注入脚本: 应通过 window.toolweb.scripts.<name> = fn 注册函数 */
  scripts?: string
}

const STYLE_TAG_ID = 'theme-custom'

let _activeConfig: ThemeConfig | null = null
let _activePage: string | null = null
let _styleTag: HTMLStyleElement | null = null

type ThemeChangeListener = (config: ThemeConfig | null) => void
const _listeners = new Set<ThemeChangeListener>()

/** 订阅主题变更. 返回取消订阅函数. */
export function onThemeChange(listener: ThemeChangeListener): () => void {
  _listeners.add(listener)
  return () => { _listeners.delete(listener) }
}

function notifyListeners(config: ThemeConfig | null): void {
  _listeners.forEach((fn) => fn(config))
}

export function getActiveConfig(): ThemeConfig | null {
  return _activeConfig
}

export function getCurrentPage(): string | null {
  return _activePage
}

/** 应用一份主题配置. 可选页面名, 用于触发 pages.<page> 覆盖. */
export function applyThemeConfig(config: ThemeConfig, page?: string): void {
  _activeConfig = config
  _activePage = page ?? null

  ensureStyleTag()
  _styleTag!.textContent = buildCSS(config, _activePage)

  if (config.scripts) {
    runUserScript(config.scripts)
  }

  window.dispatchEvent(new CustomEvent('theme:changed', { detail: config }))
  notifyListeners(config)
}

/** 切换当前页面 (重新计算页面级覆盖) */
export function switchPage(page: string | null): void {
  if (!_activeConfig) {
    _activePage = page
    return
  }
  _activePage = page
  ensureStyleTag()
  _styleTag!.textContent = buildCSS(_activeConfig, _activePage)
}

/** 清除所有自定义主题 (回到默认 token) */
export function clearThemeConfig(): void {
  _activeConfig = null
  _activePage = null
  if (_styleTag) {
    _styleTag.textContent = ''
  }
  window.dispatchEvent(new CustomEvent('theme:changed', { detail: null }))
  notifyListeners(null)
}

/** 按 position 取出当前激活主题的按钮列表 */
export function getButtonsByPosition(position: ButtonPosition): ThemeButton[] {
  return (_activeConfig?.buttons ?? []).filter((b) => b.position === position)
}

/** 执行按钮动作 */
export function executeButtonAction(btn: ThemeButton): void {
  switch (btn.action) {
    case 'runScript':
      runNamedScript(btn.scriptName)
      break

    case 'callApi':
      handleCallApi(btn)
      break

    case 'navigate':
      if (btn.navigateTo) {
        if (btn.navigateTo.startsWith('http')) {
          window.location.href = btn.navigateTo
        } else if (btn.navigateTo.startsWith('#')) {
          window.location.hash = btn.navigateTo
        } else {
          window.history.pushState({}, '', btn.navigateTo)
          window.dispatchEvent(new PopStateEvent('popstate'))
        }
      }
      break

    case 'toggleFilter':
      if (btn.filterKey) {
        window.dispatchEvent(
          new CustomEvent('filter:toggle', {
            detail: { key: btn.filterKey, value: btn.filterValue },
          }),
        )
      }
      break

    case 'openConfirmDialog':
      themeBridge.ui
        .confirm({
          title: pickLocale(btn.confirmTitle),
          description: pickLocale(btn.confirmDescription),
          danger: btn.confirmDanger,
        })
        .then((ok) => {
          if (ok) runNamedScript(btn.scriptName ?? btn.onSuccess)
        })
      break

    case 'showToast':
      themeBridge.ui.toast({
        message: pickLocale(btn.toastMessage) ?? '',
        variant: btn.toastVariant ?? 'info',
      })
      break

    case 'openModal':
      if (btn.modalId) {
        themeBridge.ui.openModal(btn.modalId)
      }
      break
  }
}

/* ─── Internal ───────────────────────────────────────── */

function ensureStyleTag(): void {
  if (_styleTag) return
  const existing = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null
  if (existing) {
    _styleTag = existing
    return
  }
  const tag = document.createElement('style')
  tag.id = STYLE_TAG_ID
  document.head.appendChild(tag)
  _styleTag = tag
}

function buildCSS(config: ThemeConfig, page: string | null): string {
  const out: string[] = []

  if (config.tokens?.light) {
    out.push(block(':root', config.tokens.light))
  }
  if (config.tokens?.dark) {
    out.push(block('[data-theme="dark"]', config.tokens.dark))
  }

  if (page && config.pages?.[page]) {
    const pg = config.pages[page]
    if (pg.light) out.push(block(':root', pg.light))
    if (pg.dark) out.push(block('[data-theme="dark"]', pg.dark))
  }

  return out.filter(Boolean).join('\n\n')
}

function block(selector: string, vars: TokenBlock): string {
  const props = Object.entries(vars)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')
  if (!props) return ''
  return `${selector} {\n${props}\n}`
}

function runUserScript(src: string): void {
  try {
    // 在主题脚本作用域提供 toolweb 引用
    const fn = new Function('toolweb', src)
    fn(themeBridge)
  } catch (err) {
    console.error('[themeEngine] user script error:', err)
  }
}

function runNamedScript(name?: string): void {
  if (!name) return
  const scripts = themeBridge.scripts as Record<string, (...args: unknown[]) => unknown>
  const fn = scripts[name]
  if (typeof fn === 'function') {
    try {
      fn()
    } catch (err) {
      console.error(`[themeEngine] scripts.${name} error:`, err)
    }
  } else {
    console.warn(`[themeEngine] no script registered as window.toolweb.scripts.${name}`)
  }
}

function handleCallApi(btn: ThemeButton): void {
  if (!btn.apiUrl) return
  const method = (btn.method ?? 'GET').toLowerCase() as
    | 'get'
    | 'post'
    | 'put'
    | 'delete'
    | 'patch'
  const apiFn = themeBridge.api[method]
  if (!apiFn) return
  const call =
    method === 'get' || method === 'delete'
      ? (apiFn as (url: string) => Promise<unknown>)(btn.apiUrl)
      : (apiFn as (url: string, body?: unknown) => Promise<unknown>)(btn.apiUrl, btn.body)
  call
    .then((data) => {
      if (btn.onSuccess) {
        const scripts = themeBridge.scripts as Record<string, (...args: unknown[]) => unknown>
        const fn = scripts[btn.onSuccess]
        if (typeof fn === 'function') {
          try {
            fn(data)
          } catch (err) {
            console.error(`[themeEngine] onSuccess(${btn.onSuccess}) error:`, err)
          }
        }
      }
    })
    .catch((err) => console.error('[themeEngine] callApi error:', err))
}

function pickLocale(map?: Record<string, string>): string | undefined {
  if (!map) return undefined
  const locale = themeBridge.i18n.locale ?? 'zh'
  return map[locale] ?? map.zh ?? map.en ?? Object.values(map)[0]
}
