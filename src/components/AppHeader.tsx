import { Settings, LayoutDashboard, ListTodo, Database, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  currentView: string;
  onViewChange: (view: 'dashboard' | 'tasks') => void;
  onSettingsOpen: () => void;
}

export const AppHeader = ({ currentView, onViewChange, onSettingsOpen }: AppHeaderProps) => {
  return (
    <header className="gradient-hero text-header-foreground sticky top-0 z-50">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-header-foreground hover:bg-header-foreground/10"
            onClick={onSettingsOpen}
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-header-foreground hover:bg-header-foreground/10"
          >
            <Database className="h-5 w-5" />
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-lg font-bold">شركة الفيروز للستالايت</h1>
          <p className="text-xs opacity-75">إدارة التركيبات والخدمات</p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs">متصل (Online)</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Nav buttons */}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="container pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => onViewChange('dashboard')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              currentView === 'dashboard'
                ? 'bg-card text-foreground shadow-card'
                : 'text-header-foreground/80 hover:bg-header-foreground/10'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              لوحة التحكم
            </span>
          </button>
          <button
            onClick={() => onViewChange('tasks')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              currentView === 'tasks'
                ? 'bg-card text-foreground shadow-card'
                : 'text-header-foreground/80 hover:bg-header-foreground/10'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ListTodo className="h-4 w-4" />
              المهام
            </span>
          </button>
        </div>
      </div>

      {/* Welcome bar */}
      <div className="bg-secondary/50 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-2 text-sm">
          <span className="opacity-75">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <span>
            مرحباً بك، <span className="font-bold text-accent">المدير العام</span>
          </span>
        </div>
      </div>
    </header>
  );
};
