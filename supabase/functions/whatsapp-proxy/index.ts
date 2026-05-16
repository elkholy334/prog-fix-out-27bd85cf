// Proxy for Whats360 API to bypass browser CORS restrictions.
// Whats360 requires POST with all params in the URL query string.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, token, instance_id, jid, msg, baseUrl } = body as {
      action: 'send-text' | 'probe';
      token: string;
      instance_id: string;
      jid?: string;
      msg?: string;
      baseUrl?: string; // e.g. https://pro.whats360.live/api/v1
    };

    if (!token || !instance_id) {
      return new Response(JSON.stringify({ success: false, error: 'token و instance_id مطلوبان' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const base = (baseUrl || 'https://pro.whats360.live/api/v1').replace(/\/$/, '');
    const url = new URL(`${base}/send-text`);
    url.searchParams.set('token', token);
    url.searchParams.set('instance_id', instance_id);
    url.searchParams.set('jid', jid ?? '');
    url.searchParams.set('msg', msg ?? (action === 'probe' ? 'ping' : ''));

    const upstream = await fetch(url.toString(), { method: 'POST' });
    const text = await upstream.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // For "probe" action, normalize to connected/disconnected
    if (action === 'probe') {
      const errMsg = String(data?.error || data?.message || '').toLowerCase();
      let connected = false;
      let reason: string | undefined;
      if (errMsg.includes('not connected') || errMsg.includes('disconnected') || errMsg.includes('logout') || errMsg.includes('instance not found')) {
        connected = false;
        reason = data?.error || data?.message || 'الجهاز غير متصل بـ WhatsApp';
      } else if (errMsg.includes('token') || errMsg.includes('unauthorized') || errMsg.includes('invalid')) {
        connected = false;
        reason = data?.error || data?.message || 'بيانات الحساب غير صحيحة';
      } else if (!upstream.ok && !data?.success) {
        connected = false;
        reason = data?.error || data?.message || `HTTP ${upstream.status}`;
      } else {
        connected = true;
      }
      return new Response(JSON.stringify({ success: true, connected, reason, raw: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: upstream.ok, status: upstream.status, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'خطأ غير معروف' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
