'use client';

// 注册页面入口, 负责账号创建, 密码确认, 密码强度反馈和注册成功跳转.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthCard, { staggerSx } from '@/components/auth/AuthCard';
import PasswordInput from '@/components/auth/PasswordInput';
import PasswordStrengthBar from '@/components/auth/PasswordStrengthBar';
import { register as apiRegister, ApiError } from '@/lib/api';

const registerCardSx = {
  minHeight: 'auto',
  p: { xs: '32px 24px 28px', sm: '48px 40px 40px' },
  boxShadow: '0 10px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)',
};

const registerFieldLabelSx = {
  fontSize: 13,
  fontWeight: 600,
  color: 'text.secondary',
  mb: '6px',
  letterSpacing: '0.01em',
};

const registerTextInputSx = {
  height: 50,
  bgcolor: 'transparent',
  '& .MuiOutlinedInput-input': {
    height: '100%',
    boxSizing: 'border-box',
    py: 0,
    px: 2,
    fontSize: 15,
  },
  '& .MuiOutlinedInput-input::placeholder': {
    color: 'text.secondary',
    opacity: 0.60,
  },
};

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
    <AuthLayout showDecorations>
      <AuthCard title="创建账号" cardSx={registerCardSx}>
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
            <FormControl fullWidth error={!!fieldErrors.username} sx={{ mb: 3.3 }}>
              <FormLabel htmlFor="register-username" sx={registerFieldLabelSx}>
                用户名
              </FormLabel>
              <OutlinedInput
                id="register-username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearFieldError('username');
                }}
                autoFocus
                disabled={submitting}
                placeholder="输入用户名"
                autoComplete="username"
                sx={registerTextInputSx}
              />
              {fieldErrors.username && (
                <FormHelperText sx={{ mx: 0, mt: '4px', fontSize: 12 }}>
                  {fieldErrors.username}
                </FormHelperText>
              )}
            </FormControl>
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
              sx={{ mb: 0 }}
              labelSx={registerFieldLabelSx}
              inputSx={registerTextInputSx}
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
              sx={{ mb: 3.3 }}
              labelSx={registerFieldLabelSx}
              inputSx={registerTextInputSx}
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
                py: 0,
                height: 49,
                borderRadius: '16px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                letterSpacing: '0.01em',
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
                '创建账号'
              )}
            </Button>
          </Box>

          {/* 登录链接 */}
          <Box sx={staggerSx(4)}>
            <Typography
              sx={{
                textAlign: 'center',
                mt: '28px',
                fontSize: '0.875rem',
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
