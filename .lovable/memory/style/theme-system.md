---
name: Theme System
description: Multiple color themes (firoz/royal/emerald/sunset/crimson/graphite) with dark/light mode toggle. Stored in localStorage. Use semantic tokens only.
type: design
---
The app supports 6 color themes via CSS class on `<html>`: `theme-firoz` (default), `theme-royal`, `theme-emerald`, `theme-sunset`, `theme-crimson`, `theme-graphite`. Combined with `.dark` class for dark mode. Managed by `useTheme()` hook in `src/hooks/useTheme.tsx`. Switcher lives in AppHeader via `ThemeSwitcher` component. NEVER hard-code colors in components — always use semantic tokens (primary, accent, header-bg, etc.).
