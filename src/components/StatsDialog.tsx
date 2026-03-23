import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTasks, useTechnicians } from '@/hooks/useDatabase';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Period = 'today' | 'week' | 'month' | 'year';

export const StatsDialog = ({ open, onOpenChange }: Props) => {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);

  const { data: tasks = [] } = useTasks();
  const { data: technicians = [] } = useTechnicians();

  const setPeriod = (p: Period) => {
    setActivePeriod(p);
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    let from = to;
    switch (p) {
      case 'today': from = to; break;
      case 'week': { const d = new Date(now); d.setDate(d.getDate() - 7); from = d.toISOString().slice(0, 10); break; }
      case 'month': { const d = new Date(now); d.setMonth(d.getMonth() - 1); from = d.toISOString().slice(0, 10); break; }
      case 'year': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); from = d.toISOString().slice(0, 10); break; }
    }
    setDateFrom(from);
    setDateTo(to);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const d = t.created_at.slice(0, 10);
      return d >= dateFrom && d <= dateTo;
    });
  }, [tasks, dateFrom, dateTo]);

  const techStats = useMemo(() => {
    return technicians.map(tech => {
      const techTasks = filteredTasks.filter(t => t.required_technician === tech.id || t.technician_id === tech.id);
      const totalDue = techTasks.reduce((s, t) => s + (Number(t.technician_commission) || 0), 0);
      return {
        id: tech.id,
        name: tech.name,
        taskCount: techTasks.length,
        avgRating: 0,
        due: totalDue,
      };
    });
  }, [technicians, filteredTasks]);

  const totalDue = techStats.reduce((s, t) => s + t.due, 0);

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'اليوم' },
    { key: 'week', label: 'الأسبوع' },
    { key: 'month', label: 'الشهر' },
    { key: 'year', label: 'السنة' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center text-primary">
            <BarChart3 className="h-6 w-6" />
            الإحصائيات
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Range */}
          <div className="flex gap-3 items-center">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">من</label>
              <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePeriod(null); }} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">إلى</label>
              <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePeriod(null); }} />
            </div>
          </div>

          {/* Quick Periods */}
          <div className="flex gap-2 justify-center">
            {periods.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activePeriod === p.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent/20'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Total Due */}
          <div className="border border-border rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي المستحق للفنيين (Due)</p>
            <p className="text-3xl font-bold text-primary">{totalDue}</p>
          </div>

          {/* Table */}
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-right font-medium">الفني</th>
                  <th className="p-2 text-center font-medium">عدد العمليات</th>
                  <th className="p-2 text-center font-medium">متوسط التقييم</th>
                  <th className="p-2 text-center font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {techStats.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">لا يوجد بيانات</td></tr>
                ) : (
                  techStats.map(t => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="p-2 font-medium">{t.name}</td>
                      <td className="p-2 text-center">{t.taskCount}</td>
                      <td className="p-2 text-center">{t.avgRating || '-'}</td>
                      <td className="p-2 text-center">{t.due}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
