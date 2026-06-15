'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import type { CardId } from './types';
import { CARD_SIZE_CONFIG } from './types';
import { CARD_DEFINITIONS } from './constants';

interface CardGridProps {
  children?: ReactNode;
  isManageMode: boolean;
  cardOrder: CardId[];
  visibleCards: CardId[];
  draggingCardId: string | null;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
  onDragOver: (e: React.DragEvent, cardId: string) => void;
  onDragEnd: () => void;
  onDeleteCard: (cardId: CardId) => void;
  /** Map of cardId -> rendered card element */
  cardElements: Record<string, ReactNode>;
}

export default function CardGrid({
  isManageMode,
  cardOrder,
  visibleCards,
  draggingCardId,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDeleteCard,
  cardElements,
}: CardGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2,
        px: { xs: 2, sm: 3 },
        pb: 4,
        maxWidth: 1200,
        mx: 'auto',
      }}
    >
      {cardOrder.filter((id) => visibleCards.includes(id)).map((cardId, index) => {
        const isDragging = draggingCardId === cardId;
        const cardSize = CARD_DEFINITIONS[cardId]?.size || 'md';

        return (
          <Box
            key={cardId}
            draggable={isManageMode}
            aria-grabbed={isManageMode ? isDragging : undefined}
            onDragStart={(e) => onDragStart(e, cardId)}
            onDragOver={(e) => onDragOver(e, cardId)}
            onDrop={(e) => { e.preventDefault(); onDragEnd(); }}
            onDragEnd={onDragEnd}
            sx={{
              gridColumn: CARD_SIZE_CONFIG[cardSize],
              position: 'relative',
              animation: `fadeSlideUp 0.35s ease-out both`,
              animationDelay: `${index * 80}ms`,
              '@keyframes fadeSlideUp': {
                from: { opacity: 0, transform: 'translateY(12px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
              ...(isDragging && { opacity: 0.5 }),
            }}
          >
            {/* 拖拽手柄 - 仅管理模式可见 */}
            {isManageMode && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 6,
                  top: 6,
                  width: 28,
                  height: 28,
                  borderRadius: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                  cursor: 'grab',
                  zIndex: 2,
                  '&:hover': { color: 'primary.main', bgcolor: 'rgba(108,92,231,0.08)' },
                }}
                aria-hidden
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="8" y1="6" x2="16" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="8" y1="18" x2="16" y2="18" />
                </svg>
              </Box>
            )}

            {/* 删除按钮 - 仅管理模式可见 */}
            {isManageMode && (
              <IconButton
                size="small"
                onClick={() => onDeleteCard(cardId)}
                aria-label={`移除${CARD_DEFINITIONS[cardId]?.label ?? '卡片'}`}
                sx={{
                  position: 'absolute',
                  right: 6,
                  top: 6,
                  width: 28,
                  height: 28,
                  color: 'text.secondary',
                  zIndex: 2,
                  '&:hover': { bgcolor: '#FEE2E2', color: '#E53935' },
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </IconButton>
            )}

            {cardElements[cardId]}
          </Box>
        );
      })}
    </Box>
  );
}
