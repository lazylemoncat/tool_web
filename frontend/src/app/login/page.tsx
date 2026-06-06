'use client';

// 登录页面入口, 负责账号密码登录, MFA 验证切换, 表单状态和认证成功跳转.
import {
  useState,
  type ComponentType,
  type MouseEvent,
  type ReactNode,
} from 'react';
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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ButtonBase from '@mui/material/ButtonBase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthCard, { staggerSx } from '@/components/auth/AuthCard';
import PasswordInput from '@/components/auth/PasswordInput';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import {
  themePreferences,
  useThemeCtx,
  type ThemePreference,
} from '@/components/theme/ThemeRegistry';
import { ApiError, resetPassword } from '@/lib/api';
import {
  localeLabels,
  supportedLocales,
  type Locale,
  type TranslationKey,
} from '@/i18n/messages';
import type { MfaMethod } from '@/lib/types';

type MfaChallenge = {
  challengeId: string;
  methods: MfaMethod[];
};

type LoginError = {
  key: TranslationKey;
};

type PasswordResetFieldErrors = {
  username?: TranslationKey;
  code?: TranslationKey;
  newPassword?: TranslationKey;
  confirmPassword?: TranslationKey;
};

type PreferenceOption<T extends string> = {
  value: T;
  labelKey: TranslationKey;
  Icon: ComponentType<SvgIconProps>;
};

type PreferenceChipProps = {
  label: string;
  ariaLabel: string;
  icon: ReactNode;
  open: boolean;
  onClick: (event: MouseEvent<HTMLElement>) => void;
};

const themePreferenceMeta: Record<
  ThemePreference,
  Omit<PreferenceOption<ThemePreference>, 'value'>
> = {
  system: {
    labelKey: 'app.theme.system',
    Icon: SettingsBrightnessRoundedIcon,
  },
  light: {
    labelKey: 'app.theme.light',
    Icon: LightModeRoundedIcon,
  },
  dark: {
    labelKey: 'app.theme.dark',
    Icon: DarkModeRoundedIcon,
  },
};

const themePreferenceOptions: ReadonlyArray<PreferenceOption<ThemePreference>> =
  themePreferences.map((value) => ({
    value,
    ...themePreferenceMeta[value],
  }));

const languagePreferenceOptions: ReadonlyArray<PreferenceOption<Locale>> =
  supportedLocales.map((locale) => ({
    value: locale,
    labelKey: localeLabels[locale],
    Icon: TranslateRoundedIcon,
  }));

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

const preferenceBarSx = {
  position: 'absolute',
  top: { xs: 12, sm: 24 },
  right: { xs: 12, sm: 32 },
  left: { xs: 12, sm: 'auto' },
  zIndex: 3,
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 1.5,
};

const preferenceChipSx = {
  minWidth: { xs: 0, sm: 132 },
  height: 44,
  px: 1.75,
  borderRadius: '999px',
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  color: 'text.primary',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  transition: 'background-color 0.15s, border-color 0.15s, box-shadow 0.15s',
  '&:hover': {
    bgcolor: 'action.hover',
    borderColor: 'primary.light',
    boxShadow: '0 6px 18px rgba(0,0,0,0.09)',
  },
  '&.Mui-focusVisible': {
    boxShadow: '0 0 0 3px rgba(108,92,231,0.22)',
  },
};

const activePreferenceChipSx = {
  bgcolor: 'action.selected',
  borderColor: 'primary.light',
  color: 'primary.main',
};

const preferenceChipLabelSx = {
  maxWidth: { xs: 92, sm: 128 },
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '0.875rem',
  fontWeight: 600,
  lineHeight: 1,
};

const preferenceMenuPaperSx = {
  mt: 1,
  minWidth: 212,
  p: 0.75,
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: '0 14px 36px rgba(0,0,0,0.14)',
};

const preferenceMenuItemSx = {
  minHeight: 44,
  borderRadius: 2,
  gap: 1,
  px: 1.25,
  '&.Mui-selected': {
    bgcolor: 'action.selected',
    color: 'primary.main',
  },
  '&.Mui-selected:hover': {
    bgcolor: 'action.selected',
  },
};

function pickMfaMethod(methods: string[] | undefined): MfaMethod {
  if (methods?.includes('totp')) return 'totp';
  return 'recovery_code';
}

const authErrorMessages: Record<string, TranslationKey> = {
  'Invalid credentials': 'auth.errors.invalidCredentials',
  'Invalid username or password': 'auth.errors.invalidCredentials',
  '登录失败': 'auth.errors.loginFailed',
  '登录失败，请重试': 'auth.errors.loginFailed',
  'MFA 验证失败': 'auth.errors.mfaFailed',
  'MFA 验证失败，请重试': 'auth.errors.mfaFailed',
  'MFA code is invalid': 'auth.forgot.errors.invalidMfa',
  '登录响应缺少 MFA challenge': 'auth.errors.missingMfaChallenge',
  '登录响应缺少用户信息': 'auth.errors.missingUser',
  'MFA 验证响应缺少用户信息': 'auth.errors.mfaMissingUser',
  '网络连接失败，请检查网络': 'auth.errors.network',
  '网络连接失败': 'auth.errors.network',
  '未认证，请先登录': 'auth.errors.unauthenticated',
  '后端服务不可用，请确认后端已启动': 'auth.errors.serverUnavailable',
  '服务器返回格式错误': 'auth.errors.badResponse',
};

function getAuthErrorKey(
  err: unknown,
  fallback: TranslationKey,
): TranslationKey {
  if (!(err instanceof ApiError)) return fallback;

  const message = err.message.trim();
  const exact = authErrorMessages[message];
  if (exact) return exact;
  if (message.startsWith('Account locked due to too many failed attempts')) {
    return 'auth.errors.accountLocked';
  }
  if (err.status === 401) return 'auth.errors.invalidCredentials';
  if (err.status === 422) return 'auth.errors.validation';
  if (err.status === 429) return 'auth.errors.rateLimited';
  if (err.status >= 500) return 'auth.errors.serverUnavailable';
  return fallback;
}

export default function LoginPage() {
  const { login, verifyMfa } = useAuth();
  const { preference, setMode } = useThemeCtx();
  const { language, setLanguage, t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMethod, setMfaMethod] = useState<MfaMethod>('totp');
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const [error, setError] = useState<LoginError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: TranslationKey;
    password?: TranslationKey;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetMethod, setResetMethod] = useState<MfaMethod>('totp');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetFieldErrors, setResetFieldErrors] = useState<PasswordResetFieldErrors>({});
  const [resetError, setResetError] = useState<TranslationKey | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [themeMenuAnchor, setThemeMenuAnchor] = useState<null | HTMLElement>(null);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);

  const selectedThemePreference =
    themePreferenceOptions.find((option) => option.value === preference)
    ?? themePreferenceOptions[0];
  const SelectedThemeIcon = selectedThemePreference.Icon;
  const selectedLanguage =
    languagePreferenceOptions.find((option) => option.value === language)
    ?? languagePreferenceOptions[0];

  const validate = (): boolean => {
    const errs: { username?: TranslationKey; password?: TranslationKey } = {};
    if (!username.trim()) errs.username = 'auth.errors.usernameRequired';
    if (!password) errs.password = 'auth.errors.passwordRequired';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleThemePreferenceChange = (nextPreference: ThemePreference) => {
    setMode(nextPreference);
    setThemeMenuAnchor(null);
  };

  const handleLanguagePreferenceChange = (nextLanguage: Locale) => {
    setLanguage(nextLanguage);
    setLanguageMenuAnchor(null);
  };

  const openResetDialog = () => {
    setResetUsername(username.trim());
    setResetCode('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetFieldErrors({});
    setResetError(null);
    setResetSuccess(false);
    setResetOpen(true);
  };

  const closeResetDialog = () => {
    if (!resetSubmitting) setResetOpen(false);
  };

  const clearFieldError = (field: 'username' | 'password') => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await login(username.trim(), password);
      if (res.status === 'mfa_required') {
        if (!res.challenge_id) {
          setError({ key: 'auth.errors.missingMfaChallenge' });
          return;
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
      setError({ key: getAuthErrorKey(err, 'auth.errors.loginFailed') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallenge) return;
    if (!mfaCode.trim()) {
      setError({ key: 'auth.errors.mfaCodeRequired' });
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await verifyMfa(mfaChallenge.challengeId, mfaMethod, mfaCode.trim());
      window.location.href = '/';
    } catch (err) {
      setError({ key: getAuthErrorKey(err, 'auth.errors.mfaFailed') });
    } finally {
      setSubmitting(false);
    }
  };

  const validatePasswordReset = (): boolean => {
    const errs: PasswordResetFieldErrors = {};
    if (!resetUsername.trim()) errs.username = 'auth.errors.usernameRequired';
    if (!resetCode.trim()) errs.code = 'auth.forgot.errors.codeRequired';
    if (!resetNewPassword) {
      errs.newPassword = 'auth.forgot.errors.newPasswordRequired';
    } else if (
      resetNewPassword.length < 8
      || !/[a-zA-Z]/.test(resetNewPassword)
      || !/\d/.test(resetNewPassword)
    ) {
      errs.newPassword = 'auth.forgot.errors.passwordRule';
    }
    if (!resetConfirmPassword) {
      errs.confirmPassword = 'auth.forgot.errors.confirmPasswordRequired';
    } else if (resetConfirmPassword !== resetNewPassword) {
      errs.confirmPassword = 'register.passwordMismatched';
    }
    setResetFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);
    if (!validatePasswordReset()) return;
    setResetSubmitting(true);
    try {
      await resetPassword({
        username: resetUsername.trim(),
        method: resetMethod,
        code: resetCode.trim(),
        new_password: resetNewPassword,
      });
      setResetSuccess(true);
      setPassword('');
      setResetCode('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setResetFieldErrors({});
    } catch (err) {
      setResetError(getAuthErrorKey(err, 'auth.forgot.errors.failed'));
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <AuthLayout showDecorations>
      <>
        <Box component="header" sx={preferenceBarSx}>
          <PreferenceChip
            ariaLabel={`${t('app.themeLabel')}: ${t(selectedThemePreference.labelKey)}`}
            label={t(selectedThemePreference.labelKey)}
            icon={<SelectedThemeIcon sx={{ fontSize: 20 }} />}
            open={Boolean(themeMenuAnchor)}
            onClick={(event) => setThemeMenuAnchor(event.currentTarget)}
          />
          <PreferenceChip
            ariaLabel={`${t('auth.languageLabel')}: ${t(selectedLanguage.labelKey)}`}
            label={t(selectedLanguage.labelKey)}
            icon={<LanguageRoundedIcon sx={{ fontSize: 20 }} />}
            open={Boolean(languageMenuAnchor)}
            onClick={(event) => setLanguageMenuAnchor(event.currentTarget)}
          />
        </Box>

        <Menu
          anchorEl={themeMenuAnchor}
          open={Boolean(themeMenuAnchor)}
          onClose={() => setThemeMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: preferenceMenuPaperSx } }}
        >
          {themePreferenceOptions.map((option) => {
            const OptionIcon = option.Icon;
            const selected = preference === option.value;
            return (
              <MenuItem
                key={option.value}
                selected={selected}
                onClick={() => handleThemePreferenceChange(option.value)}
                sx={preferenceMenuItemSx}
              >
                <ListItemIcon sx={{ minWidth: 30, color: 'inherit' }}>
                  <OptionIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={t(option.labelKey)}
                  slotProps={{
                    primary: {
                      sx: { fontSize: '0.875rem', fontWeight: 600 },
                    },
                  }}
                />
                {selected && (
                  <CheckRoundedIcon
                    aria-hidden={true}
                    sx={{ fontSize: 18, color: 'primary.main' }}
                  />
                )}
              </MenuItem>
            );
          })}
        </Menu>

        <Menu
          anchorEl={languageMenuAnchor}
          open={Boolean(languageMenuAnchor)}
          onClose={() => setLanguageMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: preferenceMenuPaperSx } }}
        >
          {languagePreferenceOptions.map((option) => {
            const OptionIcon = option.Icon;
            const selected = language === option.value;
            return (
              <MenuItem
                key={option.value}
                selected={selected}
                onClick={() => handleLanguagePreferenceChange(option.value)}
                sx={preferenceMenuItemSx}
              >
                <ListItemIcon sx={{ minWidth: 30, color: 'inherit' }}>
                  <OptionIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={t(option.labelKey)}
                  slotProps={{
                    primary: {
                      sx: { fontSize: '0.875rem', fontWeight: 600 },
                    },
                  }}
                />
                {selected && (
                  <CheckRoundedIcon
                    aria-hidden={true}
                    sx={{ fontSize: 18, color: 'primary.main' }}
                  />
                )}
              </MenuItem>
            );
          })}
        </Menu>

        <AuthCard title={t('auth.welcomeBack')} cardSx={loginCardSx}>
        {/* Error Banner */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2.5, borderRadius: 1.5, fontSize: '0.8125rem' }}
          >
            {t(error.key)}
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
                  {t('auth.totp')}
                </Button>
                <Button
                  type="button"
                  variant={mfaMethod === 'recovery_code' ? 'contained' : 'outlined'}
                  size="small"
                  disabled={submitting}
                  onClick={() => setMfaMethod('recovery_code')}
                >
                  {t('auth.recoveryCode')}
                </Button>
              </Box>
            )}
            <TextField
              fullWidth
              label={
                mfaMethod === 'totp'
                  ? t('auth.totp')
                  : t('auth.recoveryCode')
              }
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
                t('auth.verifyAndLogin')
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
                setError(null);
              }}
            >
              {t('auth.backToPasswordLogin')}
            </Button>
          </Box>
        ) : (
          /* ===== 账号密码登录视图 ===== */
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* 用户名 */}
            <Box sx={staggerSx(0)}>
              <FormControl fullWidth error={!!fieldErrors.username} sx={{ mb: 3.8 }}>
                <FormLabel htmlFor="login-username" sx={authFieldLabelSx}>
                  {t('auth.username')}
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
                  placeholder={t('auth.usernamePlaceholder')}
                  autoComplete="username"
                  sx={authTextInputSx}
                />
                {fieldErrors.username && (
                  <FormHelperText sx={{ mx: 0, mt: 0.75, fontSize: '0.75rem' }}>
                    {t(fieldErrors.username)}
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
                helperText={
                  fieldErrors.password ? t(fieldErrors.password) : undefined
                }
                placeholder={t('auth.passwordPlaceholder')}
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
                    {t('auth.rememberMe')}
                  </Typography>
                }
              />
              <Link
                href="#"
                underline="none"
                sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'primary.main' }}
                onClick={(e) => {
                  e.preventDefault();
                  openResetDialog();
                }}
              >
                {t('auth.forgotPassword')}
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
                  t('auth.login')
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
                {t('auth.noAccount')}{' '}
                <Link
                  href="/register"
                  underline="none"
                  sx={{ fontWeight: 600, color: 'primary.main' }}
                >
                  {t('auth.signUp')}
                </Link>
              </Typography>
            </Box>
          </Box>
        )}
        <Dialog
          open={resetOpen}
          onClose={closeResetDialog}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: { sx: { borderRadius: 2 } },
          }}
        >
          <Box component="form" onSubmit={handlePasswordReset} noValidate>
            <DialogTitle sx={{ pb: 0.5, fontWeight: 700 }}>
              {t('auth.forgot.title')}
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
              <Typography
                sx={{
                  mb: 2,
                  color: 'text.secondary',
                  fontSize: '0.8125rem',
                  lineHeight: 1.55,
                }}
              >
                {t('auth.forgot.description')}
              </Typography>
              {resetError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
                  {t(resetError)}
                </Alert>
              )}
              {resetSuccess && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }}>
                  {t('auth.forgot.success')}
                </Alert>
              )}
              <TextField
                id="reset-username"
                fullWidth
                label={t('auth.username')}
                value={resetUsername}
                onChange={(e) => {
                  setResetUsername(e.target.value);
                  setResetFieldErrors((prev) => ({ ...prev, username: undefined }));
                }}
                disabled={resetSubmitting}
                error={!!resetFieldErrors.username}
                helperText={
                  resetFieldErrors.username
                    ? t(resetFieldErrors.username)
                    : undefined
                }
                autoComplete="username"
                size="small"
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel sx={authFieldLabelSx}>
                  {t('auth.forgot.methodLabel')}
                </FormLabel>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  value={resetMethod}
                  size="small"
                  onChange={(_, nextMethod: MfaMethod | null) => {
                    if (nextMethod) setResetMethod(nextMethod);
                  }}
                >
                  <ToggleButton value="totp">{t('auth.totp')}</ToggleButton>
                  <ToggleButton value="recovery_code">
                    {t('auth.recoveryCode')}
                  </ToggleButton>
                </ToggleButtonGroup>
              </FormControl>
              <TextField
                id="reset-code"
                fullWidth
                label={t('auth.forgot.code')}
                value={resetCode}
                onChange={(e) => {
                  setResetCode(e.target.value);
                  setResetFieldErrors((prev) => ({ ...prev, code: undefined }));
                }}
                disabled={resetSubmitting}
                error={!!resetFieldErrors.code}
                helperText={
                  resetFieldErrors.code ? t(resetFieldErrors.code) : undefined
                }
                placeholder={t('auth.forgot.codePlaceholder')}
                autoComplete="one-time-code"
                size="small"
                sx={{ mb: 2 }}
              />
              <PasswordInput
                label={t('auth.forgot.newPassword')}
                value={resetNewPassword}
                onChange={(e) => {
                  setResetNewPassword(e.target.value);
                  setResetFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                disabled={resetSubmitting}
                error={!!resetFieldErrors.newPassword}
                helperText={
                  resetFieldErrors.newPassword
                    ? t(resetFieldErrors.newPassword)
                    : undefined
                }
                autoComplete="new-password"
                sx={{ mb: 2 }}
              />
              <PasswordInput
                label={t('auth.forgot.confirmPassword')}
                value={resetConfirmPassword}
                onChange={(e) => {
                  setResetConfirmPassword(e.target.value);
                  setResetFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                disabled={resetSubmitting}
                error={!!resetFieldErrors.confirmPassword}
                helperText={
                  resetFieldErrors.confirmPassword
                    ? t(resetFieldErrors.confirmPassword)
                    : undefined
                }
                autoComplete="new-password"
                sx={{ mb: 0 }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button
                type="button"
                variant="text"
                onClick={closeResetDialog}
                disabled={resetSubmitting}
              >
                {t('auth.forgot.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={resetSubmitting}
                sx={{ minWidth: 108 }}
              >
                {resetSubmitting ? (
                  <CircularProgress size={18} sx={{ color: '#fff' }} />
                ) : (
                  t('auth.forgot.submit')
                )}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
        </AuthCard>
      </>
    </AuthLayout>
  );
}

function PreferenceChip({
  label,
  ariaLabel,
  icon,
  open,
  onClick,
}: PreferenceChipProps) {
  return (
    <ButtonBase
      component="button"
      type="button"
      aria-label={ariaLabel}
      aria-haspopup="menu"
      aria-expanded={open ? true : undefined}
      onClick={onClick}
      sx={[preferenceChipSx, open ? activePreferenceChipSx : null]}
    >
      <Box
        component="span"
        aria-hidden={true}
        sx={{ display: 'inline-flex', alignItems: 'center', color: 'inherit' }}
      >
        {icon}
      </Box>
      <Box component="span" sx={preferenceChipLabelSx}>
        {label}
      </Box>
      <KeyboardArrowDownRoundedIcon
        aria-hidden={true}
        sx={{
          fontSize: 18,
          ml: 0.25,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.16s',
        }}
      />
    </ButtonBase>
  );
}
