import { X, Phone } from 'lucide-react';
import { Task, STATUS_LABELS, TaskStatus } from '@/types/task';
import { technicians } from '@/data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TaskDetailDialogProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskDetailDialog = ({ task, onClose }: TaskDetailDialogProps) => {
  if (!task) return null;

  const assignedTechs = technicians.filter((t) => task.assignedTechnicians.includes(t.id));

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="gradient-hero p-4 text-primary-foreground rounded-t-lg">
          <DialogTitle className="text-center text-lg">تفاصيل المهمة #{task.id}</DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Client Info */}
          <FormField label="اسم العميل">
            <Input value={task.clientName} readOnly className="text-right" />
          </FormField>

          <FormField label="الموبايل">
            <div className="flex gap-2">
              <Input value={task.phone} readOnly className="text-right" />
              <Button variant="outline" size="icon" className="shrink-0">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </FormField>

          <FormField label="العنوان">
            <Input value={task.address} readOnly className="text-right" />
          </FormField>

          <FormField label="ميعاد التنفيذ المطلوب">
            <div className="flex gap-2">
              <Input value={task.scheduledTime} readOnly className="text-right flex-1" />
              <Input value={task.scheduledDate} readOnly type="date" className="flex-1" />
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
              <Input value={task.createdAt} readOnly className="text-right" />
            </FormField>
          </div>

          <FormField label="المشكلة">
            <textarea
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-right min-h-[60px] resize-none"
              defaultValue={task.problem}
              readOnly
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="تاريخ الإصلاح">
              <Input type="date" defaultValue={task.repairDate} className="text-right" />
            </FormField>
            <FormField label="وقت البدء">
              <Input defaultValue={task.startTime || ''} className="text-right" />
            </FormField>
          </div>

          {/* Technician */}
          <FormField label="الفني">
            <Select defaultValue={task.requiredTechnician || ''}>
              <SelectTrigger><SelectValue placeholder="اختر الفني" /></SelectTrigger>
              <SelectContent>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {/* Assigned Technicians */}
          <FormField label="تعيين فنيين (مطلوب)">
            <div className="space-y-2 border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Checkbox id="select-all" />
                <label htmlFor="select-all" className="text-sm font-medium">اختيار الجميع</label>
              </div>
              {technicians.map((tech) => (
                <div key={tech.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`tech-${tech.id}`}
                      defaultChecked={task.assignedTechnicians.includes(tech.id)}
                    />
                    <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">
                      {tech.tasksCount > 30 ? '4' : '3'}
                    </span>
                  </div>
                  <label htmlFor={`tech-${tech.id}`} className="text-sm">{tech.name}</label>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                ℹ الفني المحدد هنا سيظهر له على المهمة كلمة <span className="font-bold">مطلوب</span>.
              </p>
            </div>
          </FormField>

          {/* Status */}
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

          {/* Financials */}
          <div className="grid grid-cols-3 gap-3">
            <FormField label="متوقع">
              <Input type="number" defaultValue={task.expectedAmount} className="text-right" />
            </FormField>
            <FormField label="مدفوع">
              <Input type="number" defaultValue={task.paidAmount} className="text-right" />
            </FormField>
            <FormField label="عمولة الفني">
              <Input type="number" defaultValue={task.technicianCommission} className="text-right" />
            </FormField>
          </div>

          <FormField label="صافي المحل">
            <Input type="number" defaultValue={task.shopNet} readOnly className="text-right bg-muted" />
          </FormField>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button className="w-full gradient-hero text-primary-foreground font-bold py-3">
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
