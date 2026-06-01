'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, CircularProgress,
  FormControlLabel, IconButton, InputAdornment, TextField, Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useThemeMode } from '@/components/ThemeRegistry';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';

function LoginForm() {
  const { mode, toggleTheme } = useThemeMode();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password, remember);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', px: 2 }}>
      <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Typography variant="h5" sx={{ textAlign: 'center', mb: 1, fontWeight: 700 }}>ToolWeb</Typography>
          <Typography variant="h4" sx={{ textAlign: 'center', mb: 3, fontWeight: 700 }}>欢迎回来</Typography>

          {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="用户名"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              margin="normal"
              autoFocus
              disabled={loading}
            />
            <TextField
              fullWidth
              label="密码"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              margin="normal"
              disabled={loading}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw((value) => !value)} edge="end" size="small">
                        {showPw ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <FormControlLabel
              sx={{ my: 1 }}
              control={<Checkbox checked={remember} onChange={(event) => setRemember(event.target.checked)} size="small" />}
              label={<Typography variant="body2">记住我</Typography>}
            />

            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py: 1.5, borderRadius: 3 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : '登录'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2.5 }} color="text.secondary">
            还没有账号? <Link href="/register" style={{ fontWeight: 600 }}>立即注册</Link>
          </Typography>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button size="small" onClick={toggleTheme} sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.75rem' }}>
              {mode === 'light' ? '暗色模式' : mode === 'dark' ? '抹茶模式' : '亮色模式'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
