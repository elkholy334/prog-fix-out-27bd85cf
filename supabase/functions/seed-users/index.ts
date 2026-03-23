import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const users = [
    { email: "admin@app.com", password: "123456", fullName: "المدير", role: "admin", technicianId: null },
    { email: "nebrawy@app.com", password: "123456", fullName: "النبراوي", role: "technician", technicianId: "63c44aed-cbfb-4a07-ac14-cfa6bad9fece" },
    { email: "mostafa@app.com", password: "123456", fullName: "مصطفى", role: "technician", technicianId: "87a24c60-3e89-404d-a060-eac478e7ea20" },
    { email: "alishaat@app.com", password: "123456", fullName: "علي شعت", role: "technician", technicianId: "011c42db-901a-4ee3-aece-2fa15542b301" },
    { email: "hesham@app.com", password: "123456", fullName: "هشام", role: "technician", technicianId: "0e8a5913-0591-404f-af7b-fde7cd9a76a2" },
    { email: "arboud@app.com", password: "123456", fullName: "محمد عربود", role: "technician", technicianId: "658a4745-4dff-412f-94ca-f672e8de4575" },
    { email: "on@app.com", password: "123456", fullName: "on", role: "technician", technicianId: "2dc02d54-bfda-4a6b-920a-4e4bf2e58967" },
    { email: "serawy@app.com", password: "123456", fullName: "السراوي", role: "technician", technicianId: "4d46f9ea-f3ad-410f-b35b-294ae6f90e1c" },
    { email: "ahmadredwan@app.com", password: "123456", fullName: "احمد رضوان", role: "technician", technicianId: "331ebdcf-c964-4418-9739-8f831d7d887c" },
    { email: "kareemelkholy@app.com", password: "123456", fullName: "كريم الخولي", role: "technician", technicianId: "9caf9c0a-c248-4122-8a7e-f2cc088ebef6" },
    { email: "ahmadelkholy@app.com", password: "123456", fullName: "أحمد الخولي", role: "technician", technicianId: "17d4e5a1-fdbb-4e4e-9893-97cadd56ce4a" },
    { email: "sonbol@app.com", password: "123456", fullName: "سونيبول", role: "technician", technicianId: "071424b5-4756-4660-8530-1b4727665b12" },
  ];

  const results = [];

  for (const u of users) {
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const found = existing?.users?.find((x: any) => x.email === u.email);
    
    let userId: string;
    
    if (found) {
      userId = found.id;
      results.push({ email: u.email, status: "already exists" });
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName },
      });
      if (error) {
        results.push({ email: u.email, status: "error", error: error.message });
        continue;
      }
      userId = data.user.id;
      results.push({ email: u.email, status: "created" });
    }

    if (u.technicianId) {
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        full_name: u.fullName,
        technician_id: u.technicianId,
      });
    }

    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: u.role },
      { onConflict: "user_id,role" }
    );
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
