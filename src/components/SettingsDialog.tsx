import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="gradient-hero p-4 text-primary-foreground rounded-t-lg">
          <DialogTitle className="text-center text-lg">الإعدادات</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <Tabs defaultValue="general" dir="rtl">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="general">عامة</TabsTrigger>
              <TabsTrigger value="team">فريق العمل</TabsTrigger>
              <TabsTrigger value="tasks">المهام</TabsTrigger>
              <TabsTrigger value="whatsapp">واتساب</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-right block">اسم المحل</Label>
                <Input defaultValue="شركة الفيروز للستالايت" className="text-right" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-right block">حد التأخير (ساعات)</Label>
                <Input type="number" defaultValue={24} className="text-right" />
              </div>
              <Button className="w-full gradient-hero text-primary-foreground font-bold">
                حفظ الكل
              </Button>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <p className="text-center text-muted-foreground text-sm">إدارة فريق العمل والفنيين</p>
              <div className="space-y-2">
                {['النبراوي', 'مصطفى', 'علي شعت', 'هشام', 'محمد عربود'].map((name) => (
                  <div key={name} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                    <Button variant="ghost" size="sm" className="text-destructive text-xs">حذف</Button>
                    <span className="font-medium text-sm">{name}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <p className="text-center text-muted-foreground text-sm">إعدادات المهام وأنواعها</p>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4">
              <h3 className="text-center font-bold text-primary">رسائل الواتساب التلقائية</h3>

              <WhatsAppMessage
                title="عند الحجز"
                message={`أهلا وسهلاً أ / {العميل}\nلقد تم حجز طلب صيانة بتاريخ {الموعد}\nالمشكله الخاصه بيك هي {المشكلة}\nسوف يتم ارسال الفني خلال اقرب وقت باذن الله`}
              />
              <WhatsAppMessage
                title="عند الاكتمال"
                message={`أهلا وسهلاً أ / {العميل}\nلقد تم اتمام عمليه الصيانة بنجاح\nفي تمام الساعه {الوقت}\nعن طريق الفني {الفني}\nو المبلغ المدفوع هو {المبلغ}`}
              />
              <WhatsAppMessage
                title="للمتابعة"
                message={`أهلا وسهلاً أ / {العميل}\nلقد تم اتمام عمليه الصيانه بنجاح\nما رأيك و تقييمك للخدمه المقدمه لك\nبحيث تقييمك من 1 الي 10\n*شكرا لاهتمامك*`}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const WhatsAppMessage = ({ title, message }: { title: string; message: string }) => (
  <div className="border border-border rounded-lg p-3 space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">▲</Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">▼</Button>
      </div>
      <h4 className="font-medium text-sm">{title}</h4>
    </div>
    <textarea
      className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm text-right min-h-[100px] resize-none"
      defaultValue={message}
    />
  </div>
);
