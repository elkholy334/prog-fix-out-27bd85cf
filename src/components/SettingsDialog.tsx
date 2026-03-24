import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Save, Link2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSetting, useUpsertSetting, useTechnicians } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

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

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { data: waConfigData } = useSetting('whatsapp_config');
  const { data: generalData } = useSetting('general');
  const { data: technicians = [] } = useTechnicians();
  const upsertSetting = useUpsertSetting();
  const queryClient = useQueryClient();

  const [waConfig, setWaConfig] = useState<WhatsAppConfig>({
    apiToken: '', instanceId: '', defaultPhone: '', endpoints: { ...DEFAULT_ENDPOINTS },
  });
  const [showToken, setShowToken] = useState(false);
  const [shopName, setShopName] = useState('شركة الفيروز للستالايت');
  const [adminPhone, setAdminPhone] = useState('');
  const [delayHours, setDelayHours] = useState(24);
  const [newTechName, setNewTechName] = useState('');

  useEffect(() => {
    if (waConfigData) setWaConfig(waConfigData as unknown as WhatsAppConfig);
  }, [waConfigData]);

  useEffect(() => {
    if (generalData) {
      const g = generalData as any;
      if (g.shopName) setShopName(g.shopName);
      if (g.adminPhone) setAdminPhone(g.adminPhone);
      if (g.delayHours) setDelayHours(g.delayHours);
    }
  }, [generalData]);

  const saveWhatsAppConfig = () => {
    // Also save to localStorage for the send function
    localStorage.setItem('whatsapp_config', JSON.stringify(waConfig));
    upsertSetting.mutate(
      { key: 'whatsapp_config', value: waConfig as any },
      { onSuccess: () => toast.success('تم حفظ إعدادات الواتساب بنجاح') }
    );
  };

  const saveGeneral = () => {
    upsertSetting.mutate(
      { key: 'general', value: { shopName, adminPhone, delayHours } as any },
      { onSuccess: () => toast.success('تم حفظ الإعدادات العامة') }
    );
  };

  const updateCommissionRate = async (techId: string, rate: number) => {
    const { error } = await supabase.from('technicians').update({ commission_rate: rate } as any).eq('id', techId);
    if (error) { toast.error('فشل في تحديث النسبة'); return; }
    toast.success('تم تحديث نسبة العمولة');
    queryClient.invalidateQueries({ queryKey: ['technicians'] });
  };

  const addTechnician = async () => {
    if (!newTechName.trim()) return;
    const { error } = await supabase.from('technicians').insert({ name: newTechName.trim() });
    if (error) { toast.error('فشل في إضافة الفني'); return; }
    toast.success('تم إضافة الفني');
    setNewTechName('');
    queryClient.invalidateQueries({ queryKey: ['technicians'] });
  };

  const deleteTechnician = async (id: string) => {
    const { error } = await supabase.from('technicians').update({ is_active: false }).eq('id', id);
    if (error) { toast.error('فشل في حذف الفني'); return; }
    toast.success('تم حذف الفني');
    queryClient.invalidateQueries({ queryKey: ['technicians'] });
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
                <Input value={shopName} onChange={(e) => setShopName(e.target.value)} className="text-right" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-right block">رقم هاتف المدير (للإشعارات)</Label>
                <Input
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="بكود الدولة بدون + (مثال: 201234567890)"
                  className="text-left font-mono text-sm" dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-right block">حد التأخير (ساعات)</Label>
                <Input type="number" value={delayHours} onChange={(e) => setDelayHours(Number(e.target.value))} className="text-right" />
              </div>
              <Button className="w-full gradient-hero text-primary-foreground font-bold" onClick={saveGeneral}>
                حفظ الكل
              </Button>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <p className="text-center text-muted-foreground text-sm">إدارة فريق العمل والفنيين</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={addTechnician} className="gradient-hero text-primary-foreground">
                  <Plus className="h-4 w-4" />
                </Button>
                <Input
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  placeholder="اسم الفني الجديد"
                  className="text-right"
                  onKeyDown={(e) => e.key === 'Enter' && addTechnician()}
                />
              </div>
              <div className="space-y-2">
                {technicians.map((tech) => (
                  <div key={tech.id} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 gap-2">
                    <Button variant="ghost" size="sm" className="text-destructive text-xs shrink-0" onClick={() => deleteTechnician(tech.id)}>
                      حذف
                    </Button>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="number"
                        defaultValue={(tech as any).commission_rate || 0}
                        className="w-20 text-center text-sm h-8"
                        placeholder="%"
                        onBlur={(e) => updateCommissionRate(tech.id, Number(e.target.value))}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <span className="font-medium text-sm">{tech.name}</span>
                  </div>
                ))}
                {technicians.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">لا يوجد فنيين. أضف فني جديد أعلاه.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <p className="text-center text-muted-foreground text-sm">إعدادات المهام وأنواعها</p>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-6">
              <div className="border-2 border-success/30 rounded-xl p-4 space-y-4 bg-success/5">
                <div className="flex items-center justify-center gap-2 text-success">
                  <Link2 className="h-5 w-5" />
                  <h3 className="font-bold">ربط حساب Whats360</h3>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-right block text-sm font-medium">API Token</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="shrink-0" onClick={() => setShowToken(!showToken)}>
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Input
                      type={showToken ? 'text' : 'password'}
                      value={waConfig.apiToken}
                      onChange={(e) => setWaConfig({ ...waConfig, apiToken: e.target.value })}
                      placeholder="أدخل API Token الخاص بك"
                      className="text-left font-mono text-sm" dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-right block text-sm font-medium">Instance ID</Label>
                  <Input
                    value={waConfig.instanceId}
                    onChange={(e) => setWaConfig({ ...waConfig, instanceId: e.target.value })}
                    placeholder="مثال: device_mn3g1rl8"
                    className="text-left font-mono text-sm" dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-right block text-sm font-medium">رقم الهاتف الافتراضي</Label>
                  <Input
                    value={waConfig.defaultPhone}
                    onChange={(e) => setWaConfig({ ...waConfig, defaultPhone: e.target.value })}
                    placeholder="بكود الدولة بدون + (مثال: 201234567890)"
                    className="text-left font-mono text-sm" dir="ltr"
                  />
                </div>

                <div className="space-y-3 border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <button className="text-xs text-primary hover:underline" onClick={() => setWaConfig({ ...waConfig, endpoints: { ...DEFAULT_ENDPOINTS } })}>
                      إعادة تعيين
                    </button>
                    <h4 className="text-sm font-medium flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5" />
                      روابط الـ API Endpoints
                    </h4>
                  </div>
                  {[
                    { key: 'sendText' as const, label: 'Send Text', emoji: '💬' },
                    { key: 'sendImage' as const, label: 'Send Image', emoji: '🖼️' },
                    { key: 'sendVideo' as const, label: 'Send Video', emoji: '🎬' },
                    { key: 'sendAudio' as const, label: 'Send Audio', emoji: '🎵' },
                    { key: 'sendDoc' as const, label: 'Send Document', emoji: '📄' },
                  ].map(({ key, label, emoji }) => (
                    <div key={key} className="space-y-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">{emoji} {label}</span>
                      <Input
                        value={waConfig.endpoints[key]}
                        onChange={(e) => setWaConfig({ ...waConfig, endpoints: { ...waConfig.endpoints, [key]: e.target.value } })}
                        className="text-left font-mono text-xs h-8" dir="ltr"
                      />
                    </div>
                  ))}
                </div>

                <Button className="w-full gradient-success text-success-foreground font-bold py-3" onClick={saveWhatsAppConfig}>
                  <Save className="h-4 w-4 ml-2" />
                  حفظ الإعدادات
                </Button>
              </div>

              <h3 className="text-center font-bold text-primary">رسائل الواتساب التلقائية</h3>
              <WhatsAppMessage title="عند الحجز" message={`أهلا وسهلاً أ / {العميل}\nلقد تم حجز طلب صيانة بتاريخ {الموعد}\nالمشكله الخاصه بيك هي {المشكلة}\nسوف يتم ارسال الفني خلال اقرب وقت باذن الله`} />
              <WhatsAppMessage title="عند الاكتمال" message={`أهلا وسهلاً أ / {العميل}\nلقد تم اتمام عمليه الصيانة بنجاح\nفي تمام الساعه {الوقت}\nعن طريق الفني {الفني}\nو المبلغ المدفوع هو {المبلغ}`} />
              <WhatsAppMessage title="للمتابعة" message={`أهلا وسهلاً أ / {العميل}\nلقد تم اتمام عمليه الصيانه بنجاح\nما رأيك و تقييمك للخدمه المقدمه لك\nبحيث تقييمك من 1 الي 10\n*شكرا لاهتمامك*`} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const WhatsAppMessage = ({ title, message }: { title: string; message: string }) => (
  <div className="border border-border rounded-lg p-3 space-y-2">
    <h4 className="font-medium text-sm text-right">{title}</h4>
    <textarea
      className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm text-right min-h-[100px] resize-none"
      defaultValue={message}
    />
  </div>
);
