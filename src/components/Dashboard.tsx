import { useMemo } from 'react';
import { Trophy, Calendar, CalendarDays, Award, TriangleAlert as AlertTriangle, Clock, CircleCheck as CheckCircle2, Pause, Wrench } from 'lucide-react';
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

    // All-time = historical tasks_count (baseline before system) + completed tasks in DB (new)
    const dbCounts = countByTech(completedTasks);
    const allTimeCounts: Record<string, number> = {};
    technicians.forEach(t => {
      allTimeCounts[t.id] = t.tasks_count + (dbCounts[t.id] || 0);
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
    <div className="space-y-4 animate-slide-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <PerformerCard
          title="نجم التركيبات"
          subtitle="إجمالي"
          icon={<Trophy className="h-6 w-6" />}
          performers={topAllTime}
          gradient="gradient-gold"
          iconBg="bg-accent"
          compact
        />
        <PerformerCard
          title="نجم الشهر"
          subtitle="شهري"
          icon={<Calendar className="h-6 w-6" />}
          performers={topMonth}
          gradient="gradient-info"
          iconBg="bg-info"
          compact
        />
        <PerformerCard
          title="نجم الأسبوع"
          subtitle="أسبوعي"
          icon={<CalendarDays className="h-6 w-6" />}
          performers={topWeek}
          gradient="gradient-info"
          iconBg="bg-primary"
          compact
        />
        <PerformerCard
          title="نجم اليوم"
          subtitle="يومي"
          icon={<Award className="h-6 w-6" />}
          performers={topToday}
          gradient="gradient-info"
          iconBg="bg-primary"
          compact
        />
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        <StatCard label="انتظار" value={stats.waiting} gradient="gradient-gold" icon={<Clock className="h-5 w-5" />} onClick={() => onFilterTasks?.('waiting')} compact />
        <StatCard label="تنفيذ" value={stats.in_progress} gradient="gradient-success" icon={<Wrench className="h-5 w-5" />} onClick={() => onFilterTasks?.('in_progress')} compact />
        <StatCard label="مكتمل" value={stats.completed} gradient="gradient-info" icon={<CheckCircle2 className="h-5 w-5" />} onClick={() => onFilterTasks?.('completed')} compact />
        <StatCard label="مؤجل" value={stats.postponed} gradient="gradient-gold" icon={<Pause className="h-5 w-5" />} onClick={() => onFilterTasks?.('postponed')} compact />
        <StatCard label="متأخر" value={stats.late} gradient="gradient-danger" icon={<AlertTriangle className="h-5 w-5" />} onClick={() => onFilterTasks?.('late')} compact />
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
  compact?: boolean;
}

const PerformerCard = ({ title, subtitle, icon, performers, gradient, iconBg, compact }: PerformerCardProps) => (
  <div className="rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
    <div className={`${gradient} ${compact ? 'p-3' : 'p-4'} text-center`}>
      <div className={`${iconBg} text-primary-foreground ${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full flex items-center justify-center mx-auto ${compact ? 'mb-1' : 'mb-2'}`}>
        {icon}
      </div>
      <h3 className={`font-bold text-primary-foreground ${compact ? 'text-sm' : ''}`}>{title}</h3>
      <p className={`text-primary-foreground/75 ${compact ? 'text-[10px]' : 'text-xs'}`}>{subtitle}</p>
    </div>
    <div className={`bg-card ${compact ? 'p-2' : 'p-3'} space-y-1`}>
      {performers.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-2">لا يوجد بيانات</p>
      ) : (
        performers.map((p) => (
          <div key={p.id} className={`flex items-center justify-between bg-card-warm rounded-lg ${compact ? 'px-2 py-1' : 'px-3 py-2'} border border-accent/30`}>
            <span className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>{p.count} عملية</span>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{p.name}</span>
              <div className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} rounded-full flex items-center justify-center text-primary-foreground`} style={{ backgroundColor: p.color }}>
                <Wrench className={`${compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'}`} />
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
