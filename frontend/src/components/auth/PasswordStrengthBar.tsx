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
    if (score === 3) return '#F5A623';
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
