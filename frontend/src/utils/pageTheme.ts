export type ThemePage =
  | 'home'
  | 'todo'
  | 'settings'
  | 'finance'
  | 'help'
  | 'ui-preview'

export function getThemePageFromPath(pathname: string): ThemePage | null {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/todo')) return 'todo'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/finance')) return 'finance'
  if (pathname.startsWith('/help')) return 'help'
  if (pathname.startsWith('/ui-preview')) return 'ui-preview'
  return null
}
