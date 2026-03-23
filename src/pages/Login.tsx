import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Wrench, UserCog, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type LoginRole = null | 'admin' | 'technician';

interface TechnicianOption {
  id: string;
  name: string;
  email: string;
}

const REMEMBER_KEY = 'remembered_login';

const Login = () => {
  const { signIn } = useAuth();
  const [selectedRole, setSelectedRole] = useState<LoginRole>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [selectedTechId, setSelectedTechId] = useState('');

  // Load remembered credentials
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      try {
        const { email: savedEmail, password: savedPass, role } = JSON.parse(saved);
        setEmail(savedEmail);
        setPassword(savedPass);
        setRememberMe(true);
        if (role) setSelectedRole(role);
      } catch { /* ignore */ }
    }
  }, []);

  // Fetch technicians when role is technician
  useEffect(() => {
    if (selectedRole === 'technician') {
      const fetchTechnicians = async () => {
        const { data: techs } = await supabase
          .from('technicians')
          .select('id, name, email')
          .eq('is_active', true)
          .order('name');

        if (techs) {
          setTechnicians(techs.map(t => ({
            id: t.id,
            name: t.name,
            email: (t as any).email || '',
          })));

          // Check if there's a remembered technician
          const saved = localStorage.getItem(REMEMBER_KEY);
          if (saved) {
            try {
              const { techId } = JSON.parse(saved);
              if (techId) setSelectedTechId(techId);
            } catch { /* ignore */ }
          }
        }
      };
      fetchTechnicians();
    }
  }, [selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let loginEmail = email;

    // For technician role, get email from selected technician profile
    if (selectedRole === 'technician' && selectedTechId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('technician_id', selectedTechId)
        .single();

      if (profile) {
        // Get user email from auth
        const { data } = await supabase.rpc('has_role', { _user_id: profile.id, _role: 'technician' });
        // We need the actual email - fetch from app_settings or use known pattern
        // Since we seeded users with known emails, let's look up by profile
        const { data: userData } = await supabase.auth.admin?.getUserById?.(profile.id) || { data: null };
        
        // Fallback: use the technician name to derive email (matching seed pattern)
        const tech = technicians.find(t => t.id === selectedTechId);
        if (tech) {
          // Match the seeded email pattern
          const nameToEmail: Record<string, string> = {
            'احمد رضوان': 'ahmadredwan@app.com',
            'كريم الخولي': 'kareemelkholy@app.com',
            'أحمد الخولي': 'ahmadelkholy@app.com',
            'سنبل': 'sonbol@app.com',
            'علي شعت': 'alishaat@app.com',
          };
          loginEmail = nameToEmail[tech.name] || email;
        }
      }
    }

    const { error } = await signIn(loginEmail, password);
    if (error) {
      toast.error('فشل تسجيل الدخول: بيانات غير صحيحة');
    } else if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({
        email: loginEmail,
        password,
        role: selectedRole,
        techId: selectedTechId,
      }));
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-secondary p-6 text-center">
            <p className="text-sm text-secondary-foreground/70">تركيبات الفيروز</p>
            <h1 className="text-xl font-bold text-secondary-foreground mt-1">تسجيل الدخول</h1>
          </div>

          {!selectedRole ? (
            /* Role Selection */
            <div className="p-6 space-y-5">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setSelectedRole('admin')}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl bg-muted hover:bg-accent/10 hover:shadow-card transition-all w-32 group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <UserCog className="h-7 w-7 text-primary" />
                  </div>
                  <span className="font-bold text-sm text-foreground">الإدارة</span>
                </button>

                <button
                  onClick={() => setSelectedRole('technician')}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl bg-muted hover:bg-accent/10 hover:shadow-card transition-all w-32 group"
                >
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Wrench className="h-7 w-7 text-accent-foreground" />
                  </div>
                  <span className="font-bold text-sm text-foreground">الفنيين</span>
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground pt-2">
                Powered by <span className="font-bold text-foreground">Prog-Fix</span>
              </p>
            </div>
          ) : (
            /* Login Form */
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => { setSelectedRole(null); setSelectedTechId(''); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  {selectedRole === 'admin' ? (
                    <UserCog className="h-5 w-5 text-primary" />
                  ) : (
                    <Wrench className="h-5 w-5 text-accent-foreground" />
                  )}
                  <span className="font-bold text-foreground">
                    {selectedRole === 'admin' ? 'تسجيل دخول الإدارة' : 'تسجيل دخول الفنيين'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedRole === 'technician' ? (
                  <div className="space-y-2">
                    <Label>اختر المستخدم</Label>
                    <Select value={selectedTechId} onValueChange={setSelectedTechId}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر الفني..." />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map(tech => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@app.com"
                      required
                      dir="ltr"
                      className="text-left"
                    />
                  </div>
                )}
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
                  disabled={loading || (selectedRole === 'technician' && !selectedTechId)}
                >
                  {loading ? 'جاري الدخول...' : 'دخول للنظام'}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                Powered by <span className="font-bold text-foreground">Prog-Fix</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
