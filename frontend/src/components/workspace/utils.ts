import type { WorkspaceCardsState, CardId } from './types';
import { DEFAULT_CARD_STATE, STORAGE_KEY } from './constants';

export function loadCardsState(): WorkspaceCardsState {
  if (typeof window === 'undefined') return DEFAULT_CARD_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CARD_STATE;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.order) &&
      Array.isArray(parsed.visible) &&
      parsed.order.length > 0
    ) {
      return parsed as WorkspaceCardsState;
    }
    return DEFAULT_CARD_STATE;
  } catch {
    return DEFAULT_CARD_STATE;
  }
}

export function saveCardsState(state: WorkspaceCardsState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or disabled — silently ignore
  }
}

export function isCardVisible(cardId: CardId, visible: CardId[]): boolean {
  return visible.includes(cardId);
}
