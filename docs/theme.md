# Theme System

Tool Web 主题系统由两个独立子系统组成:

- **Mode**: light / dark / system 三选, 切换 `<html data-theme>`. 由 `frontend/src/theme.ts` 管理.
- **Custom Theme**: 用户上传的 JSON 主题文件, 可覆盖 CSS 变量 / 注册自定义按钮 / 注入脚本. 由 `frontend/src/themeEngine.ts` 管理.

## 文件清单

| 文件 | 作用 |
|------|------|
| `frontend/src/theme.ts` | mode 切换 (`applyTheme`/`saveTheme`/`initTheme`/`exportCurrentTheme`) |
| `frontend/src/themeEngine.ts` | 自定义主题运行时: 解析 schema, 注入 token, 注册按钮, 执行脚本 |
| `frontend/src/runtime/themeBridge.ts` | `window.toolweb` 桥, 提供 `ui`/`i18n`/`api`/`events`/`theme`/`scripts` 给主题脚本 |
| `frontend/src/styles/tokens/atoms.css` | 原子 token (灰阶 / accent 阶 / 间距 / 阴影 / z-index) |
| `frontend/src/styles/tokens/semantic.css` | 语义 token (light/dark), 组件级一律引用此层 |
| `frontend/src/styles/tokens/typography.css` | 字体族 / 字号 / 字重 / 行高 |
| `frontend/src/styles/tokens/breakpoints.css` | 响应式断点 (`--bp-*`, JS 读取用) |
| `frontend/src/components/common/CustomButtons.tsx` | 渲染主题文件注册的按钮, 按 `position` slot 过滤 |
| `frontend/src/components/settings/ThemeManager.tsx` | 设置页主题上传 / 列表 / 删除 UI |
| `frontend/public/theme-template.json` | 主题文件示例 (可下载) |
| `frontend/public/help/theme-schema.md` | 用户向 schema 文档 |

## 后端

| 文件 | 作用 |
|------|------|
| `backend/src/models/theme.py` | `UserTheme` ORM (用户 id, 名称, `config_json` 文本) |
| `backend/src/schemas/theme.py` | Pydantic schema |
| `backend/src/routers/theme.py` | `/api/v1/themes` CRUD |

后端不解析 `config_json` 内容, 仅作为字符串存取. 全部 schema 验证在前端.

## Schema 概览

详见 `frontend/public/help/theme-schema.md`. 顶层结构:

```jsonc
{
  "name": "...",
  "version": "1.0",
  "tokens": { "light": {...}, "dark": {...} },
  "pages": { "<pageName>": { "light": {...}, "dark": {...} } },
  "buttons": [ { "id", "label", "position", "action", ... } ],
  "scripts": "// JS string, run once with `toolweb` arg"
}
```

## 加载流程

1. 用户登录, `AppContent` 读 `preferences.custom_theme_id`
2. 调 `/api/v1/themes/:id` 取 `config_json`
3. `JSON.parse` 后 `applyThemeConfig(cfg, currentPage)`
4. CSS 变量注入到 `<style id="theme-custom">`
5. `scripts` 字段执行一次, `toolweb.scripts.<name>` 注册函数可被按钮触发

## Position Slot 扩展

新增 slot 时:

1. 在 `themeEngine.ts` `ButtonPosition` 联合类型添加
2. 在对应 React 组件位置插 `<CustomButtons position="新名" />`
3. 文档 `frontend/public/help/theme-schema.md` 加一行
