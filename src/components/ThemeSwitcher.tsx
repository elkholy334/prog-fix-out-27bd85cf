import { Moon, Sun, Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { THEMES, useTheme } from '@/hooks/useTheme';

interface ThemeSwitcherProps {
  showLabels?: boolean;
}

export const ThemeSwitcher = ({ showLabels = false }: ThemeSwitcherProps) => {
  const { theme, mode, setTheme, toggleMode } = useTheme();

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size={showLabels ? 'sm' : 'icon'}
        onClick={toggleMode}
        className={showLabels ? 'rounded-xl border border-border bg-card hover:bg-muted' : 'text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl'}
        title={mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
      >
        {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        {showLabels && <span>{mode === 'dark' ? 'فاتح' : 'داكن'}</span>}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={showLabels ? 'sm' : 'icon'}
            className={showLabels ? 'rounded-xl border border-border bg-card hover:bg-muted' : 'text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl'}
            title="تغيير الثيم"
          >
            <Palette className="h-5 w-5" />
            {showLabels && <span>الألوان</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-right">اختر لون الواجهة</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {THEMES.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {theme === t.id && <Check className="h-4 w-4 text-success" />}
                <span className="text-sm">{t.name}</span>
              </div>
              <span className="h-5 w-5 rounded-full border-2 border-border shrink-0" style={{ background: t.accentColor }} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
