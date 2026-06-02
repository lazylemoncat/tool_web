'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthCard, { staggerSx } from '@/components/auth/AuthCard';
import PasswordInput from '@/components/auth/PasswordInput';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import type { MfaMethod } from '@/lib/types';

type MfaChallenge = {
  challengeId: string;
  methods: MfaMethod[];
};

function pickMfaMethod(methods: string[] | undefined): MfaMethod {
  if (methods?.includes('totp')) return 'totp';
  return 'recovery_code';
}

export default function LoginPage() {
  const { login, verifyMfa } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMethod, setMfaMethod] = useState<MfaMethod>('totp');
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: { username?: string; password?: string } = {};
    if (!username.trim()) errs.username = '请输入用户名';
    if (!password) errs.password = '请输入密码';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const clearFieldError = (field: 'username' | 'password') => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await login(username.trim(), password);
      if (res.status === 'mfa_required') {
        if (!res.challenge_id) {
          throw new ApiError(400, '登录响应缺少 MFA challenge');
        }
        const methods = (res.available_methods ?? []).filter(
          (method): method is MfaMethod =>
            method === 'totp' || method === 'recovery_code',
        );
        setMfaChallenge({ challengeId: res.challenge_id, methods });
        setMfaMethod(pickMfaMethod(methods));
        setMfaCode('');
        return;
      }
      window.location.href = '/todo';
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : '登录失败，请重试',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallenge) return;
    if (!mfaCode.trim()) {
      setError('请输入验证码');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await verifyMfa(mfaChallenge.challengeId, mfaMethod, mfaCode.trim());
      window.location.href = '/todo';
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'MFA 验证失败，请重试',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard title="欢迎回来">
        {/* Error Banner */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2.5, borderRadius: 1.5, fontSize: '0.8125rem' }}
          >
            {error}
          </Alert>
        )}

        {mfaChallenge ? (
          /* ===== MFA 验证视图 ===== */
          <Box component="form" onSubmit={handleMfaSubmit} sx={staggerSx(0)}>
            {mfaChallenge.methods.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <Button
                  type="button"
                  variant={mfaMethod === 'totp' ? 'contained' : 'outlined'}
                  size="small"
                  disabled={submitting}
                  onClick={() => setMfaMethod('totp')}
                >
                  动态验证码
                </Button>
                <Button
                  type="button"
                  variant={mfaMethod === 'recovery_code' ? 'contained' : 'outlined'}
                  size="small"
                  disabled={submitting}
                  onClick={() => setMfaMethod('recovery_code')}
                >
                  恢复码
                </Button>
              </Box>
            )}
            <TextField
              fullWidth
              label={mfaMethod === 'totp' ? '动态验证码' : '恢复码'}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              margin="normal"
              size="small"
              autoFocus
              disabled={submitting}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{ py: 1.75, borderRadius: '16px', fontSize: '0.9375rem', fontWeight: 600 }}
            >
              {submitting ? (
                <CircularProgress size={20} sx={{ color: '#fff' }} />
              ) : (
                '验证并登录'
              )}
            </Button>
            <Button
              type="button"
              fullWidth
              variant="text"
              disabled={submitting}
              sx={{ mt: 1, fontSize: '0.8125rem' }}
              onClick={() => {
                setMfaChallenge(null);
                setMfaCode('');
                setError('');
              }}
            >
              返回账号密码登录
            </Button>
          </Box>
        ) : (
          /* ===== 账号密码登录视图 ===== */
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
                placeholder="输入你的用户名"
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
                placeholder="输入你的密码"
                autoComplete="current-password"
                disabled={submitting}
              />
            </Box>

            {/* 记住我 + 忘记密码 */}
            <Box
              sx={{
                ...staggerSx(2),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={submitting}
                    sx={{ '&.Mui-checked': { color: 'primary.main' } }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                    记住我
                  </Typography>
                }
              />
              <Link
                href="#"
                underline="none"
                sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'primary.main' }}
                onClick={(e) => e.preventDefault()}
              >
                忘记密码？
              </Link>
            </Box>

            {/* 登录按钮 */}
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
                  '登录'
                )}
              </Button>
            </Box>

            {/* 注册链接 */}
            <Box sx={staggerSx(4)}>
              <Typography
                sx={{
                  textAlign: 'center',
                  mt: 3.5,
                  fontSize: '0.8125rem',
                  color: 'text.secondary',
                }}
              >
                还没有账号？{' '}
                <Link
                  href="/register"
                  underline="none"
                  sx={{ fontWeight: 600, color: 'primary.main' }}
                >
                  立即注册
                </Link>
              </Typography>
            </Box>
          </Box>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
