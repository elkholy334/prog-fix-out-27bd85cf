import { useState, useEffect } from 'react';
import { Star, Clock, MapPin, Phone, Eye, MessageCircle, Trash2, User, Plus } from 'lucide-react';
import { useTasks, useTechnicians, useDeleteTask } from '@/hooks/useDatabase';
import { useAuth } from '@/hooks/useAuth';
import { TaskDetailDialog } from '@/components/TaskDetailDialog';
import { SendWhatsAppDialog } from '@/components/SendWhatsAppDialog';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { StatusChangeDialog } from '@/components/StatusChangeDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type FilterTab = 'all' | 'assigned' | string;

const STATUS_LABELS: Record<string, string> = {
  waiting: 'انتظار',
  in_progress: 'تنفيذ',
  completed: 'مكتمل',
  postponed: 'مؤجل',
  late: 'متأخرة',
  unrated: 'بلا تقييم',
};

const STATUS_COLORS: Record<string, string> = {
  waiting: 'bg-accent text-accent-foreground',
  in_progress: 'bg-success text-success-foreground',
  completed: 'bg-primary text-primary-foreground',
  postponed: 'bg-warning text-warning-foreground',
  late: 'bg-destructive text-destructive-foreground',
  unrated: 'bg-muted text-muted-foreground',
};

const CARD_BORDER_COLORS: Record<string, string> = {
  waiting: 'border-l-4 border-l-accent',
  in_progress: 'border-l-4 border-l-success',
  completed: 'border-l-4 border-l-primary',
  postponed: 'border-l-4 border-l-warning',
  late: 'border-l-4 border-l-destructive',
  unrated: 'border-l-4 border-l-muted-foreground',
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'assigned', label: 'مطلوب مني' },
  { key: 'waiting', label: 'انتظار' },
  { key: 'in_progress', label: 'تنفيذ' },
  { key: 'completed', label: 'مكتمل' },
  { key: 'postponed', label: 'مؤجل' },
  { key: 'late', label: 'متأخرة' },
  { key: 'unrated', label: 'بلا تقييم' },
];

interface TasksListProps {
  initialFilter?: string;
}

export const TasksList = ({ initialFilter = 'all' }: TasksListProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>(initialFilter);
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);
  const [whatsappTask, setWhatsappTask] = useState<TaskRow | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [statusTask, setStatusTask] = useState<TaskRow | null>(null);

  useEffect(() => { setActiveFilter(initialFilter); }, [initialFilter]);
  const isAdmin = role === 'admin';
  const isTechnician = role === 'technician';

  const { data: tasks = [], isLoading } = useTasks();
  const { data: technicians = [] } = useTechnicians();
  const deleteTask = useDeleteTask();

  // Technicians only see tasks assigned to them
  const visibleTasks = isTechnician
    ? tasks.filter((t) => t.required_technician === technicianId || t.technician_id === technicianId)
    : tasks;

  const filteredTasks = visibleTasks.filter((task) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'assigned') return task.required_technician != null;
    return task.status === activeFilter;
  });

  const handleDelete = (id: number) => {
    deleteTask.mutate(id, {
      onSuccess: () => toast.success('تم حذف المهمة'),
      onError: () => toast.error('فشل في حذف المهمة'),
    });
  };

  const getDaysAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 4) return '****';
    return '****' + phone.slice(-2);
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Add Task Button - Admin only */}
      {isAdmin && (
        <div className="flex items-center justify-between">
          <Button
            className="gradient-hero text-primary-foreground font-bold px-6 py-2.5 shadow-card hover:shadow-card-hover"
            onClick={() => setAddTaskOpen(true)}
          >
            <Plus className="h-5 w-5 ml-2" />
            إضافة مهمة جديدة
          </Button>
          <span className="text-sm text-muted-foreground">
            {filteredTasks.length} مهمة
          </span>
        </div>
      )}

      {!isAdmin && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-bold">
            المهام المطلوبة منك ({filteredTasks.length})
          </span>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === tab.key
                ? 'bg-secondary text-secondary-foreground shadow-card'
                : 'bg-card text-muted-foreground hover:bg-muted border border-border'
            }`}
          >
            {tab.key === 'assigned' && <User className="inline h-3.5 w-3.5 ml-1" />}
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">جاري التحميل...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const techName = task.required_technician
              ? technicians.find((t) => t.id === task.required_technician)?.name
              : '';
            const daysAgo = getDaysAgo(task.created_at);

            return (
              <div key={task.id} className={`bg-card rounded-xl border border-accent/20 shadow-card hover:shadow-card-hover transition-all overflow-hidden ${CARD_BORDER_COLORS[task.status] || ''}`}>
                <div className="p-4 pb-2">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">#{task.id}</span>
                      <span className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
                        <Clock className="h-3 w-3" />
                        منذ {daysAgo} يوم
                      </span>
                    </div>
                    <Star className={`h-5 w-5 ${task.is_favorite ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">{task.client_name}</h3>
                  <p className="text-sm text-muted-foreground">{task.type}</p>
                </div>

                <div className="px-4 pb-2 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(task.created_at).toLocaleString('ar-EG')}</span>
                  </div>
                  {task.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{task.address}</span>
                    </div>
                  )}
                  {techName && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>{techName}</span>
                    </div>
                  )}
                  {task.scheduled_time && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>موعد التنفيذ: {task.scheduled_time}</span>
                    </div>
                  )}
                </div>

                {/* Status badge - clickable for admin to change, clickable for tech to start */}
                <div className="px-4 py-2">
                  <button
                    onClick={() => setStatusTask(task)}
                    className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium w-full text-center cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[task.status] || 'bg-muted text-muted-foreground'}`}
                  >
                    {isAdmin
                      ? STATUS_LABELS[task.status] || task.status
                      : task.status === 'waiting'
                        ? '🚀 بدء المهمة'
                        : STATUS_LABELS[task.status] || task.status}
                  </button>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-accent/20">
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {/* WhatsApp - admin only, phone hidden from technician */}
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-success/10" onClick={() => setWhatsappTask(task)}>
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {/* Phone - admin only */}
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted"
                        onClick={() => window.open(`tel:${task.phone}`)}>
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="text-xs border-border" onClick={() => setSelectedTask(task)}>
                    التفاصيل
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filteredTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">لا توجد مهام</p>
        </div>
      )}

      <TaskDetailDialog task={selectedTask} onClose={() => setSelectedTask(null)} />
      {isAdmin && <SendWhatsAppDialog task={whatsappTask} onClose={() => setWhatsappTask(null)} />}
      {isAdmin && <AddTaskDialog open={addTaskOpen} onOpenChange={setAddTaskOpen} />}
      <StatusChangeDialog task={statusTask} onClose={() => setStatusTask(null)} />
    </div>
  );
};
