import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Save, Link2, Plus, Loader2, Trash2, GripVertical, Pencil, Check, X, ImageIcon, Send, Wifi, WifiOff, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useSetting, useUpsertSetting, useTechnicians } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { testWhatsAppConnection, sendWhatsAppMessage, type WhatsAppAccount } from '@/lib/whatsapp';

interface TaskType {
  id: string;
  name: string;
  imageUrl: string;
  order: number;
}

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
  accounts?: WhatsAppAccount[];
  defaultAccountId?: string;
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
  const { data: taskTypesData } = useSetting('task_types');
  const [allTechnicians, setAllTechnicians] = useState<any[]>([]);
  const { data: technicians = [] } = useTechnicians();
  const upsertSetting = useUpsertSetting();
  const queryClient = useQueryClient();

  const DEFAULT_TASK_TYPES: TaskType[] = [
    { id: '1', name: 'تركيب كاميرات', imageUrl: '', order: 0 },
    { id: '2', name: 'تركيب هوائي', imageUrl: '', order: 1 },
    { id: '3', name: 'تركيب طبق', imageUrl: '', order: 2 },
    { id: '4', name: 'صيانة', imageUrl: '', order: 3 },
    { id: '5', name: 'أخرى', imageUrl: '', order: 4 },
  ];

  const [waConfig, setWaConfig] = useState<WhatsAppConfig>({
    apiToken: '', instanceId: '', defaultPhone: '', endpoints: { ...DEFAULT_ENDPOINTS },
    accounts: [], defaultAccountId: undefined,
  });
  const [showToken, setShowToken] = useState(false);
  const [shopName, setShopName] = useState('شركة الفيروز للستالايت');
  const [adminPhone, setAdminPhone] = useState('');
  const [delayHours, setDelayHours] = useState(24);
  const [newTechName, setNewTechName] = useState('');
  const [taskTypes, setTaskTypes] = useState<TaskType[]>(DEFAULT_TASK_TYPES);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeImage, setNewTypeImage] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [draggedTypeId, setDraggedTypeId] = useState<string | null>(null);
  useEffect(() => {
    if (waConfigData) {
      const raw = waConfigData as unknown as WhatsAppConfig;
      let accounts = Array.isArray(raw.accounts) ? [...raw.accounts] : [];
      // Migrate legacy single config into accounts list
      if (accounts.length === 0 && raw.apiToken && raw.instanceId) {
        accounts = [{
          id: 'legacy-' + Date.now(),
          name: 'الحساب الرئيسي',
          apiToken: raw.apiToken,
          instanceId: raw.instanceId,
          phone: raw.defaultPhone || '',
        }];
      }
      const defaultAccountId = raw.defaultAccountId && accounts.some(a => a.id === raw.defaultAccountId)
        ? raw.defaultAccountId
        : accounts[0]?.id;
      const config: WhatsAppConfig = {
        apiToken: raw.apiToken || '',
        instanceId: raw.instanceId || '',
        defaultPhone: raw.defaultPhone || '',
        endpoints: raw.endpoints || { ...DEFAULT_ENDPOINTS },
        accounts,
        defaultAccountId,
      };
      setWaConfig(config);
      localStorage.setItem('whatsapp_config', JSON.stringify(config));
    }
  }, [waConfigData]);

  useEffect(() => {
    if (generalData) {
      const g = generalData as any;
      if (g.shopName) setShopName(g.shopName);
      if (g.adminPhone) setAdminPhone(g.adminPhone);
      if (g.delayHours) setDelayHours(g.delayHours);
    }
  }, [generalData]);

  useEffect(() => {
    if (taskTypesData) {
      const types = taskTypesData as unknown as TaskType[];
      if (Array.isArray(types) && types.length > 0) {
        setTaskTypes(types.sort((a, b) => a.order - b.order));
      }
    }
  }, [taskTypesData]);

  const loadAllTechnicians = async () => {
    const { data } = await supabase.from('technicians').select('*').order('name');
    setAllTechnicians(data || []);
  };

  useEffect(() => {
    if (open) loadAllTechnicians();
  }, [open, technicians]);

  const saveTaskTypes = (types: TaskType[]) => {
    upsertSetting.mutate(
      { key: 'task_types', value: types as any },
      { onSuccess: () => toast.success('تم حفظ أنواع المهام') }
    );
  };

  const addTaskType = () => {
    if (!newTypeName.trim()) return;
    const newType: TaskType = {
      id: Date.now().toString(),
      name: newTypeName.trim(),
      imageUrl: newTypeImage.trim(),
      order: taskTypes.length,
    };
    const updated = [...taskTypes, newType];
    setTaskTypes(updated);
    saveTaskTypes(updated);
    setNewTypeName('');
    setNewTypeImage('');
  };

  const deleteTaskType = (id: string) => {
    const updated = taskTypes.filter(t => t.id !== id).map((t, i) => ({ ...t, order: i }));
    setTaskTypes(updated);
    saveTaskTypes(updated);
  };

  const startEditType = (type: TaskType) => {
    setEditingTypeId(type.id);
    setEditName(type.name);
    setEditImage(type.imageUrl);
  };

  const saveEditType = () => {
    if (!editingTypeId || !editName.trim()) return;
    const updated = taskTypes.map(t => t.id === editingTypeId ? { ...t, name: editName.trim(), imageUrl: editImage.trim() } : t);
    setTaskTypes(updated);
    saveTaskTypes(updated);
    setEditingTypeId(null);
  };

  const handleTypeDragStart = (id: string) => setDraggedTypeId(id);
  const handleTypeDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTypeId || draggedTypeId === targetId) return;
    const oldIdx = taskTypes.findIndex(t => t.id === draggedTypeId);
    const newIdx = taskTypes.findIndex(t => t.id === targetId);
    const reordered = [...taskTypes];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);
    setTaskTypes(reordered.map((t, i) => ({ ...t, order: i })));
  };
  const handleTypeDragEnd = () => {
    saveTaskTypes(taskTypes);
    setDraggedTypeId(null);
  };

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

  const updateTechPhone = async (techId: string, phone: string) => {
    const { error } = await supabase.from('technicians').update({ phone } as any).eq('id', techId);
    if (error) { toast.error('فشل في تحديث رقم الهاتف'); return; }
    toast.success('تم تحديث رقم الهاتف');
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

  const toggleTechnicianActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from('technicians').update({ is_active: !currentActive }).eq('id', id);
    if (error) { toast.error('فشلت العملية'); return; }
    toast.success(!currentActive ? 'تم تفعيل الفني ✅' : 'تم إيقاف الفني ⛔');
    queryClient.invalidateQueries({ queryKey: ['technicians'] });
    loadAllTechnicians();
  };

  const deleteTechnicianPermanent = async (id: string) => {
    if (!confirm('حذف نهائي للفني؟ لا يمكن التراجع.')) return;
    const { error } = await supabase.from('technicians').delete().eq('id', id);
    if (error) { toast.error('فشل الحذف (قد يكون له معاملات مرتبطة)'); return; }
    toast.success('تم الحذف نهائياً');
    queryClient.invalidateQueries({ queryKey: ['technicians'] });
    loadAllTechnicians();
  };

  const updateTechPassword = async (techId: string, email: string | undefined, password: string) => {
    if (!password || password.length < 4) { toast.error('كلمة المرور قصيرة جداً (4 أحرف على الأقل)'); return; }
    const { data, error } = await supabase.functions.invoke('update-tech-password', {
      body: { technician_id: techId, email, new_password: password },
    });
    if (error || (data as any)?.error) { toast.error((data as any)?.error || 'فشل تحديث كلمة المرور'); return; }
    toast.success('تم تحديث كلمة المرور ✅');
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
                {allTechnicians.map((tech) => {
                  const isActive = tech.is_active !== false;
                  return (
                  <div key={tech.id} className={`rounded-lg px-3 py-2 space-y-2 ${isActive ? 'bg-muted' : 'bg-destructive/5 border border-destructive/20 opacity-75'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant={isActive ? 'ghost' : 'default'}
                          size="sm"
                          className={`text-xs h-8 ${isActive ? 'text-warning hover:text-warning' : 'bg-success hover:bg-success/90 text-success-foreground'}`}
                          onClick={() => toggleTechnicianActive(tech.id, isActive)}
                        >
                          {isActive ? 'إيقاف' : 'تفعيل'}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive text-xs h-8" onClick={() => deleteTechnicianPermanent(tech.id)}>
                          حذف
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="number"
                          data-rate
                          defaultValue={(tech as any).commission_rate || 0}
                          className="w-20 text-center text-sm h-8"
                          placeholder="%"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                        <Input
                          data-phone
                          defaultValue={(tech as any).phone || ''}
                          className="w-32 text-left font-mono text-xs h-8"
                          placeholder="رقم الواتساب"
                          dir="ltr"
                        />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-sm">{tech.name}</span>
                        {!isActive && <span className="text-[10px] text-destructive font-bold">موقوف</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        data-pw
                        type="text"
                        className="flex-1 text-left font-mono text-xs h-8"
                        placeholder="كلمة المرور الجديدة (اتركه فارغ لو مش هتغيرها)"
                        dir="ltr"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">باسورد:</span>
                    </div>
                    <Button
                      size="sm"
                      className="w-full gradient-hero text-primary-foreground font-bold h-9"
                      onClick={async (e) => {
                        const card = e.currentTarget.closest('div.rounded-lg') as HTMLElement;
                        const rateInput = card?.querySelector('input[data-rate]') as HTMLInputElement;
                        const phoneInput = card?.querySelector('input[data-phone]') as HTMLInputElement;
                        const pwInput = card?.querySelector('input[data-pw]') as HTMLInputElement;
                        const newRate = Number(rateInput?.value || 0);
                        const newPhone = phoneInput?.value || '';
                        const newPw = pwInput?.value || '';
                        let ok = true;
                        if (newRate !== ((tech as any).commission_rate || 0)) {
                          const { error } = await supabase.from('technicians').update({ commission_rate: newRate } as any).eq('id', tech.id);
                          if (error) ok = false;
                        }
                        if (newPhone !== ((tech as any).phone || '')) {
                          const { error } = await supabase.from('technicians').update({ phone: newPhone } as any).eq('id', tech.id);
                          if (error) ok = false;
                        }
                        if (newPw) {
                          await updateTechPassword(tech.id, (tech as any).email, newPw);
                          if (pwInput) pwInput.value = '';
                        }
                        queryClient.invalidateQueries({ queryKey: ['technicians'] });
                        loadAllTechnicians();
                        if (ok) toast.success('تم حفظ تعديلات ' + tech.name + ' ✅');
                        else toast.error('فشل حفظ بعض التعديلات');
                      }}
                    >
                      💾 حفظ التعديلات
                    </Button>
                  </div>
                  );
                })}
                {allTechnicians.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">لا يوجد فنيين. أضف فني جديد أعلاه.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <p className="text-center text-muted-foreground text-sm">إدارة أنواع المهام</p>
              
              {/* Add new type */}
              <div className="space-y-2 border border-border rounded-lg p-3">
                <Label className="text-right block text-sm font-medium">إضافة نوع جديد</Label>
                <Input
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="اسم نوع المهمة"
                  className="text-right"
                />
                <div className="flex gap-2">
                  <Input
                    value={newTypeImage}
                    onChange={(e) => setNewTypeImage(e.target.value)}
                    placeholder="رابط صورة / لوجو (اختياري)"
                    className="text-left text-xs font-mono" dir="ltr"
                  />
                  <ImageIcon className="h-8 w-8 text-muted-foreground shrink-0 mt-1" />
                </div>
                <Button size="sm" className="w-full gradient-hero text-primary-foreground" onClick={addTaskType}>
                  <Plus className="h-4 w-4 ml-1" /> إضافة
                </Button>
              </div>

              {/* Types list */}
              <div className="space-y-2">
                {taskTypes.map((type) => (
                  <div
                    key={type.id}
                    draggable
                    onDragStart={() => handleTypeDragStart(type.id)}
                    onDragOver={(e) => handleTypeDragOver(e, type.id)}
                    onDragEnd={handleTypeDragEnd}
                    className={`flex items-center gap-2 bg-muted rounded-lg px-3 py-2 transition-all ${draggedTypeId === type.id ? 'opacity-50' : ''}`}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                    
                    {type.imageUrl && (
                      <img src={type.imageUrl} alt={type.name} className="h-8 w-8 rounded object-contain shrink-0" />
                    )}

                    {editingTypeId === type.id ? (
                      <div className="flex-1 space-y-1">
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-right h-7 text-sm" />
                        <Input value={editImage} onChange={(e) => setEditImage(e.target.value)} placeholder="رابط الصورة" className="text-left text-xs font-mono h-7" dir="ltr" />
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 text-success" onClick={saveEditType}><Check className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" className="h-6 text-destructive" onClick={() => setEditingTypeId(null)}><X className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-right">{type.name}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditType(type)}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTaskType(type.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-6">
              <div className="border-2 border-success/30 rounded-xl p-4 space-y-4 bg-success/5">
                <div className="flex items-center justify-center gap-2 text-success">
                  <Link2 className="h-5 w-5" />
                  <h3 className="font-bold">ربط حساب Whats360</h3>
                </div>

                <WhatsAppAccountsManager
                  accounts={waConfig.accounts || []}
                  defaultAccountId={waConfig.defaultAccountId}
                  endpoints={waConfig.endpoints}
                  showToken={showToken}
                  onToggleShowToken={() => setShowToken(!showToken)}
                  onChange={(accounts, defaultAccountId) => {
                    const updated = { ...waConfig, accounts, defaultAccountId };
                    setWaConfig(updated);
                    localStorage.setItem('whatsapp_config', JSON.stringify(updated));
                  }}
                />

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

interface WhatsAppAccountsManagerProps {
  accounts: WhatsAppAccount[];
  defaultAccountId?: string;
  endpoints: { sendText: string; sendImage: string; sendVideo: string; sendAudio: string; sendDoc: string };
  showToken: boolean;
  onToggleShowToken: () => void;
  onChange: (accounts: WhatsAppAccount[], defaultAccountId?: string) => void;
}

const WhatsAppAccountsManager = ({ accounts, defaultAccountId, endpoints, showToken, onToggleShowToken, onChange }: WhatsAppAccountsManagerProps) => {
  const [statuses, setStatuses] = useState<Record<string, { connected: boolean; checking: boolean; error?: string }>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const updateAccount = (id: string, patch: Partial<WhatsAppAccount>) => {
    onChange(accounts.map(a => a.id === id ? { ...a, ...patch } : a), defaultAccountId);
  };

  const deleteAccount = (id: string) => {
    if (!confirm('حذف هذا الحساب؟')) return;
    const next = accounts.filter(a => a.id !== id);
    const nextDefault = defaultAccountId === id ? next[0]?.id : defaultAccountId;
    onChange(next, nextDefault);
  };

  const addAccount = () => {
    const newAcc: WhatsAppAccount = {
      id: 'acc-' + Date.now(),
      name: `حساب ${accounts.length + 1}`,
      apiToken: '',
      instanceId: '',
      phone: '',
    };
    const next = [...accounts, newAcc];
    onChange(next, defaultAccountId || newAcc.id);
  };

  const setDefault = (id: string) => onChange(accounts, id);

  const checkStatus = async (acc: WhatsAppAccount) => {
    if (!acc.apiToken || !acc.instanceId) {
      setStatuses(s => ({ ...s, [acc.id]: { connected: false, checking: false, error: 'أدخل API Token و Instance ID' } }));
      return;
    }
    setStatuses(s => ({ ...s, [acc.id]: { ...(s[acc.id] || { connected: false }), checking: true } }));
    const result = await testWhatsAppConnection(acc, endpoints);
    setStatuses(s => ({ ...s, [acc.id]: { connected: result.connected, checking: false, error: result.error } }));
  };

  // Auto-check status on mount / when credentials change
  useEffect(() => {
    accounts.forEach((acc) => {
      if (acc.apiToken && acc.instanceId && !statuses[acc.id]) {
        checkStatus(acc);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.map(a => `${a.id}:${a.apiToken}:${a.instanceId}`).join('|')]);


  const sendTest = async (acc: WhatsAppAccount) => {
    if (!acc.phone) { toast.error('أدخل رقم الهاتف الخاص بالحساب لإرسال رسالة تجربة'); return; }
    setTesting(t => ({ ...t, [acc.id]: true }));
    // Temporarily set this account as the source for sending
    const saved = localStorage.getItem('whatsapp_config');
    const tmpConfig = { endpoints, apiToken: acc.apiToken, instanceId: acc.instanceId, defaultPhone: acc.phone };
    localStorage.setItem('whatsapp_config', JSON.stringify(tmpConfig));
    const result = await sendWhatsAppMessage(acc.phone, `رسالة تجربة من ${acc.name} ✅`, { recipientName: acc.name, messageType: 'test' });
    if (saved) localStorage.setItem('whatsapp_config', saved);
    setTesting(t => ({ ...t, [acc.id]: false }));
    if (result.success) {
      toast.success('تم إرسال رسالة تجربة بنجاح ✅');
      setStatuses(s => ({ ...s, [acc.id]: { connected: true, checking: false } }));
    } else {
      toast.error(result.error || 'فشل إرسال رسالة التجربة');
      setStatuses(s => ({ ...s, [acc.id]: { connected: false, checking: false, error: result.error } }));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button size="sm" onClick={addAccount} className="gradient-hero text-primary-foreground h-8">
          <Plus className="h-4 w-4 ml-1" /> إضافة حساب
        </Button>
        <h4 className="text-sm font-bold">حسابات Whats Pilot ({accounts.length})</h4>
      </div>

      {accounts.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-4">لا يوجد حسابات. اضغط "إضافة حساب" للبدء.</p>
      )}

      {accounts.map((acc) => {
        const isDefault = defaultAccountId === acc.id;
        const status = statuses[acc.id];
        return (
          <div key={acc.id} className={`rounded-lg border p-3 space-y-2 ${isDefault ? 'border-success bg-success/5' : 'border-border bg-muted/30'}`}>
            {/* Status banner */}
            <div
              className={`rounded-md px-3 py-2 flex items-center gap-2 text-xs font-bold border ${
                status?.checking
                  ? 'bg-muted text-muted-foreground border-border'
                  : status?.connected
                    ? 'bg-success/15 text-success border-success/40'
                    : status
                      ? 'bg-destructive/15 text-destructive border-destructive/40'
                      : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {status?.checking ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> جاري فحص الاتصال…</>
              ) : status?.connected ? (
                <><Wifi className="h-4 w-4" /> متصل وجاهز للإرسال</>
              ) : status ? (
                <>
                  <WifiOff className="h-4 w-4 shrink-0" />
                  <span className="shrink-0">غير متصل:</span>
                  <span className="truncate font-medium opacity-90" title={status.error}>
                    {status.error || 'سبب غير معروف'}
                  </span>
                </>
              ) : (
                <><WifiOff className="h-4 w-4" /> لم يتم الفحص بعد</>
              )}
              <div className="flex-1" />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[11px] hover:bg-background/50"
                disabled={status?.checking}
                onClick={() => checkStatus(acc)}
              >
                إعادة الفحص
              </Button>
            </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={isDefault ? 'default' : 'ghost'}
                  className={`h-7 text-xs ${isDefault ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}`}
                  onClick={() => setDefault(acc.id)}
                  title="تعيين كافتراضي"
                >
                  <Star className={`h-3.5 w-3.5 ${isDefault ? 'fill-current' : ''}`} />
                  {isDefault ? ' افتراضي' : ''}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => deleteAccount(acc.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input
                value={acc.name}
                onChange={(e) => updateAccount(acc.id, { name: e.target.value })}
                placeholder="اسم الحساب"
                className="text-right h-8 text-sm font-medium flex-1"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={onToggleShowToken}>
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Input
                  type={showToken ? 'text' : 'password'}
                  value={acc.apiToken}
                  onChange={(e) => updateAccount(acc.id, { apiToken: e.target.value })}
                  placeholder="API Token"
                  className="text-left font-mono text-xs h-9" dir="ltr"
                />
              </div>
              <Input
                value={acc.instanceId}
                onChange={(e) => updateAccount(acc.id, { instanceId: e.target.value })}
                placeholder="Instance ID"
                className="text-left font-mono text-xs h-9" dir="ltr"
              />
              <Input
                value={acc.phone}
                onChange={(e) => updateAccount(acc.id, { phone: e.target.value })}
                placeholder="رقم الواتساب (بكود الدولة، مثال: 201234567890)"
                className="text-left font-mono text-xs h-9" dir="ltr"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={testing[acc.id]}
                onClick={() => sendTest(acc)}
              >
                {testing[acc.id] ? <Loader2 className="h-3.5 w-3.5 ml-1 animate-spin" /> : <Send className="h-3.5 w-3.5 ml-1" />}
                إرسال تجربة
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                disabled={status?.checking}
                onClick={() => checkStatus(acc)}
              >
                {status?.checking ? <Loader2 className="h-3.5 w-3.5 ml-1 animate-spin" /> : null}
                فحص الاتصال
              </Button>
              <div className="flex-1" />
              {status && !status.checking && (
                status.connected ? (
                  <span className="flex items-center gap-1 text-xs text-success font-bold">
                    <Wifi className="h-3.5 w-3.5" /> متصل
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-destructive font-bold" title={status.error}>
                    <WifiOff className="h-3.5 w-3.5" /> غير متصل
                  </span>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

