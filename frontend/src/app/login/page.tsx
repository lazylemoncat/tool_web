'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
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
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMethod, setMfaMethod] = useState<MfaMethod>('totp');
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await login(username.trim(), password);
      if (res.status === 'mfa_required') {
        if (!res.challenge_id) {
          throw new ApiError(400, '登录响应缺少 MFA challenge');
        }
        const methods = (res.available_methods ?? []).filter((method): method is MfaMethod =>
          method === 'totp' || method === 'recovery_code',
        );
        const nextMethod = pickMfaMethod(methods);
        setMfaChallenge({ challengeId: res.challenge_id, methods });
        setMfaMethod(nextMethod);
        setMfaCode('');
        return;
      }
      window.location.href = '/todo';
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '登录失败，请重试');
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
      setError(err instanceof ApiError ? err.message : 'MFA 验证失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 4,
          borderRadius: 4,
          boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
        }}
      >
        {/* Brand */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.5rem',
              mx: 'auto',
              mb: 1.5,
            }}
          >
            T
          </Box>
          <Typography variant="h2" sx={{ fontWeight: 800 }}>
            ToolWeb
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {mfaChallenge ? '输入二次验证码以继续' : '登录以继续'}
          </Typography>
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {mfaChallenge ? (
          <Box component="form" onSubmit={handleMfaSubmit}>
            {mfaChallenge.methods.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
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
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{ mt: 2.5, py: 1.25, borderRadius: 3, fontSize: '1rem' }}
            >
              {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : '验证并登录'}
            </Button>
            <Button
              type="button"
              fullWidth
              variant="text"
              disabled={submitting}
              sx={{ mt: 1 }}
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
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              size="small"
              autoFocus
              disabled={submitting}
            />
            <TextField
              fullWidth
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              size="small"
              disabled={submitting}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{ mt: 2.5, py: 1.25, borderRadius: 3, fontSize: '1rem' }}
            >
              {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : '登录'}
            </Button>
          </Box>
        )}
      </Card>
    </Box>
  );
}
