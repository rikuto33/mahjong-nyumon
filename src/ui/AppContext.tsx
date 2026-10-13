import { createContext, useContext } from 'react';
import type { Progress, Settings } from '../storage';

export type AppState = {
  settings: Settings;
  progress: Progress;
  storageOk: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  markCleared: (stage: number) => void;
  resetProgress: () => void;
};

export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppContext');
  return ctx;
}
