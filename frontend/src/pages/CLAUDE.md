# 页面路由

## 路由树
```
/welcome                         LandingPage (未登录欢迎)
/                                HomePage (登录后仪表盘)
/todo                            TodoApp (任务清单)
/settings                        SettingsPage (设置布局, 重定向 /settings/account)
/settings/account                AccountSection (账号概要)
/settings/account/password       PasswordPage (修改密码独立页)
/settings/account/delete         DeleteAccountPage (注销账号独立页)
/settings/appearance             AppearanceSection (主题预设)
/settings/appearance/custom      CustomThemePage (自定义主题编辑器)
/settings/locale                 LocaleSection (语言/时区)
/settings/notifications          NotificationsSection (通知)
/settings/data                   DataSection (数据导入导出)
/help                            HelpPage
/finance                         FinanceLayout (记账, 重定向 /finance/dashboard)
/finance/dashboard               DashboardPage
/finance/transactions            TransactionsPage
/finance/budgets                 BudgetsPage
/finance/events                  EventsPage
/ui-preview                      UIPreviewPage (开发用, 仅 DEV)
```

## 身份验证
- 未登录: 所有路由重定向至 AuthPage (Login/Register)
- 已登录: AppTopBar 全局渲染, 路由按上述树分发

## 页面文件位置
- `pages/`: LandingPage, HomePage, HelpPage, UIPreviewPage
- `pages/settings/`: PasswordPage, DeleteAccountPage, CustomThemePage
- `pages/finance/`: FinanceLayout, DashboardPage, TransactionsPage, BudgetsPage, EventsPage
- `components/settings/`: SettingsPage, ThemeManager
- `components/settings/sections/`: AccountSection, AppearanceSection, LocaleSection, NotificationsSection, DataSection
