import { useState, useEffect } from 'react';
import { useUpdateTask, useTechnicians, useSetting } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle, DollarSign, User, FileText, Shield, CalendarIcon, Clock, RotateCcw, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import type { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];

interface Props {
  task: TaskRow | null;
  onClose: () => void;
}

export const TaskCompletionDialog = ({ task, onClose }: Props) => {
  const updateTask = useUpdateTask();
  const { data: technicians = [] } = useTechnicians();
  const { data: generalData } = useSetting('general');

  const [paidAmount, setPaidAmount] = useState(0);
  const [moneyDelivered, setMoneyDelivered] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPostpone, setShowPostpone] = useState(false);
  const [postponeDate, setPostponeDate] = useState<Date>();
  const [postponeTime, setPostponeTime] = useState('');

  useEffect(() => {
    if (task) {
      setPaidAmount(0);
      setMoneyDelivered(false);
      setNotes('');
      setShowPostpone(false);
      setPostponeDate(undefined);
      setPostponeTime('');
    }
  }, [task]);

  if (!task) return null;

  const tech = technicians.find(t => t.id === task.technician_id);
  const techName = tech?.name || 'غير محدد';
  const commissionRate = Number((tech as any)?.commission_rate) || 0;
  const commission = (paidAmount * commissionRate) / 100;
  const shopNet = paidAmount - commission;

  const general = generalData as any;
  const shopName = general?.shopName || 'المحل';
  const adminPhone = general?.adminPhone || '';

  const handleComplete = async () => {
    setIsSaving(true);
    const completionTime = new Date().toLocaleString('ar-EG');

    try {
      await updateTask.mutateAsync({
        id: task.id,
        status: 'completed',
        paid_amount: paidAmount,
        technician_commission: commission,
        shop_net: shopNet,
        technician_notes: notes,
        money_delivered_to_shop: moneyDelivered,
        completion_time: new Date().toISOString(),
        repair_date: new Date().toISOString().split('T')[0],
      } as any);

      // Format start/end times
      const startTimeFormatted = task.start_time
        ? new Date(task.start_time).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit' })
        : 'غير محدد';
      const endTimeFormatted = new Date().toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit' });

      // Build WhatsApp message for client
      const clientMsg = `✅ *تم اتمام المهمة بنجاح*

مرحباً أ/ ${task.client_name}
تم اتمام عملية الصيانة بنجاح ✨

📋 *تفاصيل المهمة:*
🔧 نوع العمل: ${task.type}
👨‍🔧 الفني: ${techName}
🕐 وقت بدء العمل: ${startTimeFormatted}
🕑 وقت الانتهاء: ${endTimeFormatted}
💰 المبلغ المدفوع: ${paidAmount} جنيه
${notes ? `📝 ملاحظات: ${notes}` : ''}

🛡️ *ضمان شهر على نفس العطل لو تكرر*

نتمنى أن تكون الخدمة قد نالت رضاكم
⭐ نرجو تقييم الخدمة من 1 إلى 10

شكراً لثقتكم في ${shopName}`;

      // Send to client
      const clientResult = await sendWhatsAppMessage(task.phone, clientMsg);
      if (clientResult.success) {
        toast.success('✅ تم إرسال رسالة للعميل');
      }

      // Build admin message
      if (adminPhone) {
        const adminMsg = `📊 *تقرير اتمام مهمة*

🔖 مهمة #${task.id}
👤 العميل: ${task.client_name}
📱 رقم العميل: ${task.phone}
🔧 النوع: ${task.type}
👨‍🔧 الفني: ${techName}
🕐 وقت بدء العمل: ${startTimeFormatted}
🕑 وقت الانتهاء: ${endTimeFormatted}

💰 *التفاصيل المالية:*
المبلغ المدفوع: ${paidAmount} جنيه
نسبة الفني (${commissionRate}%): ${commission.toFixed(0)} جنيه
صافي المحل: ${shopNet.toFixed(0)} جنيه
${moneyDelivered ? '✅ تم توصيل المبلغ للمحل' : '❌ لم يتم توصيل المبلغ بعد'}
${notes ? `\n📝 ملاحظات الفني: ${notes}` : ''}

🛡️ ضمان شهر على نفس العطل`;

        const adminResult = await sendWhatsAppMessage(adminPhone, adminMsg);
        if (adminResult.success) {
          toast.success('✅ تم إرسال تقرير للإدارة');
        }
      }

      toast.success('🎉 تم اتمام المهمة بنجاح');
      onClose();
    } catch (err) {
      toast.error('فشل في اتمام المهمة');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!task} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0" dir="rtl">
        <DialogHeader className="bg-success p-4 text-success-foreground rounded-t-lg">
          <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5" />
            اتمام المهمة #{task.id}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Client & Tech Info */}
          <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="font-bold">{task.client_name}</span>
              <span className="text-muted-foreground">العميل</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">{techName}</span>
              <span className="text-muted-foreground">الفني</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">{task.type}</span>
              <span className="text-muted-foreground">النوع</span>
            </div>
          </div>

          {/* Financial Section */}
          <div className="space-y-3 border border-border rounded-lg p-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              التفاصيل المالية
            </h3>

            <div className="space-y-1.5">
              <Label className="text-right block text-sm">المبلغ المدفوع من العميل</Label>
              <Input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="text-right"
              />
            </div>

            {commissionRate > 0 && (
              <div className="bg-accent/10 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-bold">{commissionRate}%</span>
                  <span>نسبة الفني</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-success">{commission.toFixed(0)} جنيه</span>
                  <span>عمولة الفني</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1">
                  <span className="font-bold text-primary">{shopNet.toFixed(0)} جنيه</span>
                  <span>صافي المحل</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
              <Checkbox
                id="money-delivered"
                checked={moneyDelivered}
                onCheckedChange={(v) => setMoneyDelivered(!!v)}
              />
              <label htmlFor="money-delivered" className="text-sm font-medium cursor-pointer">
                تم توصيل المبلغ للمحل
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-right block text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              ملاحظات الفني
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب ملاحظاتك هنا..."
              className="text-right min-h-[80px]"
            />
          </div>

          {/* Warranty Note */}
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 flex items-start gap-2">
            <Shield className="h-5 w-5 text-accent mt-0.5" />
            <p className="text-sm text-foreground">
              <span className="font-bold">ضمان شهر</span> على نفس العطل في حال تكراره
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button
              className="w-full bg-success text-success-foreground font-bold py-3"
              onClick={handleComplete}
              disabled={isSaving}
            >
              {isSaving ? 'جاري الحفظ...' : '✅ اتمام المهمة وإرسال الرسائل'}
            </Button>

            {/* Postpone / Back to waiting */}
            {!showPostpone ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10 font-bold"
                  onClick={() => {
                    updateTask.mutate(
                      { id: task.id, status: 'waiting', start_time: null, technician_id: null } as any,
                      {
                        onSuccess: () => {
                          toast.success('تم إرجاع المهمة للانتظار');
                          onClose();
                        },
                      }
                    );
                  }}
                  disabled={isSaving}
                >
                  <RotateCcw className="h-4 w-4 ml-1" />
                  إرجاع للانتظار
                </Button>
                <Button
                  variant="outline"
                  className="border-warning text-warning hover:bg-warning/10 font-bold"
                  onClick={() => setShowPostpone(true)}
                  disabled={isSaving}
                >
                  <PauseCircle className="h-4 w-4 ml-1" />
                  تأجيل
                </Button>
              </div>
            ) : (
              <div className="space-y-3 border-2 border-warning/30 rounded-lg p-4 bg-warning/5">
                <h4 className="font-bold text-sm text-warning flex items-center gap-2">
                  <PauseCircle className="h-4 w-4" />
                  تأجيل المهمة
                </h4>
                <div className="space-y-1.5">
                  <Label className="text-right block text-sm">تاريخ التأجيل</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal",
                          !postponeDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {postponeDate ? format(postponeDate, "yyyy-MM-dd") : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={postponeDate}
                        onSelect={setPostponeDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-right block text-sm">وقت التأجيل</Label>
                  <Input
                    type="time"
                    value={postponeTime}
                    onChange={(e) => setPostponeTime(e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="bg-warning text-warning-foreground font-bold"
                    onClick={() => {
                      updateTask.mutate(
                        {
                          id: task.id,
                          status: 'postponed',
                          scheduled_date: postponeDate ? format(postponeDate, "yyyy-MM-dd") : null,
                          scheduled_time: postponeTime || null,
                        } as any,
                        {
                          onSuccess: () => {
                            toast.success('تم تأجيل المهمة');
                            onClose();
                          },
                        }
                      );
                    }}
                    disabled={!postponeDate}
                  >
                    تأكيد التأجيل
                  </Button>
                  <Button variant="outline" onClick={() => setShowPostpone(false)}>
                    رجوع
                  </Button>
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
