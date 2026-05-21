/*
 CSS 变量注入引擎：解析 theme JSON，动态注入 <style> 到 <head>。
 优先级：page > global > 默认 CSS
*/

export interface ThemeConfig {
  name?: string
  version?: string
  global?: Record<string, Record<string, string>>
  pages?: Record<string, Record<string, Record<string, string>>>
  buttons?: ThemeButton[]
  scripts?: string
}

export interface ThemeButton {
  id: string
  label: Record<string, string>
  icon?: string
  position: 'toolbar' | 'sidebar' | 'todoItem'
  action: 'runScript' | 'callApi' | 'navigate' | 'toggleFilter'
  scriptName?: string
  apiUrl?: string
  method?: string
  onSuccess?: string
  navigateTo?: string
  filterKey?: string
  filterValue?: string
}

let _activeConfig: ThemeConfig | null = null
let _styleTag: HTMLStyleElement | null = null
let _activePage: string | null = null

export function getActiveConfig(): ThemeConfig | null {
  return _activeConfig
}

export function applyThemeConfig(config: ThemeConfig, page?: string): void {
  _activeConfig = config

  if (!_styleTag) {
    _styleTag = document.createElement('style')
    _styleTag.id = 'theme-custom'
    document.head.appendChild(_styleTag)
  }

  _activePage = page || null
  _styleTag.textContent = buildCSS(config, page)

  // Execute scripts
  if (config.scripts) {
    try {
      const fn = new Function(config.scripts)
      fn()
    } catch (e) {
      console.error('Theme script error:', e)
    }
  }

  // Dispatch event for button re-render
  window.dispatchEvent(new CustomEvent('theme:changed', { detail: config }))
}

export function switchPage(page: string): void {
  if (_activeConfig) {
    _activePage = page
    applyThemeConfig(_activeConfig, page)
  }
}

export function getCurrentPage(): string | null {
  return _activePage
}

export function clearThemeConfig(): void {
  _activeConfig = null
  _activePage = null
  if (_styleTag) {
    _styleTag.textContent = ''
  }
}

function buildCSS(config: ThemeConfig, page?: string): string {
  const blocks: string[] = []

  // Global
  if (config.global) {
    for (const [selector, vars] of Object.entries(config.global)) {
      blocks.push(buildBlock(selector, vars))
    }
  }

  // Page-specific — merge with global, page wins
  if (page && config.pages?.[page]) {
    for (const [selector, vars] of Object.entries(config.pages[page])) {
      blocks.push(buildBlock(selector, vars))
    }
  }

  return blocks.join('\n')
}

function buildBlock(selector: string, vars: Record<string, string>): string {
  const props = Object.entries(vars)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')
  return `${selector} {\n${props}\n}`
}

export function executeButtonAction(btn: ThemeButton): void {
  switch (btn.action) {
    case 'runScript': {
      if (btn.scriptName && _activeConfig?.scripts) {
        try {
          // Re-execute entire script block — idempotent functions
          const fn = new Function(_activeConfig.scripts)
          fn()
          // Call named function if it exists on window
          const namedFn = (window as any)[btn.scriptName]
          if (typeof namedFn === 'function') namedFn()
        } catch (e) {
          console.error('Button script error:', e)
        }
      }
      break
    }
    case 'callApi': {
      if (btn.apiUrl) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        const token = localStorage.getItem('token')
        if (token) headers['Authorization'] = `Bearer ${token}`

        fetch(btn.apiUrl, {
          method: btn.method || 'GET',
          headers,
        })
          .then((r) => r.json())
          .then((data) => {
            if (btn.onSuccess && _activeConfig?.scripts) {
              try {
                const fn = new Function('data', _activeConfig.scripts)
                fn(data)
                const cb = (window as any)[btn.scriptName || btn.onSuccess]
                if (typeof cb === 'function') cb(data)
              } catch (e) {
                console.error('onSuccess script error:', e)
              }
            }
          })
          .catch((e) => console.error('API call error:', e))
      }
      break
    }
    case 'navigate': {
      if (btn.navigateTo) {
        window.location.hash = btn.navigateTo
      }
      break
    }
    case 'toggleFilter': {
      if (btn.filterKey) {
        window.dispatchEvent(
          new CustomEvent('filter:toggle', {
            detail: { key: btn.filterKey, value: btn.filterValue },
          }),
        )
      }
      break
    }
  }
}

export function getButtonsByPosition(
  position: 'toolbar' | 'sidebar' | 'todoItem',
): ThemeButton[] {
  return (_activeConfig?.buttons || []).filter((b) => b.position === position)
}
