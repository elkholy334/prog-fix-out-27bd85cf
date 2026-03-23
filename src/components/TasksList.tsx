import { useState } from 'react';
import { Star, Clock, MapPin, Phone, Eye, MessageCircle, Trash2, User } from 'lucide-react';
import { sampleTasks, technicians } from '@/data/mockData';
import { Task, TaskStatus, STATUS_LABELS, STATUS_COLORS } from '@/types/task';
import { TaskDetailDialog } from '@/components/TaskDetailDialog';
import { SendWhatsAppDialog } from '@/components/SendWhatsAppDialog';
import { Button } from '@/components/ui/button';

type FilterTab = 'all' | 'assigned' | TaskStatus;

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

export const TasksList = () => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filteredTasks = sampleTasks.filter((task) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'assigned') return task.requiredTechnician != null;
    return task.status === activeFilter;
  });

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Filter Tabs */}
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

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} onSelect={setSelectedTask} />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">لا توجد مهام</p>
        </div>
      )}

      <TaskDetailDialog task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
}

const TaskCard = ({ task, onSelect }: TaskCardProps) => {
  const techName = task.requiredTechnician
    ? technicians.find((t) => t.id === task.requiredTechnician)?.name
    : '';

  return (
    <div className="bg-card-warm rounded-xl border border-accent/20 shadow-card hover:shadow-card-hover transition-all overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">#{task.id}</span>
            <span className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
              <Clock className="h-3 w-3" />
              منذ {task.daysAgo} يوم
            </span>
          </div>
          <Star className={`h-5 w-5 ${task.isFavorite ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
        </div>
        <h3 className="font-bold text-lg text-foreground">{task.clientName}</h3>
        <p className="text-sm text-muted-foreground">{task.type}</p>
      </div>

      {/* Details */}
      <div className="px-4 pb-2 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>{task.createdAt}</span>
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
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>موعد التنفيذ: {task.scheduledTime}</span>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 py-2">
        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium w-full text-center ${STATUS_COLORS[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-accent/20">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-success/10">
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
            <Phone className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-border"
          onClick={() => onSelect(task)}
        >
          التفاصيل
        </Button>
      </div>
    </div>
  );
};
