import { useState, useEffect, useMemo, useCallback } from 'react';
import { Star, Clock, MapPin, Phone, Archive, MessageCircle, Trash2, User, Plus, GripVertical, Timer, CheckCircle2, Wrench, Pause, AlertTriangle, LayoutGrid, List } from 'lucide-react';
import { useTasks, useTechnicians, useDeleteTask, useUpdateTask, useSetting } from '@/hooks/useDatabase';
import { Dashboard } from '@/components/Dashboard';
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

const CARD_BG_COLORS: Record<string, string> = {
  waiting: 'bg-[hsl(42_100%_96%)] border-accent/40',
  in_progress: 'bg-[hsl(145_60%_96%)] border-success/40',
  completed: 'bg-[hsl(215_80%_96%)] border-primary/40',
  postponed: 'bg-[hsl(35_95%_95%)] border-warning/40',
  late: 'bg-[hsl(0_72%_96%)] border-destructive/40',
  unrated: 'bg-muted/30 border-muted-foreground/20',
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
  taskTypeImage?: string;
  viewMode?: 'grid' | 'list';
  onDelete: (id: number) => void;
  onStatusChange: (task: TaskRow) => void;
  onComplete: (task: TaskRow) => void;
  onDetails: (task: TaskRow) => void;
  onWhatsApp: (task: TaskRow) => void;
  onToggleFavorite: (task: TaskRow) => void;
  onArchive: (task: TaskRow) => void;
}

const SortableTaskCard = ({ task, techName, executingTechName, daysAgo, isAdmin, taskTypeImage, viewMode = 'grid', onDelete, onStatusChange, onComplete, onDetails, onWhatsApp, onToggleFavorite, onArchive }: SortableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const isExecuting = task.status === 'in_progress';

  // Compact list-mode row
  if (viewMode === 'list') {
    return (
      <div ref={setNodeRef} style={style} className={`rounded-xl border-2 shadow-card hover:shadow-card-hover transition-all p-3 flex items-center gap-3 ${CARD_BG_COLORS[task.status] || 'bg-card border-accent/20'} ${isExecuting ? 'ring-2 ring-success/40' : ''} ${task.is_favorite ? 'ring-2 ring-accent/30' : ''}`}>
        {isAdmin && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 shrink-0">
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
          </div>
        )}
        <button onClick={() => onToggleFavorite(task)} className="shrink-0 hover:scale-110 transition-transform">
          <Star className={`h-5 w-5 ${task.is_favorite ? 'fill-accent text-accent' : 'text-muted-foreground/40'}`} />
        </button>
        {taskTypeImage && (
          <img src={taskTypeImage} alt={task.type} className="h-12 w-12 rounded-lg object-contain shrink-0" />
        )}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 title={task.client_name} className="font-bold text-base text-foreground flex-1 break-words whitespace-normal leading-tight">{task.client_name}</h3>
            <span className="text-xs font-bold text-muted-foreground shrink-0">#{task.id}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{task.type}</p>
          {task.address && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" />{task.address}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
            {techName && (
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{techName}</span>
            )}
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />منذ {daysAgo} يوم</span>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-1.5 shrink-0 w-24">
          <button
            onClick={() => isExecuting ? onComplete(task) : onStatusChange(task)}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold ${isExecuting ? 'bg-success text-success-foreground' : STATUS_COLORS[task.status] || 'bg-muted text-muted-foreground'}`}
          >
            {isExecuting ? '✅ اتمام' : (isAdmin ? STATUS_LABELS[task.status] || task.status : (task.status === 'waiting' ? '🚀 بدء' : STATUS_LABELS[task.status] || task.status))}
          </button>
          <Button variant="outline" size="sm" className="text-xs rounded-lg h-7" onClick={() => onDetails(task)}>
            التفاصيل
          </Button>
          {isAdmin && (
            <Button variant="outline" size="sm" className="text-xs rounded-lg h-7 text-success border-success/30 hover:bg-success/10" onClick={() => onWhatsApp(task)}>
              <MessageCircle className="h-3.5 w-3.5 ml-1" />
              واتساب
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={`rounded-2xl border-2 shadow-card hover:shadow-card-hover transition-all overflow-hidden ${CARD_BG_COLORS[task.status] || 'bg-card border-accent/20'} ${isExecuting ? 'animate-pulse-glow ring-2 ring-success/40' : ''} ${task.is_favorite ? 'ring-2 ring-accent/30 shadow-[0_0_15px_hsl(var(--accent)/0.2)]' : ''}`}>
      {/* Drag Handle */}
      {isAdmin && (
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center py-1 cursor-grab active:cursor-grabbing hover:bg-black/5 transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        </div>
      )}

      <div className="px-4 pt-2 pb-1">
        {/* Top row: Star | days ago + id */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => onToggleFavorite(task)} className="hover:scale-125 transition-transform">
            <Star className={`h-6 w-6 ${task.is_favorite ? 'fill-accent text-accent drop-shadow-[0_0_8px_hsl(var(--accent))]' : 'text-muted-foreground/40 hover:text-accent'}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-white/60 rounded-full px-2.5 py-1">
              <Clock className="h-3 w-3" />
              منذ {daysAgo} يوم
            </span>
            <span className="text-xs font-bold text-muted-foreground">#{task.id}</span>
          </div>
        </div>

        {/* Center: Logo beside Name + Type */}
        <div className="flex items-center justify-center gap-3 mb-3 flex-row-reverse">
          {taskTypeImage && (
            <img src={taskTypeImage} alt={task.type} className="h-14 w-14 rounded-xl object-contain shrink-0 drop-shadow-md" />
          )}
          <div className="text-center">
            <h3 className="font-bold text-lg text-foreground leading-tight">{task.client_name}</h3>
            <p className="text-sm text-muted-foreground">{task.type}</p>
          </div>
        </div>

        {/* Info rows - aligned right */}
        <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
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
          {task.scheduled_time && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>موعد التنفيذ: {task.scheduled_time}</span>
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
        </div>

        {/* Completed task timing info */}
        {task.status === 'completed' && task.start_time && task.completion_time && (() => {
          const start = new Date(task.start_time!);
          const end = new Date(task.completion_time!);
          const diffMs = end.getTime() - start.getTime();
          const diffH = Math.floor(diffMs / 3600000);
          const diffM = Math.floor((diffMs % 3600000) / 60000);
          const durationText = diffH > 0 ? `${diffH} ساعة و ${diffM} دقيقة` : `${diffM} دقيقة`;
          return (
            <div className="mx-0 mb-3 p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-success">
                <Timer className="h-3.5 w-3.5" />
                <span>بدء التنفيذ: {start.toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })} - {start.toLocaleDateString('ar-EG')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>انتهاء التنفيذ: {end.toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })} - {end.toLocaleDateString('ar-EG')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground font-bold">
                <Clock className="h-3.5 w-3.5" />
                <span>تمت في {durationText}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Execution Banner */}
      {isExecuting && (
        <div className="mx-4 mb-2 p-3 rounded-xl bg-success/10 border border-success/30">
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

      {/* Status Button */}
      <div className="px-4 pb-3">
        <button
          onClick={() => isExecuting ? onComplete(task) : onStatusChange(task)}
          className={`w-full py-2.5 rounded-xl text-sm font-bold text-center cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] ${isExecuting ? 'bg-success text-success-foreground' : STATUS_COLORS[task.status] || 'bg-muted text-muted-foreground'}`}
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

      {/* Action Buttons */}
      <div className="flex items-center justify-between px-3 py-2.5 border-t border-black/5 bg-white/40">
        <div className="flex items-center gap-0.5">
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg" onClick={() => onArchive(task)}
              title={task.is_archived ? 'إلغاء الأرشفة' : 'أرشفة'}>
              <Archive className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-success/70 hover:text-success hover:bg-success/10 rounded-lg" onClick={() => onWhatsApp(task)}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg"
              onClick={() => window.open(`tel:${task.phone}`)}>
              <Phone className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" className="text-xs border-black/10 rounded-lg hover:bg-white/60 bg-white/40" onClick={() => onDetails(task)}>
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('tasksViewMode') as 'grid' | 'list') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('tasksViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => { setActiveFilter(initialFilter); }, [initialFilter]);

  const { role, technicianId } = useAuth();
  const isAdmin = role === 'admin';
  const isTechnician = role === 'technician';

  const { data: tasks = [], isLoading } = useTasks();
  const { data: technicians = [] } = useTechnicians();
  const { data: stats = { waiting: 0, in_progress: 0, completed: 0, postponed: 0, late: 0 } } = useDashboardStats();
  const { data: taskTypesData } = useSetting('task_types');
  const deleteTask = useDeleteTask();

  const taskTypeImageMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(taskTypesData)) {
      (taskTypesData as any[]).forEach((t: any) => { if (t.imageUrl) map[t.name] = t.imageUrl; });
    }
    return map;
  }, [taskTypesData]);

  const visibleTasks = isTechnician
    ? tasks.filter((t) =>
        t.required_technician === technicianId ||
        t.technician_id === technicianId ||
        (Array.isArray(t.assigned_technicians) && t.assigned_technicians.includes(technicianId!))
      )
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

  const handleArchive = (task: TaskRow) => {
    const newVal = !task.is_archived;
    updateTask.mutate(
      { id: task.id, is_archived: newVal },
      {
        onSuccess: () => toast.success(newVal ? '📦 تم أرشفة المهمة' : '📋 تم إلغاء الأرشفة'),
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

      {isAdmin && <Dashboard />}

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1 min-w-0">
          {FILTER_TABS
            .filter(tab => isAdmin || (tab.key !== 'archived'))
            .map((tab) => (
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
        <div className="flex items-center gap-1 bg-card border border-border rounded-full p-1 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            title="عرض المربعات"
            className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-secondary text-secondary-foreground shadow-card' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="عرض القائمة"
            className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-secondary text-secondary-foreground shadow-card' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">جاري التحميل...</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredTasks.map(t => t.id)} strategy={rectSortingStrategy}>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3' : 'flex flex-col gap-2'}>
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
                      taskTypeImage={taskTypeImageMap[task.type] || ''}
                      viewMode={viewMode}
                      onDelete={handleDelete}
                      onStatusChange={setStatusTask}
                      onComplete={(t) => setCompletionTask(t)}
                      onDetails={setSelectedTask}
                      onWhatsApp={setWhatsappTask}
                      onToggleFavorite={handleToggleFavorite}
                      onArchive={handleArchive}
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
