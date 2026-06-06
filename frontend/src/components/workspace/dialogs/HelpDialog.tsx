'use client';

import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const HELP_ITEMS = [
  { icon: '📋', title: '待办事项', desc: '管理任务、设置优先级、创建子任务，支持文件夹和标签分类。' },
  { icon: '💰', title: '记账', desc: '记录日常收支，管理多账本和账户，查看月度统计趋势。' },
  { icon: '🎨', title: '个性化', desc: '支持浅色/深色主题切换，自定义导航和工作台布局。' },
  { icon: '⌨️', title: '快捷键', desc: '按 ? 查看可用的键盘快捷键参考。' },
];

export default function HelpDialog({ open, onClose }: HelpDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}>
        <Typography component="span" variant="h2" sx={{ fontSize: '1.125rem' }}>功能介绍</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          ToolWeb 是一个个人效率工具集，帮助你管理日常任务和个人记账。
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {HELP_ITEMS.map((item) => (
            <Box
              key={item.title}
              sx={{
                display: 'flex',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography sx={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon}</Typography>
              <Box>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
                  {item.title}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.5 }}>
                  {item.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
