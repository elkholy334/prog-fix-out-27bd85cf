import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Wrench, UserCog, ArrowRight } from 'lucide-react';

type LoginRole = null | 'admin' | 'technician';

const Login = () => {
  const { signIn } = useAuth();
  const [selectedRole, setSelectedRole] = useState<LoginRole>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error('فشل تسجيل الدخول: بيانات غير صحيحة');
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
                  onClick={() => setSelectedRole(null)}
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
                    {selectedRole === 'admin' ? 'دخول الإدارة' : 'دخول الفنيين'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    required
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-hero text-primary-foreground font-bold py-5"
                  disabled={loading}
                >
                  {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
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
