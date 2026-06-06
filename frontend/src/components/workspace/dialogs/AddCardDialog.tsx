'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import type { CardId } from '../types';
import { CARD_DEFINITIONS } from '../constants';

interface AddCardDialogProps {
  open: boolean;
  visibleCards: CardId[];
  onAddCard: (cardId: CardId) => void;
  onClose: () => void;
}

export default function AddCardDialog({ open, visibleCards, onAddCard, onClose }: AddCardDialogProps) {
  const allCards = Object.values(CARD_DEFINITIONS);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}>
        <Typography component="span" variant="h2" sx={{ fontSize: '1.125rem' }}>添加卡片</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          选择要添加到工作台的卡片：
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {allCards.map((card) => {
            const isVisible = visibleCards.includes(card.id as CardId);
            return (
              <Box
                key={card.id}
                onClick={() => {
                  if (!isVisible) {
                    onAddCard(card.id as CardId);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: isVisible ? 'default' : 'pointer',
                  opacity: isVisible ? 0.5 : 1,
                  transition: 'all 0.15s',
                  '&:hover': isVisible ? {} : {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(108,92,231,0.04)',
                  },
                }}
              >
                {/* 小图标 */}
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: card.iconBg,
                    color: card.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                  }}
                >
                  {card.label[0]}
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.primary' }}>
                    {card.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>
                    {card.description}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 999,
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    bgcolor: isVisible ? '#D1FAE5' : 'action.hover',
                    color: isVisible ? '#065F46' : 'text.secondary',
                    flexShrink: 0,
                  }}
                >
                  {isVisible ? '已添加' : '可添加'}
                </Box>
              </Box>
            );
          })}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
