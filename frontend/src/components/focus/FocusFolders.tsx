'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import type { FocusFolderOut } from '@/lib/focusTypes';

interface FocusFoldersProps {
  folders: FocusFolderOut[];
  onCreateFolder: (name: string) => Promise<FocusFolderOut>;
}

function countFolders(folders: FocusFolderOut[]): number {
  return folders.reduce(
    (total, folder) => total + 1 + countFolders(folder.children ?? []),
    0,
  );
}

function FolderRows({
  folders,
  depth = 0,
}: {
  folders: FocusFolderOut[];
  depth?: number;
}) {
  return (
    <Stack spacing={0.75}>
      {folders.map((folder) => (
        <Box key={folder.id}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              minHeight: 42,
              pl: 1 + depth * 2,
              pr: 1.25,
              py: 0.75,
              borderRadius: 2,
              bgcolor: 'background.default',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <FolderRoundedIcon fontSize="small" sx={{ color: 'text.secondary', flexShrink: 0 }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {folder.name}
              </Typography>
            </Box>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', flexShrink: 0 }}>
              {folder.session_count} 条
            </Typography>
          </Box>
          {folder.children.length > 0 && (
            <Box sx={{ mt: 0.75 }}>
              <FolderRows folders={folder.children} depth={depth + 1} />
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  );
}

export default function FocusFolders({
  folders,
  onCreateFolder,
}: FocusFoldersProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const total = countFolders(folders);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setSaving(true);
    setError('');
    try {
      await onCreateFolder(trimmed);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建文件夹失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.625rem', color: 'text.primary', mb: 0.5 }}>
            文件夹管理
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            共 {total} 个专注文件夹, 仅用于专注记录
          </Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: 'background.paper', mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          <TextField
            size="small"
            label="文件夹名称"
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
            sx={{ minWidth: 132 }}
          >
            新增文件夹
          </Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>{error}</Alert>}
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
        {folders.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <FolderRoundedIcon sx={{ fontSize: 40, mb: 1, color: 'text.disabled' }} />
            <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>暂无文件夹</Typography>
            <Typography sx={{ fontSize: '0.8125rem' }}>新增文件夹后可在计时, 归档和记录筛选中选择.</Typography>
          </Box>
        ) : (
          <FolderRows folders={folders} />
        )}
      </Paper>
    </Box>
  );
}
