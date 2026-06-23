'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import type { APITag } from '@/lib/types';

interface FocusTagPickerProps {
  id: string;
  label: string;
  tags: APITag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  onCreateTag?: (name: string) => Promise<APITag>;
  disabled?: boolean;
}

function uniqueTagIds(tagIds: string[]): string[] {
  return Array.from(new Set(tagIds.filter(Boolean)));
}

export default function FocusTagPicker({
  id,
  label,
  tags,
  selectedTagIds,
  onChange,
  onCreateTag,
  disabled = false,
}: FocusTagPickerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleCreate = async () => {
    const name = newTagName.trim();
    if (!name) return;

    const existingTag = tags.find((tag) => tag.name.trim().toLowerCase() === name.toLowerCase());
    if (existingTag) {
      onChange(uniqueTagIds([...selectedTagIds, String(existingTag.id)]));
      setNewTagName('');
      setCreateError('');
      return;
    }

    if (!onCreateTag) {
      setCreateError('当前页面无法创建标签');
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      const tag = await onCreateTag(name);
      onChange(uniqueTagIds([...selectedTagIds, String(tag.id)]));
      setNewTagName('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : '创建标签失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box>
      <FormControl size="small" fullWidth disabled={disabled}>
        <InputLabel id={`${id}-label`}>{label}</InputLabel>
        <Select
          labelId={`${id}-label`}
          label={label}
          multiple
          value={selectedTagIds}
          onChange={(event) => {
            const value = event.target.value;
            onChange(uniqueTagIds(typeof value === 'string' ? value.split(',') : value));
          }}
          renderValue={(selected) => (
            selected
              .map((tagId) => tags.find((tag) => String(tag.id) === tagId)?.name ?? `#${tagId}`)
              .join(', ')
          )}
        >
          {tags.length === 0 ? (
            <MenuItem disabled value="">
              暂无标签
            </MenuItem>
          ) : tags.map((tag) => (
            <MenuItem key={tag.id} value={String(tag.id)}>
              <Checkbox checked={selectedTagIds.includes(String(tag.id))} />
              <ListItemText primary={tag.name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
        <TextField
          size="small"
          label="新增标签"
          value={newTagName}
          disabled={disabled || creating}
          onChange={(event) => {
            setNewTagName(event.target.value);
            if (createError) setCreateError('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleCreate();
            }
          }}
          sx={{ flex: 1 }}
        />
        <Button
          variant="outlined"
          startIcon={<AddRoundedIcon />}
          disabled={disabled || creating || !newTagName.trim()}
          onClick={() => void handleCreate()}
          sx={{ minWidth: 104 }}
        >
          添加
        </Button>
      </Stack>

      {createError && (
        <Typography sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.75 }}>
          {createError}
        </Typography>
      )}
    </Box>
  );
}
