import { Trophy, Calendar, CalendarDays, Award, AlertTriangle, Clock, CheckCircle2, Pause, Wrench } from 'lucide-react';
import { dashboardStats, technicians } from '@/data/mockData';

export const Dashboard = () => {
  const topAllTime = [...technicians].sort((a, b) => b.tasksCount - a.tasksCount).slice(0, 3);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Top Performers */}
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
          performers={topAllTime.slice(0, 2)}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="قيد الانتظار"
          value={dashboardStats.waiting}
          gradient="gradient-gold"
          icon={<Clock className="h-6 w-6" />}
        />
        <StatCard
          label="قيد التنفيذ"
          value={dashboardStats.inProgress}
          gradient="gradient-success"
          icon={<Wrench className="h-6 w-6" />}
        />
        <StatCard
          label="مكتملة"
          value={dashboardStats.completed}
          gradient="gradient-info"
          icon={<CheckCircle2 className="h-6 w-6" />}
        />
        <StatCard
          label="مؤجلة"
          value={dashboardStats.postponed}
          gradient="gradient-gold"
          icon={<Pause className="h-6 w-6" />}
        />
        <StatCard
          label="متأخرة"
          value={dashboardStats.late}
          gradient="gradient-danger"
          icon={<AlertTriangle className="h-6 w-6" />}
        />
      </div>
    </div>
  );
};

interface PerformerCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  performers: { id: string; name: string; tasksCount: number; color: string }[];
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
        performers.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between bg-card-warm rounded-lg px-3 py-2 border border-accent/30">
            <span className="text-sm text-muted-foreground">{p.tasksCount} عملية</span>
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

interface StatCardProps {
  label: string;
  value: number;
  gradient: string;
  icon: React.ReactNode;
}

const StatCard = ({ label, value, gradient, icon }: StatCardProps) => (
  <div className={`${gradient} rounded-xl p-4 text-center text-primary-foreground shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5`}>
    <div className="flex items-center justify-center gap-2 mb-1">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);
