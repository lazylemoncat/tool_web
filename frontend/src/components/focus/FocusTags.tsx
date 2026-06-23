'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import type { APITag } from '@/lib/types';

interface FocusTagsProps {
  tags: APITag[];
  onCreateTag: (name: string) => Promise<APITag>;
}

export default function FocusTags({ tags, onCreateTag }: FocusTagsProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setSaving(true);
    setError('');
    try {
      await onCreateTag(trimmed);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建标签失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.625rem', color: 'text.primary', mb: 0.5 }}>
            标签管理
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            共 {tags.length} 个标签, 可用于计时和专注记录
          </Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: 'background.paper', mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          <TextField
            size="small"
            label="标签名称"
            value={name}
            disabled={saving}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError('');
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
            variant="contained"
            startIcon={<AddRoundedIcon />}
            disabled={saving || !name.trim()}
            onClick={() => void handleCreate()}
            sx={{ minWidth: 120 }}
          >
            新增标签
          </Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>{error}</Alert>}
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
        {tags.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <LocalOfferRoundedIcon sx={{ fontSize: 40, mb: 1, color: 'text.disabled' }} />
            <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>暂无标签</Typography>
            <Typography sx={{ fontSize: '0.8125rem' }}>新增标签后可在计时和编辑记录时选择.</Typography>
          </Box>
        ) : (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {tags.map((tag) => (
              <Chip
                key={tag.id}
                icon={<LocalOfferRoundedIcon />}
                label={tag.name}
                variant="outlined"
                sx={{ borderRadius: 999, fontWeight: 700 }}
              />
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
