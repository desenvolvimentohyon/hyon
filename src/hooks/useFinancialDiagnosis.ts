import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FinancialDiagnosisAlert {
  prioridade: "alta" | "media" | "baixa";
  categoria: string;
  titulo: string;
  descricao: string;
  acao_sugerida: string;
}

export interface FinancialRecommendation {
  titulo: string;
  descricao: string;
  tipo_acao: string;
  cliente_nome?: string;
  impacto: string;
}

export interface ClientProfitability {
  nome: string;
  receita: number;
  custo: number;
  margem: number;
  classificacao: "saudavel" | "atencao" | "critico";
}

export interface FinancialScenario {
  descricao: string;
  impacto_mrr: string;
  impacto_margem: string;
}

export interface FinancialDiagnosis {
  resumo: string;
  alertas: FinancialDiagnosisAlert[];
  recomendacoes: FinancialRecommendation[];
  lucratividade_clientes: ClientProfitability[];
  projecoes: {
    mrr_atual: number;
    arr_atual: number;
    ticket_medio: number;
    margem_pct: number;
    inadimplencia_pct: number;
    tendencia: "crescimento" | "estavel" | "queda";
  };
  cenarios: FinancialScenario[];
}

async function fetchFinancialContext() {
  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const mesAnterior = (() => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  const [clientsRes, titlesCurrentRes, titlesPrevRes, titlesOverdueRes, proposalsRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, monthly_value_final, monthly_cost_value, cost_active, status, system_name, health_score")
      .eq("status", "ativo") as any,
    supabase
      .from("financial_titles")
      .select("type, value_original, origin, status")
      .eq("competency", mesAtual) as any,
    supabase
      .from("financial_titles")
      .select("type, value_original, status")
      .eq("competency", mesAnterior) as any,
    supabase
      .from("financial_titles")
      .select("id, value_original, interest, fine, client_id")
      .eq("type", "receber")
      .eq("status", "vencido") as any,
    supabase
      .from("proposals")
      .select("id, valor_mensal, desconto_percent, status_aceite")
      .in("status_aceite", ["pendente", "visualizou"]) as any,
  ]);

  const clients = (clientsRes.data || []) as any[];
  const titlesCurrent = (titlesCurrentRes.data || []) as any[];
  const titlesPrev = (titlesPrevRes.data || []) as any[];
  const titlesOverdue = (titlesOverdueRes.data || []) as any[];
  const proposals = (proposalsRes.data || []) as any[];

  const mrr = clients.reduce((s: number, c: any) => s + Number(c.monthly_value_final || 0), 0);
  const custos = clients.filter((c: any) => c.cost_active).reduce((s: number, c: any) => s + Number(c.monthly_cost_value || 0), 0);
  const arr = mrr * 12;
  const ticketMedio = clients.length > 0 ? mrr / clients.length : 0;
  const margem = mrr - custos;
  const margemPct = mrr > 0 ? (margem / mrr) * 100 : 0;

  const inadimplenciaTotal = titlesOverdue.reduce((s: number, t: any) => s + Number(t.value_original || 0) + Number(t.interest || 0) + Number(t.fine || 0), 0);
  const inadimplenciaPct = mrr > 0 ? (inadimplenciaTotal / mrr) * 100 : 0;

  const receitaMesAtual = titlesCurrent.filter((t: any) => t.type === "receber").reduce((s: number, t: any) => s + Number(t.value_original || 0), 0);
  const receitaMesAnterior = titlesPrev.filter((t: any) => t.type === "receber").reduce((s: number, t: any) => s + Number(t.value_original || 0), 0);

  const tendencia = receitaMesAtual > receitaMesAnterior * 1.03 ? "crescimento" : receitaMesAtual < receitaMesAnterior * 0.97 ? "queda" : "estavel";

  // Top 10 clients by revenue
  const topClients = [...clients]
    .sort((a: any, b: any) => Number(b.monthly_value_final || 0) - Number(a.monthly_value_final || 0))
    .slice(0, 10)
    .map((c: any) => ({
      nome: c.name,
      receita: Number(c.monthly_value_final || 0),
      custo: c.cost_active ? Number(c.monthly_cost_value || 0) : 0,
      sistema: c.system_name || "—",
      health: c.health_score ?? 100,
    }));

  return {
    mrr, arr, ticketMedio, custos, margem, margemPct,
    inadimplenciaTotal, inadimplenciaPct, tendencia,
    clientesAtivos: clients.length,
    titulosVencidos: titlesOverdue.length,
    receitaMesAtual, receitaMesAnterior,
    propostasAbertas: proposals.length,
    valorFunilPropostas: proposals.reduce((s: number, p: any) => s + Number(p.valor_mensal || 0), 0),
    topClients,
  };
}

export function useFinancialDiagnosis() {
  return useQuery<FinancialDiagnosis>({
    queryKey: ["financial_diagnosis"],
    staleTime: 300_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const ctx = await fetchFinancialContext();

      const response = await supabase.functions.invoke("ai-consultant", {
        body: { type: "financial_analysis", context: ctx },
      });

      if (response.error) throw new Error(response.error.message || "Erro ao consultar IA financeira");
      return response.data as FinancialDiagnosis;
    },
  });
}

export function useFinancialContext() {
  return useQuery({
    queryKey: ["financial_context"],
    staleTime: 300_000,
    queryFn: fetchFinancialContext,
  });
}
