/*
 主题管理: 支持 light / dark / system, 从 preferences 初始化.
*/

export type Theme = 'light' | 'dark' | 'soft-dark' | 'system'

function resolveSystem(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? resolveSystem() : theme
  document.documentElement.dataset.theme = resolved
}

export function initTheme(preferences?: { theme?: string }) {
  const theme = (preferences?.theme || localStorage.getItem('theme') || 'system') as Theme
  applyTheme(theme)
}

export function saveTheme(theme: Theme) {
  localStorage.setItem('theme', theme)
  applyTheme(theme)
}

/** 提取当前 :root 上所有 CSS 变量, 用于导出 theme 模板 (light tokens). */
export function exportCurrentTheme(): Record<string, string> {
  const styles = getComputedStyle(document.documentElement)
  const vars: Record<string, string> = {}
  for (let i = 0; i < styles.length; i++) {
    const prop = styles[i]
    if (prop.startsWith('--')) {
      vars[prop] = styles.getPropertyValue(prop).trim()
    }
  }
  return vars
}
