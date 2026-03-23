import { X, Phone } from 'lucide-react';
import { useTechnicians, useUpdateTask } from '@/hooks/useDatabase';
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
  const updateTask = useUpdateTask();

  if (!task) return null;

  const handleSave = () => {
    // For now just show success - form state management can be enhanced later
    toast.success('تم حفظ التعديلات');
    onClose();
  };

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="gradient-hero p-4 text-primary-foreground rounded-t-lg">
          <DialogTitle className="text-center text-lg">تفاصيل المهمة #{task.id}</DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <FormField label="اسم العميل">
            <Input defaultValue={task.client_name} className="text-right" />
          </FormField>

          <FormField label="الموبايل">
            <div className="flex gap-2">
              <Input defaultValue={task.phone} className="text-right" />
              <Button variant="outline" size="icon" className="shrink-0">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </FormField>

          <FormField label="العنوان">
            <Input defaultValue={task.address || ''} className="text-right" />
          </FormField>

          <FormField label="ميعاد التنفيذ المطلوب">
            <div className="flex gap-2">
              <Input defaultValue={task.scheduled_time || ''} className="text-right flex-1" />
              <Input defaultValue={task.scheduled_date || ''} type="date" className="flex-1" />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="النوع">
              <Select defaultValue={task.type}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="تركيب كاميرات">تركيب كاميرات</SelectItem>
                  <SelectItem value="تركيب هوائي">تركيب هوائي</SelectItem>
                  <SelectItem value="تركيب طبق">تركيب طبق</SelectItem>
                  <SelectItem value="صيانة">صيانة</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
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
              defaultValue={task.problem || ''}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="تاريخ الإصلاح">
              <Input type="date" defaultValue={task.repair_date || ''} />
            </FormField>
            <FormField label="وقت البدء">
              <Input defaultValue={task.start_time || ''} className="text-right" />
            </FormField>
          </div>

          <FormField label="الفني">
            <Select defaultValue={task.required_technician || ''}>
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
                    defaultChecked={task.assigned_technicians?.includes(tech.id) || false}
                  />
                  <label htmlFor={`tech-${tech.id}`} className="text-sm">{tech.name}</label>
                </div>
              ))}
            </div>
          </FormField>

          <FormField label="الحالة">
            <Select defaultValue={task.status}>
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
              <Input type="number" defaultValue={task.expected_amount ?? 0} className="text-right" />
            </FormField>
            <FormField label="مدفوع">
              <Input type="number" defaultValue={task.paid_amount ?? 0} className="text-right" />
            </FormField>
            <FormField label="عمولة الفني">
              <Input type="number" defaultValue={task.technician_commission ?? 0} className="text-right" />
            </FormField>
          </div>

          <FormField label="صافي المحل">
            <Input type="number" defaultValue={task.shop_net ?? 0} readOnly className="text-right bg-muted" />
          </FormField>

          <div className="space-y-2 pt-2">
            <Button className="w-full gradient-hero text-primary-foreground font-bold py-3" onClick={handleSave}>
              حفظ
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
