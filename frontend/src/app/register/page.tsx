'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, IconButton,
  InputAdornment, LinearProgress, TextField, Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useThemeMode } from '@/components/ThemeRegistry';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';

function passwordStrength(password: string): { score: number; label: string; color: 'error' | 'warning' | 'success' } {
  if (!password) return { score: 0, label: '', color: 'error' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Za-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return { score, label: '弱', color: 'error' };
  if (score <= 3) return { score, label: '一般', color: 'warning' };
  return { score, label: '强', color: 'success' };
}

export default function RegisterPage() {
  const { mode, toggleTheme } = useThemeMode();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const strength = passwordStrength(password);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!username.trim()) nextErrors.username = '请输入用户名';
    if (username.trim().length > 0 && username.trim().length < 3) nextErrors.username = '用户名至少 3 个字符';
    if (!password) nextErrors.password = '请输入密码';
    if (password && password.length < 6) nextErrors.password = '密码至少 6 个字符';
    if (password !== confirmPw) nextErrors.confirmPw = '两次输入的密码不一致';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register(username.trim(), password);
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
          <Typography variant="h4" sx={{ textAlign: 'center', mb: 3, fontWeight: 700 }}>创建账号</Typography>

          {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="用户名"
              value={username}
              onChange={(event) => { setUsername(event.target.value); setErrors((prev) => ({ ...prev, username: '' })); }}
              margin="normal"
              disabled={loading}
              error={!!errors.username}
              helperText={errors.username}
            />
            <TextField
              fullWidth
              label="密码"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(event) => { setPassword(event.target.value); setErrors((prev) => ({ ...prev, password: '' })); }}
              margin="normal"
              disabled={loading}
              error={!!errors.password}
              helperText={errors.password}
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

            {password.length > 0 && (
              <Box sx={{ mt: -0.5, mb: 1 }}>
                <LinearProgress variant="determinate" value={(strength.score / 5) * 100} color={strength.color} sx={{ height: 4, borderRadius: 2 }} />
                <Typography variant="caption" color={`${strength.color}.main`} sx={{ fontWeight: 600 }}>
                  密码强度: {strength.label}
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              label="确认密码"
              type={showPw ? 'text' : 'password'}
              value={confirmPw}
              onChange={(event) => { setConfirmPw(event.target.value); setErrors((prev) => ({ ...prev, confirmPw: '' })); }}
              margin="normal"
              disabled={loading}
              error={!!errors.confirmPw}
              helperText={errors.confirmPw}
            />

            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 2, py: 1.5, borderRadius: 3 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : '创建账号'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2.5 }} color="text.secondary">
            已有账号? <Link href="/login" style={{ fontWeight: 600 }}>返回登录</Link>
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
