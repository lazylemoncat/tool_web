'use client';

// 注册页密码强度条, 按长度, 大小写, 数字和特殊字符计算四段式强度反馈.
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';

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
  helpText?: string;
  labelPrefix?: string;
  strengthLabels?: string[];
}

export default function PasswordStrengthBar({
  password,
  helpText,
  labelPrefix = '密码强度',
  strengthLabels,
}: PasswordStrengthBarProps) {
  const strength = getPasswordStrength(password);
  const score = strength.score;
  const label = strengthLabels?.[score] ?? strength.label;

  const getSegmentColor = (index: number) => {
    if (index >= score) return 'divider';
    if (score <= 2) return 'error.main';
    if (score === 3) return '#F5A623';
    return 'success.main';
  };

  return (
    <Box sx={{ mb: 3.3 }}>
      <Box sx={{ display: 'flex', gap: '4px', mt: '8px' }}>
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
      {(label || helpText) && (
        <Box
          sx={{
            mt: '4px',
            minHeight: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '11px',
              lineHeight: '20px',
            }}
          >
            {label ? `${labelPrefix}: ${label}` : labelPrefix}
          </Typography>
          {helpText && (
            <Tooltip title={helpText}>
              <IconButton
                size="small"
                aria-label={helpText}
                sx={{
                  width: 20,
                  height: 20,
                  color: 'text.secondary',
                }}
              >
                <HelpOutlineRoundedIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
}
