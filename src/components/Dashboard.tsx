import { useMemo } from 'react';
import { Trophy, Calendar, CalendarDays, Award, AlertTriangle, Clock, CheckCircle2, Pause, Wrench } from 'lucide-react';
import { useDashboardStats, useTechnicians, useTasks } from '@/hooks/useDatabase';

interface DashboardProps {
  onFilterTasks?: (status: string) => void;
}

export const Dashboard = ({ onFilterTasks }: DashboardProps) => {
  const { data: stats = { waiting: 0, in_progress: 0, completed: 0, postponed: 0, late: 0 } } = useDashboardStats();
  const { data: technicians = [] } = useTechnicians();
  const { data: tasks = [] } = useTasks();

  const { topAllTime, topMonth, topWeek, topToday } = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const completedTasks = tasks.filter(t => t.status === 'completed');

    const countByTech = (filtered: typeof completedTasks) => {
      const map: Record<string, number> = {};
      filtered.forEach(t => {
        if (t.technician_id) {
          map[t.technician_id] = (map[t.technician_id] || 0) + 1;
        }
      });
      return map;
    };

    const todayTasks = completedTasks.filter(t => t.completion_time && t.completion_time >= startOfDay);
    const weekTasks = completedTasks.filter(t => t.completion_time && t.completion_time >= startOfWeek);
    const monthTasks = completedTasks.filter(t => t.completion_time && t.completion_time >= startOfMonth);

    const todayCounts = countByTech(todayTasks);
    const weekCounts = countByTech(weekTasks);
    const monthCounts = countByTech(monthTasks);

    const toPerformers = (counts: Record<string, number>) =>
      technicians
        .map(t => ({ id: t.id, name: t.name, count: counts[t.id] || 0, color: t.color }))
        .filter(t => t.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    // All-time uses tasks_count from technicians table as base + completed tasks from DB
    const allTimeCounts: Record<string, number> = {};
    technicians.forEach(t => {
      allTimeCounts[t.id] = t.tasks_count;
    });
    completedTasks.forEach(t => {
      if (t.technician_id) {
        // Only add if tasks_count is 0 (new system), otherwise tasks_count already includes historical
        // We use the higher of tasks_count or actual DB count
      }
    });
    // Count from actual DB
    const dbCounts = countByTech(completedTasks);
    technicians.forEach(t => {
      // Use the max of stored tasks_count and actual DB completed count
      allTimeCounts[t.id] = Math.max(t.tasks_count, dbCounts[t.id] || 0);
    });

    const topAllTime = technicians
      .map(t => ({ id: t.id, name: t.name, count: allTimeCounts[t.id] || 0, color: t.color }))
      .filter(t => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      topAllTime,
      topMonth: toPerformers(monthCounts),
      topWeek: toPerformers(weekCounts),
      topToday: toPerformers(todayCounts),
    };
  }, [technicians, tasks]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PerformerCard
          title="نجم التركيبات"
          subtitle="إجمالي التركيبات (كل الوقت)"
          icon={<Trophy className="h-8 w-8" />}
          performers={topAllTime}
          gradient="gradient-gold"
          iconBg="bg-accent"
        />
        <PerformerCard
          title="نجم الشهر"
          subtitle="أعلى 3 هذا الشهر"
          icon={<Calendar className="h-8 w-8" />}
          performers={topMonth}
          gradient="gradient-info"
          iconBg="bg-info"
        />
        <PerformerCard
          title="نجم الأسبوع"
          subtitle="أعلى 3 هذا الأسبوع"
          icon={<CalendarDays className="h-8 w-8" />}
          performers={topWeek}
          gradient="gradient-info"
          iconBg="bg-primary"
        />
        <PerformerCard
          title="نجم اليوم"
          subtitle="أعلى 3 اليوم"
          icon={<Award className="h-8 w-8" />}
          performers={topToday}
          gradient="gradient-info"
          iconBg="bg-primary"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="قيد الانتظار" value={stats.waiting} gradient="gradient-gold" icon={<Clock className="h-6 w-6" />} onClick={() => onFilterTasks?.('waiting')} />
        <StatCard label="قيد التنفيذ" value={stats.in_progress} gradient="gradient-success" icon={<Wrench className="h-6 w-6" />} onClick={() => onFilterTasks?.('in_progress')} />
        <StatCard label="مكتملة" value={stats.completed} gradient="gradient-info" icon={<CheckCircle2 className="h-6 w-6" />} onClick={() => onFilterTasks?.('completed')} />
        <StatCard label="مؤجلة" value={stats.postponed} gradient="gradient-gold" icon={<Pause className="h-6 w-6" />} onClick={() => onFilterTasks?.('postponed')} />
        <StatCard label="متأخرة" value={stats.late} gradient="gradient-danger" icon={<AlertTriangle className="h-6 w-6" />} onClick={() => onFilterTasks?.('late')} />
      </div>
    </div>
  );
};

interface PerformerCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  performers: { id: string; name: string; count: number; color: string }[];
  gradient: string;
  iconBg: string;
}

const PerformerCard = ({ title, subtitle, icon, performers, gradient, iconBg }: PerformerCardProps) => (
  <div className="rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
    <div className={`${gradient} p-4 text-center`}>
      <div className={`${iconBg} text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2`}>
        {icon}
      </div>
      <h3 className="font-bold text-primary-foreground">{title}</h3>
      <p className="text-xs text-primary-foreground/75">{subtitle}</p>
    </div>
    <div className="bg-card p-3 space-y-2">
      {performers.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-2">لا يوجد بيانات</p>
      ) : (
        performers.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-card-warm rounded-lg px-3 py-2 border border-accent/30">
            <span className="text-sm text-muted-foreground">{p.count} عملية</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{p.name}</span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-primary-foreground" style={{ backgroundColor: p.color }}>
                <Wrench className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const StatCard = ({ label, value, gradient, icon, onClick }: { label: string; value: number; gradient: string; icon: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`${gradient} rounded-xl p-4 text-center text-primary-foreground shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 hover:scale-105 cursor-pointer w-full`}
  >
    <div className="flex items-center justify-center gap-2 mb-1">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <p className="text-3xl font-bold">{value}</p>
  </button>
);
