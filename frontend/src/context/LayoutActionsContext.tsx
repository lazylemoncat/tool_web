'use client';

import { createContext, useContext } from 'react';

export interface LayoutActions {
  openSettings: () => void;
}

export const LayoutActionsContext = createContext<LayoutActions>({
  openSettings: () => {},
});

export function useLayoutActions(): LayoutActions {
  return useContext(LayoutActionsContext);
}
