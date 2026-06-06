import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppAccount {
  id: string;
  name: string;
  apiToken: string;
  instanceId: string;
  phone: string;
}

export interface WhatsAppEndpoints {
  sendText: string;
  sendImage: string;
  sendVideo: string;
  sendAudio: string;
  sendDoc: string;
}

export interface WhatsAppConfig {
  apiToken: string;
  instanceId: string;
  defaultPhone: string;
  endpoints: WhatsAppEndpoints;
  accounts?: WhatsAppAccount[];
  defaultAccountId?: string;
  pilotEnabled?: boolean; // when false, all sends open wa.me instead of API
}

/** Whether the Whats360 (pilot) API is enabled. Defaults to true. */
export const isPilotEnabled = (): boolean => {
  try {
    const saved = localStorage.getItem('whatsapp_config');
    if (!saved) return true;
    const cfg = JSON.parse(saved) as WhatsAppConfig;
    return cfg.pilotEnabled !== false;
  } catch { return true; }
};

/** Normalize a phone number to international format (no +) with default country code 20 (Egypt). */
export const normalizePhone = (raw: string): string => {
  const clean = (raw || '').replace(/[^0-9]/g, '');
  if (!clean) return '';
  if (clean.startsWith('20')) return clean;
  if (clean.startsWith('0'))  return `20${clean.slice(1)}`;
  if (clean.length === 10)    return `20${clean}`;
  return clean;
};

/** Build a wa.me URL that opens WhatsApp directly with a prefilled message. */
export const buildWaMeLink = (phone: string, message: string): string => {
  const p = normalizePhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
};

/** Open WhatsApp directly (web/app) — used when Pilot API is disabled. */
export const openWhatsAppDirect = (phone: string, message: string) => {
  const url = buildWaMeLink(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
};

/** Returns the effective single-account config (resolved from default account if present). */
export const getWhatsAppConfig = (): WhatsAppConfig | null => {
  try {
    const saved = localStorage.getItem('whatsapp_config');
    if (!saved) return null;
    const config = JSON.parse(saved) as WhatsAppConfig;
    const active = resolveActiveAccount(config);
    if (!active) return null;
    return {
      ...config,
      apiToken: active.apiToken,
      instanceId: active.instanceId,
      defaultPhone: active.phone || config.defaultPhone,
    };
  } catch {
    return null;
  }
};

export const resolveActiveAccount = (config: WhatsAppConfig): WhatsAppAccount | null => {
  if (config.accounts && config.accounts.length > 0) {
    const def = config.accounts.find((a) => a.id === config.defaultAccountId) || config.accounts[0];
    if (def && def.apiToken && def.instanceId) return def;
    return null;
  }
  if (config.apiToken && config.instanceId) {
    return { id: 'legacy', name: 'الحساب الافتراضي', apiToken: config.apiToken, instanceId: config.instanceId, phone: config.defaultPhone || '' };
  }
  return null;
};

const getBaseUrl = (endpoints: WhatsAppEndpoints) => endpoints.sendText.replace(/\/send-text.*$/, '');

/** Probes the WhatsApp instance by sending a real ping message to the account's own number. */
export const testWhatsAppConnection = async (
  account: { apiToken: string; instanceId: string; phone?: string },
  endpoints: WhatsAppEndpoints
): Promise<{ connected: boolean; error?: string }> => {
  try {
    const probePhone = normalizePhone(account.phone || '');
    if (!probePhone) {
      return { connected: false, error: 'أدخل رقم هاتف الحساب لإجراء فحص حقيقي' };
    }
    const { data, error } = await supabase.functions.invoke('whatsapp-proxy', {
      body: {
        action: 'probe',
        token: account.apiToken,
        instance_id: account.instanceId,
        baseUrl: getBaseUrl(endpoints),
        jid: probePhone,
        msg: '✅ فحص اتصال — تم بنجاح',
      },
    });
    if (error) return { connected: false, error: error.message || 'فشل الاتصال بخادم الفحص' };
    if (!data?.success) return { connected: false, error: data?.error || 'فشل الفحص' };
    return { connected: !!data.connected, error: data.reason };
  } catch (e: any) {
    return { connected: false, error: e?.message || 'فشل الاتصال' };
  }
};

export const sendWhatsAppMessage = async (
  phone: string,
  message: string,
  logInfo?: { taskId?: number; recipientName?: string; messageType?: string }
): Promise<{ success: boolean; error?: string }> => {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    await logWhatsAppMessage({
      recipientPhone: phone,
      recipientName: logInfo?.recipientName || '',
      messageType: logInfo?.messageType || 'general',
      messageText: message,
      taskId: logInfo?.taskId,
      status: 'failed',
      errorMessage: 'رقم الهاتف غير صالح',
    });
    return { success: false, error: 'رقم الهاتف غير صالح' };
  }

  if (!isPilotEnabled()) {
    openWhatsAppDirect(normalizedPhone, message);
    await logWhatsAppMessage({
      recipientPhone: normalizedPhone,
      recipientName: logInfo?.recipientName || '',
      messageType: logInfo?.messageType || 'general',
      messageText: message,
      taskId: logInfo?.taskId,
      status: 'success',
      errorMessage: 'تم فتح واتساب مباشر للإرسال اليدوي',
    });
    return { success: true };
  }

  const config = getWhatsAppConfig();
  if (!config) {
    await logWhatsAppMessage({
      recipientPhone: normalizedPhone,
      recipientName: logInfo?.recipientName || '',
      messageType: logInfo?.messageType || 'general',
      messageText: message,
      taskId: logInfo?.taskId,
      status: 'failed',
      errorMessage: 'إعدادات الواتساب غير مكتملة',
    });
    return { success: false, error: 'إعدادات الواتساب غير مكتملة. يرجى إدخال API Token و Instance ID في الإعدادات.' };
  }

  try {
    const { data, error: invokeErr } = await supabase.functions.invoke('whatsapp-proxy', {
      body: {
        action: 'send-text',
        token: config.apiToken,
        instance_id: config.instanceId,
        baseUrl: getBaseUrl(config.endpoints),
        jid: normalizedPhone,
        msg: message,
      },
    });

    if (invokeErr) {
      const errorMsg = invokeErr.message || 'فشل الاتصال بخادم الإرسال';
      await logWhatsAppMessage({
        recipientPhone: normalizedPhone, recipientName: logInfo?.recipientName || '',
        messageType: logInfo?.messageType || 'general', messageText: message,
        taskId: logInfo?.taskId, status: 'failed', errorMessage: errorMsg,
      });
      return { success: false, error: errorMsg };
    }

    const upstream = data?.data || {};
    const ok = data?.success && (upstream.success || upstream.status === true || upstream.status === 'success');

    if (ok) {
      await logWhatsAppMessage({
        recipientPhone: normalizedPhone, recipientName: logInfo?.recipientName || '',
        messageType: logInfo?.messageType || 'general', messageText: message,
        taskId: logInfo?.taskId, status: 'success',
      });
      return { success: true };
    }

    const errorMsg = upstream.message || upstream.error || data?.error || 'فشل في إرسال الرسالة';
    await logWhatsAppMessage({
      recipientPhone: normalizedPhone, recipientName: logInfo?.recipientName || '',
      messageType: logInfo?.messageType || 'general', messageText: message,
      taskId: logInfo?.taskId, status: 'failed', errorMessage: errorMsg,
    });
    return { success: false, error: errorMsg };
  } catch (err: any) {
    const errorMsg = err.message || 'خطأ في الاتصال بخدمة الواتساب';
    await logWhatsAppMessage({
      recipientPhone: normalizedPhone,
      recipientName: logInfo?.recipientName || '',
      messageType: logInfo?.messageType || 'general',
      messageText: message,
      taskId: logInfo?.taskId,
      status: 'failed',
      errorMessage: errorMsg,
    });
    return { success: false, error: errorMsg };
  }
};

async function logWhatsAppMessage(log: {
  recipientPhone: string;
  recipientName: string;
  messageType: string;
  messageText: string;
  taskId?: number;
  status: string;
  errorMessage?: string;
}) {
  try {
    await supabase.from('whatsapp_logs').insert({
      task_id: log.taskId ?? null,
      recipient_phone: log.recipientPhone,
      recipient_name: log.recipientName,
      message_type: log.messageType,
      message_text: log.messageText,
      status: log.status,
      error_message: log.errorMessage ?? null,
    });
  } catch (e) {
    console.error('Failed to log WhatsApp message:', e);
  }
}

export const buildMessageFromTemplate = (
  template: string,
  replacements: Record<string, string>
): string => {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
};
