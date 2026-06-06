'use client';

// 注册页面入口, 负责账号创建, 密码确认, 密码强度反馈和注册成功跳转.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthCard, { staggerSx } from '@/components/auth/AuthCard';
import PasswordInput from '@/components/auth/PasswordInput';
import PasswordStrengthBar from '@/components/auth/PasswordStrengthBar';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { ApiError, checkUsernameAvailability } from '@/lib/api';
import type { TranslationKey } from '@/i18n/messages';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

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
  const { register } = useAuth();
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState<TranslationKey | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: TranslationKey;
    password?: TranslationKey;
    confirmPw?: TranslationKey;
  }>({});
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [submitting, setSubmitting] = useState(false);

  const passwordStrengthLabels = [
    '',
    t('register.passwordWeak'),
    t('register.passwordFair'),
    t('register.passwordMedium'),
    t('register.passwordStrong'),
    t('register.passwordVeryStrong'),
  ];

  useEffect(() => {
    const normalizedUsername = username.trim();
    if (normalizedUsername.length < 3) {
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(normalizedUsername);
        if (!active) return;
        setUsernameStatus(result.available ? 'available' : 'taken');
        setFieldErrors((prev) => {
          if (!result.available) {
            return { ...prev, username: 'register.usernameTaken' };
          }
          if (
            prev.username === 'register.usernameTaken'
            || prev.username === 'register.errors.usernameCheckPending'
            || prev.username === 'register.errors.usernameCheckFailed'
          ) {
            return { ...prev, username: undefined };
          }
          return prev;
        });
      } catch {
        if (active) setUsernameStatus('error');
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [username]);

  const validate = (): boolean => {
    const errs: typeof fieldErrors = {};
    if (!username.trim()) errs.username = 'auth.errors.usernameRequired';
    else if (username.trim().length < 3) errs.username = 'register.errors.usernameMinLength';
    else if (usernameStatus === 'checking') errs.username = 'register.errors.usernameCheckPending';
    else if (usernameStatus === 'taken') errs.username = 'register.usernameTaken';
    if (!password) errs.password = 'auth.errors.passwordRequired';
    else if (password.length < 8) errs.password = 'register.errors.passwordMinLength';
    else if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      errs.password = 'register.errors.passwordRule';
    }
    if (!confirmPw) errs.confirmPw = 'register.errors.confirmPasswordRequired';
    else if (confirmPw !== password) errs.confirmPw = 'register.passwordMismatched';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const clearFieldError = (field: keyof typeof fieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register(username.trim(), password);
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('register.usernameTaken');
          setUsernameStatus('taken');
          setFieldErrors((prev) => ({ ...prev, username: 'register.usernameTaken' }));
        } else if (err.status === 422) {
          setError('auth.errors.validation');
        } else {
          setError('register.errors.failed');
        }
      } else {
        setError('register.errors.failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const usernameHelperKey = fieldErrors.username
    ?? (usernameStatus === 'checking' ? 'register.usernameChecking' : undefined)
    ?? (usernameStatus === 'available' ? 'register.usernameAvailable' : undefined)
    ?? (usernameStatus === 'error' ? 'register.errors.usernameCheckFailed' : undefined);
  const confirmPasswordHelperKey = fieldErrors.confirmPw
    ?? (confirmPw ? (confirmPw === password ? 'register.passwordMatched' : 'register.passwordMismatched') : undefined);
  const confirmPasswordError = !!fieldErrors.confirmPw || Boolean(confirmPw && confirmPw !== password);

  return (
    <AuthLayout showDecorations>
      <AuthCard title={t('register.createAccount')} cardSx={registerCardSx}>
        {/* Error Banner */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2.5, borderRadius: 1.5, fontSize: '0.8125rem' }}
          >
            {t(error)}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* 用户名 */}
          <Box sx={staggerSx(0)}>
            <FormControl fullWidth error={!!fieldErrors.username} sx={{ mb: 3.3 }}>
              <FormLabel htmlFor="register-username" sx={registerFieldLabelSx}>
                {t('auth.username')}
              </FormLabel>
              <OutlinedInput
                id="register-username"
                value={username}
                onChange={(e) => {
                  const nextUsername = e.target.value;
                  setUsername(nextUsername);
                  setUsernameStatus(nextUsername.trim().length >= 3 ? 'checking' : 'idle');
                  clearFieldError('username');
                }}
                autoFocus
                disabled={submitting}
                placeholder={t('register.usernamePlaceholder')}
                autoComplete="username"
                sx={registerTextInputSx}
              />
              {usernameHelperKey && (
                <FormHelperText
                  sx={{
                    mx: 0,
                    mt: '4px',
                    fontSize: 12,
                    color: usernameStatus === 'available' && !fieldErrors.username
                      ? 'success.main'
                      : undefined,
                  }}
                >
                  {t(usernameHelperKey)}
                </FormHelperText>
              )}
            </FormControl>
          </Box>

          {/* 密码 */}
          <Box sx={staggerSx(1)}>
            <PasswordInput
              label={t('auth.password')}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password ? t(fieldErrors.password) : undefined}
              placeholder={t('register.passwordPlaceholder')}
              autoComplete="new-password"
              disabled={submitting}
              sx={{ mb: 0 }}
              labelSx={registerFieldLabelSx}
              inputSx={registerTextInputSx}
            />
            <PasswordStrengthBar
              password={password}
              helpText={t('register.passwordRuleHelp')}
              labelPrefix={t('register.passwordStrength')}
              strengthLabels={passwordStrengthLabels}
            />
          </Box>

          {/* 确认密码 */}
          <Box sx={staggerSx(2)}>
            <PasswordInput
              label={t('register.confirmPassword')}
              value={confirmPw}
              onChange={(e) => {
                setConfirmPw(e.target.value);
                clearFieldError('confirmPw');
              }}
              error={confirmPasswordError}
              helperText={confirmPasswordHelperKey ? t(confirmPasswordHelperKey) : undefined}
              placeholder={t('register.confirmPasswordPlaceholder')}
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
                  t('register.createAccount')
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
              {t('register.hasAccount')}{' '}
              <Link
                href="/login"
                underline="none"
                sx={{ fontWeight: 600, color: 'primary.main' }}
              >
                {t('register.backToLogin')}
              </Link>
            </Typography>
          </Box>
        </Box>
      </AuthCard>
    </AuthLayout>
  );
}
