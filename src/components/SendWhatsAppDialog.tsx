import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { sendWhatsAppMessage, buildMessageFromTemplate, getWhatsAppConfig } from '@/lib/whatsapp';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];

interface SendWhatsAppDialogProps {
  task: TaskRow | null;
  onClose: () => void;
}

const MESSAGE_TEMPLATES = [
  {
    id: 'booking',
    label: 'عند الحجز',
    template: `أهلا وسهلاً أ / {العميل}\nلقد تم حجز طلب صيانة بتاريخ {الموعد}\nالمشكله الخاصه بيك هي {المشكلة}\nسوف يتم ارسال الفني خلال اقرب وقت باذن الله`,
  },
  {
    id: 'completed',
    label: 'عند الاكتمال',
    template: `أهلا وسهلاً أ / {العميل}\nلقد تم اتمام عمليه الصيانة بنجاح\nفي تمام الساعه {الوقت}\nعن طريق الفني {الفني}\nو المبلغ المدفوع هو {المبلغ}`,
  },
  {
    id: 'followup',
    label: 'للمتابعة',
    template: `أهلا وسهلاً أ / {العميل}\nلقد تم اتمام عمليه الصيانه بنجاح\nما رأيك و تقييمك للخدمه المقدمه لك\nبحيث تقييمك من 1 الي 10\n*شكرا لاهتمامك*`,
  },
];

export const SendWhatsAppDialog = ({ task, onClose }: SendWhatsAppDialogProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState('booking');
  const [phone, setPhone] = useState(task?.phone || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [initialized, setInitialized] = useState<number | null>(null);

  // Re-init when task changes
  if (task && initialized !== task.id) {
    setPhone(task.phone);
    const tpl = MESSAGE_TEMPLATES[0];
    setMessage(
      buildMessageFromTemplate(tpl.template, {
        'العميل': task.client_name,
        'الموعد': task.scheduled_date || '',
        'المشكلة': task.problem || '',
        'الوقت': task.scheduled_time || '',
        'الفني': '',
        'المبلغ': String(task.paid_amount ?? 0),
      })
    );
    setSelectedTemplate('booking');
    setInitialized(task.id);
  }

  if (!task) return null;

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      setMessage(
        buildMessageFromTemplate(tpl.template, {
          'العميل': task.client_name,
          'الموعد': task.scheduled_date || '',
          'المشكلة': task.problem || '',
          'الوقت': task.scheduled_time || '',
          'الفني': '',
          'المبلغ': String(task.paid_amount ?? 0),
        })
      );
    }
  };

  const handleSend = async () => {
    const config = getWhatsAppConfig();
    if (!config) {
      toast.error('إعدادات الواتساب غير مكتملة. افتح الإعدادات وأدخل API Token و Instance ID.');
      return;
    }
    setSending(true);
    const result = await sendWhatsAppMessage(phone, message, { taskId: task.id, recipientName: task.client_name, messageType: 'general' });
    setSending(false);
    if (result.success) {
      toast.success(`تم إرسال رسالة واتساب إلى ${task.client_name} بنجاح ✅`);
      onClose();
    } else {
      toast.error(result.error || 'فشل في إرسال الرسالة');
    }
  };

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="gradient-success p-4 text-success-foreground rounded-t-lg">
          <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
            <MessageCircle className="h-5 w-5" />
            إرسال رسالة واتساب
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="font-bold text-foreground">{task.client_name}</p>
            <p className="text-sm text-muted-foreground">#{task.id}</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-right block text-sm">رقم الهاتف</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="text-left font-mono" dir="ltr" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-right block text-sm">اختر قالب الرسالة</Label>
            <div className="flex gap-2">
              {MESSAGE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleTemplateChange(tpl.id)}
                  className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedTemplate === tpl.id
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-right block text-sm">نص الرسالة</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-right min-h-[140px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              dir="rtl"
            />
          </div>

          <Button
            className="w-full gradient-success text-success-foreground font-bold py-3"
            onClick={handleSend}
            disabled={sending || !phone || !message}
          >
            {sending ? (
              <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري الإرسال...</>
            ) : (
              <><Send className="h-4 w-4 ml-2" />إرسال الرسالة</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
