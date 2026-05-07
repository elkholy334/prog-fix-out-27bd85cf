import { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import { useTechnicians, useUpdateTask, useSetting } from '@/hooks/useDatabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];

const STATUS_LABELS: Record<string, string> = {
  waiting: 'انتظار',
  in_progress: 'تنفيذ',
  completed: 'مكتمل',
  postponed: 'مؤجل',
  late: 'متأخرة',
  unrated: 'بلا تقييم',
};

interface TaskDetailDialogProps {
  task: TaskRow | null;
  onClose: () => void;
}

export const TaskDetailDialog = ({ task, onClose }: TaskDetailDialogProps) => {
  const { data: technicians = [] } = useTechnicians();
  const { data: taskTypesData } = useSetting('task_types');
  const updateTask = useUpdateTask();

  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (task) {
      setForm({
        client_name: task.client_name || '',
        phone: task.phone || '',
        address: task.address || '',
        scheduled_time: task.scheduled_time || '',
        scheduled_date: task.scheduled_date || '',
        type: task.type || 'أخرى',
        problem: task.problem || '',
        repair_date: task.repair_date || '',
        start_time: task.start_time || '',
        required_technician: task.required_technician || '',
        assigned_technicians: task.assigned_technicians || [],
        status: task.status,
        expected_amount: task.expected_amount ?? 0,
        paid_amount: task.paid_amount ?? 0,
        technician_commission: task.technician_commission ?? 0,
        shop_net: task.shop_net ?? 0,
      });
    }
  }, [task]);

  if (!task || !form) return null;

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const taskTypes: any[] = Array.isArray(taskTypesData) ? (taskTypesData as any[]) : [];

  const toggleTech = (id: string, checked: boolean) => {
    setForm((p: any) => ({
      ...p,
      assigned_technicians: checked
        ? [...(p.assigned_technicians || []), id]
        : (p.assigned_technicians || []).filter((x: string) => x !== id),
    }));
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        ...form,
        scheduled_date: form.scheduled_date || null,
        repair_date: form.repair_date || null,
        required_technician: form.required_technician || null,
        expected_amount: Number(form.expected_amount) || 0,
        paid_amount: Number(form.paid_amount) || 0,
        technician_commission: Number(form.technician_commission) || 0,
        shop_net: (Number(form.paid_amount) || 0) - (Number(form.technician_commission) || 0),
      };
      await updateTask.mutateAsync({ id: task.id, ...payload });
      toast.success('تم حفظ التعديلات ✅');
      onClose();
    } catch (e: any) {
      toast.error('فشل حفظ التعديلات: ' + (e?.message || ''));
    }
  };

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="gradient-hero p-4 text-primary-foreground rounded-t-lg">
          <DialogTitle className="text-center text-lg">تفاصيل المهمة #{task.id}</DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <FormField label="اسم العميل">
            <Input value={form.client_name} onChange={(e) => set('client_name', e.target.value)} className="text-right" />
          </FormField>

          <FormField label="الموبايل">
            <div className="flex gap-2">
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="text-right" />
              <Button variant="outline" size="icon" className="shrink-0" onClick={() => window.open(`tel:${form.phone}`)}>
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </FormField>

          <FormField label="العنوان">
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} className="text-right" />
          </FormField>

          <FormField label="ميعاد التنفيذ المطلوب">
            <div className="flex gap-2">
              <Input value={form.scheduled_time} onChange={(e) => set('scheduled_time', e.target.value)} className="text-right flex-1" />
              <Input value={form.scheduled_date} onChange={(e) => set('scheduled_date', e.target.value)} type="date" className="flex-1" />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="النوع">
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {taskTypes.length > 0 ? taskTypes.map((t: any) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  )) : (
                    <>
                      <SelectItem value="تركيب كاميرات">تركيب كاميرات</SelectItem>
                      <SelectItem value="تركيب هوائي">تركيب هوائي</SelectItem>
                      <SelectItem value="تركيب طبق">تركيب طبق</SelectItem>
                      <SelectItem value="صيانة">صيانة</SelectItem>
                      <SelectItem value="أخرى">أخرى</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="تاريخ الإضافة">
              <Input value={new Date(task.created_at).toLocaleString('ar-EG')} readOnly className="text-right" />
            </FormField>
          </div>

          <FormField label="المشكلة">
            <textarea
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-right min-h-[60px] resize-none"
              value={form.problem}
              onChange={(e) => set('problem', e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="تاريخ الإصلاح">
              <Input type="date" value={form.repair_date} onChange={(e) => set('repair_date', e.target.value)} />
            </FormField>
            <FormField label="وقت البدء">
              <Input value={form.start_time} onChange={(e) => set('start_time', e.target.value)} className="text-right" />
            </FormField>
          </div>

          <FormField label="الفني">
            <Select value={form.required_technician || undefined} onValueChange={(v) => set('required_technician', v)}>
              <SelectTrigger><SelectValue placeholder="اختر الفني" /></SelectTrigger>
              <SelectContent>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="تعيين فنيين (مطلوب)">
            <div className="space-y-2 border border-border rounded-lg p-3">
              {technicians.map((tech) => (
                <div key={tech.id} className="flex items-center justify-between">
                  <Checkbox
                    id={`tech-${tech.id}`}
                    checked={form.assigned_technicians?.includes(tech.id) || false}
                    onCheckedChange={(c) => toggleTech(tech.id, c === true)}
                  />
                  <label htmlFor={`tech-${tech.id}`} className="text-sm cursor-pointer">{tech.name}</label>
                </div>
              ))}
            </div>
          </FormField>

          <FormField label="الحالة">
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="متوقع">
              <Input type="number" value={form.expected_amount} onChange={(e) => set('expected_amount', e.target.value)} className="text-right" />
            </FormField>
            <FormField label="مدفوع">
              <Input type="number" value={form.paid_amount} onChange={(e) => set('paid_amount', e.target.value)} className="text-right" />
            </FormField>
            <FormField label="عمولة الفني">
              <Input type="number" value={form.technician_commission} onChange={(e) => set('technician_commission', e.target.value)} className="text-right" />
            </FormField>
          </div>

          <FormField label="صافي المحل">
            <Input
              type="number"
              value={(Number(form.paid_amount) || 0) - (Number(form.technician_commission) || 0)}
              readOnly
              className="text-right bg-muted"
            />
          </FormField>

          <div className="space-y-2 pt-2">
            <Button
              className="w-full gradient-hero text-primary-foreground font-bold py-3"
              onClick={handleSave}
              disabled={updateTask.isPending}
            >
              {updateTask.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-right block">{label}</Label>
    {children}
  </div>
);
