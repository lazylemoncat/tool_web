import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { installThemeBridge, registerTheme } from './runtime/themeBridge'
import { getActiveConfig, getCurrentPage, switchPage } from './themeEngine'

/*
 启动时:
 - 挂 window.toolweb (供主题脚本与按钮 action 使用)
 - 把 themeEngine 的查询 API wire 进桥 (避免 themeBridge ↔ themeEngine 循环 import)
 - UI 命令式实现与 i18n 由对应 Provider 在 mount 时再 registerUI / registerI18n
*/
installThemeBridge()
registerTheme({ getActiveConfig, getCurrentPage, switchPage })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
