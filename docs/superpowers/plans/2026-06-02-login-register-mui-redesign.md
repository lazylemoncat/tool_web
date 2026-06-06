# Login & Register MUI 视觉还原实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将根目录 `login.html` 和 `register.html` 的视觉设计高度还原到 Next.js 16 + MUI 9 前端，保留现有功能逻辑。

**Architecture:** 新建 4 个可复用组件（AuthLayout/AuthCard/PasswordInput/PasswordStrengthBar），重写 login/page.tsx（保留 MFA 流程），新建 register/page.tsx，微调 theme.ts 匹配原型阴影和圆角，api.ts 新增 register() 函数。

**Tech Stack:** Next.js 16 App Router, React 19, MUI 9, Emotion (styled/keyframes), TypeScript

---

### Task 1: 添加 register() API 函数

**Files:**
- Modify: `frontend/src/lib/api.ts` (line 163, 在 refreshTokenApi 之后)

- [ ] **Step 1: 在 api.ts 中添加 register 函数**

在 `frontend/src/lib/api.ts` 的 refreshTokenApi 函数之后（第 163 行），添加：

```typescript
export async function register(body: {
  username: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('POST', '/api/v1/auth/register', body, {
    skipCsrf: true,
    skipAuthRefresh: true,
  });
}
```

- [ ] **Step 2: 验证编译通过**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无类型错误（AuthResponse 已在 types.ts 中定义）

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(api): add register() function for auth registration"
```

---

### Task 2: 创建 AuthLayout 组件（装饰背景 + 居中容器）

**Files:**
- Create: `frontend/src/components/auth/AuthLayout.tsx`

- [ ] **Step 1: 创建 AuthLayout 组件**

```tsx
'use client';

import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
        p: { xs: 1.5, sm: 3 },
      }}
    >
      {/* 装饰大圆 - 右上 */}
      <Box
        sx={{
          position: 'absolute',
          width: { xs: 0, sm: 600 },
          height: { xs: 0, sm: 600 },
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.10),
          top: -200,
          right: -150,
          pointerEvents: 'none',
          transition: 'background-color 0.3s',
        }}
      />
      {/* 装饰小圆 - 左下 */}
      <Box
        sx={{
          position: 'absolute',
          width: { xs: 0, sm: 400 },
          height: { xs: 0, sm: 400 },
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.secondary.main, 0.08),
          bottom: -100,
          left: -100,
          pointerEvents: 'none',
          transition: 'background-color 0.3s',
        }}
      />
      {children}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/auth/AuthLayout.tsx
git commit -m "feat(auth): add AuthLayout component with decorative background circles"
```

---

### Task 3: 创建 AuthCard 组件（品牌 + 标题 + 入场动画）

**Files:**
- Create: `frontend/src/components/auth/AuthCard.tsx`

- [ ] **Step 1: 创建 AuthCard 组件（含 card-enter 和 fade-slide-up 动画）**

```tsx
'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/material/styles';

const cardEnter = keyframes`
  0% { opacity: 0; transform: translateY(20px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const fadeSlideUp = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const staggerDelays = [0.02, 0.04, 0.06, 0.08, 0.10, 0.12];

// 返回带 stagger delay 的 sx 对象
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
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 440,
        bgcolor: 'background.paper',
        borderRadius: '16px',
        boxShadow: '0 10px 24px -4px rgba(0,0,0,0.12), 0 4px 8px -4px rgba(0,0,0,0.08)',
        p: { xs: '28px 24px 32px', sm: '48px 40px 40px' },
        animation: `${cardEnter} 0.5s ease-out`,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Brand: ToolWeb 带 primary 色前缀 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: { xs: 3, sm: 4 } }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '22px',
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
          mb: 3,
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>

      {children}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/auth/AuthCard.tsx
git commit -m "feat(auth): add AuthCard component with brand, title, and entrance animations"
```

---

### Task 4: 创建 PasswordInput 组件（密码输入 + 显隐切换）

**Files:**
- Create: `frontend/src/components/auth/PasswordInput.tsx`

- [ ] **Step 1: 创建 PasswordInput 组件**

```tsx
'use client';

import { useState } from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface PasswordInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}

export default function PasswordInput({
  id, label, value, onChange, error, helperText,
  placeholder = '', autoComplete, disabled,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <FormControl fullWidth error={error} sx={{ mb: 2.5 }}>
      <FormLabel
        sx={{
          fontSize: 13,
          fontWeight: 600,
          color: 'text.secondary',
          mb: 0.75,
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </FormLabel>
      <OutlinedInput
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        sx={{
          bgcolor: 'transparent',
          pr: 0.5,
        }}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShow(!show)}
              edge="end"
              size="small"
              tabIndex={-1}
              sx={{ color: 'text.secondary' }}
              disabled={disabled}
            >
              {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </InputAdornment>
        }
      />
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
}
```

> 注意：输入框 1.5px 边框 + 3px focus ring 已在 theme.ts 的 MuiTextField overrides 中全局配置，此组件复用 OutlinedInput 自动生效。

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/auth/PasswordInput.tsx
git commit -m "feat(auth): add PasswordInput component with visibility toggle"
```

---

### Task 5: 创建 PasswordStrengthBar 组件（密码强度指示器）

**Files:**
- Create: `frontend/src/components/auth/PasswordStrengthBar.tsx`

- [ ] **Step 1: 创建密码强度工具函数和组件**

```tsx
'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels = ['', '弱', '较弱', '一般', '强', '非常强'];
  return { score, label: labels[score] ?? '' };
}

interface PasswordStrengthBarProps {
  password: string;
}

export default function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  if (!password) return null;

  const { score, label } = getPasswordStrength(password);

  const getSegmentColor = (index: number) => {
    if (index >= score) return 'divider';
    if (score <= 2) return 'error.main';
    if (score === 3) return '#F5A623'; // amber
    return 'success.main';
  };

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: 3,
              borderRadius: '2px',
              bgcolor: getSegmentColor(i),
              transition: 'background-color 0.3s',
            }}
          />
        ))}
      </Box>
      {label && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            display: 'block',
            color: 'text.secondary',
            fontSize: '12px',
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/auth/PasswordStrengthBar.tsx
git commit -m "feat(auth): add PasswordStrengthBar component with real-time scoring"
```

---

### Task 6: 重写登录页（保留 MFA，匹配原型视觉）

**Files:**
- Modify: `frontend/src/app/login/page.tsx`
- Reference: `frontend/src/components/auth/AuthLayout.tsx`, `AuthCard.tsx`, `PasswordInput.tsx`

- [ ] **Step 1: 重写 login/page.tsx**

```tsx
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
```

- [ ] **Step 2: 验证页面正常渲染**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/login/page.tsx
git commit -m "feat(login): rewrite login page with auth layout, animations, remember me, password input"
```

---

### Task 7: 创建注册页面

**Files:**
- Create: `frontend/src/app/register/page.tsx`

- [ ] **Step 1: 创建 register/page.tsx**

```tsx
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
import Slide from '@mui/material/Slide';
import type { SlideProps } from '@mui/material/Slide';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthCard, { staggerSx } from '@/components/auth/AuthCard';
import PasswordInput from '@/components/auth/PasswordInput';
import PasswordStrengthBar from '@/components/auth/PasswordStrengthBar';
import { register as apiRegister, ApiError } from '@/lib/api';

function SlideUp(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

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
          TransitionComponent={SlideUp}
          message="注册成功"
          ContentProps={{
            sx: {
              borderRadius: '8px',
              minWidth: '200px',
              justifyContent: 'center',
              fontSize: '0.875rem',
              borderLeft: '4px solid #4CAF50',
            },
          }}
        />
      </AuthCard>
    </AuthLayout>
  );
}
```

- [ ] **Step 2: 验证编译通过**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/register/page.tsx
git commit -m "feat(register): create register page with password strength, validation, and animations"
```

---

### Task 8: 微调 Theme 匹配原型阴影和圆角

**Files:**
- Modify: `frontend/src/theme.ts`

- [ ] **Step 1: 添加 MuiOutlinedInput 全局覆盖 + 调整 Button 圆角**

PasswordInput 组件直接使用 `<OutlinedInput>`（而非 TextField），需要独立的 MuiOutlinedInput 覆盖以确保 1.5px 边框和 3px focus ring 生效。
同时将 Button 默认圆角从 28 改为 16 以匹配原型。

在 theme.ts 中 MuiButton 之前添加 MuiOutlinedInput 覆盖，并修改 MuiButton：

在 `shared.components` 中 MuiButton 之前（第 38 行附近）添加：

```typescript
MuiOutlinedInput: {
  styleOverrides: {
    root: {
      borderRadius: 8,
      fontSize: '0.875rem',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#CDCBD5',
        borderWidth: '1.5px',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#CDCBD5',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#6C5CE7',
        borderWidth: '1.5px',
        boxShadow: '0 0 0 3px #E8E0FF',
      },
    },
  },
},
```

然后修改 MuiButton 的 borderRadius 为 16：

```typescript
MuiButton: {
  styleOverrides: {
    root: { borderRadius: 16, textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' },
  },
  variants: [
    {
      props: { variant: 'contained', color: 'primary' },
      style: { boxShadow: 'none', '&:hover': { boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)' } },
    },
  ],
},
```

- [ ] **Step 2: 验证界面一致性**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add frontend/src/theme.ts
git commit -m "style(theme): change MuiButton borderRadius from 28 to 16 to match prototype"
```

---

### Task 9: 最终集成验证

- [ ] **Step 1: 启动开发服务器并验证页面**

```bash
cd frontend && npm run dev
```

Expected: Next.js 开发服务器在 localhost:3000 启动

- [ ] **Step 2: 验证登录页面渲染**

打开 http://localhost:3000/login
验证清单：
- [ ] 页面上方有 **装饰背景圆圈**（右上大圆 + 左下小圆，半透明 primary/secondary 色）
- [ ] 卡片居中，**card-enter** 入场动画（0.5s 淡入 + 上滑 + 缩放）
- [ ] 表单元素有 **交错淡入** 动画（stagger delay）
- [ ] Brand "Tool" 为 primary 色 + "Web" 为默认色
- [ ] Title "欢迎回来" 26px Plus Jakarta Sans 700 粗体
- [ ] 用户名输入框有 1.5px 边框，focus 时 3px primary-container 外发光
- [ ] 密码输入框有 **eye/eye-off 图标**
- [ ] "记住我" 复选框 + "忘记密码？"链接
- [ ] 按钮 primary 色，16px 圆角，hover 时阴影提升
- [ ] "还没有账号？立即注册" 链接指向 /register
- [ ] Dark mode 切换正常

- [ ] **Step 3: 验证注册页面**

打开 http://localhost:3000/register
验证清单：
- [ ] Title "创建账号"
- [ ] 密码输入时实时显示 **强度指示器**（4段红→黄→绿）
- [ ] 用户名至少 3 字符校验
- [ ] 密码至少 8 字符校验
- [ ] 确认密码一致性校验
- [ ] 提交成功 → Snackbar "注册成功" → 跳转 /login
- [ ] 用户名冲突 → 显示错误 "用户名已存在"

- [ ] **Step 4: 验证响应式布局**

浏览器 DevTools 切换到 <520px 宽度
验证清单：
- [ ] 装饰圆隐藏
- [ ] 卡片靠上对齐（flex-start）
- [ ] 卡片 padding 和圆角缩小
- [ ] Title 字体从 28px 缩小到 24px

- [ ] **Step 5: 验证 MFA 流程（仅登录页）**

用配置了 MFA 的账号登录：
1. 输入用户名密码 → 提交
2. 页面切换到 **MFA 验证视图**（方法选择 + 验证码输入 + "验证并登录" 按钮）
3. 可点击 "返回账号密码登录" 切换回去

- [ ] **Step 6: Commit 最终版本**

```bash
git add -A
git commit -m "feat(auth): complete login and register visual redesign matching HTML prototypes"
```
