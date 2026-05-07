import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, technician_id, new_password } = await req.json();

    if (!new_password || new_password.length < 4) {
      return new Response(JSON.stringify({ error: "كلمة المرور قصيرة جداً" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId: string | null = null;

    if (technician_id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("technician_id", technician_id)
        .maybeSingle();
      if (profile) userId = profile.id;
    }

    if (!userId && email) {
      const { data: list } = await admin.auth.admin.listUsers();
      const found = list?.users?.find((x: any) => x.email === email);
      if (found) userId = found.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "المستخدم غير موجود" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: new_password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
