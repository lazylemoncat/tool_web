'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthCard, { staggerSx } from '@/components/auth/AuthCard';
import PasswordInput from '@/components/auth/PasswordInput';
import PasswordStrengthBar from '@/components/auth/PasswordStrengthBar';
import { register as apiRegister, ApiError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
    confirmPw?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const validate = (): boolean => {
    const errs: typeof fieldErrors = {};
    if (!username.trim()) errs.username = '请输入用户名';
    else if (username.trim().length < 3) errs.username = '用户名至少 3 个字符';
    if (!password) errs.password = '请输入密码';
    else if (password.length < 8) errs.password = '密码至少 8 个字符';
    if (!confirmPw) errs.confirmPw = '请确认密码';
    else if (confirmPw !== password) errs.confirmPw = '两次密码不一致';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const clearFieldError = (field: keyof typeof fieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await apiRegister({ username: username.trim(), password });
      setSnackbarOpen(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('用户名已存在');
          setFieldErrors((prev) => ({ ...prev, username: '用户名已存在' }));
        } else {
          setError(err.message);
        }
      } else {
        setError('注册失败，请重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard title="创建账号">
        {/* Error Banner */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2.5, borderRadius: 1.5, fontSize: '0.8125rem' }}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* 用户名 */}
          <Box sx={staggerSx(0)}>
            <TextField
              fullWidth
              label="用户名"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError('username');
              }}
              margin="normal"
              size="small"
              autoFocus
              disabled={submitting}
              error={!!fieldErrors.username}
              helperText={fieldErrors.username}
              placeholder="输入用户名"
              autoComplete="username"
              sx={{ mb: 0, '& .MuiFormHelperText-root': { fontSize: '0.75rem' } }}
            />
          </Box>

          {/* 密码 */}
          <Box sx={staggerSx(1)}>
            <PasswordInput
              label="密码"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
              placeholder="至少 8 位"
              autoComplete="new-password"
              disabled={submitting}
            />
            <PasswordStrengthBar password={password} />
          </Box>

          {/* 确认密码 */}
          <Box sx={staggerSx(2)}>
            <PasswordInput
              label="确认密码"
              value={confirmPw}
              onChange={(e) => {
                setConfirmPw(e.target.value);
                clearFieldError('confirmPw');
              }}
              error={!!fieldErrors.confirmPw}
              helperText={fieldErrors.confirmPw}
              placeholder="再次输入密码"
              autoComplete="new-password"
              disabled={submitting}
            />
          </Box>

          {/* 注册按钮 */}
          <Box sx={staggerSx(3)}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{
                py: 1.75,
                borderRadius: '16px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                '&:active': { transform: 'scale(0.98)' },
                '&:hover': {
                  boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
                  filter: 'brightness(1.08)',
                },
              }}
            >
              {submitting ? (
                <CircularProgress size={20} sx={{ color: '#fff' }} />
              ) : (
                '注册'
              )}
            </Button>
          </Box>

          {/* 登录链接 */}
          <Box sx={staggerSx(4)}>
            <Typography
              sx={{
                textAlign: 'center',
                mt: 3.5,
                fontSize: '0.8125rem',
                color: 'text.secondary',
              }}
            >
              已有账号？{' '}
              <Link
                href="/login"
                underline="none"
                sx={{ fontWeight: 600, color: 'primary.main' }}
              >
                返回登录
              </Link>
            </Typography>
          </Box>
        </Box>

        {/* 注册成功 Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={1500}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          message="注册成功"
        />
      </AuthCard>
    </AuthLayout>
  );
}
