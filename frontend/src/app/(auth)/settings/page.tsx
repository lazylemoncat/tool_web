'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, Switch, FormControlLabel } from '@mui/material';
import { useThemeMode } from '@/components/ThemeRegistry';

export default function SettingsPage() {
  const { mode } = useThemeMode();

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: 4 }}>
      <Typography variant="h4" sx={{ mb: 1,  fontWeight: 700  }} >设置</Typography>
      <Typography variant="body2" color="text.secondary"  sx={{ mb: 4 }}>
        管理你的 ToolWeb 账号、外观和偏好。
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2,  fontWeight: 600  }} >外观</Typography>
          <FormControlLabel control={<Switch />} label="深色模式" />
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              当前主题: {mode === 'light' ? '亮色' : mode === 'dark' ? '暗色' : '抹茶'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2,  fontWeight: 600  }} >语言</Typography>
          <FormControlLabel control={<Switch defaultChecked />} label="中文" />
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2,  fontWeight: 600  }} >数据</Typography>
          <FormControlLabel control={<Switch />} label="自动备份" />
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">上次备份: 2026-06-01 09:30</Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2,  fontWeight: 600  }} >导航管理</Typography>
          <Typography variant="body2" color="text.secondary"  sx={{ mb: 2 }}>
            自定义顶部导航栏显示哪些模块入口。
          </Typography>
          <FormControlLabel control={<Switch defaultChecked />} label="首页" />
          <FormControlLabel control={<Switch defaultChecked />} label="任务" />
          <FormControlLabel control={<Switch defaultChecked />} label="记账" />
          <FormControlLabel control={<Switch defaultChecked />} label="设置" />
          <FormControlLabel control={<Switch defaultChecked />} label="帮助" />
        </CardContent>
      </Card>
    </Box>
  );
}
