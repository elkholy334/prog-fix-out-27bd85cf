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

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await admin.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub;
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const isAdmin = roles?.some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "صلاحيات غير كافية" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Auto-create auth user if technician has no linked account
    if (!userId && technician_id) {
      const { data: tech } = await admin
        .from("technicians")
        .select("id, name, email, phone")
        .eq("id", technician_id)
        .maybeSingle();

      if (!tech) {
        return new Response(JSON.stringify({ error: "الفني غير موجود" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newEmail = tech.email || `tech_${tech.phone || tech.id.slice(0, 8)}@app.com`;

      // Check if email already exists
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users?.find((x: any) => x.email === newEmail);

      if (existing) {
        userId = existing.id;
      } else {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: newEmail,
          password: new_password,
          email_confirm: true,
          user_metadata: { full_name: tech.name },
        });
        if (createErr || !created?.user) {
          return new Response(JSON.stringify({ error: createErr?.message || "فشل إنشاء الحساب" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = created.user.id;
      }

      // Link profile to technician + ensure email saved on technician
      await admin.from("profiles").upsert({
        id: userId,
        full_name: tech.name,
        technician_id: technician_id,
      });
      if (!tech.email) {
        await admin.from("technicians").update({ email: newEmail }).eq("id", technician_id);
      }
      // Assign technician role
      await admin.from("user_roles").upsert(
        { user_id: userId, role: "technician" },
        { onConflict: "user_id,role" }
      );
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
