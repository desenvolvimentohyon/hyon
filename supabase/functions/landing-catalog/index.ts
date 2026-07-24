import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Primary org (single-vendor landing)
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!org) {
      return new Response(JSON.stringify({ systems: [], plans: [], modules: [] }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const [systemsRes, plansRes, itemsRes, modulesRes] = await Promise.all([
      supabase.from("systems_catalog").select("id,name,description,sale_value")
        .eq("org_id", org.id).eq("active", true).order("name"),
      supabase.from("module_plans").select("id,name,description,min_total_value,allow_bonus,system_id")
        .eq("org_id", org.id).eq("active", true).order("name"),
      supabase.from("module_plan_items").select("plan_id,module_id,suggested_value"),
      supabase.from("system_modules").select("id,name,description,sale_value,system_ids,is_global")
        .eq("org_id", org.id).eq("active", true),
    ]);

    if (systemsRes.error) throw systemsRes.error;
    if (plansRes.error) throw plansRes.error;
    if (itemsRes.error) throw itemsRes.error;
    if (modulesRes.error) throw modulesRes.error;

    const modulesById = new Map((modulesRes.data ?? []).map((m) => [m.id, m]));
    const itemsByPlan = new Map<string, Array<{ module_id: string; name: string; suggested_value: number }>>();
    for (const it of itemsRes.data ?? []) {
      const mod = modulesById.get(it.module_id);
      if (!mod) continue;
      const arr = itemsByPlan.get(it.plan_id) ?? [];
      arr.push({ module_id: it.module_id, name: mod.name, suggested_value: Number(it.suggested_value) });
      itemsByPlan.set(it.plan_id, arr);
    }

    const plans = (plansRes.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      min_total_value: Number(p.min_total_value),
      allow_bonus: p.allow_bonus,
      system_id: p.system_id,
      items: itemsByPlan.get(p.id) ?? [],
    }));

    return new Response(JSON.stringify({
      systems: systemsRes.data ?? [],
      plans,
      modules: modulesRes.data ?? [],
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
