/*
 主题管理: 支持 light / dark / system, 从 preferences 初始化.
*/

export type Theme = 'light' | 'dark' | 'system'

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

/** Extract current CSS custom properties into a theme config JSON for download. */
export function exportCurrentTheme(): Record<string, Record<string, string>> {
  const styles = getComputedStyle(document.documentElement)
  const vars: Record<string, string> = {}
  // Read all CSS custom properties defined on :root
  for (let i = 0; i < styles.length; i++) {
    const prop = styles[i]
    if (prop.startsWith('--')) {
      vars[prop] = styles.getPropertyValue(prop).trim()
    }
  }
  return { ':root': vars }
}
