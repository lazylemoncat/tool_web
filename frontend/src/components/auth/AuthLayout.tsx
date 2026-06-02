'use client';

import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
        p: { xs: 1.5, sm: 3 },
      }}
    >
      {/* 装饰大圆 - 右上 */}
      <Box
        aria-hidden={true}
        sx={{
          position: 'absolute',
          display: { xs: 'none', sm: 'block' },
          width: 600,
          height: 600,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.10),
          top: -200,
          right: -150,
          pointerEvents: 'none',
          transition: 'background-color 0.3s',
        }}
      />
      {/* 装饰小圆 - 左下 */}
      <Box
        aria-hidden={true}
        sx={{
          position: 'absolute',
          display: { xs: 'none', sm: 'block' },
          width: 400,
          height: 400,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.secondary.main, 0.08),
          bottom: -100,
          left: -100,
          pointerEvents: 'none',
          transition: 'background-color 0.3s',
        }}
      />
      {children}
    </Box>
  );
}
