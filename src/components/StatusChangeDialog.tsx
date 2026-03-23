import { useAuth } from '@/hooks/useAuth';
import { useUpdateTask } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];

const ALL_STATUSES = [
  { key: 'waiting', label: 'انتظار', color: 'bg-accent text-accent-foreground' },
  { key: 'in_progress', label: 'تنفيذ', color: 'bg-success text-success-foreground' },
  { key: 'completed', label: 'مكتمل', color: 'bg-primary text-primary-foreground' },
  { key: 'postponed', label: 'مؤجل', color: 'bg-warning text-warning-foreground' },
  { key: 'late', label: 'متأخرة', color: 'bg-destructive text-destructive-foreground' },
  { key: 'unrated', label: 'بلا تقييم', color: 'bg-muted text-muted-foreground' },
];

interface Props {
  task: TaskRow | null;
  onClose: () => void;
}

export const StatusChangeDialog = ({ task, onClose }: Props) => {
  const { role } = useAuth();
  const updateTask = useUpdateTask();

  if (!task) return null;

  const handleChange = (newStatus: string) => {
    updateTask.mutate(
      { id: task.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success('تم تحديث الحالة');
          onClose();
        },
        onError: () => toast.error('فشل في تحديث الحالة'),
      }
    );
  };

  const handleStartTask = () => {
    updateTask.mutate(
      { id: task.id, status: 'in_progress', start_time: new Date().toISOString() },
      {
        onSuccess: () => {
          toast.success('تم بدء المهمة');
          onClose();
        },
        onError: () => toast.error('فشل في بدء المهمة'),
      }
    );
  };

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {role === 'admin' ? 'تغيير حالة المهمة' : 'بدء المهمة'}
          </DialogTitle>
        </DialogHeader>

        {role === 'admin' ? (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {ALL_STATUSES.map((s) => (
              <Button
                key={s.key}
                variant="outline"
                className={`${task.status === s.key ? s.color + ' font-bold ring-2 ring-ring' : ''} justify-center`}
                onClick={() => handleChange(s.key)}
                disabled={updateTask.isPending}
              >
                {s.label}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">
              المهمة: <span className="font-bold text-foreground">{task.client_name}</span>
            </p>
            <Button
              className="w-full bg-success text-success-foreground font-bold"
              onClick={handleStartTask}
              disabled={updateTask.isPending || task.status === 'in_progress'}
            >
              {task.status === 'in_progress' ? 'المهمة قيد التنفيذ بالفعل' : '🚀 بدء المهمة'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
