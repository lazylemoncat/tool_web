'use client';

import Box from '@mui/material/Box';
import type { MouseEvent } from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

export type MarkerType = 'color' | 'emoji';

export type MarkerValue = {
  type: MarkerType;
  value: string;
};

export const MARKER_COLORS = [
  '#6282E3',
  '#E3628C',
  '#62E3A0',
  '#E3B462',
  '#B462E3',
  '#62D4E3',
  '#6D5DFC',
  '#10B981',
];

export const MARKER_EMOJIS = [
  '📁',
  '📝',
  '🚨',
  '📅',
  '💼',
  '📚',
  '🧹',
  '🏃',
  '💵',
  '💸',
  '🧮',
  '🧾',
  '🏦',
  '🐷',
  '📈',
  '💳',
  '🛍️',
  '🎮',
  '💊',
  '📂',
  '✅',
  '📌',
  '⭐',
  '💡',
  '💰',
  '🍽️',
  '🚕',
  '🏠',
  '🛒',
  '🎁',
];

interface MarkerPickerProps {
  marker: MarkerValue;
  onChange: (marker: MarkerValue) => void;
  label?: string | null;
}

export function MarkerIcon({
  type,
  value,
  size = 18,
}: {
  type: MarkerType;
  value: string;
  size?: number;
}) {
  if (type === 'emoji') {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          fontSize: Math.max(12, size - 2),
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {value}
      </Box>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: value,
        flexShrink: 0,
        display: 'inline-flex',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
      }}
    />
  );
}

export default function MarkerPicker({ marker, onChange, label = '标识' }: MarkerPickerProps) {
  const handleTypeChange = (_: MouseEvent<HTMLElement>, nextType: MarkerType | null) => {
    if (!nextType) return;
    onChange({
      type: nextType,
      value: nextType === 'color' ? MARKER_COLORS[0] : MARKER_EMOJIS[0],
    });
  };

  const handleEmojiChange = (event: SelectChangeEvent<string>) => {
    onChange({ type: 'emoji', value: event.target.value });
  };

  return (
    <Box>
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 600 }}>
          {label}
        </Typography>
      )}
      <ToggleButtonGroup
        value={marker.type}
        exclusive
        onChange={handleTypeChange}
        fullWidth
        size="small"
        sx={{ mb: 1, '& .MuiToggleButton-root': { borderRadius: 2, py: 0.75, fontSize: '0.8125rem' } }}
      >
        <ToggleButton value="color">纯色</ToggleButton>
        <ToggleButton value="emoji">Emoji</ToggleButton>
      </ToggleButtonGroup>

      {marker.type === 'color' ? (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {MARKER_COLORS.map((color) => (
            <Box
              key={color}
              component="button"
              type="button"
              aria-label={`选择颜色 ${color}`}
              onClick={() => onChange({ type: 'color', value: color })}
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                bgcolor: color,
                cursor: 'pointer',
                p: 0,
                border: '2px solid',
                borderColor: marker.value === color ? 'text.primary' : 'transparent',
                transition: 'transform 0.15s',
                '&:hover': { transform: 'scale(1.12)' },
              }}
            />
          ))}
        </Box>
      ) : (
        <FormControl fullWidth size="small">
          <InputLabel>Emoji</InputLabel>
          <Select
            label="Emoji"
            value={marker.value}
            onChange={handleEmojiChange}
          >
            {MARKER_EMOJIS.map((emoji) => (
              <MenuItem key={emoji} value={emoji}>
                {emoji}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
}
