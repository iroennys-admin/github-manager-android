// ============================================================
// OctoMobile · Lightweight global state (no Redux, just React)
// ============================================================

import { createContext, useContext } from 'react';
import type { User } from '../api/github';

export type Theme = 'github-dark' | 'github-dimmed' | 'midnight' | 'aurora' | 'cyber';

export interface AppSettings {
  theme: Theme;
  fontSize: number;
  hapticFeedback: boolean;
  notificationsEnabled: boolean;
  notificationsIntervalMin: number;
  language: 'en' | 'es';
  perPage: number;
  /** Optional override of the OAuth Device Flow client id */
  oauthClientId?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'github-dark',
  fontSize: 14,
  hapticFeedback: true,
  notificationsEnabled: true,
  notificationsIntervalMin: 15,
  language: 'es',
  perPage: 30,
};

export interface AppState {
  token: string | null;
  me: User | null;
  settings: AppSettings;
  setToken: (t: string | null) => void;
  setMe: (u: User | null) => void;
  updateSettings: (p: Partial<AppSettings>) => void;
  logout: () => void;
}

export const AppCtx = createContext<AppState | null>(null);
export const useApp = (): AppState => {
  const v = useContext(AppCtx);
  if (!v) throw new Error('useApp() outside provider');
  return v;
};
