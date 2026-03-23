import { useState } from 'react';
import { Database, Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Period = 'all' | 'today' | 'week' | 'month' | 'year';

export const BackupDialog = ({ open, onOpenChange }: Props) => {
  const [excelPeriod, setExcelPeriod] = useState<Period>('all');
  const [loading, setLoading] = useState(false);

  const getDateFilter = (period: Period) => {
    const now = new Date();
    switch (period) {
      case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'week': { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
      case 'month': { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString(); }
      case 'year': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString(); }
      default: return null;
    }
  };

  const downloadBackup = async () => {
    setLoading(true);
    try {
      const [tasks, technicians, settings] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('technicians').select('*'),
        supabase.from('app_settings').select('*'),
      ]);
      const backup = {
        version: 1,
        date: new Date().toISOString(),
        tasks: tasks.data || [],
        technicians: technicians.data || [],
        settings: settings.data || [],
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('تم تنزيل النسخة الاحتياطية');
    } catch {
      toast.error('فشل في إنشاء النسخة الاحتياطية');
    }
    setLoading(false);
  };

  const restoreBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setLoading(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.version || !data.tasks) throw new Error('Invalid backup');

        // Insert tasks
        for (const task of data.tasks) {
          const { id, ...rest } = task;
          await supabase.from('tasks').upsert({ id, ...rest });
        }
        toast.success('تم استعادة النسخة الاحتياطية بنجاح');
      } catch {
        toast.error('فشل في استعادة النسخة الاحتياطية - تأكد من صحة الملف');
      }
      setLoading(false);
    };
    input.click();
  };

  const exportExcel = async () => {
    setLoading(true);
    try {
      let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
      const dateFilter = getDateFilter(excelPeriod);
      if (dateFilter) query = query.gte('created_at', dateFilter);
      const { data, error } = await query;
      if (error) throw error;

      // Build CSV
      const headers = ['رقم', 'اسم العميل', 'الموبايل', 'العنوان', 'النوع', 'الحالة', 'تاريخ الإنشاء', 'المبلغ المتوقع', 'المبلغ المدفوع'];
      const rows = (data || []).map(t => [
        t.id, t.client_name, t.phone, t.address || '', t.type, t.status,
        new Date(t.created_at).toLocaleDateString('ar-EG'),
        t.expected_amount || 0, t.paid_amount || 0
      ]);
      const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients_${excelPeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('تم تصدير البيانات');
    } catch {
      toast.error('فشل في تصدير البيانات');
    }
    setLoading(false);
  };

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'اليوم' },
    { key: 'week', label: 'الأسبوع' },
    { key: 'month', label: 'الشهر' },
    { key: 'year', label: 'السنة' },
    { key: 'all', label: 'الكل' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center text-primary">
            <Database className="h-6 w-6" />
            النسخ الاحتياطي
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-info/10 text-info text-center text-sm rounded-lg p-3 font-medium">
            يمكنك تنزيل نسخة احتياطية كاملة أو استعادة نسخة.
          </div>

          {/* Full Backup */}
          <div className="border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-center text-foreground">نسخ احتياطي شامل (النظام)</h3>
            <div className="flex gap-2">
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={downloadBackup} disabled={loading}>
                <Download className="h-4 w-4 ml-1" />
                تنزيل نسخة
              </Button>
              <Button variant="outline" className="flex-1" onClick={restoreBackup} disabled={loading}>
                <Upload className="h-4 w-4 ml-1" />
                استعادة
              </Button>
            </div>
          </div>

          {/* Excel Export */}
          <div className="border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-center text-foreground">استخراج بيانات العملاء (Excel)</h3>
            <div className="flex gap-2 justify-center flex-wrap">
              {periods.map(p => (
                <button
                  key={p.key}
                  onClick={() => setExcelPeriod(p.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    excelPeriod === p.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent/20'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">يتم استخراج البيانات من القائمة الحالية على النظام.</p>
            <Button className="w-full bg-success text-success-foreground" onClick={exportExcel} disabled={loading}>
              <Download className="h-4 w-4 ml-1" />
              تصدير Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
