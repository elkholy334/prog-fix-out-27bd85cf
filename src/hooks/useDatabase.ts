import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type TechnicianRow = Database['public']['Tables']['technicians']['Row'];

// ---- TECHNICIANS ----
export const useTechnicians = () =>
  useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as TechnicianRow[];
    },
  });

// ---- TASKS ----
export const useTasks = (statusFilter?: string) => 
  useQuery({
    queryKey: ['tasks', statusFilter],
    queryFn: async () => {
      let query = supabase.from('tasks').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all' && statusFilter !== 'assigned') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as TaskRow[];
    },
  });

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: TaskInsert) => {
      const { data, error } = await supabase.from('tasks').insert(task).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TaskUpdate & { id: number }) => {
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

// ---- SETTINGS ----
export const useSetting = (key: string) =>
  useQuery({
    queryKey: ['settings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      return data?.value ?? null;
    },
  });

export const useUpsertSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: (_, { key }) => qc.invalidateQueries({ queryKey: ['settings', key] }),
  });
};

// ---- DASHBOARD STATS ----
export const useDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('status');
      if (error) throw error;
      const counts = { waiting: 0, in_progress: 0, completed: 0, postponed: 0, late: 0 };
      data?.forEach((t) => {
        if (t.status in counts) counts[t.status as keyof typeof counts]++;
      });
      return counts;
    },
  });
