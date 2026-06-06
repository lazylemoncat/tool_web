'use client';

// 登录页面入口, 负责账号密码登录, MFA 验证切换, 表单状态和认证成功跳转.
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import OutlinedInput from '@mui/material/OutlinedInput';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
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

const loginCardSx = {
  minHeight: { xs: 'auto', sm: 545 },
  p: { xs: '32px 24px 36px', sm: '48px 40px 40px' },
  boxShadow: '0 10px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)',
};

const authFieldLabelSx = {
  fontSize: 13,
  fontWeight: 600,
  color: 'text.secondary',
  mb: '6px',
  letterSpacing: '0.01em',
};

const authTextInputSx = {
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

const rememberBoxSx = {
  width: 22,
  height: 22,
  borderRadius: '7px',
  border: '1.5px solid',
  borderColor: '#B8BBC6',
  bgcolor: 'background.paper',
  transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
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
      window.location.href = '/';
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
      window.location.href = '/';
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'MFA 验证失败，请重试',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout showDecorations>
      <AuthCard title="欢迎回来" cardSx={loginCardSx}>
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
              <FormControl fullWidth error={!!fieldErrors.username} sx={{ mb: 3.8 }}>
                <FormLabel htmlFor="login-username" sx={authFieldLabelSx}>
                  用户名
                </FormLabel>
                <OutlinedInput
                  id="login-username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearFieldError('username');
                  }}
                  autoFocus
                  disabled={submitting}
                  placeholder="输入你的用户名"
                  autoComplete="username"
                  sx={authTextInputSx}
                />
                {fieldErrors.username && (
                  <FormHelperText sx={{ mx: 0, mt: 0.75, fontSize: '0.75rem' }}>
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
                placeholder="输入你的密码"
                autoComplete="current-password"
                disabled={submitting}
                labelSx={authFieldLabelSx}
                inputSx={authTextInputSx}
              />
            </Box>

            {/* 记住我 + 忘记密码 */}
            <Box
              sx={{
                ...staggerSx(2),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 28,
                mb: 3.5,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={submitting}
                    disableRipple
                    icon={<Box component="span" sx={rememberBoxSx} />}
                    checkedIcon={
                      <Box
                        component="span"
                        sx={{
                          ...rememberBoxSx,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderColor: 'primary.main',
                          bgcolor: 'primary.main',
                          boxShadow: '0 3px 8px rgba(108,92,231,0.28)',
                        }}
                      >
                        <CheckRoundedIcon sx={{ fontSize: 17, color: 'primary.contrastText' }} />
                      </Box>
                    }
                    sx={{
                      p: 0,
                      borderRadius: '8px',
                      '&:hover span': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(108,92,231,0.06)',
                      },
                      '&.Mui-checked:hover span': {
                        bgcolor: 'primary.main',
                      },
                      '&.Mui-focusVisible span': {
                        boxShadow: '0 0 0 3px #E8E0FF',
                      },
                    }}
                  />
                }
                sx={{ m: 0, gap: 1.25 }}
                label={
                  <Typography sx={{ fontSize: '0.875rem', lineHeight: '22px', color: 'text.secondary' }}>
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
                  py: 2,
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
                  '登录'
                )}
              </Button>
            </Box>

            {/* 注册链接 */}
            <Box sx={staggerSx(4)}>
              <Typography
                sx={{
                  textAlign: 'center',
                  mt: 5,
                  fontSize: '0.875rem',
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
