'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { keyframes, useTheme } from '@mui/material/styles';

const cardEnter = keyframes`
  0% { opacity: 0; transform: translateY(20px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const fadeSlideUp = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const staggerDelays = [0.02, 0.04, 0.06, 0.08, 0.10, 0.12];

export function staggerSx(index: number) {
  return {
    animation: `${fadeSlideUp} 0.4s ease-out both`,
    animationDelay: `${staggerDelays[index] ?? 0.14}s`,
  };
}

export default function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const shadowMode = theme.palette.mode === 'dark' ? '0.30' : '0.12';
  const shadowAccent = theme.palette.mode === 'dark' ? '0.20' : '0.08';

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 440,
        minHeight: { xs: 'auto', sm: 540 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        borderRadius: '16px',
        boxShadow: `0 10px 24px -4px rgba(0,0,0,${shadowMode}), 0 4px 8px -4px rgba(0,0,0,${shadowAccent})`,
        p: { xs: '32px 24px 36px', sm: '52px 44px 44px' },
        animation: `${cardEnter} 0.5s ease-out`,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Brand: ToolWeb 带 primary 色前缀 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: { xs: 4, sm: 5 } }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '24px',
            letterSpacing: '-0.02em',
            color: 'text.primary',
          }}
        >
          <Box component="span" sx={{ color: 'primary.main' }}>
            Tool
          </Box>
          Web
        </Typography>
      </Box>

      {/* Title: "欢迎回来" / "创建账号" */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: 24, sm: 28 },
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          mb: 4,
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>

      {children}
    </Box>
  );
}
