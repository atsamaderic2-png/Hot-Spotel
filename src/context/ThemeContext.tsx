import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'navy_gold' | 'emerald_amber' | 'royal_crimson' | 'obsidian_bronze';

export interface ThemeOption {
  id: AppTheme;
  labelEn: string;
  labelFr: string;
  primaryHex: string;
  accentHex: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'navy_gold',
    labelEn: 'Midnight & Gold',
    labelFr: 'Bleu Nuit & Or',
    primaryHex: '#071426',
    accentHex: '#CA8A04',
  },
  {
    id: 'emerald_amber',
    labelEn: 'Botanical & Brass',
    labelFr: 'Émeraude & Laiton',
    primaryHex: '#06241B',
    accentHex: '#D97706',
  },
  {
    id: 'royal_crimson',
    labelEn: 'Burgundy & Gold',
    labelFr: 'Bordeaux & Or',
    primaryHex: '#2D0A14',
    accentHex: '#CA8A04',
  },
  {
    id: 'obsidian_bronze',
    labelEn: 'Charcoal & Bronze',
    labelFr: 'Anthracite & Bronze',
    primaryHex: '#14161D',
    accentHex: '#C87D0A',
  },
];

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  themes: ThemeOption[];
  currentThemeOption: ThemeOption;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const VALID_THEMES: AppTheme[] = ['navy_gold', 'emerald_amber', 'royal_crimson', 'obsidian_bronze'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('hs_theme') as AppTheme | null;
    return saved && VALID_THEMES.includes(saved) ? saved : 'navy_gold';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hs_theme', theme);
  }, [theme]);

  const setTheme = (next: AppTheme) => {
    setThemeState(next);
  };

  const currentThemeOption =
    THEME_OPTIONS.find((item) => item.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEME_OPTIONS, currentThemeOption }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
