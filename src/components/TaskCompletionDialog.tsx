import { useState, useEffect } from 'react';
import { useUpdateTask, useTechnicians, useSetting } from '@/hooks/useDatabase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, DollarSign, User, FileText, Shield } from 'lucide-react';
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

  const [expectedAmount, setExpectedAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [moneyDelivered, setMoneyDelivered] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setExpectedAmount(Number(task.expected_amount) || 0);
      setPaidAmount(Number(task.paid_amount) || 0);
      setMoneyDelivered(false);
      setNotes('');
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
        expected_amount: expectedAmount,
        paid_amount: paidAmount,
        technician_commission: commission,
        shop_net: shopNet,
        technician_notes: notes,
        money_delivered_to_shop: moneyDelivered,
        completion_time: new Date().toISOString(),
        repair_date: new Date().toISOString().split('T')[0],
      } as any);

      // Build WhatsApp message for client
      const clientMsg = `✅ *تم اتمام المهمة بنجاح*

مرحباً أ/ ${task.client_name}
تم اتمام عملية الصيانة بنجاح ✨

📋 *تفاصيل المهمة:*
🔧 نوع العمل: ${task.type}
👨‍🔧 الفني: ${techName}
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

💰 *التفاصيل المالية:*
المبلغ المتوقع: ${expectedAmount} جنيه
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
              <Label className="text-right block text-sm">المبلغ المتوقع</Label>
              <Input
                type="number"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(Number(e.target.value))}
                className="text-right"
              />
            </div>

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
            <Button variant="outline" className="w-full" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
