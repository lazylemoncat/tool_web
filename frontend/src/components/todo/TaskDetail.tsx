import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import type { TodoOut, FolderOut } from '@/lib/types';
import dayjs from 'dayjs';

interface TaskDetailProps {
  task: TodoOut;
  folders?: FolderOut[];
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TaskDetail({ task, folders, onEdit, onDelete }: TaskDetailProps) {
  const folderName = folders?.find((f) => f.id === task.folder_id)?.name || (task.folder_id ? '未命名' : '无');
  const createdAt = task.created_at ? dayjs(task.created_at).format('YYYY-MM-DD HH:mm') : '-';
  const updatedAt = task.updated_at ? dayjs(task.updated_at).format('YYYY-MM-DD HH:mm') : '-';

  return (
    <Box sx={{ mt: 0.25, px: { xs: 2, sm: 8.5 }, py: 2.5, bgcolor: 'oklch(94% 0.005 275)', borderRadius: '0 0 12px 12px' }}>
      <Box sx={{ display: 'flex', gap: 5, flexWrap: 'wrap', mb: 2 }}>
        <Box sx={{ minWidth: 140 }}>
          <Typography component="label" sx={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 0.5 }}>创建时间</Typography>
          <Typography variant="body2">{createdAt}</Typography>
        </Box>
        <Box sx={{ minWidth: 140 }}>
          <Typography component="label" sx={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 0.5 }}>更新时间</Typography>
          <Typography variant="body2">{updatedAt}</Typography>
        </Box>
        <Box sx={{ minWidth: 140 }}>
          <Typography component="label" sx={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 0.5 }}>所属文件夹</Typography>
          <Typography variant="body2">{folderName}</Typography>
        </Box>
      </Box>

      {/* Children (subtasks) from API */}
      {task.children && task.children.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.75 }}>子任务</Typography>
          {task.children.map((child) => (
            <Box key={child.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid', borderColor: child.is_completed ? 'primary.main' : 'oklch(82% 0.01 275)', bgcolor: child.is_completed ? 'primary.main' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...(child.is_completed && { '&::after': { content: '""', width: 6, height: 3, borderLeft: '1.5px solid #fff', borderBottom: '1.5px solid #fff', transform: 'rotate(-45deg) translateY(-0.5px)' } }),
              }} />
              <Typography variant="body2" sx={{ textDecoration: child.is_completed ? 'line-through' : 'none', color: child.is_completed ? 'text.secondary' : 'text.primary' }}>{child.title}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Note */}
      {task.note && (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2, whiteSpace: 'pre-wrap', '& code': { bgcolor: 'action.hover', px: 0.75, borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8125rem' } }}>
          {task.note}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" size="small" onClick={onEdit} sx={{ borderRadius: 2, fontSize: '0.8125rem', fontWeight: 600 }}>编辑</Button>
        <Button variant="outlined" size="small" onClick={onDelete} sx={{ borderRadius: 2, fontSize: '0.8125rem', fontWeight: 600, borderColor: 'oklch(82% 0.01 275)', color: 'error.main', '&:hover': { bgcolor: 'oklch(95% 0.08 25)', borderColor: 'error.main' } }}>删除</Button>
      </Box>
    </Box>
  );
}
