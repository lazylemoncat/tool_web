'use client';

// 认证页外层布局, 负责提供全屏浅色背景和居中的登录/注册卡片舞台.
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

export default function AuthLayout({
  children,
  showDecorations = false,
}: {
  children: React.ReactNode;
  showDecorations?: boolean;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: showDecorations ? 'flex-start' : 'center', sm: 'center' },
        justifyContent: 'center',
        minHeight: '100dvh',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
        p: { xs: showDecorations ? '12px' : 1.5, sm: showDecorations ? '24px' : 3 },
        pt: { xs: showDecorations ? '60px' : 1.5, sm: showDecorations ? '24px' : 3 },
      }}
    >
      {showDecorations && (
        <>
          <Box
            aria-hidden={true}
            sx={{
              position: 'absolute',
              display: { xs: 'none', sm: 'block' },
              width: 600,
              height: 600,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.20 : 0.10),
              top: -200,
              right: -150,
              pointerEvents: 'none',
              transition: 'background-color 0.3s',
            }}
          />
          <Box
            aria-hidden={true}
            sx={{
              position: 'absolute',
              display: { xs: 'none', sm: 'block' },
              width: 400,
              height: 400,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
              bottom: -100,
              left: -100,
              pointerEvents: 'none',
              transition: 'background-color 0.3s',
            }}
          />
        </>
      )}
      {children}
    </Box>
  );
}
