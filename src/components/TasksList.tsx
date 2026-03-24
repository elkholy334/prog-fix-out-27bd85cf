import { useState, useEffect, useMemo, useCallback } from 'react';
import { Star, Clock, MapPin, Phone, Archive, MessageCircle, Trash2, User, Plus, GripVertical, Timer } from 'lucide-react';
import { useTasks, useTechnicians, useDeleteTask, useUpdateTask } from '@/hooks/useDatabase';
import { useAuth } from '@/hooks/useAuth';
import { TaskDetailDialog } from '@/components/TaskDetailDialog';
import { SendWhatsAppDialog } from '@/components/SendWhatsAppDialog';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { StatusChangeDialog } from '@/components/StatusChangeDialog';
import { TaskCompletionDialog } from '@/components/TaskCompletionDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  { key: 'archived', label: '📦 الأرشيف' },
];

// ---- Elapsed Timer Component ----
const ElapsedTimer = ({ startTime }: { startTime: string }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(startTime).getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className="font-mono text-sm font-bold text-success tabular-nums">{elapsed}</span>
  );
};

// ---- Sortable Task Card ----
interface SortableTaskCardProps {
  task: TaskRow;
  techName: string;
  executingTechName: string;
  daysAgo: number;
  isAdmin: boolean;
  onDelete: (id: number) => void;
  onStatusChange: (task: TaskRow) => void;
  onComplete: (task: TaskRow) => void;
  onDetails: (task: TaskRow) => void;
  onWhatsApp: (task: TaskRow) => void;
  onToggleFavorite: (task: TaskRow) => void;
  onArchive: (task: TaskRow) => void;
}

const SortableTaskCard = ({ task, techName, executingTechName, daysAgo, isAdmin, onDelete, onStatusChange, onComplete, onDetails, onWhatsApp, onToggleFavorite, onArchive }: SortableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const isExecuting = task.status === 'in_progress';

  return (
    <div ref={setNodeRef} style={style} className={`bg-card rounded-xl border shadow-card hover:shadow-card-hover transition-all overflow-hidden ${CARD_BORDER_COLORS[task.status] || ''} ${isExecuting ? 'animate-pulse-glow border-success ring-2 ring-success/40' : ''} ${task.is_favorite ? 'border-accent ring-2 ring-accent/30 shadow-[0_0_15px_hsl(var(--accent)/0.2)]' : !isExecuting ? 'border-accent/20' : ''}`}>
      {/* Drag Handle - Admin only */}
      {isAdmin && (
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center py-1.5 cursor-grab active:cursor-grabbing bg-muted/50 hover:bg-muted transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">#{task.id}</span>
            <span className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
              <Clock className="h-3 w-3" />
              منذ {daysAgo} يوم
            </span>
          </div>
          <button onClick={() => onToggleFavorite(task)} className="hover:scale-125 transition-transform">
            <Star className={`h-5 w-5 ${task.is_favorite ? 'fill-accent text-accent drop-shadow-[0_0_6px_hsl(var(--accent))]' : 'text-muted-foreground hover:text-accent'}`} />
          </button>
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
            <span>مطلوب: {techName}</span>
          </div>
        )}
        {executingTechName && task.status !== 'in_progress' && (
          <div className="flex items-center gap-1.5 text-primary font-bold">
            <User className="h-3.5 w-3.5" />
            <span>نفذ بواسطة: {executingTechName}</span>
          </div>
        )}
        {task.scheduled_time && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>موعد التنفيذ: {task.scheduled_time}</span>
          </div>
        )}
      </div>

      {/* Execution Banner */}
      {isExecuting && (
        <div className="mx-4 mb-2 p-3 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-success animate-pulse" />
              <span className="text-xs font-bold text-success">جاري التنفيذ</span>
            </div>
            {task.start_time && <ElapsedTimer startTime={task.start_time} />}
          </div>
          {executingTechName && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <User className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-bold text-foreground">{executingTechName}</span>
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-2">
        <button
          onClick={() => isExecuting ? onComplete(task) : onStatusChange(task)}
          className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium w-full text-center cursor-pointer hover:opacity-80 transition-opacity ${isExecuting ? 'bg-success text-success-foreground' : STATUS_COLORS[task.status] || 'bg-muted text-muted-foreground'}`}
        >
          {isExecuting
            ? '✅ اتمام المهمة'
            : isAdmin
              ? STATUS_LABELS[task.status] || task.status
              : task.status === 'waiting'
                ? '🚀 بدء المهمة'
                : STATUS_LABELS[task.status] || task.status}
        </button>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-accent/20">
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => onArchive(task)}
              title={task.is_archived ? 'إلغاء الأرشفة' : 'أرشفة'}>
              <Archive className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-success/10" onClick={() => onWhatsApp(task)}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted"
              onClick={() => window.open(`tel:${task.phone}`)}>
              <Phone className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" className="text-xs border-border" onClick={() => onDetails(task)}>
          التفاصيل
        </Button>
      </div>
    </div>
  );
};

// ---- Main List ----
interface TasksListProps {
  initialFilter?: string;
}

export const TasksList = ({ initialFilter = 'all' }: TasksListProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>(initialFilter);
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);
  const [whatsappTask, setWhatsappTask] = useState<TaskRow | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [statusTask, setStatusTask] = useState<TaskRow | null>(null);
  const [completionTask, setCompletionTask] = useState<TaskRow | null>(null);
  const [orderedIds, setOrderedIds] = useState<number[]>([]);

  useEffect(() => { setActiveFilter(initialFilter); }, [initialFilter]);

  const { role, technicianId } = useAuth();
  const isAdmin = role === 'admin';
  const isTechnician = role === 'technician';

  const { data: tasks = [], isLoading } = useTasks();
  const { data: technicians = [] } = useTechnicians();
  const deleteTask = useDeleteTask();

  const visibleTasks = isTechnician
    ? tasks.filter((t) => t.required_technician === technicianId || t.technician_id === technicianId)
    : tasks;

  const baseFiltered = visibleTasks.filter((task) => {
    if (activeFilter === 'archived') return task.is_archived === true;
    // Hide archived from all other filters
    if (task.is_archived) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'assigned') return task.required_technician != null;
    return task.status === activeFilter;
  });

  // Sync orderedIds when tasks change
  useEffect(() => {
    setOrderedIds(baseFiltered.map(t => t.id));
  }, [tasks, activeFilter]);

  const filteredTasks = useMemo(() => {
    const taskMap = new Map(baseFiltered.map(t => [t.id, t]));
    const ordered = orderedIds.filter(id => taskMap.has(id)).map(id => taskMap.get(id)!);
    // Add any new tasks not in orderedIds
    const orderedSet = new Set(orderedIds);
    baseFiltered.forEach(t => { if (!orderedSet.has(t.id)) ordered.push(t); });
    return ordered;
  }, [baseFiltered, orderedIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedIds(prev => {
      const oldIndex = prev.indexOf(Number(active.id));
      const newIndex = prev.indexOf(Number(over.id));
      const newOrder = arrayMove(prev, oldIndex, newIndex);

      // Save sort order to DB
      newOrder.forEach((taskId, index) => {
        updateTask.mutate({ id: taskId, sort_order: index } as any);
      });

      return newOrder;
    });

    toast.success('تم إعادة ترتيب المهام');
  };

  const handleDelete = (id: number) => {
    deleteTask.mutate(id, {
      onSuccess: () => toast.success('تم حذف المهمة'),
      onError: () => toast.error('فشل في حذف المهمة'),
    });
  };

  const updateTask = useUpdateTask();

  const handleToggleFavorite = (task: TaskRow) => {
    updateTask.mutate(
      { id: task.id, is_favorite: !task.is_favorite },
      {
        onSuccess: () => toast.success(task.is_favorite ? 'تم إزالة النجمة' : '⭐ تم تمييز المهمة كمهمة'),
      }
    );
  };

  const getDaysAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4 animate-slide-up">
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredTasks.map(t => t.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => {
                const techName = task.required_technician
                  ? technicians.find((t) => t.id === task.required_technician)?.name || ''
                  : '';
                const executingTechName = task.technician_id
                  ? technicians.find((t) => t.id === task.technician_id)?.name || ''
                  : '';
                const daysAgo = getDaysAgo(task.created_at);

                return (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    techName={techName}
                    executingTechName={executingTechName}
                    daysAgo={daysAgo}
                    isAdmin={isAdmin}
                    onDelete={handleDelete}
                    onStatusChange={setStatusTask}
                    onComplete={(t) => setCompletionTask(t)}
                    onDetails={setSelectedTask}
                    onWhatsApp={setWhatsappTask}
                    onToggleFavorite={handleToggleFavorite}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!isLoading && filteredTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">لا توجد مهام</p>
        </div>
      )}

      <TaskDetailDialog task={selectedTask} onClose={() => setSelectedTask(null)} />
      {isAdmin && <SendWhatsAppDialog task={whatsappTask} onClose={() => setWhatsappTask(null)} />}
      {isAdmin && <AddTaskDialog open={addTaskOpen} onOpenChange={setAddTaskOpen} />}
      <StatusChangeDialog
        task={statusTask}
        onClose={() => setStatusTask(null)}
        onComplete={(t) => setCompletionTask(t)}
      />
      <TaskCompletionDialog task={completionTask} onClose={() => setCompletionTask(null)} />
    </div>
  );
};
