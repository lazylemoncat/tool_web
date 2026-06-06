import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import ThemeRegistry from '@/components/theme/ThemeRegistry';
import { I18nProvider } from '@/context/I18nContext';
import { AuthProvider } from '@/context/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import LayoutClient from '@/components/layout/LayoutClient';

export const metadata: Metadata = {
  title: 'ToolWeb',
  description: '任务管理和个人记账工具',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppRouterCacheProvider>
          <I18nProvider>
            <ThemeRegistry>
              <AuthProvider>
                <AuthGuard>
                  <LayoutClient>{children}</LayoutClient>
                </AuthGuard>
              </AuthProvider>
            </ThemeRegistry>
          </I18nProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
