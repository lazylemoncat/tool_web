import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

interface BatchBarProps {
  count: number;
  onCompleteAll: () => void;
  onMove: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export default function BatchBar({
  count,
  onCompleteAll,
  onMove,
  onDelete,
  onCancel,
}: BatchBarProps) {
  if (count === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        mb: 2,
        bgcolor: 'oklch(90% 0.08 285)',
        borderRadius: 3,
        flexWrap: 'wrap',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'oklch(20% 0.10 285)',
          mr: 'auto',
        }}
      >
        已选择 <strong>{count}</strong> 个任务
      </Typography>
      <Button
        variant="contained"
        size="small"
        onClick={onCompleteAll}
        sx={{ borderRadius: 2, fontSize: '0.8125rem' }}
      >
        全部完成
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={onMove}
        sx={{
          borderRadius: 2,
          fontSize: '0.8125rem',
          borderColor: 'oklch(82% 0.01 275)',
          color: 'text.secondary',
          '&:hover': { bgcolor: 'oklch(93% 0.01 275)', borderColor: 'oklch(82% 0.01 275)' },
        }}
      >
        移动到…
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={onDelete}
        sx={{
          borderRadius: 2,
          fontSize: '0.8125rem',
          borderColor: 'oklch(82% 0.01 275)',
          color: 'error.main',
          '&:hover': { bgcolor: 'oklch(95% 0.08 25)', borderColor: 'error.main' },
        }}
      >
        删除
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={onCancel}
        sx={{
          borderRadius: 2,
          fontSize: '0.8125rem',
          borderColor: 'oklch(82% 0.01 275)',
          color: 'text.secondary',
          '&:hover': { bgcolor: 'oklch(93% 0.01 275)', borderColor: 'oklch(82% 0.01 275)' },
        }}
      >
        取消选择
      </Button>
    </Box>
  );
}
