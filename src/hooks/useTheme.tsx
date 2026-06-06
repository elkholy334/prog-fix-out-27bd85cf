import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeId = 'firoz' | 'royal' | 'emerald' | 'sunset' | 'crimson' | 'graphite';
export type ThemeMode = 'dark' | 'light';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  accentColor: string;
}

export const THEMES: ThemeOption[] = [
  { id: 'firoz',    name: 'الفيروز (الأساسي)', accentColor: '#1e88e5' },
  { id: 'royal',    name: 'الملكي البنفسجي',   accentColor: '#7c3aed' },
  { id: 'emerald',  name: 'الزمردي الأخضر',    accentColor: '#10b981' },
  { id: 'sunset',   name: 'برتقالي الغروب',    accentColor: '#f97316' },
  { id: 'crimson',  name: 'الأحمر القرمزي',    accentColor: '#dc2626' },
  { id: 'graphite', name: 'الرمادي الجرافيت',  accentColor: '#64748b' },
];

interface ThemeContextValue {
  theme: ThemeId;
  mode: ThemeMode;
  setTheme: (t: ThemeId) => void;
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const applyTheme = (theme: ThemeId, mode: ThemeMode) => {
  const root = document.documentElement;
  root.classList.remove(...THEMES.map(t => `theme-${t.id}`));
  root.classList.add(`theme-${theme}`);
  if (mode === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => (localStorage.getItem('app_theme') as ThemeId) || 'firoz');
  const [mode, setModeState]   = useState<ThemeMode>(() => (localStorage.getItem('app_theme_mode') as ThemeMode) || 'light');

  useEffect(() => { applyTheme(theme, mode); }, [theme, mode]);

  const setTheme = (t: ThemeId) => { localStorage.setItem('app_theme', t); setThemeState(t); };
  const setMode  = (m: ThemeMode) => { localStorage.setItem('app_theme_mode', m); setModeState(m); };
  const toggleMode = () => setMode(mode === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
