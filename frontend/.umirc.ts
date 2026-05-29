import { defineConfig } from 'umi'

export default defineConfig({
  esbuildMinifyIIFE: true,
  history: { type: 'hash' },
  proxy: {
    '/api': {
      target: 'http://localhost:8001',
      changeOrigin: true,
    },
  },
  routes: [
    { path: '/', component: '@/pages/HomePage' },
    { path: '/welcome', component: '@/pages/LandingPage' },
    { path: '/todo', component: '@/pages/TodoPage' },
    { path: '/settings/account/password', component: '@/pages/settings/PasswordPage' },
    { path: '/settings/account/delete', component: '@/pages/settings/DeleteAccountPage' },
    { path: '/settings/appearance/custom', component: '@/pages/settings/CustomThemePage' },
    {
      path: '/settings',
      component: '@/components/settings/SettingsPage',
      routes: [
        { path: '/settings', redirect: '/settings/account' },
        { path: '/settings/account', component: '@/components/settings/sections/AccountSection' },
        { path: '/settings/appearance', component: '@/components/settings/sections/AppearanceSection' },
        { path: '/settings/locale', component: '@/components/settings/sections/LocaleSection' },
        { path: '/settings/notifications', component: '@/components/settings/sections/NotificationsSection' },
        { path: '/settings/data', component: '@/components/settings/sections/DataSection' },
      ],
    },
    { path: '/help', component: '@/pages/HelpPage' },
    {
      path: '/finance',
      component: '@/pages/finance/FinanceLayout',
      routes: [
        { path: '/finance', redirect: '/finance/dashboard' },
        { path: '/finance/dashboard', component: '@/pages/finance/DashboardPage' },
        { path: '/finance/transactions', component: '@/pages/finance/TransactionsPage' },
        { path: '/finance/budgets', component: '@/pages/finance/BudgetsPage' },
        { path: '/finance/events', component: '@/pages/finance/EventsPage' },
        { path: '/finance/manage', component: '@/pages/finance/ManagePage' },
      ],
    },
    { path: '/ui-preview', component: '@/pages/UIPreviewPage' },
  ],
  npmClient: 'npm',
})
