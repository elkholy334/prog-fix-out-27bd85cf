import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Save, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppConfig {
  apiToken: string;
  instanceId: string;
  defaultPhone: string;
  endpoints: {
    sendText: string;
    sendImage: string;
    sendVideo: string;
    sendAudio: string;
    sendDoc: string;
  };
}

const DEFAULT_ENDPOINTS = {
  sendText: 'https://pro.whats360.live/api/v1/send-text',
  sendImage: 'https://pro.whats360.live/api/v1/send-image',
  sendVideo: 'https://pro.whats360.live/api/v1/send-video',
  sendAudio: 'https://pro.whats360.live/api/v1/send-audio',
  sendDoc: 'https://pro.whats360.live/api/v1/send-doc',
};

const loadWhatsAppConfig = (): WhatsAppConfig => {
  try {
    const saved = localStorage.getItem('whatsapp_config');
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    apiToken: '',
    instanceId: '',
    defaultPhone: '',
    endpoints: { ...DEFAULT_ENDPOINTS },
  };
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [waConfig, setWaConfig] = useState<WhatsAppConfig>(loadWhatsAppConfig);
  const [showToken, setShowToken] = useState(false);

  const saveWhatsAppConfig = () => {
    localStorage.setItem('whatsapp_config', JSON.stringify(waConfig));
    toast.success('تم حفظ إعدادات الواتساب بنجاح');
  };

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

            <TabsContent value="whatsapp" className="space-y-6">
              {/* API Configuration Section */}
              <div className="border-2 border-success/30 rounded-xl p-4 space-y-4 bg-success/5">
                <div className="flex items-center justify-center gap-2 text-success">
                  <Link2 className="h-5 w-5" />
                  <h3 className="font-bold">ربط حساب Whats360</h3>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-right block text-sm font-medium">API Token</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Input
                      type={showToken ? 'text' : 'password'}
                      value={waConfig.apiToken}
                      onChange={(e) => setWaConfig({ ...waConfig, apiToken: e.target.value })}
                      placeholder="أدخل API Token الخاص بك"
                      className="text-left font-mono text-sm"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-right block text-sm font-medium">Instance ID</Label>
                  <Input
                    value={waConfig.instanceId}
                    onChange={(e) => setWaConfig({ ...waConfig, instanceId: e.target.value })}
                    placeholder="مثال: device_mn3g1rl8"
                    className="text-left font-mono text-sm"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-right block text-sm font-medium">رقم الهاتف الافتراضي</Label>
                  <Input
                    value={waConfig.defaultPhone}
                    onChange={(e) => setWaConfig({ ...waConfig, defaultPhone: e.target.value })}
                    placeholder="بكود الدولة بدون + (مثال: 201234567890)"
                    className="text-left font-mono text-sm"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground text-right">بكود الدولة بدون + (مثال: 201234567890)</p>
                </div>

                {/* API Endpoints */}
                <div className="space-y-3 border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => setWaConfig({ ...waConfig, endpoints: { ...DEFAULT_ENDPOINTS } })}
                    >
                      إعادة تعيين
                    </button>
                    <h4 className="text-sm font-medium flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5" />
                      روابط الـ API Endpoints
                    </h4>
                  </div>

                  <EndpointField
                    label="Send Text"
                    emoji="💬"
                    value={waConfig.endpoints.sendText}
                    onChange={(v) => setWaConfig({ ...waConfig, endpoints: { ...waConfig.endpoints, sendText: v } })}
                  />
                  <EndpointField
                    label="Send Image"
                    emoji="🖼️"
                    value={waConfig.endpoints.sendImage}
                    onChange={(v) => setWaConfig({ ...waConfig, endpoints: { ...waConfig.endpoints, sendImage: v } })}
                  />
                  <EndpointField
                    label="Send Video"
                    emoji="🎬"
                    value={waConfig.endpoints.sendVideo}
                    onChange={(v) => setWaConfig({ ...waConfig, endpoints: { ...waConfig.endpoints, sendVideo: v } })}
                  />
                  <EndpointField
                    label="Send Audio"
                    emoji="🎵"
                    value={waConfig.endpoints.sendAudio}
                    onChange={(v) => setWaConfig({ ...waConfig, endpoints: { ...waConfig.endpoints, sendAudio: v } })}
                  />
                  <EndpointField
                    label="Send Document"
                    emoji="📄"
                    value={waConfig.endpoints.sendDoc}
                    onChange={(v) => setWaConfig({ ...waConfig, endpoints: { ...waConfig.endpoints, sendDoc: v } })}
                  />

                  <p className="text-xs text-muted-foreground text-right">غيّر الروابط لو تستخدم مزود خدمة تاني</p>
                </div>

                <Button
                  className="w-full gradient-success text-success-foreground font-bold py-3"
                  onClick={saveWhatsAppConfig}
                >
                  <Save className="h-4 w-4 ml-2" />
                  حفظ الإعدادات
                </Button>
              </div>

              {/* WhatsApp Templates */}
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

const EndpointField = ({ label, emoji, value, onChange }: { label: string; emoji: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
      {emoji} {label}
    </span>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-left font-mono text-xs h-8"
      dir="ltr"
    />
  </div>
);

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
