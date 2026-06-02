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
