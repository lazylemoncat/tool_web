'use client';

// 密码输入控件, 提供外置标签, MUI outlined 输入框, 显示/隐藏密码按钮和错误提示.
import { useState } from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material/styles';

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
  sx?: SxProps<Theme>;
  labelSx?: SxProps<Theme>;
  inputSx?: SxProps<Theme>;
}

export default function PasswordInput({
  id, label, value, onChange, error, helperText,
  placeholder = '', autoComplete, disabled, sx, labelSx, inputSx,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <FormControl
      fullWidth
      error={error}
      sx={[
        { mb: 3.5 },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <FormLabel
        sx={[
          {
            fontSize: 13,
            fontWeight: 600,
            color: 'text.primary',
            mb: 0.8,
            letterSpacing: 0,
          },
          ...(Array.isArray(labelSx) ? labelSx : labelSx ? [labelSx] : []),
        ]}
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
        sx={[
          {
            height: 50,
            bgcolor: 'transparent',
            pr: 0.5,
            '& .MuiOutlinedInput-input': {
              height: '100%',
              boxSizing: 'border-box',
              py: 0,
              px: 2,
            },
            '& .MuiOutlinedInput-input::placeholder': {
              color: 'text.secondary',
              opacity: 0.62,
            },
          },
          ...(Array.isArray(inputSx) ? inputSx : inputSx ? [inputSx] : []),
        ]}
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
