import { Settings, LayoutDashboard, ListTodo, Database, LogOut, BarChart3, Wallet, Wrench, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSetting } from '@/hooks/useDatabase';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

interface AppHeaderProps {
  currentView: string;
  onViewChange: (view: 'dashboard' | 'tasks') => void;
  onSettingsOpen: () => void;
  onBackupOpen?: () => void;
  onStatsOpen?: () => void;
  onAccountOpen?: () => void;
  onWhatsAppLogsOpen?: () => void;
}

export const AppHeader = ({ currentView, onViewChange, onSettingsOpen, onBackupOpen, onStatsOpen, onAccountOpen, onWhatsAppLogsOpen }: AppHeaderProps) => {
  const { role, fullName, signOut } = useAuth();
  const isAdmin = role === 'admin';
  const { data: generalData } = useSetting('general');
  const general = (generalData as any) || {};
  const shopName = general.shopName || 'شركة الفيروز للستالايت';
  const shopTagline = general.tagline || 'إدارة التركيبات والخدمات';
  const logoUrl = general.logoUrl || '';

  return (
    <header className="sticky top-0 z-50 overflow-hidden">
      <div className="relative gradient-hero">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-accent/5 rounded-full blur-3xl" />

        <div className="relative container py-3 sm:py-4">
          {/* Top row: icons + theme switcher */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-0.5 flex-shrink-0 flex-wrap">
              {isAdmin && (
                <>
                  <Button variant="ghost" size="icon" className="text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl h-9 w-9 sm:h-10 sm:w-10" onClick={onSettingsOpen} title="الإعدادات">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl h-9 w-9 sm:h-10 sm:w-10" onClick={onBackupOpen} title="النسخ الاحتياطي">
                    <Database className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl h-9 w-9 sm:h-10 sm:w-10" onClick={onStatsOpen} title="الإحصائيات">
                    <BarChart3 className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl h-9 w-9 sm:h-10 sm:w-10" onClick={onAccountOpen} title="حسابات الفنيين">
                    <Wallet className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl h-9 w-9 sm:h-10 sm:w-10" onClick={onWhatsAppLogsOpen} title="تقارير الواتساب">
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 rounded-xl h-9 w-9 sm:h-10 sm:w-10" onClick={signOut} title="تسجيل الخروج">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-shrink-0">
              <ThemeSwitcher />
            </div>
          </div>

          {/* Brand row: centered logo, name, tagline, online */}
          <div className="text-center mt-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              {logoUrl ? (
                <img src={logoUrl} alt={shopName} className="h-8 w-8 rounded-lg object-cover bg-accent/20 flex-shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Wrench className="h-4 w-4 text-accent" />
                </div>
              )}
              <h1 className="text-lg sm:text-xl font-bold text-header-foreground tracking-wide">{shopName}</h1>
            </div>
            <p className="text-xs text-header-foreground/60 font-medium">{shopTagline}</p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-header-foreground/70">متصل (Online)</span>
            </div>
          </div>
        </div>

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
