import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'admin' | 'technician';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  technicianId: string | null;
  fullName: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [technicianId, setTechnicianId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUserMeta = async (userId: string) => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (roles && roles.length > 0) {
      // Prioritize admin role if user has multiple roles
      const hasAdmin = roles.some(r => r.role === 'admin');
      setRole(hasAdmin ? 'admin' : (roles[0].role as AppRole));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, technician_id')
      .eq('id', userId)
      .single();

    if (profile) {
      setFullName(profile.full_name || '');
      setTechnicianId(profile.technician_id || null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchUserMeta(session.user.id), 0);
        } else {
          setRole(null);
          setTechnicianId(null);
          setFullName('');
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserMeta(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setTechnicianId(null);
    setFullName('');
  };

  return (
    <AuthContext.Provider value={{ user, session, role, technicianId, fullName, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
