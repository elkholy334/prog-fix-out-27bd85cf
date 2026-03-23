import { useState, useMemo } from 'react';
import { Receipt, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks, useTechnicians } from '@/hooks/useDatabase';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Period = 'today' | 'week' | 'month' | 'year';

export const AccountStatementDialog = ({ open, onOpenChange }: Props) => {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [selectedTech, setSelectedTech] = useState<string>('all');
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
      if (d < dateFrom || d > dateTo) return false;
      if (selectedTech !== 'all' && t.required_technician !== selectedTech && t.technician_id !== selectedTech) return false;
      return true;
    });
  }, [tasks, dateFrom, dateTo, selectedTech]);

  const totalCommission = filteredTasks.reduce((s, t) => s + (Number(t.technician_commission) || 0), 0);
  const totalPaid = filteredTasks.reduce((s, t) => s + (Number(t.paid_amount) || 0), 0);
  const totalNet = totalPaid - totalCommission;

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
            <Receipt className="h-6 w-6" />
            كشف الحساب
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

          {/* Technician Select */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">الفني</label>
            <Select value={selectedTech} onValueChange={setSelectedTech}>
              <SelectTrigger>
                <SelectValue placeholder="-- كل الفنيين --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- كل الفنيين --</SelectItem>
                {technicians.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Table */}
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="p-2 text-right font-medium">التاريخ</th>
                  <th className="p-2 text-center font-medium">العميل</th>
                  <th className="p-2 text-center font-medium">المدفوع</th>
                  <th className="p-2 text-center font-medium">العمولة</th>
                  <th className="p-2 text-center font-medium">استلم</th>
                  <th className="p-2 text-center font-medium">صافي</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">لا يوجد بيانات</td></tr>
                ) : (
                  filteredTasks.map(t => {
                    const commission = Number(t.technician_commission) || 0;
                    const paid = Number(t.paid_amount) || 0;
                    return (
                      <tr key={t.id} className="border-t border-border">
                        <td className="p-2 text-xs">{new Date(t.created_at).toLocaleDateString('ar-EG')}</td>
                        <td className="p-2 text-center text-xs">{t.client_name}</td>
                        <td className="p-2 text-center">{paid}</td>
                        <td className="p-2 text-center">{commission}</td>
                        <td className="p-2 text-center">{paid}</td>
                        <td className="p-2 text-center">{paid - commission}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex gap-4 justify-center text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">إجمالي العمولات</p>
              <p className="font-bold text-lg">{totalCommission}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">الرصيد النهائي</p>
              <p className="font-bold text-lg">{totalNet}</p>
            </div>
          </div>

          {/* WhatsApp Send */}
          <Button className="w-full bg-success text-success-foreground font-bold text-base py-5">
            <MessageCircle className="h-5 w-5 ml-2" />
            إرسال على واتساب
          </Button>

          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
