import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const now = new Date();
const day = (d: number) => {
  const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt.toISOString();
};
const past = (d: number) => day(-d);
const pastDate = (d: number) => past(d).split("T")[0];
const competencia = (monthsAgo: number) => {
  const d = new Date(); d.setMonth(d.getMonth() - monthsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await supabase.from("profiles").select("org_id, role").eq("id", user.id).single();
    if (!profile) {
      return new Response(JSON.stringify({ error: "No profile" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const orgId = profile.org_id;
    const body = await req.json().catch(() => ({}));
    const action = body.action || "seed";
    const force = body.force === true;

    // ===== RESET MODE =====
    if (action === "reset") {
      // Wave 1: leaf tables
      await Promise.all([
        supabase.from("task_comments").delete().eq("org_id", orgId),
        supabase.from("task_history").delete().eq("org_id", orgId),
        supabase.from("proposal_items").delete().eq("org_id", orgId),
        supabase.from("bank_transactions").delete().eq("org_id", orgId),
        supabase.from("monthly_adjustments").delete().eq("org_id", orgId),
        supabase.from("support_events").delete().eq("org_id", orgId),
        supabase.from("notification_logs").delete().eq("org_id", orgId),
        supabase.from("billing_notifications").delete().eq("org_id", orgId),
        supabase.from("payment_receipts").delete().eq("org_id", orgId),
        supabase.from("client_attachments").delete().eq("org_id", orgId),
        supabase.from("client_contacts").delete().eq("org_id", orgId),
        supabase.from("contract_adjustments").delete().eq("org_id", orgId),
        supabase.from("asaas_webhook_events").delete().eq("org_id", orgId),
        supabase.from("portal_tickets").delete().eq("org_id", orgId),
        supabase.from("portal_referrals").delete().eq("org_id", orgId),
        supabase.from("card_commissions").delete().eq("org_id", orgId),
        supabase.from("card_revenue_monthly").delete().eq("org_id", orgId),
        supabase.from("card_proposal_onboarding").delete().eq("org_id", orgId),
        supabase.from("card_fee_profiles").delete().eq("org_id", orgId),
      ]);
      // Wave 2: intermediate
      await Promise.all([
        supabase.from("tasks").delete().eq("org_id", orgId),
        supabase.from("financial_titles").delete().eq("org_id", orgId),
        supabase.from("plan_renewal_requests").delete().eq("org_id", orgId),
        supabase.from("card_proposals").delete().eq("org_id", orgId),
      ]);
      // Wave 3: proposals
      await supabase.from("proposals").delete().eq("org_id", orgId);
      // Wave 4: root entities
      await Promise.all([
        supabase.from("clients").delete().eq("org_id", orgId),
        supabase.from("partners").delete().eq("org_id", orgId),
        supabase.from("card_clients").delete().eq("org_id", orgId),
      ]);

      return new Response(JSON.stringify({ ok: true, action: "reset", message: "Dados operacionais limpos com sucesso." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already seeded
    const { data: existingClients } = await supabase.from("clients").select("id").eq("org_id", orgId).limit(1);
    if (!force && existingClients && existingClients.length > 0) {
      return new Response(JSON.stringify({ error: "already_seeded", message: "Dados já existem. Envie force=true para sobrescrever." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // If force, clean existing data
    if (force) {
      await Promise.all([
        supabase.from("task_comments").delete().eq("org_id", orgId),
        supabase.from("task_history").delete().eq("org_id", orgId),
        supabase.from("proposal_items").delete().eq("org_id", orgId),
        supabase.from("bank_transactions").delete().eq("org_id", orgId),
        supabase.from("monthly_adjustments").delete().eq("org_id", orgId),
        supabase.from("support_events").delete().eq("org_id", orgId),
      ]);
      await Promise.all([
        supabase.from("tasks").delete().eq("org_id", orgId),
        supabase.from("financial_titles").delete().eq("org_id", orgId),
        supabase.from("proposals").delete().eq("org_id", orgId),
      ]);
      await Promise.all([
        supabase.from("clients").delete().eq("org_id", orgId),
        supabase.from("plans").delete().eq("org_id", orgId),
        supabase.from("payment_methods").delete().eq("org_id", orgId),
        supabase.from("systems_catalog").delete().eq("org_id", orgId),
        supabase.from("system_modules").delete().eq("org_id", orgId),
        supabase.from("crm_statuses").delete().eq("org_id", orgId),
        supabase.from("plan_accounts").delete().eq("org_id", orgId),
        supabase.from("bank_accounts").delete().eq("org_id", orgId),
        supabase.from("proposal_settings").delete().eq("org_id", orgId),
        supabase.from("partners").delete().eq("org_id", orgId),
      ]);
    }

    const results: string[] = [];

    // ===== 1. Plans =====
    await supabase.from("plans").insert([
      { org_id: orgId, name: "Mensal", months_validity: 1, discount_percent: 0, active: true },
      { org_id: orgId, name: "Trimestral", months_validity: 3, discount_percent: 5, active: true },
      { org_id: orgId, name: "Semestral", months_validity: 6, discount_percent: 10, active: true },
      { org_id: orgId, name: "Anual", months_validity: 12, discount_percent: 15, active: true },
    ]);
    results.push("Plans: 4");

    // ===== 2. Payment methods =====
    await supabase.from("payment_methods").insert([
      { org_id: orgId, name: "PIX", active: true },
      { org_id: orgId, name: "Boleto Bancário", active: true },
      { org_id: orgId, name: "Cartão de Crédito", active: true, notes: "Até 12x" },
      { org_id: orgId, name: "Transferência Bancária", active: true },
      { org_id: orgId, name: "Dinheiro", active: true },
    ]);
    results.push("Payment methods: 5");

    // ===== 3. Systems catalog =====
    await supabase.from("systems_catalog").insert([
      { org_id: orgId, name: "Hyon Alimentação", description: "Sistema para food service e alimentação", cost_value: 89, sale_value: 199, active: true },
      { org_id: orgId, name: "LinkPro Varejo", description: "Sistema para varejo e PDV", cost_value: 120, sale_value: 279, active: true },
      { org_id: orgId, name: "LinkPro Lite", description: "Versão simplificada para MEI", cost_value: 45, sale_value: 99, active: true },
    ]);
    results.push("Systems: 3");

    // ===== 4. System modules =====
    await supabase.from("system_modules").insert([
      { org_id: orgId, name: "Estoque", description: "Controle de estoque e inventário", cost_value: 20, sale_value: 49, active: true },
      { org_id: orgId, name: "Fiscal / NF-e", description: "Emissão de notas fiscais", cost_value: 30, sale_value: 69, active: true },
      { org_id: orgId, name: "Financeiro", description: "Controle financeiro integrado", cost_value: 25, sale_value: 59, active: true },
      { org_id: orgId, name: "Relatórios", description: "Relatórios gerenciais avançados", cost_value: 15, sale_value: 39, active: true },
      { org_id: orgId, name: "TEF", description: "Transferência eletrônica de fundos", cost_value: 35, sale_value: 79, active: true },
    ]);
    results.push("Modules: 5");

    // ===== 5. CRM statuses =====
    await supabase.from("crm_statuses").insert([
      { org_id: orgId, name: "Rascunho", sort_order: 0, is_default: true },
      { org_id: orgId, name: "Enviada", sort_order: 1 },
      { org_id: orgId, name: "Visualizada", sort_order: 2 },
      { org_id: orgId, name: "Negociação", sort_order: 3 },
      { org_id: orgId, name: "Aceita", sort_order: 4 },
      { org_id: orgId, name: "Recusada", sort_order: 5 },
    ]);
    results.push("CRM statuses: 6");

    // ===== 6. Proposal settings =====
    await supabase.from("proposal_settings").insert({
      org_id: orgId, default_valid_days: 15, default_send_method: "whatsapp",
      company_name: "Minha Empresa", alert_days_before_expiry: 30,
      default_message_template: "Olá {cliente}, segue a proposta {numeroProposta} do sistema {sistema}.",
      additional_info_default: "Proposta sujeita a disponibilidade.", pdf_footer: "Documento gerado automaticamente.",
    });
    results.push("Proposal settings: 1");

    // ===== 7. Bank accounts =====
    const { data: bankAccounts } = await supabase.from("bank_accounts").insert([
      { org_id: orgId, name: "Conta Principal", bank: "Banco do Brasil", agency: "1234-5", account: "56789-0", type: "corrente" },
      { org_id: orgId, name: "Conta Reserva", bank: "Nubank", agency: "0001", account: "98765-4", type: "corrente" },
    ]).select("id, name");
    const bankMap: Record<string, string> = {};
    if (bankAccounts) {
      bankAccounts.forEach(b => { bankMap[b.name] = b.id; });
    }
    results.push("Bank accounts: 2");

    // ===== 8. Plan accounts (chart of accounts) =====
    const planAccountRows = [
      { org_id: orgId, code: "1", name: "Receitas", type: "receita" },
      { org_id: orgId, code: "1.01", name: "Mensalidades", type: "receita" },
      { org_id: orgId, code: "1.02", name: "Implantação", type: "receita" },
      { org_id: orgId, code: "1.03", name: "Treinamentos", type: "receita" },
      { org_id: orgId, code: "1.04", name: "Serviços Avulsos", type: "receita" },
      { org_id: orgId, code: "2", name: "Custos / Repasses", type: "custo" },
      { org_id: orgId, code: "2.01", name: "Repasses PDV+", type: "repasse" },
      { org_id: orgId, code: "2.02", name: "Repasses LinkPro", type: "repasse" },
      { org_id: orgId, code: "2.03", name: "Repasses Torge", type: "repasse" },
      { org_id: orgId, code: "2.04", name: "Repasses Emissor Fiscal", type: "repasse" },
      { org_id: orgId, code: "2.05", name: "Repasses Hyon Hospede", type: "repasse" },
      { org_id: orgId, code: "3", name: "Despesas Operacionais", type: "despesa" },
      { org_id: orgId, code: "3.01", name: "Contabilidade", type: "despesa" },
      { org_id: orgId, code: "3.02", name: "Telefonia / Internet", type: "despesa" },
      { org_id: orgId, code: "3.03", name: "Marketing", type: "despesa" },
      { org_id: orgId, code: "3.04", name: "Salários / Pró-labore", type: "despesa" },
      { org_id: orgId, code: "3.05", name: "Ferramentas e SaaS", type: "despesa" },
      { org_id: orgId, code: "4", name: "Impostos", type: "imposto" },
      { org_id: orgId, code: "4.01", name: "Simples Nacional", type: "imposto" },
      { org_id: orgId, code: "4.02", name: "ISS", type: "imposto" },
      { org_id: orgId, code: "5", name: "Investimentos", type: "investimento" },
      { org_id: orgId, code: "5.01", name: "Equipamentos", type: "investimento" },
      { org_id: orgId, code: "5.02", name: "Capacitação", type: "investimento" },
    ];
    // Insert parents first, then children
    const parents = planAccountRows.filter(p => !p.code.includes("."));
    const { data: parentData } = await supabase.from("plan_accounts").insert(parents).select("id, code");
    const parentMap: Record<string, string> = {};
    if (parentData) parentData.forEach(p => { parentMap[p.code] = p.id; });

    const children = planAccountRows.filter(p => p.code.includes(".")).map(p => ({
      ...p, parent_id: parentMap[p.code.split(".")[0]] || null,
    }));
    await supabase.from("plan_accounts").insert(children);
    results.push("Plan accounts: " + planAccountRows.length);

    // ===== 9. Clients (Receita + App clients merged) =====
    type ClientDef = { nome: string; sistema: string; mensalidade: number; custo: number; status: string; cidade?: string; doc?: string; phone?: string; email?: string; metadata?: Record<string, unknown> };
    const clientDefs: ClientDef[] = [
      { nome: "Supermercado Bom Preço", sistema: "PDV+", mensalidade: 350, custo: 85, status: "ativo", cidade: "São Paulo", doc: "12.345.678/0001-90", phone: "(11) 3456-7890", email: "ti@bompreco.com.br", metadata: { sistemaUsado: "hyon", usaCloud: true, usaTEF: true, usaPagamentoIntegrado: false, tipoNegocio: "Supermercado", perfilCliente: "estrategico", statusFinanceiro: "em_dia" } },
      { nome: "Restaurante Sabor & Arte", sistema: "Torge", mensalidade: 200, custo: 42, status: "ativo", cidade: "Rio de Janeiro", doc: "67.890.123/0001-45", phone: "(21) 2345-6789", email: "adm@saborarte.com.br", metadata: { sistemaUsado: "hyon", usaCloud: true, usaTEF: true, usaPagamentoIntegrado: true, tipoNegocio: "Restaurante", perfilCliente: "estrategico", statusFinanceiro: "em_dia" } },
      { nome: "Padaria Estrela Dourada", sistema: "PDV+", mensalidade: 220, custo: 55, status: "ativo", cidade: "Santos", phone: "(11) 98765-4321", email: "estrela@gmail.com", metadata: { sistemaUsado: "hyon", usaCloud: false, usaTEF: true, tipoNegocio: "Padaria", perfilCliente: "conservador", statusFinanceiro: "1_atraso" } },
      { nome: "Loja Central Modas", sistema: "LinkPro", mensalidade: 380, custo: 95, status: "ativo", cidade: "Belo Horizonte", doc: "45.678.901/0001-23", phone: "(31) 3333-4444", email: "ti@centralmodas.com.br", metadata: { sistemaUsado: "linkpro", usaCloud: true, tipoNegocio: "Loja de Roupas", perfilCliente: "resistente", statusFinanceiro: "2_mais_atrasos", riscoCancelamento: true } },
      { nome: "Auto Peças Nacional", sistema: "LinkPro", mensalidade: 320, custo: 80, status: "ativo", cidade: "Campinas", doc: "56.789.012/0001-34", phone: "(19) 4444-5555", email: "compras@autopecas.com", metadata: { sistemaUsado: "linkpro", usaCloud: false, tipoNegocio: "Auto Peças", perfilCliente: "conservador", statusFinanceiro: "em_dia" } },
      { nome: "Farmácia Vida Plena", sistema: "LinkPro", mensalidade: 250, custo: 62, status: "ativo", cidade: "Guarulhos", phone: "(11) 2222-3333", email: "gerencia@vidaplena.com.br", metadata: { sistemaUsado: "hyon", usaCloud: true, usaTEF: true, usaPagamentoIntegrado: true, tipoNegocio: "Farmácia", perfilCliente: "estrategico", statusFinanceiro: "em_dia" } },
      { nome: "Pet Shop Amigo Fiel", sistema: "LinkPro", mensalidade: 190, custo: 47.6, status: "atraso", cidade: "São Paulo", phone: "(11) 5555-6666", email: "contato@amigofiel.com", metadata: { sistemaUsado: "linkpro", usaCloud: false, usaTEF: true, tipoNegocio: "Pet Shop", perfilCliente: "resistente", statusFinanceiro: "2_mais_atrasos", riscoCancelamento: true } },
      { nome: "Materiais ABC Construção", sistema: "Emissor Fiscal", mensalidade: 95, custo: 18, status: "ativo", cidade: "São Paulo", doc: "78.901.234/0001-56", phone: "(19) 7777-8888", email: "ti@abcconstrucao.com", metadata: { sistemaUsado: "hyon", usaCloud: true, tipoNegocio: "Material de Construção", perfilCliente: "estrategico", statusFinanceiro: "em_dia" } },
      { nome: "Mercearia São Jorge", sistema: "PDV+", mensalidade: 180, custo: 45, status: "ativo", cidade: "Campinas" },
      { nome: "Açougue Premium", sistema: "PDV+", mensalidade: 195, custo: 48, status: "ativo", cidade: "São Paulo" },
      { nome: "Hortifruti Natural", sistema: "PDV+", mensalidade: 160, custo: 40, status: "ativo", cidade: "Osasco" },
      { nome: "Conveniência 24h", sistema: "PDV+", mensalidade: 130, custo: 32, status: "atraso", cidade: "Barueri" },
      { nome: "Empório Gourmet", sistema: "PDV+", mensalidade: 280, custo: 70, status: "ativo", cidade: "São Paulo", doc: "34.567.890/0001-12" },
      { nome: "Distribuidora Central", sistema: "PDV+", mensalidade: 320, custo: 80, status: "ativo", cidade: "Jundiaí" },
      { nome: "Loja Tudo Certo", sistema: "PDV+", mensalidade: 175, custo: 43.5, status: "ativo", cidade: "Sorocaba" },
      { nome: "Mercadinho do Zé", sistema: "PDV+", mensalidade: 140, custo: 35, status: "suspenso", cidade: "Limeira" },
      { nome: "Casa de Carnes Silva", sistema: "PDV+", mensalidade: 200, custo: 75, status: "ativo", cidade: "Ribeirão Preto" },
      { nome: "Loja Esporte Mania", sistema: "LinkPro", mensalidade: 210, custo: 52, status: "ativo", cidade: "Santo André" },
      { nome: "Papelaria Criativa", sistema: "LinkPro", mensalidade: 160, custo: 40, status: "ativo", cidade: "São Bernardo" },
      { nome: "Eletrônicos Tech", sistema: "LinkPro", mensalidade: 290, custo: 72, status: "ativo", cidade: "Mogi das Cruzes" },
      { nome: "Bazar Mil Coisas", sistema: "LinkPro", mensalidade: 145, custo: 36, status: "ativo", cidade: "Diadema" },
      { nome: "Magazine Express", sistema: "LinkPro", mensalidade: 230, custo: 36, status: "ativo", cidade: "Osasco" },
      { nome: "Doceria Bella", sistema: "Torge", mensalidade: 150, custo: 35, status: "ativo", cidade: "Curitiba" },
      { nome: "Lanchonete Expresso", sistema: "Torge", mensalidade: 120, custo: 28, status: "ativo", cidade: "São Paulo" },
      { nome: "Pizzaria Napolitana", sistema: "Torge", mensalidade: 180, custo: 32.3, status: "ativo", cidade: "São Paulo" },
      { nome: "Bar do João", sistema: "Torge", mensalidade: 110, custo: 22, status: "cancelado", cidade: "Campinas" },
      { nome: "Contabilidade Foco", sistema: "Emissor Fiscal", mensalidade: 80, custo: 12.8, status: "ativo", cidade: "São Paulo" },
      { nome: "Escritório Prime", sistema: "Emissor Fiscal", mensalidade: 70, custo: 9, status: "ativo", cidade: "Barueri" },
      { nome: "Hotel Bela Vista", sistema: "Hyon Hospede", mensalidade: 110.45, custo: 1.2, status: "ativo", cidade: "Campos do Jordão" },
      { nome: "Pousada Recanto", sistema: "Hyon Hospede", mensalidade: 80, custo: 1, status: "ativo", cidade: "Ubatuba" },
      { nome: "Hostel Aventura", sistema: "Hyon Hospede", mensalidade: 60, custo: 1, status: "ativo", cidade: "Paraty" },
      { nome: "Padaria Pão Quente", sistema: "PDV+", mensalidade: 150, custo: 38, status: "ativo", cidade: "Guarulhos", doc: "23.456.789/0001-01" },
    ];

    const clientInserts = clientDefs.map(c => ({
      org_id: orgId, name: c.nome, document: c.doc || null, phone: c.phone || null,
      email: c.email || null, city: c.cidade || null, system_name: c.sistema,
      status: c.status, recurrence_active: c.status === "ativo" || c.status === "atraso",
      monthly_value_final: c.mensalidade, monthly_value_base: c.mensalidade,
      cost_active: c.status !== "cancelado", monthly_cost_value: c.custo,
      cost_system_name: c.sistema, metadata: c.metadata || {},
      cancelled_at: c.status === "cancelado" ? pastDate(45) : null,
      cancellation_reason: c.status === "cancelado" ? "Optou por concorrente" : null,
      contract_signed_at: pastDate(90 + Math.floor(Math.random() * 365)),
    }));

    const { data: insertedClients } = await supabase.from("clients").insert(clientInserts).select("id, name");
    const clientMap: Record<string, string> = {};
    if (insertedClients) insertedClients.forEach(c => { clientMap[c.name] = c.id; });
    results.push("Clients: " + clientDefs.length);

    // ===== 9.5 Partners =====
    const { data: insertedPartners } = await supabase.from("partners").insert([
      {
        org_id: orgId, name: "João Indicador", email: "joao@indicador.com", phone: "(11) 91234-5678",
        document: "123.456.789-00", commission_type: "implantacao_e_recorrente",
        commission_implant_percent: 15, commission_recur_percent: 5, commission_recur_months: 12,
        commission_recur_apply_on: "on_invoice_paid", active: true,
        notes: "Parceiro estratégico, indicou vários clientes do setor alimentício",
      },
      {
        org_id: orgId, name: "Maria Parceira", email: "maria@parceira.com.br", phone: "(21) 98765-4321",
        document: "987.654.321-00", commission_type: "apenas_implantacao",
        commission_implant_percent: 10, commission_recur_percent: 0, commission_recur_months: 0,
        commission_recur_apply_on: "on_invoice_paid", active: true,
        notes: "Contadora que indica clientes",
      },
      {
        org_id: orgId, name: "Tech Solutions", email: "contato@techsolutions.com.br", phone: "(19) 3333-9999",
        document: "12.345.678/0001-99", commission_type: "implantacao_e_recorrente",
        commission_implant_percent: 12, commission_recur_percent: 3, commission_recur_months: 0,
        commission_recur_apply_on: "on_invoice_paid", active: true,
        notes: "Empresa de TI parceira — comissão recorrente ilimitada",
      },
    ]).select("id, name");
    const partnerMap: Record<string, string> = {};
    if (insertedPartners) insertedPartners.forEach(p => { partnerMap[p.name] = p.id; });
    results.push("Partners: 3");

    // Update 5 clients with partner references
    const partnerClientUpdates: { clientName: string; partnerId: string; recurPercent: number; recurMonths: number }[] = [
      { clientName: "Supermercado Bom Preço", partnerId: partnerMap["João Indicador"], recurPercent: 5, recurMonths: 12 },
      { clientName: "Farmácia Vida Plena", partnerId: partnerMap["Maria Parceira"], recurPercent: 0, recurMonths: 0 },
      { clientName: "Auto Peças Nacional", partnerId: partnerMap["Tech Solutions"], recurPercent: 3, recurMonths: 0 },
      { clientName: "Padaria Estrela Dourada", partnerId: partnerMap["João Indicador"], recurPercent: 5, recurMonths: 12 },
      { clientName: "Eletrônicos Tech", partnerId: partnerMap["Tech Solutions"], recurPercent: 3, recurMonths: 0 },
    ];
    for (const u of partnerClientUpdates) {
      const cid = clientMap[u.clientName];
      if (cid && u.partnerId) {
        await supabase.from("clients").update({
          ref_partner_id: u.partnerId,
          ref_partner_recur_percent: u.recurPercent,
          ref_partner_recur_months: u.recurMonths,
          ref_partner_start_at: pastDate(90),
          ref_partner_recur_apply_on: u.recurPercent > 0 ? "on_invoice_paid" : null,
        }).eq("id", cid);
      }
    }
    results.push("Partner-client links: 5");

    // ===== 10. Support events =====
    const tipos: string[] = ["suporte", "implantacao", "treinamento"];
    const supportInserts: any[] = [];
    Object.values(clientMap).forEach(clientId => {
      const count = Math.floor(Math.random() * 6) + 1;
      for (let i = 0; i < count; i++) {
        supportInserts.push({
          org_id: orgId, client_id: clientId,
          type: tipos[Math.floor(Math.random() * 3)],
          duration_minutes: Math.floor(Math.random() * 120) + 10,
          resolved: Math.random() > 0.2,
        });
      }
    });
    // Insert in batches of 50
    for (let i = 0; i < supportInserts.length; i += 50) {
      await supabase.from("support_events").insert(supportInserts.slice(i, i + 50));
    }
    results.push("Support events: " + supportInserts.length);

    // ===== 11. Monthly adjustments =====
    const motivos = ["Reajuste anual", "Upgrade de plano", "Negociação comercial", "Correção IGPM", "Promoção"];
    const adjustInserts: any[] = [];
    for (const cd of clientDefs) {
      const cid = clientMap[cd.nome];
      if (!cid) continue;
      const numAjustes = Math.floor(Math.random() * 3) + 1;
      let valor = Math.round(cd.mensalidade * 0.75 * 100) / 100;
      for (let i = numAjustes; i >= 1; i--) {
        const valorNovo = i === 1 ? cd.mensalidade : Math.round(valor * 1.08 * 100) / 100;
        adjustInserts.push({
          org_id: orgId, client_id: cid, previous_value: valor, new_value: valorNovo,
          reason: motivos[Math.floor(Math.random() * motivos.length)],
          adjustment_date: past(i * 90),
        });
        valor = valorNovo;
      }
    }
    for (let i = 0; i < adjustInserts.length; i += 50) {
      await supabase.from("monthly_adjustments").insert(adjustInserts.slice(i, i + 50));
    }
    results.push("Adjustments: " + adjustInserts.length);

    // ===== 12. Tasks =====
    const taskInserts: any[] = [
      // Suporte
      { org_id: orgId, title: "Sistema não abre após atualização", description: "Cliente relata que o sistema não abre depois da última atualização.", client_id: clientMap["Supermercado Bom Preço"], priority: "urgente", status: "em_andamento", due_at: day(0), tipo_operacional: "suporte", sistema_relacionado: "hyon", tags: ["erro", "urgente"], total_seconds: 3600, metadata: { slaHoras: 4 } },
      { org_id: orgId, title: "Erro na emissão de NF-e", description: "NF-e retornando erro de rejeição 301.", client_id: clientMap["Restaurante Sabor & Arte"], priority: "urgente", status: "a_fazer", due_at: past(1), tipo_operacional: "suporte", sistema_relacionado: "hyon", tags: ["fiscal", "nfe"], metadata: { moduloRelacionado: "fiscal", slaHoras: 4, reincidente: true } },
      { org_id: orgId, title: "TEF não conecta", description: "Máquina de cartão parou de comunicar com o sistema.", client_id: clientMap["Padaria Estrela Dourada"], priority: "alta", status: "em_andamento", due_at: day(0), tipo_operacional: "suporte", sistema_relacionado: "hyon", tags: ["tef"], total_seconds: 1800, metadata: { slaHoras: 8 } },
      { org_id: orgId, title: "Relatório de vendas não gera", description: "Ao gerar relatório de vendas mensal, sistema trava.", client_id: clientMap["Supermercado Bom Preço"], priority: "media", status: "a_fazer", due_at: day(2), tipo_operacional: "suporte", sistema_relacionado: "hyon", tags: ["relatório"], metadata: { moduloRelacionado: "relatorios", slaHoras: 24 } },
      { org_id: orgId, title: "Produto sem preço no PDV", description: "Alguns produtos aparecem sem preço no PDV.", client_id: clientMap["Farmácia Vida Plena"], priority: "alta", status: "concluida", tipo_operacional: "suporte", sistema_relacionado: "hyon", tags: ["pdv"], total_seconds: 2700, metadata: { moduloRelacionado: "estoque", slaHoras: 8 } },
      { org_id: orgId, title: "Lentidão no módulo financeiro", description: "Sistema lento ao acessar contas a pagar.", client_id: clientMap["Loja Central Modas"], priority: "media", status: "a_fazer", due_at: day(3), tipo_operacional: "suporte", sistema_relacionado: "linkpro", tags: ["lentidão"], metadata: { moduloRelacionado: "financeiro", slaHoras: 24 } },
      { org_id: orgId, title: "Backup automático falhou", description: "Backup não executou nos últimos 3 dias.", client_id: clientMap["Restaurante Sabor & Arte"], priority: "alta", status: "em_andamento", due_at: day(0), tipo_operacional: "suporte", sistema_relacionado: "hyon", tags: ["backup"], total_seconds: 1200, metadata: { slaHoras: 12 } },
      { org_id: orgId, title: "Estoque negativo aparecendo", description: "Produtos mostrando quantidade negativa no estoque.", client_id: clientMap["Supermercado Bom Preço"], priority: "alta", status: "a_fazer", due_at: day(1), tipo_operacional: "suporte", sistema_relacionado: "hyon", tags: ["estoque", "bug"], metadata: { moduloRelacionado: "estoque", slaHoras: 12 } },
      // Implantação
      { org_id: orgId, title: "Implantação Hyon - Farmácia Vida Plena", description: "Implantação completa do sistema na Farmácia Vida Plena.", client_id: clientMap["Farmácia Vida Plena"], priority: "alta", status: "em_andamento", due_at: day(10), tipo_operacional: "implantacao", sistema_relacionado: "hyon", tags: ["implantação"], total_seconds: 14400, metadata: { etapaImplantacao: "Configuração fiscal" } },
      { org_id: orgId, title: "Implantação LinkPro - Auto Peças Nacional", description: "Implantação do LinkPro com módulo de estoque e fiscal.", client_id: clientMap["Auto Peças Nacional"], priority: "alta", status: "em_andamento", due_at: past(2), tipo_operacional: "implantacao", sistema_relacionado: "linkpro", tags: ["implantação"], total_seconds: 21600, metadata: { etapaImplantacao: "Treinamento operacional" } },
      { org_id: orgId, title: "Implantação Hyon - Materiais ABC", description: "Implantação do Hyon completo.", client_id: clientMap["Materiais ABC Construção"], priority: "media", status: "em_andamento", due_at: day(20), tipo_operacional: "implantacao", sistema_relacionado: "hyon", tags: ["implantação"], total_seconds: 3600, metadata: { etapaImplantacao: "Cadastro de produtos" } },
      // Comercial
      { org_id: orgId, title: "Lead - Minimercado São Jorge", description: "Contato recebido via indicação.", priority: "alta", status: "em_andamento", due_at: day(5), tipo_operacional: "comercial", sistema_relacionado: "hyon", tags: ["lead"], metadata: { statusComercial: "lead", valorProposta: 890, tipoPlano: "Completo", origemLead: "Indicação" } },
      { org_id: orgId, title: "Proposta - Açougue Premium", description: "Proposta enviada para sistema completo com TEF.", priority: "media", status: "em_andamento", due_at: day(10), tipo_operacional: "comercial", sistema_relacionado: "hyon", tags: ["proposta"], metadata: { statusComercial: "proposta_enviada", valorProposta: 1200, tipoPlano: "Premium", origemLead: "Site" } },
      { org_id: orgId, title: "Negociação - Loja Esporte Mania", description: "Em negociação para sistema LinkPro.", priority: "alta", status: "em_andamento", due_at: day(3), tipo_operacional: "comercial", sistema_relacionado: "linkpro", tags: ["negociação"], metadata: { statusComercial: "em_negociacao", valorProposta: 450, origemLead: "Evento", objecoes: "Preço alto" } },
      // Treinamento
      { org_id: orgId, title: "Treinamento Fiscal - Restaurante Sabor & Arte", description: "Treinamento do setor administrativo em emissão de NF-e.", client_id: clientMap["Restaurante Sabor & Arte"], priority: "alta", status: "em_andamento", due_at: day(2), tipo_operacional: "treinamento", sistema_relacionado: "hyon", tags: ["treinamento", "fiscal"], total_seconds: 3600, metadata: { setorTreinamento: "administrativo", horasMinistradas: 1, treinamentoExtraCobrado: true, valorTreinamentoExtra: 250 } },
      { org_id: orgId, title: "Treinamento Estoque - Auto Peças Nacional", description: "Treinamento equipe comercial no controle de estoque.", client_id: clientMap["Auto Peças Nacional"], priority: "media", status: "a_fazer", due_at: day(7), tipo_operacional: "treinamento", sistema_relacionado: "linkpro", tags: ["treinamento", "estoque"], metadata: { setorTreinamento: "comercial" } },
      // Financeiro
      { org_id: orgId, title: "Contato financeiro - Loja Central Modas (2+ atrasos)", description: "Cliente com 2 ou mais mensalidades em atraso.", client_id: clientMap["Loja Central Modas"], priority: "alta", status: "a_fazer", due_at: day(2), tipo_operacional: "financeiro", sistema_relacionado: "linkpro", tags: ["atraso", "financeiro"], metadata: { riscoCancelamento: true } },
      { org_id: orgId, title: "Contato financeiro - Pet Shop Amigo Fiel (2+ atrasos)", description: "Cliente com mensalidades atrasadas.", client_id: clientMap["Pet Shop Amigo Fiel"], priority: "alta", status: "em_andamento", due_at: day(1), tipo_operacional: "financeiro", sistema_relacionado: "linkpro", tags: ["atraso", "financeiro"], total_seconds: 900, metadata: { riscoCancelamento: true } },
      // Interno
      { org_id: orgId, title: "Documentar processos internos", description: "Criar documentação dos procedimentos.", priority: "baixa", status: "backlog", tipo_operacional: "interno", tags: ["documentação", "interno"] },
      { org_id: orgId, title: "Reunião semanal equipe", description: "Preparar pauta e conduzir reunião semanal.", priority: "media", status: "a_fazer", due_at: day(1), tipo_operacional: "interno", tags: ["reunião"] },
    ];

    const { data: insertedTasks } = await supabase.from("tasks").insert(taskInserts).select("id, title");
    if (insertedTasks) {
      // Add history for each
      const historyInserts = insertedTasks.map(t => ({
        org_id: orgId, task_id: t.id, action: "Criação", details: "Tarefa criada via seed",
      }));
      await supabase.from("task_history").insert(historyInserts);
    }
    results.push("Tasks: " + taskInserts.length);

    // ===== 13. Proposals =====
    const proposalInserts = [
      { org_id: orgId, proposal_number: "PROP-2026-0001", system_name: "HYON", plan_name: "Básico", monthly_value: 450, implementation_value: 1500, implementation_flow: "parcelado", implementation_installments: 3, valid_days: 10, crm_status: "Rascunho", view_status: "nao_enviado", acceptance_status: "pendente", acceptance_link: "/aceite/PROP-2026-0001", notes_internal: "Aguardando definição do cliente", additional_info: "Inclui módulo estoque e fiscal." },
      { org_id: orgId, proposal_number: "PROP-2026-0002", client_id: clientMap["Supermercado Bom Preço"], client_name_snapshot: "Supermercado Bom Preço", system_name: "HYON", plan_name: "Completo", monthly_value: 890, implementation_value: 3500, implementation_flow: "parcelado", implementation_installments: 5, sent_at: past(3), valid_days: 10, valid_until: day(7), crm_status: "Enviada", view_status: "enviado", acceptance_status: "pendente", acceptance_link: "/aceite/PROP-2026-0002", pdf_generated_at: past(3), notes_internal: "Cliente antigo, boa chance de fechar" },
      { org_id: orgId, proposal_number: "PROP-2026-0003", client_id: clientMap["Restaurante Sabor & Arte"], client_name_snapshot: "Restaurante Sabor & Arte", system_name: "HYON", plan_name: "Premium", monthly_value: 1200, implementation_value: 5000, implementation_flow: "a_vista", sent_at: past(5), valid_days: 7, valid_until: day(2), crm_status: "Enviada", view_status: "enviado", acceptance_status: "pendente", acceptance_link: "/aceite/PROP-2026-0003", pdf_generated_at: past(5) },
      { org_id: orgId, proposal_number: "PROP-2026-0004", client_id: clientMap["Materiais ABC Construção"], client_name_snapshot: "Materiais ABC Construção", system_name: "HYON", plan_name: "Completo", monthly_value: 750, implementation_value: 2800, implementation_flow: "parcelado", implementation_installments: 4, sent_at: past(2), valid_days: 10, valid_until: day(8), crm_status: "Enviada", view_status: "enviado", acceptance_status: "pendente", acceptance_link: "/aceite/PROP-2026-0004", pdf_generated_at: past(2) },
      { org_id: orgId, proposal_number: "PROP-2026-0005", client_id: clientMap["Padaria Estrela Dourada"], client_name_snapshot: "Padaria Estrela Dourada", system_name: "HYON", plan_name: "Básico", monthly_value: 450, implementation_value: 1200, implementation_flow: "a_vista", sent_at: past(6), valid_days: 10, valid_until: day(4), crm_status: "Visualizada", view_status: "visualizado", acceptance_status: "pendente", acceptance_link: "/aceite/PROP-2026-0005", pdf_generated_at: past(6) },
      { org_id: orgId, proposal_number: "PROP-2026-0006", client_id: clientMap["Farmácia Vida Plena"], client_name_snapshot: "Farmácia Vida Plena", system_name: "HYON", plan_name: "Premium", monthly_value: 980, implementation_value: 4000, implementation_flow: "parcelado", implementation_installments: 6, sent_at: past(4), valid_days: 10, valid_until: day(6), crm_status: "Negociação", view_status: "visualizado", acceptance_status: "pendente", acceptance_link: "/aceite/PROP-2026-0006", pdf_generated_at: past(4) },
      { org_id: orgId, proposal_number: "PROP-2026-0007", client_id: clientMap["Loja Central Modas"], client_name_snapshot: "Loja Central Modas", system_name: "LINKPRO", plan_name: "Padrão", monthly_value: 380, implementation_value: 1000, implementation_flow: "a_vista", sent_at: past(8), valid_days: 7, valid_until: past(1), crm_status: "Enviada", view_status: "nao_abriu", acceptance_status: "pendente", acceptance_link: "/aceite/PROP-2026-0007", pdf_generated_at: past(8) },
      { org_id: orgId, proposal_number: "PROP-2026-0008", client_id: clientMap["Auto Peças Nacional"], client_name_snapshot: "Auto Peças Nacional", system_name: "LINKPRO", plan_name: "Completo", monthly_value: 550, implementation_value: 2000, implementation_flow: "parcelado", implementation_installments: 4, sent_at: past(15), valid_days: 10, valid_until: past(5), crm_status: "Aceita", view_status: "visualizado", acceptance_status: "aceitou", acceptance_link: "/aceite/PROP-2026-0008", pdf_generated_at: past(15), partner_id: partnerMap["Tech Solutions"] || null, partner_commission_implant_percent: 12, partner_commission_implant_value: 240, commission_implant_generated: true },
      { org_id: orgId, proposal_number: "PROP-2026-0009", client_id: clientMap["Farmácia Vida Plena"], client_name_snapshot: "Farmácia Vida Plena", system_name: "HYON", plan_name: "Completo", monthly_value: 750, implementation_value: 3000, implementation_flow: "parcelado", implementation_installments: 3, sent_at: past(25), valid_days: 10, valid_until: past(15), crm_status: "Aceita", view_status: "visualizado", acceptance_status: "aceitou", acceptance_link: "/aceite/PROP-2026-0009", pdf_generated_at: past(25), partner_id: partnerMap["Maria Parceira"] || null, partner_commission_implant_percent: 10, partner_commission_implant_value: 300, commission_implant_generated: true },
      { org_id: orgId, proposal_number: "PROP-2026-0010", client_id: clientMap["Pet Shop Amigo Fiel"], client_name_snapshot: "Pet Shop Amigo Fiel", system_name: "LINKPRO", plan_name: "Básico", monthly_value: 290, implementation_value: 800, implementation_flow: "a_vista", sent_at: past(12), valid_days: 7, valid_until: past(5), crm_status: "Recusada", view_status: "visualizado", acceptance_status: "recusou", acceptance_link: "/aceite/PROP-2026-0010", pdf_generated_at: past(12) },
    ];

    const { data: insertedProposals } = await supabase.from("proposals").insert(proposalInserts).select("id, proposal_number");
    // Add items for first proposal
    if (insertedProposals) {
      const prop1 = insertedProposals.find(p => p.proposal_number === "PROP-2026-0001");
      if (prop1) {
        await supabase.from("proposal_items").insert([
          { org_id: orgId, proposal_id: prop1.id, description: "Licença Hyon Básico", quantity: 1, unit_value: 450 },
          { org_id: orgId, proposal_id: prop1.id, description: "Implantação presencial", quantity: 1, unit_value: 1500 },
        ]);
      }
      const prop2 = insertedProposals.find(p => p.proposal_number === "PROP-2026-0002");
      if (prop2) {
        await supabase.from("proposal_items").insert([
          { org_id: orgId, proposal_id: prop2.id, description: "Licença Hyon Completo", quantity: 1, unit_value: 890 },
          { org_id: orgId, proposal_id: prop2.id, description: "Implantação completa", quantity: 1, unit_value: 3500 },
        ]);
      }
    }
    results.push("Proposals: " + proposalInserts.length);

    // ===== 14. Financial titles =====
    const mainBankId = bankMap["Conta Principal"] || "";
    const reserveBankId = bankMap["Conta Reserva"] || "";
    const formasPagArray = ["pix", "boleto", "cartao", "transferencia"];
    const titleInserts: any[] = [];

    // Mensalidades receivable (6 months for active clients)
    const activeClientDefs = clientDefs.filter(c => c.status === "ativo" || c.status === "atraso");
    for (let m = 0; m < 6; m++) {
      for (const cd of activeClientDefs) {
        const cid = clientMap[cd.nome];
        if (!cid) continue;
        const isPast = m > 0;
        const isOverdue = m === 1 && cd.status === "atraso";
        const st = isOverdue ? "vencido" : isPast ? "pago" : "aberto";
        titleInserts.push({
          org_id: orgId, type: "receber", origin: "mensalidade",
          description: `Mensalidade ${cd.nome}`, client_id: cid,
          plan_account_code: "1.01", competency: competencia(m),
          issued_at: pastDate(m * 30), due_at: pastDate(m * 30 - 15),
          value_original: cd.mensalidade, status: st,
          bank_account_id: Math.random() > 0.3 ? mainBankId : reserveBankId,
          metadata: { formaPagamento: formasPagArray[Math.floor(Math.random() * 4)] },
        });
      }
    }

    // Monthly operational expenses (6 months)
    const expenses = [
      { desc: "Contabilidade mensal", value: 450, code: "3.01", supplier: "Contabilidade Foco" },
      { desc: "Internet + Telefonia", value: 320, code: "3.02", supplier: "VIVO Telecom" },
      { desc: "Google Ads", value: 500, code: "3.03", supplier: "Google Ads" },
      { desc: "Pró-labore", value: 4500, code: "3.04", supplier: "Sócio" },
      { desc: "Ferramentas SaaS", value: 280, code: "3.05", supplier: "AWS/Vercel" },
    ];
    for (let m = 0; m < 6; m++) {
      const isPast = m > 0;
      for (const exp of expenses) {
        titleInserts.push({
          org_id: orgId, type: "pagar", origin: "despesa_operacional",
          description: exp.desc, supplier_name: exp.supplier,
          plan_account_code: exp.code, competency: competencia(m),
          issued_at: pastDate(m * 30), due_at: pastDate(m * 30 - 10),
          value_original: exp.value, status: isPast ? "pago" : "aberto",
          bank_account_id: mainBankId,
          metadata: { formaPagamento: "boleto" },
        });
      }
    }

    // Repasses (6 months)
    const repasses = [
      { desc: "Repasse PDV+ mensal", value: 646.50, code: "2.01", supplier: "Franqueadora PDV+" },
      { desc: "Repasse LinkPro mensal", value: 520.60, code: "2.02", supplier: "Franqueadora LinkPro" },
      { desc: "Repasse Torge mensal", value: 159.30, code: "2.03", supplier: "Franqueadora Torge" },
    ];
    for (let m = 0; m < 6; m++) {
      const isPast = m > 0;
      for (const rep of repasses) {
        titleInserts.push({
          org_id: orgId, type: "pagar", origin: "repasse",
          description: rep.desc, supplier_name: rep.supplier,
          plan_account_code: rep.code, competency: competencia(m),
          issued_at: pastDate(m * 30), due_at: pastDate(m * 30 - 10),
          value_original: rep.value, status: isPast ? "pago" : "aberto",
          bank_account_id: mainBankId,
          metadata: { formaPagamento: "transferencia" },
        });
      }
    }

    // ===== Partner commissions =====
    // Find inserted proposal IDs for PROP-0008 and PROP-0009
    const prop0008 = insertedProposals?.find(p => p.proposal_number === "PROP-2026-0008");
    const prop0009 = insertedProposals?.find(p => p.proposal_number === "PROP-2026-0009");

    // 3 implantation commissions (one per partner)
    if (partnerMap["Tech Solutions"] && prop0008) {
      titleInserts.push({
        org_id: orgId, type: "pagar", origin: "comissao_parceiro", commission_type: "implantacao",
        description: "Comissão implantação - Auto Peças Nacional (Tech Solutions)",
        partner_id: partnerMap["Tech Solutions"], reference_proposal_id: prop0008.id,
        client_id: clientMap["Auto Peças Nacional"],
        plan_account_code: "3.04", competency: competencia(1),
        issued_at: pastDate(15), due_at: pastDate(5),
        value_original: 240, status: "pago", bank_account_id: mainBankId,
        supplier_name: "Tech Solutions", metadata: { formaPagamento: "pix" },
      });
    }
    if (partnerMap["Maria Parceira"] && prop0009) {
      titleInserts.push({
        org_id: orgId, type: "pagar", origin: "comissao_parceiro", commission_type: "implantacao",
        description: "Comissão implantação - Farmácia Vida Plena (Maria Parceira)",
        partner_id: partnerMap["Maria Parceira"], reference_proposal_id: prop0009.id,
        client_id: clientMap["Farmácia Vida Plena"],
        plan_account_code: "3.04", competency: competencia(2),
        issued_at: pastDate(25), due_at: pastDate(15),
        value_original: 300, status: "pago", bank_account_id: mainBankId,
        supplier_name: "Maria Parceira", metadata: { formaPagamento: "pix" },
      });
    }
    if (partnerMap["João Indicador"]) {
      // João doesn't have a proposal in seed but we add one implantation commission anyway
      titleInserts.push({
        org_id: orgId, type: "pagar", origin: "comissao_parceiro", commission_type: "implantacao",
        description: "Comissão implantação - Supermercado Bom Preço (João Indicador)",
        partner_id: partnerMap["João Indicador"],
        client_id: clientMap["Supermercado Bom Preço"],
        plan_account_code: "3.04", competency: competencia(3),
        issued_at: pastDate(60), due_at: pastDate(50),
        value_original: 375, status: "pago", bank_account_id: mainBankId,
        supplier_name: "João Indicador", metadata: { formaPagamento: "pix" },
      });
    }

    // 4 recurring commissions paid (past months)
    if (partnerMap["João Indicador"]) {
      for (let m = 2; m <= 3; m++) {
        titleInserts.push({
          org_id: orgId, type: "pagar", origin: "comissao_parceiro", commission_type: "recorrente",
          description: `Comissão recorrente ${competencia(m)} - Supermercado Bom Preço (João Indicador)`,
          partner_id: partnerMap["João Indicador"],
          client_id: clientMap["Supermercado Bom Preço"],
          plan_account_code: "3.04", competency: competencia(m),
          issued_at: pastDate(m * 30), due_at: pastDate(m * 30 - 10),
          value_original: 17.50, status: "pago", bank_account_id: mainBankId,
          supplier_name: "João Indicador", metadata: { formaPagamento: "pix" },
        });
      }
    }
    if (partnerMap["Tech Solutions"]) {
      for (let m = 1; m <= 2; m++) {
        titleInserts.push({
          org_id: orgId, type: "pagar", origin: "comissao_parceiro", commission_type: "recorrente",
          description: `Comissão recorrente ${competencia(m)} - Auto Peças Nacional (Tech Solutions)`,
          partner_id: partnerMap["Tech Solutions"],
          client_id: clientMap["Auto Peças Nacional"],
          plan_account_code: "3.04", competency: competencia(m),
          issued_at: pastDate(m * 30), due_at: pastDate(m * 30 - 10),
          value_original: 9.60, status: "pago", bank_account_id: mainBankId,
          supplier_name: "Tech Solutions", metadata: { formaPagamento: "pix" },
        });
      }
    }

    // 2 recurring commissions open (current month)
    if (partnerMap["João Indicador"]) {
      titleInserts.push({
        org_id: orgId, type: "pagar", origin: "comissao_parceiro", commission_type: "recorrente",
        description: `Comissão recorrente ${competencia(0)} - Supermercado Bom Preço (João Indicador)`,
        partner_id: partnerMap["João Indicador"],
        client_id: clientMap["Supermercado Bom Preço"],
        plan_account_code: "3.04", competency: competencia(0),
        issued_at: pastDate(5), due_at: pastDate(-10),
        value_original: 17.50, status: "aberto", bank_account_id: mainBankId,
        supplier_name: "João Indicador", metadata: { formaPagamento: "pix" },
      });
    }
    if (partnerMap["Tech Solutions"]) {
      titleInserts.push({
        org_id: orgId, type: "pagar", origin: "comissao_parceiro", commission_type: "recorrente",
        description: `Comissão recorrente ${competencia(0)} - Auto Peças Nacional (Tech Solutions)`,
        partner_id: partnerMap["Tech Solutions"],
        client_id: clientMap["Auto Peças Nacional"],
        plan_account_code: "3.04", competency: competencia(0),
        issued_at: pastDate(5), due_at: pastDate(-10),
        value_original: 9.60, status: "aberto", bank_account_id: mainBankId,
        supplier_name: "Tech Solutions", metadata: { formaPagamento: "pix" },
      });
    }

    // Insert in batches
    for (let i = 0; i < titleInserts.length; i += 50) {
      await supabase.from("financial_titles").insert(titleInserts.slice(i, i + 50));
    }
    results.push("Financial titles: " + titleInserts.length);

    // ===== 15. Bank transactions from paid titles =====
    const { data: paidTitles } = await supabase.from("financial_titles").select("id, type, value_original, description, due_at, bank_account_id").eq("org_id", orgId).eq("status", "pago").limit(500);
    if (paidTitles && paidTitles.length > 0) {
      const txInserts = paidTitles.map(t => ({
        org_id: orgId, bank_account_id: t.bank_account_id || mainBankId,
        date: t.due_at || pastDate(0), description: t.description,
        value: t.type === "receber" ? t.value_original : -t.value_original,
        type: t.type === "receber" ? "credito" : "debito",
        reconciled: Math.random() > 0.15, linked_title_id: t.id,
      }));
      for (let i = 0; i < txInserts.length; i += 50) {
        await supabase.from("bank_transactions").insert(txInserts.slice(i, i + 50));
      }
      results.push("Bank transactions: " + txInserts.length);

      // Unmatched bank movements
      const unmatchedMovs = [];
      for (let i = 0; i < 6; i++) {
        const isCredit = i < 2;
        unmatchedMovs.push({
          org_id: orgId, bank_account_id: i % 2 === 0 ? mainBankId : reserveBankId,
          date: pastDate(Math.floor(Math.random() * 60)),
          description: isCredit ? "Depósito não identificado" : "Tarifa bancária",
          value: isCredit ? Math.round((500 + Math.random() * 2000) * 100) / 100 : -Math.round((15 + Math.random() * 100) * 100) / 100,
          type: isCredit ? "credito" : "debito", reconciled: false,
        });
      }
      await supabase.from("bank_transactions").insert(unmatchedMovs);
    }

    return new Response(JSON.stringify({ 
      message: "Seed completo!", 
      results 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
