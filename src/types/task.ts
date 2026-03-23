export type TaskStatus = 'waiting' | 'in_progress' | 'completed' | 'postponed' | 'late' | 'unrated';

export type TaskType = 'تركيب كاميرات' | 'تركيب هوائي' | 'تركيب طبق' | 'صيانة' | 'أخرى';

export interface Technician {
  id: string;
  name: string;
  tasksCount: number;
  color: string;
}

export interface Task {
  id: number;
  clientName: string;
  phone: string;
  address: string;
  type: TaskType;
  problem: string;
  status: TaskStatus;
  createdAt: string;
  scheduledDate: string;
  scheduledTime: string;
  repairDate?: string;
  startTime?: string;
  technicianId?: string;
  assignedTechnicians: string[];
  requiredTechnician?: string;
  expectedAmount: number;
  paidAmount: number;
  technicianCommission: number;
  shopNet: number;
  isFavorite: boolean;
  daysAgo: number;
}

export interface DashboardStats {
  waiting: number;
  inProgress: number;
  completed: number;
  postponed: number;
  late: number;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  waiting: 'انتظار',
  in_progress: 'تنفيذ',
  completed: 'مكتمل',
  postponed: 'مؤجل',
  late: 'متأخرة',
  unrated: 'بلا تقييم',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  waiting: 'bg-accent text-accent-foreground',
  in_progress: 'bg-success text-success-foreground',
  completed: 'bg-primary text-primary-foreground',
  postponed: 'bg-warning text-warning-foreground',
  late: 'bg-destructive text-destructive-foreground',
  unrated: 'bg-muted text-muted-foreground',
};
