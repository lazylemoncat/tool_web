import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import ThemeRegistry from '@/components/theme/ThemeRegistry';
import { I18nProvider } from '@/context/I18nContext';
import { AuthProvider } from '@/context/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import LayoutClient from '@/components/layout/LayoutClient';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
});

export const metadata: Metadata = {
  title: 'ToolWeb',
  description: '任务管理和个人记账工具',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={plusJakartaSans.variable}>
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
