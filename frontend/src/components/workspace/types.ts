export type CardId = 'todo' | 'finance' | 'monthly' | 'recent' | 'settings' | 'help';

export type CardSize = 'sm' | 'md' | 'lg';

export interface CardDefinition {
  id: CardId;
  label: string;
  description: string;
  size: CardSize;
  iconBg: string;
  iconColor: string;
}

export interface WorkspaceCardsState {
  order: CardId[];
  visible: CardId[];
}

export const CARD_SIZE_CONFIG: Record<CardSize, Record<string, string>> = {
  sm: { xs: 'span 1', sm: 'span 1', md: 'span 1' },
  md: { xs: 'span 1', sm: 'span 1', md: 'span 2' },
  lg: { xs: 'span 1', sm: 'span 2', md: 'span 4' },
};
