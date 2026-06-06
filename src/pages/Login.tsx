import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowRight, User, Shield, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician';
  color?: string;
}

const REMEMBER_KEY = 'remembered_login';

const Login = () => {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  // Load all users from technicians table
  useEffect(() => {
    const fetchUsers = async () => {
      const { data: techs, error } = await supabase.rpc('get_login_users');
      if (error) {
        console.error('Failed to load login users:', error);
        return;
      }
      if (!techs) return;

      const allUsers: UserOption[] = (techs as any[]).map(t => ({
        id: t.id,
        name: t.name,
        email: t.email || '',
        role: t.is_admin ? 'admin' as const : 'technician' as const,
        color: t.color,
      }));

      // Sort: admin first
      allUsers.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return 0;
      });

      setUsers(allUsers);
    };
    fetchUsers();
  }, []);

  // Load remembered credentials & auto-select user
  useEffect(() => {
    if (users.length === 0) return;
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      try {
        const { email, password: savedPass } = JSON.parse(saved);
        const found = users.find(u => u.email === email);
        if (found) {
          setSelectedUser(found);
          setPassword(savedPass);
          setRememberMe(true);
        }
      } catch { /* ignore */ }
    }
  }, [users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);

    console.log('Login attempt:', { email: selectedUser.email, selectedUser });
    const { error } = await signIn(selectedUser.email, password);
    console.log('Login result:', { error });
    if (error) {
      toast.error('كلمة المرور غير صحيحة: ' + error);
    } else if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({
        email: selectedUser.email,
        password,
      }));
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    setLoading(false);
  };

  const getRoleLabel = (role: string) => role === 'admin' ? 'مدير' : 'فني';
  const getRoleIcon = (role: string) => role === 'admin'
    ? <Shield className="h-5 w-5 text-primary" />
    : <Wrench className="h-5 w-5 text-accent-foreground" />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors" dir="rtl">
      <div className="fixed left-4 top-4 z-10">
        <ThemeSwitcher showLabels />
      </div>
      <div className="w-full max-w-md">
        {!selectedUser ? (
          /* User Selection Grid */
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <User className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground">مرحباً بك</h1>
              <p className="text-muted-foreground text-sm">اختر حسابك للمتابعة</p>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-3 gap-3">
              {users.map(user => {
                const isAdmin = user.role === 'admin';
                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all group ${
                      isAdmin
                        ? 'gradient-hero text-primary-foreground border-primary/40 hover:border-primary hover:shadow-lg col-span-3 flex-row justify-center py-5 ring-1 ring-primary/20'
                        : 'bg-card border-border hover:border-primary/40 hover:shadow-card'
                    }`}
                  >
                    <div className={`rounded-full flex items-center justify-center transition-colors ${
                      isAdmin
                        ? 'w-14 h-14 bg-primary text-primary-foreground'
                        : 'w-12 h-12 bg-muted group-hover:bg-primary/10'
                    }`}>
                      {isAdmin
                        ? <Shield className="h-7 w-7" />
                        : <User className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      }
                    </div>
                    <div className={isAdmin ? 'mr-3 text-right' : 'text-center'}>
                      <span className={`font-bold leading-tight ${isAdmin ? 'text-base text-primary-foreground' : 'text-xs text-foreground'}`}>
                        {user.name}
                      </span>
                      <span className={`block ${isAdmin ? 'text-xs text-primary-foreground/80 font-semibold' : 'text-[10px] text-muted-foreground'}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground pt-2">
              Powered by <span className="font-bold text-foreground">Prog-Fix</span>
            </p>
          </div>
        ) : (
          /* Password Form */
          <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
            <div className="bg-secondary p-6">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => { setSelectedUser(null); setPassword(''); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
                <span className="text-sm text-muted-foreground">رجوع</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-foreground">{selectedUser.name}</h2>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {getRoleIcon(selectedUser.role)}
                    <span className="text-sm text-muted-foreground">{getRoleLabel(selectedUser.role)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••"
                    required
                    dir="ltr"
                    className="text-left"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    تذكرني للدخول التلقائي
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-hero text-primary-foreground font-bold py-5"
                  disabled={loading}
                >
                  {loading ? 'جاري الدخول...' : 'دخول للنظام'}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                Powered by <span className="font-bold text-foreground">Prog-Fix</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
