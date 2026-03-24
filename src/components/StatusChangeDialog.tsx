import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateTask, useTechnicians, useSetting } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  onComplete?: (task: TaskRow) => void;
}

export const StatusChangeDialog = ({ task, onClose, onComplete }: Props) => {
  const { role, technicianId } = useAuth();
  const updateTask = useUpdateTask();
  const { data: technicians = [] } = useTechnicians();
  const [showTechSelect, setShowTechSelect] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');

  if (!task) return null;

  const handleChange = (newStatus: string) => {
    if (newStatus === 'completed' && onComplete && task) {
      onComplete(task);
      onClose();
      return;
    }

    if (newStatus === 'in_progress' && role === 'admin') {
      setShowTechSelect(true);
      return;
    }

    updateTask.mutate(
      { id: task.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success('تم تحديث الحالة');
          onClose();
          setShowTechSelect(false);
        },
        onError: () => toast.error('فشل في تحديث الحالة'),
      }
    );
  };

  const handleStartWithTech = () => {
    if (!selectedTechId) return;
    updateTask.mutate(
      {
        id: task.id,
        status: 'in_progress',
        start_time: new Date().toISOString(),
        technician_id: selectedTechId,
      },
      {
        onSuccess: () => {
          const techName = technicians.find(t => t.id === selectedTechId)?.name || '';
          toast.success(`🚀 تم بدء المهمة - الفني: ${techName}`);
          onClose();
          setShowTechSelect(false);
          setSelectedTechId('');
        },
        onError: () => toast.error('فشل في بدء المهمة'),
      }
    );
  };

  const handleTechStartTask = () => {
    updateTask.mutate(
      {
        id: task.id,
        status: 'in_progress',
        start_time: new Date().toISOString(),
        technician_id: technicianId || undefined,
      },
      {
        onSuccess: () => {
          toast.success('🚀 تم بدء المهمة');
          onClose();
        },
        onError: () => toast.error('فشل في بدء المهمة'),
      }
    );
  };

  const handleClose = () => {
    setShowTechSelect(false);
    setSelectedTechId('');
    onClose();
  };

  return (
    <Dialog open={!!task} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {showTechSelect
              ? 'اختر الفني لبدء التنفيذ'
              : role === 'admin'
                ? 'تغيير حالة المهمة'
                : 'بدء المهمة'}
          </DialogTitle>
        </DialogHeader>

        {showTechSelect ? (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              المهمة: <span className="font-bold text-foreground">{task.client_name}</span>
            </p>
            <div className="space-y-2">
              <Label>اختر الفني</Label>
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
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-success text-success-foreground font-bold"
                onClick={handleStartWithTech}
                disabled={!selectedTechId || updateTask.isPending}
              >
                🚀 بدء التنفيذ
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTechSelect(false)}
              >
                رجوع
              </Button>
            </div>
          </div>
        ) : role === 'admin' ? (
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
            {task.status === 'in_progress' ? (
              <Button
                className="w-full bg-success text-success-foreground font-bold"
                onClick={() => { if (onComplete) onComplete(task); onClose(); }}
              >
                ✅ اتمام المهمة
              </Button>
            ) : (
              <Button
                className="w-full bg-success text-success-foreground font-bold"
                onClick={handleTechStartTask}
                disabled={updateTask.isPending}
              >
                🚀 بدء المهمة
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
