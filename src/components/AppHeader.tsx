import { Settings, LayoutDashboard, ListTodo, Database, LogOut, BarChart3, Receipt, Wrench, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface AppHeaderProps {
  currentView: string;
  onViewChange: (view: 'dashboard' | 'tasks') => void;
  onSettingsOpen: () => void;
  onBackupOpen?: () => void;
  onStatsOpen?: () => void;
  onAccountOpen?: () => void;
  onWhatsAppLogsOpen?: () => void;
}

export const AppHeader = ({ currentView, onViewChange, onSettingsOpen, onBackupOpen, onStatsOpen, onAccountOpen }: AppHeaderProps) => {
  const { role, fullName, signOut } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <header className="sticky top-0 z-50 overflow-hidden">
      {/* Main header with gradient + pattern overlay */}
      <div className="relative gradient-hero">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-accent/5 rounded-full blur-3xl" />

        <div className="relative container flex items-center justify-between py-4">
          <div className="flex items-center gap-0.5">
            {isAdmin && (
              <>
                <Button variant="ghost" size="icon" className="text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl" onClick={onSettingsOpen} title="الإعدادات">
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl" onClick={onBackupOpen} title="النسخ الاحتياطي">
                  <Database className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl" onClick={onStatsOpen} title="الإحصائيات">
                  <BarChart3 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl" onClick={onAccountOpen} title="كشف الحساب">
                  <Receipt className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl" onClick={signOut} title="تسجيل الخروج">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <Wrench className="h-4 w-4 text-accent" />
              </div>
              <h1 className="text-xl font-bold text-header-foreground tracking-wide">شركة الفيروز للستالايت</h1>
            </div>
            <p className="text-xs text-header-foreground/60 font-medium">إدارة التركيبات والخدمات</p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-header-foreground/70">متصل (Online)</span>
            </div>
          </div>

          <div className="flex items-center gap-1" />
        </div>

        {/* Navigation tabs */}
        <div className="relative container pb-3">
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={() => onViewChange('dashboard')}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-card text-foreground shadow-card'
                    : 'text-header-foreground/70 hover:text-header-foreground hover:bg-header-foreground/10'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4" />
                  لوحة التحكم
                </span>
              </button>
            )}
            <button
              onClick={() => onViewChange('tasks')}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                currentView === 'tasks'
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-header-foreground/70 hover:text-header-foreground hover:bg-header-foreground/10'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ListTodo className="h-4 w-4" />
                المهام
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Welcome bar */}
      <div className="bg-secondary/60 backdrop-blur-md border-b border-header-foreground/5">
        <div className="container flex items-center justify-between py-2.5 text-sm">
          <span className="text-header-foreground/60">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <span className="text-header-foreground/90">
            مرحباً بك، <span className="font-bold text-accent">{fullName || (isAdmin ? 'المدير العام' : 'فني')}</span>
          </span>
        </div>
      </div>
    </header>
  );
};
