/**
 * generate-contract
 *
 * Gera o corpo do contrato de uma proposta usando Lovable AI, combinando:
 *  - `contract_templates.body` (com placeholders {{variavel}})
 *  - `contract_templates.ai_instructions` (diretrizes de redação)
 *  - bindings dinâmicos extraídos do cliente/proposta
 *
 * Requer JWT válido: todas as leituras/escritas usam o client com o token do
 * usuário, portanto o isolamento multi-tenant é garantido pelas policies RLS.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const brl = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const onlyDigits = (v?: string | null) => (v ?? "").replace(/\D/g, "");

function formatDocument(raw?: string | null): string {
  const doc = onlyDigits(raw);
  if (doc.length === 14) return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (doc.length === 11) return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return doc;
}

function renderTemplate(body: string, bindings: Record<string, string>) {
  return body.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (match, key: string) => {
    const value = bindings[String(key).toLowerCase()];
    return value !== undefined && value !== "" ? value : match;
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado." }, 401);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY ausente no ambiente." }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sessão inválida." }, 401);

    const payload = await req.json().catch(() => ({}));
    const proposalId = typeof payload?.proposalId === "string" ? payload.proposalId : "";
    const templateId = typeof payload?.templateId === "string" ? payload.templateId : null;
    if (!proposalId) return json({ error: "proposalId é obrigatório." }, 400);

    // 1) Proposta (RLS garante o org_id do usuário)
    const { data: proposal, error: pErr } = await supabase
      .from("proposals")
      .select(
        "id, proposal_number, client_id, client_name_snapshot, system_name, plan_name, monthly_value, implementation_value, implementation_flow, implementation_installments, valid_until, additional_info",
      )
      .eq("id", proposalId)
      .maybeSingle();

    if (pErr) return json({ error: pErr.message }, 400);
    if (!proposal) return json({ error: "Proposta não encontrada." }, 404);

    // 2) Template (informado ou padrão da organização)
    let templateQuery = supabase
      .from("contract_templates")
      .select("id, name, body, ai_instructions, category, is_default, active")
      .is("deleted_at", null)
      .eq("active", true);

    templateQuery = templateId
      ? templateQuery.eq("id", templateId)
      : templateQuery.order("is_default", { ascending: false });

    const { data: templates, error: tErr } = await templateQuery.limit(1);
    if (tErr) return json({ error: tErr.message }, 400);
    const template = templates?.[0];
    if (!template) {
      return json({ error: "Nenhum template de contrato ativo encontrado. Cadastre um em Configurações." }, 400);
    }

    // 3) Dados do cliente + módulos contratados
    let cliente: Record<string, unknown> | null = null;
    let modulosLista = "Nenhum módulo adicional";

    if (proposal.client_id) {
      const { data: c } = await supabase
        .from("clients")
        .select(
          "id, name, legal_name, trade_name, document, state_registration, email, phone, address_street, address_number, address_complement, address_neighborhood, city, address_uf, address_cep, tax_regime, primary_contact_name, system_name, monthly_value_base, monthly_value_final, default_due_day, contract_start_at, adjustment_type, adjustment_percent",
        )
        .eq("id", proposal.client_id)
        .maybeSingle();
      cliente = c ?? null;

      const { data: links } = await supabase
        .from("client_modules")
        .select("module_id, quantity")
        .eq("client_id", proposal.client_id);

      const ids = (links ?? []).map((l) => l.module_id).filter(Boolean) as string[];
      if (ids.length > 0) {
        const { data: mods } = await supabase
          .from("system_modules")
          .select("id, name, sale_value")
          .in("id", ids)
          .order("name");
        const qty = new Map<string, number>();
        (links ?? []).forEach((l) => qty.set(l.module_id as string, l.quantity ?? 1));
        const parts = (mods ?? []).map((m) => {
          const q = qty.get(m.id) ?? 1;
          const total = Number(m.sale_value ?? 0) * q;
          return `${m.name} (x${q}) — ${brl(total)}`;
        });
        if (parts.length > 0) modulosLista = parts.join("; ");
      }
    }

    const enderecoPartes = [
      cliente?.address_street,
      cliente?.address_number,
      cliente?.address_complement,
      cliente?.address_neighborhood,
      cliente?.city,
      cliente?.address_uf,
      cliente?.address_cep,
    ].filter((p) => !!p && String(p).trim() !== "");

    // 4) Perfil institucional da contratada (opcional)
    const { data: empresa } = await supabase
      .from("company_profile")
      .select("*")
      .limit(1)
      .maybeSingle();

    const fluxo = proposal.implementation_flow === "parcelado" && proposal.implementation_installments
      ? `${proposal.implementation_installments}x de ${brl(Number(proposal.implementation_value) / Number(proposal.implementation_installments))}`
      : "à vista";

    const bindings: Record<string, string> = {
      cliente_nome: String(cliente?.name ?? proposal.client_name_snapshot ?? ""),
      cliente_razao_social: String(cliente?.legal_name ?? cliente?.name ?? proposal.client_name_snapshot ?? ""),
      cliente_nome_fantasia: String(cliente?.trade_name ?? cliente?.name ?? ""),
      cliente_cnpj: formatDocument(cliente?.document as string | null),
      cliente_ie: String(cliente?.state_registration ?? "ISENTO"),
      cliente_email: String(cliente?.email ?? ""),
      cliente_telefone: String(cliente?.phone ?? ""),
      cliente_endereco: enderecoPartes.join(", "),
      cliente_regime_tributario: String(cliente?.tax_regime ?? ""),
      cliente_responsavel: String(cliente?.primary_contact_name ?? ""),
      sistema_nome: String(proposal.system_name ?? cliente?.system_name ?? ""),
      plano_nome: String(proposal.plan_name ?? ""),
      modulos_lista: modulosLista,
      valor_mensalidade: brl(Number(proposal.monthly_value ?? 0)),
      valor_mensalidade_base: brl(Number(cliente?.monthly_value_base ?? proposal.monthly_value ?? 0)),
      valor_implantacao: brl(Number(proposal.implementation_value ?? 0)),
      fluxo_implantacao: fluxo,
      numero_proposta: String(proposal.proposal_number ?? ""),
      dia_vencimento: cliente?.default_due_day ? String(cliente.default_due_day) : "",
      data_inicio_contrato: cliente?.contract_start_at
        ? new Date(String(cliente.contract_start_at)).toLocaleDateString("pt-BR")
        : new Date().toLocaleDateString("pt-BR"),
      indice_reajuste: String(cliente?.adjustment_type ?? ""),
      percentual_reajuste:
        cliente?.adjustment_percent !== null && cliente?.adjustment_percent !== undefined
          ? `${cliente.adjustment_percent}%`
          : "",
      data_hoje: new Date().toLocaleDateString("pt-BR"),
      empresa_nome: String((empresa as any)?.legal_name ?? (empresa as any)?.trade_name ?? (empresa as any)?.name ?? ""),
      empresa_cnpj: formatDocument((empresa as any)?.document ?? (empresa as any)?.cnpj ?? null),
    };

    const baseRenderizada = renderTemplate(String(template.body ?? ""), bindings);

    const systemPrompt = [
      "Você é um advogado especializado em contratos de licenciamento de software (SaaS) no Brasil.",
      "Redija contratos claros, juridicamente coerentes e prontos para assinatura, em português do Brasil.",
      "Regras invioláveis:",
      "- Use EXCLUSIVAMENTE os dados fornecidos. Nunca invente valores, nomes, CNPJ, datas ou prazos.",
      "- Se um dado estiver ausente, mantenha um marcador explícito como [A PREENCHER].",
      "- Preserve a estrutura e a ordem das cláusulas do template base.",
      "- Não use blocos de código nem markdown decorativo; devolva o texto do contrato pronto.",
      template.ai_instructions ? `Diretrizes específicas da organização: ${template.ai_instructions}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const userPrompt = [
      "TEMPLATE BASE (já com variáveis substituídas):",
      baseRenderizada,
      "",
      "DADOS ESTRUTURADOS (fonte da verdade):",
      JSON.stringify(bindings, null, 2),
      "",
      "Gere a versão final do contrato.",
    ].join("\n");

    // 5) Lovable AI — streaming para não exceder o timeout da plataforma
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok || !aiRes.body) {
      const detail = await aiRes.text().catch(() => "");
      if (aiRes.status === 429) return json({ error: "Limite de requisições da IA atingido. Tente novamente em instantes." }, 429);
      if (aiRes.status === 402) return json({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }, 402);
      return json({ error: `Falha na geração do contrato: ${detail || aiRes.status}` }, 502);
    }

    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let contrato = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === "string") contrato += delta;
        } catch {
          // fragmento SSE incompleto — ignora
        }
      }
    }

    contrato = contrato.trim() || baseRenderizada;

    // 6) Persiste na proposta
    const { error: upErr } = await supabase
      .from("proposals")
      .update({
        contract_body: contrato,
        contract_generated_at: new Date().toISOString(),
        contract_template_id: template.id,
      })
      .eq("id", proposalId);

    if (upErr) return json({ error: upErr.message }, 400);

    return json({
      contract: contrato,
      templateId: template.id,
      templateName: template.name,
      bindings,
    });
  } catch (err) {
    console.error("generate-contract error", err);
    return json({ error: err instanceof Error ? err.message : "Erro inesperado." }, 500);
  }
});
