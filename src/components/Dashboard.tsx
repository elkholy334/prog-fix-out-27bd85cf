import { Trophy, Calendar, CalendarDays, Award, AlertTriangle, Clock, CheckCircle2, Pause, Wrench } from 'lucide-react';
import { useDashboardStats, useTechnicians } from '@/hooks/useDatabase';

export const Dashboard = () => {
  const { data: stats = { waiting: 0, in_progress: 0, completed: 0, postponed: 0, late: 0 } } = useDashboardStats();
  const { data: technicians = [] } = useTechnicians();

  const topAllTime = [...technicians].sort((a, b) => b.tasks_count - a.tasks_count).slice(0, 3);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PerformerCard
          title="نجم التركيبات"
          subtitle="إجمالي التركيبات (كل الوقت)"
          icon={<Trophy className="h-8 w-8" />}
          performers={topAllTime.map(t => ({ id: t.id, name: t.name, count: t.tasks_count, color: t.color }))}
          gradient="gradient-gold"
          iconBg="bg-accent"
        />
        <PerformerCard
          title="نجم الشهر"
          subtitle="أعلى 3 هذا الشهر"
          icon={<Calendar className="h-8 w-8" />}
          performers={[]}
          gradient="gradient-info"
          iconBg="bg-info"
        />
        <PerformerCard
          title="نجم الأسبوع"
          subtitle="أعلى 3 هذا الأسبوع"
          icon={<CalendarDays className="h-8 w-8" />}
          performers={[]}
          gradient="gradient-info"
          iconBg="bg-primary"
        />
        <PerformerCard
          title="نجم اليوم"
          subtitle="أعلى 3 اليوم"
          icon={<Award className="h-8 w-8" />}
          performers={[]}
          gradient="gradient-info"
          iconBg="bg-primary"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="قيد الانتظار" value={stats.waiting} gradient="gradient-gold" icon={<Clock className="h-6 w-6" />} />
        <StatCard label="قيد التنفيذ" value={stats.in_progress} gradient="gradient-success" icon={<Wrench className="h-6 w-6" />} />
        <StatCard label="مكتملة" value={stats.completed} gradient="gradient-info" icon={<CheckCircle2 className="h-6 w-6" />} />
        <StatCard label="مؤجلة" value={stats.postponed} gradient="gradient-gold" icon={<Pause className="h-6 w-6" />} />
        <StatCard label="متأخرة" value={stats.late} gradient="gradient-danger" icon={<AlertTriangle className="h-6 w-6" />} />
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

const StatCard = ({ label, value, gradient, icon }: { label: string; value: number; gradient: string; icon: React.ReactNode }) => (
  <div className={`${gradient} rounded-xl p-4 text-center text-primary-foreground shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5`}>
    <div className="flex items-center justify-center gap-2 mb-1">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);
