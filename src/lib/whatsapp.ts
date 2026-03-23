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

export const sendWhatsAppMessage = async (phone: string, message: string): Promise<{ success: boolean; error?: string }> => {
  const config = getWhatsAppConfig();
  if (!config) {
    return { success: false, error: 'إعدادات الواتساب غير مكتملة. يرجى إدخال API Token و Instance ID في الإعدادات.' };
  }

  // Ensure phone is in correct format (no + sign, with country code)
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, error: 'رقم الهاتف غير صالح' };
  }

  try {
    const response = await fetch(config.endpoints.sendText, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.instanceId,
        mobile: cleanPhone,
        text: message,
        token: config.apiToken,
      }),
    });

    const data = await response.json();

    if (response.ok && (data.success || data.status === true || data.status === 'success')) {
      return { success: true };
    }

    return { success: false, error: data.message || data.error || 'فشل في إرسال الرسالة' };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ في الاتصال بخدمة الواتساب' };
  }
};

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
