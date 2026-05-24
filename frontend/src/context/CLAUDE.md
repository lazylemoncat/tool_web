# Context 层

## ThemeContext
- 文件: `context/ThemeContext.tsx`
- 导出: `ThemeProvider`, `useTheme()`
- `useTheme()` 返回: `{ currentTheme, themes, switchTheme, applyCustomTheme, clearCustomTheme }`
- `currentTheme`: 'light' | 'dark' | 'matcha' | 'system' | 'custom'
- `switchTheme(name)`: 切换内置主题 (设置 data-theme 属性 + 清除自定义主题)
- `applyCustomTheme(id)`: 应用自定义主题 (从 API 加载 JSON → themeEngine.applyThemeConfig)
- `clearCustomTheme()`: 清除自定义主题, 回到预设
- 依赖: themeEngine.ts (onThemeChange), theme.ts (saveTheme/applyTheme), useThemes hook

## I18nContext
- 文件: `context/I18nContext.tsx`
- 别名: I18nProvider (= LocaleProvider), useI18n (= useLocale)
- 实际实现: `i18n.tsx` (JSON 懒加载 + 插值)
- `useI18n()` 返回: `{ locale, setLocale, t }`

## AuthContext
- 文件: `context/AuthContext.tsx`
- 导出: `AuthProvider`, `useAuth()`
- 管理: token, preferences, login/logout/register, changePassword, deleteAccount, updatePreferences

## 主题引擎
- `themeEngine.ts`: 自定义主题 JSON 解析 + CSS 注入 + 按钮 + 脚本执行
- `theme.ts`: 内置主题 (light/dark/matcha/system) + data-theme 属性切换
- `themeBridge.ts`: window.toolweb 运行时桥 (UI/i18n/API/Events/Theme/Scripts)
- `hooks/useThemes.ts`: 用户自定义主题 CRUD (API)
