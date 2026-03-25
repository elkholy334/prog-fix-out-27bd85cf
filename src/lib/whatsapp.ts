import { supabase } from '@/integrations/supabase/client';

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

export const getWhatsAppConfig = (): WhatsAppConfig | null => {
  try {
    const saved = localStorage.getItem('whatsapp_config');
    if (!saved) return null;
    const config = JSON.parse(saved) as WhatsAppConfig;
    if (!config.apiToken || !config.instanceId) return null;
    return config;
  } catch {
    return null;
  }
};

export const sendWhatsAppMessage = async (
  phone: string,
  message: string,
  logInfo?: { taskId?: number; recipientName?: string; messageType?: string }
): Promise<{ success: boolean; error?: string }> => {
  const config = getWhatsAppConfig();
  if (!config) {
    await logWhatsAppMessage({
      recipientPhone: phone,
      recipientName: logInfo?.recipientName || '',
      messageType: logInfo?.messageType || 'general',
      messageText: message,
      taskId: logInfo?.taskId,
      status: 'failed',
      errorMessage: 'إعدادات الواتساب غير مكتملة',
    });
    return { success: false, error: 'إعدادات الواتساب غير مكتملة. يرجى إدخال API Token و Instance ID في الإعدادات.' };
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
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

  const normalizedPhone = cleanPhone.startsWith('20')
    ? cleanPhone
    : cleanPhone.startsWith('0')
      ? `20${cleanPhone.slice(1)}`
      : cleanPhone.length === 10
        ? `20${cleanPhone}`
        : cleanPhone;

  try {
    const url = new URL(config.endpoints.sendText);
    url.searchParams.set('token', config.apiToken);
    url.searchParams.set('instance_id', config.instanceId);
    url.searchParams.set('jid', normalizedPhone);
    url.searchParams.set('msg', message);
    
    const response = await fetch(url.toString(), { method: 'POST' });
    const data = await response.json();

    if (response.ok && (data.success || data.status === true || data.status === 'success')) {
      await logWhatsAppMessage({
        recipientPhone: normalizedPhone,
        recipientName: logInfo?.recipientName || '',
        messageType: logInfo?.messageType || 'general',
        messageText: message,
        taskId: logInfo?.taskId,
        status: 'success',
      });
      return { success: true };
    }

    const errorMsg = data.message || data.error || 'فشل في إرسال الرسالة';
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
