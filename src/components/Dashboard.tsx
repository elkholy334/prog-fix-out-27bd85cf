import { useMemo } from 'react';
import { Trophy, Calendar, CalendarDays, Award, Wrench } from 'lucide-react';
import { useTechnicians, useTasks } from '@/hooks/useDatabase';

export const Dashboard = () => {
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 animate-slide-up">
      <PerformerCard title="نجم التركيبات" subtitle="إجمالي" icon={<Trophy className="h-6 w-6" />} performers={topAllTime} gradient="gradient-gold" iconBg="bg-accent" />
      <PerformerCard title="نجم الشهر" subtitle="شهري" icon={<Calendar className="h-6 w-6" />} performers={topMonth} gradient="gradient-info" iconBg="bg-info" />
      <PerformerCard title="نجم الأسبوع" subtitle="أسبوعي" icon={<CalendarDays className="h-6 w-6" />} performers={topWeek} gradient="gradient-info" iconBg="bg-primary" />
      <PerformerCard title="نجم اليوم" subtitle="يومي" icon={<Award className="h-6 w-6" />} performers={topToday} gradient="gradient-info" iconBg="bg-primary" />
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
  <div className="rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
    <div className={`${gradient} p-2 text-center`}>
      <div className={`${iconBg} text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-0.5`}>
        <div className="scale-75">{icon}</div>
      </div>
      <h3 className="font-bold text-primary-foreground leading-tight text-[11px]">{title}</h3>
      <p className="text-primary-foreground/75 text-[9px]">{subtitle}</p>
    </div>
    <div className="bg-card p-1.5 space-y-0.5">
      {performers.length === 0 ? (
        <p className="text-center text-muted-foreground text-[9px] py-1">لا يوجد</p>
      ) : (
        performers.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-card-warm rounded px-1.5 py-0.5 border border-accent/30 gap-1">
            <span className="text-muted-foreground text-[8px]">{p.count}</span>
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-medium text-[8px] truncate">{p.name}</span>
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-primary-foreground shrink-0" style={{ backgroundColor: p.color }}>
                <Wrench className="h-2 w-2" />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);
