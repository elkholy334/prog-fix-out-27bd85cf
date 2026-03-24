import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCreateTask, useTechnicians, useSetting } from '@/hooks/useDatabase';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTaskDialog = ({ open, onOpenChange }: AddTaskDialogProps) => {
  const { data: technicians = [] } = useTechnicians();
  const { data: generalData } = useSetting('general');
  const { data: taskTypesData } = useSetting('task_types');
  const createTask = useCreateTask();

  const taskTypes = Array.isArray(taskTypesData) 
    ? (taskTypesData as any[]).sort((a: any, b: any) => a.order - b.order)
    : [
        { id: '1', name: 'تركيب كاميرات', imageUrl: '', order: 0 },
        { id: '2', name: 'تركيب هوائي', imageUrl: '', order: 1 },
        { id: '3', name: 'تركيب طبق', imageUrl: '', order: 2 },
        { id: '4', name: 'صيانة', imageUrl: '', order: 3 },
        { id: '5', name: 'أخرى', imageUrl: '', order: 4 },
      ];

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('تركيب كاميرات');
  const [customType, setCustomType] = useState('');
  const [problem, setProblem] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('');
  const [timeAmPm, setTimeAmPm] = useState('ص');
  const [timeHour, setTimeHour] = useState('');
  const [timeMinute, setTimeMinute] = useState('00');
  const [requiredTechnician, setRequiredTechnician] = useState('');
  const [assignedTechnicians, setAssignedTechnicians] = useState<string[]>([]);

  // Set defaults when dialog opens
  useEffect(() => {
    if (open) {
      // Default: today's date, 1 hour from now
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      setScheduledDate(now);

      let hour = oneHourLater.getHours();
      const minute = oneHourLater.getMinutes();
      const amPm = hour >= 12 ? 'م' : 'ص';
      hour = hour % 12 || 12;
      setTimeHour(String(hour).padStart(2, '0'));
      setTimeMinute(String(minute).padStart(2, '0'));
      setTimeAmPm(amPm);

      if (technicians.length > 0) {
        setAssignedTechnicians(technicians.map(t => t.id));
      }
    }
  }, [open, technicians]);

  const resetForm = () => {
    setClientName('');
    setPhone('');
    setAddress('');
    setType('تركيب كاميرات');
    setCustomType('');
    setProblem('');
    setScheduledDate(undefined);
    setTimeHour('');
    setTimeMinute('00');
    setTimeAmPm('ص');
    setRequiredTechnician('');
    setAssignedTechnicians([]);
  };

  const handleSubmit = () => {
    if (!clientName.trim()) {
      toast.error('يرجى إدخال اسم العميل');
      return;
    }
    if (!phone.trim()) {
      toast.error('يرجى إدخال رقم الموبايل');
      return;
    }

    const timeStr = timeHour ? `${timeHour}:${timeMinute} ${timeAmPm}` : '';
    const finalType = type === 'أخرى' && customType.trim() ? customType.trim() : type;

    createTask.mutate(
      {
        client_name: clientName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        type: finalType,
        problem: problem.trim(),
        scheduled_date: scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : null,
        scheduled_time: timeStr,
        required_technician: requiredTechnician || null,
        assigned_technicians: assignedTechnicians,
        status: 'waiting',
      },
      {
        onSuccess: async () => {
          toast.success('تم إضافة المهمة بنجاح ✅');

          const general = generalData as any;
          const shopName = general?.shopName || 'المحل';

          // Send WhatsApp confirmation to the client
          const dateStr = scheduledDate ? format(scheduledDate, 'yyyy/MM/dd') : 'سيتم تحديده';
          const timeDisplayStr = timeHour ? `${timeHour}:${timeMinute} ${timeAmPm}` : 'سيتم تحديده';

          const clientMsg = `✅ *تم حجز مهمتك بنجاح*

مرحباً أ/ ${clientName.trim()}
تم استلام طلبك وجاري التنفيذ ✨

📋 *تفاصيل الحجز:*
🔧 نوع العمل: ${finalType}
📍 العنوان: ${address.trim() || 'غير محدد'}
📅 موعد التنفيذ: ${dateStr}
⏰ الوقت المتوقع: ${timeDisplayStr}
${problem.trim() ? `📝 التفاصيل: ${problem.trim()}` : ''}

سيتواصل معك الفني قبل الموعد لتأكيد الحضور.
شكراً لثقتكم في ${shopName} 🙏`;

          const clientResult = await sendWhatsAppMessage(phone.trim(), clientMsg);
          if (clientResult.success) {
            toast.success('✅ تم إرسال تأكيد الحجز للعميل');
          }
          
          // Send WhatsApp notification to assigned technicians
          const taskDetails = [
            `📋 *مهمة جديدة*`,
            `👤 العميل: ${clientName.trim()}`,
            `📍 العنوان: ${address.trim() || 'غير محدد'}`,
            `🔧 النوع: ${finalType}`,
            `📝 التفاصيل: ${problem.trim() || 'غير محدد'}`,
            scheduledDate ? `📅 الموعد: ${format(scheduledDate, 'yyyy/MM/dd')}` : '',
            timeHour ? `⏰ الوقت: ${timeHour}:${timeMinute} ${timeAmPm}` : '',
          ].filter(Boolean).join('\n');

          const techsToNotify = technicians.filter(
            t => assignedTechnicians.includes(t.id) && (t as any).phone
          );
          
          techsToNotify.forEach(async (tech) => {
            const result = await sendWhatsAppMessage((tech as any).phone, taskDetails);
            if (result.success) {
              toast.success(`تم إشعار ${tech.name} عبر الواتساب ✅`, { duration: 3000 });
            }
          });

          if (techsToNotify.length === 0 && assignedTechnicians.length > 0) {
            toast.info('لم يتم إرسال إشعارات واتساب - لا يوجد أرقام هواتف للفنيين المعينين');
          }

          resetForm();
          onOpenChange(false);
        },
        onError: () => {
          toast.error('فشل في إضافة المهمة');
        },
      }
    );
  };

  const toggleTechnician = (id: string) => {
    setAssignedTechnicians((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (assignedTechnicians.length === technicians.length) {
      setAssignedTechnicians([]);
    } else {
      setAssignedTechnicians(technicians.map((t) => t.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="gradient-hero p-4 text-primary-foreground rounded-t-lg">
          <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
            <Plus className="h-5 w-5" />
            إضافة مهمة جديدة
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Client Name */}
          <FormField label="اسم العميل *">
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="أدخل اسم العميل"
              className="text-right"
            />
          </FormField>

          {/* Phone */}
          <FormField label="الموبايل *">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="text-left font-mono"
              dir="ltr"
            />
          </FormField>

          {/* Address */}
          <FormField label="العنوان">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="أدخل العنوان"
              className="text-right"
            />
          </FormField>

          {/* Type */}
          <FormField label="نوع المهمة">
            <Select value={type} onValueChange={(v) => { setType(v); if (v !== 'أخرى') setCustomType(''); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {taskTypes.map((t: any) => (
                  <SelectItem key={t.id} value={t.name}>
                    <span className="flex items-center gap-2">
                      {t.imageUrl && <img src={t.imageUrl} alt={t.name} className="h-5 w-5 rounded object-contain" />}
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {type === 'أخرى' && (
              <textarea
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="مثال: تركيب شاشة، صيانة رسيفر، تمديد أسلاك..."
                className="w-full rounded-lg border-2 border-accent/40 bg-accent/5 px-4 py-3 text-sm text-right min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent mt-2 placeholder:text-muted-foreground/60"
              />
            )}
          </FormField>

          {/* Problem */}
          <FormField label="المشكلة / التفاصيل">
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="وصف المشكلة أو تفاصيل المهمة"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-right min-h-[70px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </FormField>

          {/* Scheduled Date */}
          <FormField label="ميعاد التنفيذ المطلوب">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-right font-normal',
                    !scheduledDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {scheduledDate
                    ? format(scheduledDate, 'yyyy/MM/dd', { locale: ar })
                    : 'اختر التاريخ'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </FormField>

          {/* Scheduled Time */}
          <FormField label="وقت التنفيذ">
            <div className="flex gap-2 items-center" dir="ltr">
              <Select value={timeAmPm} onValueChange={setTimeAmPm}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ص">ص</SelectItem>
                  <SelectItem value="م">م</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Input
                value={timeMinute}
                onChange={(e) => setTimeMinute(e.target.value)}
                placeholder="00"
                className="w-20 text-center"
                maxLength={2}
              />
              <span className="text-muted-foreground">:</span>
              <Input
                value={timeHour}
                onChange={(e) => setTimeHour(e.target.value)}
                placeholder="00"
                className="w-20 text-center"
                maxLength={2}
              />
            </div>
          </FormField>

          {/* Required Technician */}
          <FormField label="الفني المطلوب">
            <Select value={requiredTechnician} onValueChange={setRequiredTechnician}>
              <SelectTrigger><SelectValue placeholder="اختر الفني" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون تحديد</SelectItem>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {/* Assign Technicians */}
          <FormField label="تعيين فنيين">
            <div className="space-y-2 border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Checkbox
                  checked={assignedTechnicians.length === technicians.length && technicians.length > 0}
                  onCheckedChange={toggleAll}
                />
                <label className="text-sm font-medium cursor-pointer" onClick={toggleAll}>
                  اختيار الجميع
                </label>
              </div>
              {technicians.map((tech) => (
                <div key={tech.id} className="flex items-center justify-between">
                  <Checkbox
                    checked={assignedTechnicians.includes(tech.id)}
                    onCheckedChange={() => toggleTechnician(tech.id)}
                  />
                  <label className="text-sm cursor-pointer" onClick={() => toggleTechnician(tech.id)}>
                    {tech.name}
                  </label>
                </div>
              ))}
            </div>
          </FormField>

          {/* Submit */}
          <div className="space-y-2 pt-2">
            <Button
              className="w-full gradient-hero text-primary-foreground font-bold py-3"
              onClick={handleSubmit}
              disabled={createTask.isPending}
            >
              {createTask.isPending ? (
                <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري الإضافة...</>
              ) : (
                <><Plus className="h-4 w-4 ml-2" />إضافة المهمة</>
              )}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              إلغاء
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
