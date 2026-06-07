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

const isThemeId = (value: string | null): value is ThemeId =>
  THEMES.some((theme) => theme.id === value);

const THEME_TOKENS: Record<ThemeId, Record<string, string>> = {
  firoz: {
    '--primary': '215 80% 48%', '--secondary': '220 50% 25%', '--ring': '215 80% 48%', '--accent': '42 100% 50%', '--accent-foreground': '220 40% 13%', '--header-bg': '220 50% 18%',
    '--gradient-hero': 'linear-gradient(135deg, hsl(220 55% 12%), hsl(215 65% 22%), hsl(210 70% 30%))', '--gradient-info': 'linear-gradient(135deg, hsl(200 80% 55%), hsl(215 80% 48%))',
  },
  royal: {
    '--primary': '262 83% 58%', '--secondary': '262 60% 25%', '--ring': '262 83% 58%', '--accent': '280 90% 60%', '--accent-foreground': '0 0% 100%', '--header-bg': '262 60% 18%',
    '--gradient-hero': 'linear-gradient(135deg, hsl(262 60% 12%), hsl(262 70% 22%), hsl(280 75% 32%))', '--gradient-info': 'linear-gradient(135deg, hsl(262 83% 58%), hsl(280 90% 60%))',
  },
  emerald: {
    '--primary': '160 84% 39%', '--secondary': '160 60% 22%', '--ring': '160 84% 39%', '--accent': '142 76% 45%', '--accent-foreground': '0 0% 100%', '--header-bg': '160 50% 16%',
    '--gradient-hero': 'linear-gradient(135deg, hsl(160 60% 10%), hsl(160 70% 20%), hsl(142 70% 28%))', '--gradient-info': 'linear-gradient(135deg, hsl(160 84% 39%), hsl(142 76% 45%))',
  },
  sunset: {
    '--primary': '24 95% 53%', '--secondary': '14 80% 30%', '--ring': '24 95% 53%', '--accent': '45 100% 55%', '--accent-foreground': '14 40% 15%', '--header-bg': '14 50% 18%',
    '--gradient-hero': 'linear-gradient(135deg, hsl(14 60% 14%), hsl(20 80% 28%), hsl(35 90% 40%))', '--gradient-info': 'linear-gradient(135deg, hsl(24 95% 53%), hsl(45 100% 55%))',
  },
  crimson: {
    '--primary': '0 84% 50%', '--secondary': '0 60% 25%', '--ring': '0 84% 50%', '--accent': '350 90% 55%', '--accent-foreground': '0 0% 100%', '--header-bg': '0 50% 18%',
    '--gradient-hero': 'linear-gradient(135deg, hsl(0 60% 12%), hsl(0 70% 22%), hsl(350 80% 35%))', '--gradient-info': 'linear-gradient(135deg, hsl(0 84% 50%), hsl(350 90% 55%))',
  },
  graphite: {
    '--primary': '215 25% 35%', '--secondary': '215 20% 22%', '--ring': '215 25% 35%', '--accent': '200 70% 50%', '--accent-foreground': '0 0% 100%', '--header-bg': '215 25% 14%',
    '--gradient-hero': 'linear-gradient(135deg, hsl(215 20% 10%), hsl(215 22% 20%), hsl(215 25% 30%))', '--gradient-info': 'linear-gradient(135deg, hsl(215 25% 35%), hsl(200 70% 50%))',
  },
};

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
  root.dataset.theme = theme;
  Object.entries(THEME_TOKENS[theme]).forEach(([key, value]) => root.style.setProperty(key, value));
  if (mode === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const savedTheme = localStorage.getItem('app_theme');
    return isThemeId(savedTheme) ? savedTheme : 'firoz';
  });
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
