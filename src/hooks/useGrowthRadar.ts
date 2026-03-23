import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GrowthRadarContext {
  mrr: number;
  arr: number;
  ticketMedio: number;
  clientesAtivos: number;
  churnPct: number;
  retencaoPct: number;
  crescimentoPct: number;
  receitaPerdida: number;
  potencialUpsell: number;
  propostasAbertas: number;
  valorFunil: number;
  propostasEsquecidas: number;
  topOportunidades: Array<{
    nome: string;
    receita: number;
    modulosContratados: number;
    totalModulos: number;
    planoAnual: boolean;
    health: number;
  }>;
  topPerdas: Array<{
    nome: string;
    tipo: string;
    valor: number;
    descricao: string;
  }>;
  reativacao: Array<{
    nome: string;
    canceladoHaDias: number;
    receitaAnterior: number;
  }>;
}

export interface GrowthDiagnosis {
  diagnostico: string;
  oportunidades: Array<{
    tipo: string;
    cliente_nome: string;
    receita_atual: number;
    potencial_adicional: number;
    acao_sugerida: string;
    prioridade: string;
  }>;
  perdas: Array<{
    tipo: string;
    cliente_nome: string;
    valor_impacto: number;
    descricao: string;
  }>;
  projecoes: Array<{
    cenario: string;
    impacto_mrr: string;
    impacto_margem: string;
  }>;
  metricas: {
    crescimento_mensal_pct: number;
    churn_pct: number;
    retencao_pct: number;
    ticket_medio: number;
    potencial_upsell_total: number;
    receita_perdida_total: number;
  };
  alertas: Array<{
    prioridade: string;
    titulo: string;
    descricao: string;
  }>;
}

export function useGrowthRadar(enabled = true) {
  // Aggregate data
  const { data: contextData, isLoading: contextLoading } = useQuery({
    queryKey: ["growth_radar_context"],
    enabled,
    staleTime: 300_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

      const [
        { data: activeClients },
        { data: cancelledClients },
        { data: allClients },
        { data: clientModules },
        { data: systemModules },
        { data: overdueFinancials },
        { data: proposals },
        { data: thisMonthRevenue },
        { data: lastMonthRevenue },
      ] = await Promise.all([
        supabase.from("clients").select("id, name, monthly_value_final, monthly_cost_value, cost_active, health_score, metadata, system_name").eq("status", "ativo"),
        supabase.from("clients").select("id, name, monthly_value_final, cancelled_at").eq("status", "cancelado").gte("cancelled_at", new Date(now.getTime() - 90 * 86400000).toISOString().slice(0, 10)),
        supabase.from("clients").select("id, status").in("status", ["ativo", "cancelado", "suspenso"]),
        supabase.from("client_modules").select("client_id, module_id"),
        supabase.from("system_modules").select("id"),
        supabase.from("financial_titles").select("client_id, value_original, status").eq("type", "receber").eq("status", "vencido"),
        supabase.from("proposals").select("id, monthly_value, acceptance_status, sent_at, first_viewed_at").in("acceptance_status", ["pendente", "enviado"]),
        supabase.from("financial_titles").select("value_original").eq("type", "receber").eq("competency", thisMonth).in("status", ["pago", "aberto", "vencido"]),
        supabase.from("financial_titles").select("value_original").eq("type", "receber").eq("competency", lastMonthKey).in("status", ["pago", "aberto", "vencido"]),
      ]);

      const clients = activeClients || [];
      const mrr = clients.reduce((s, c) => s + Number(c.monthly_value_final || 0), 0);
      const arr = mrr * 12;
      const ticketMedio = clients.length > 0 ? mrr / clients.length : 0;

      const totalClients = (allClients || []).length;
      const cancelledCount = (allClients || []).filter(c => c.status === "cancelado").length;
      const churnPct = totalClients > 0 ? (cancelledCount / totalClients) * 100 : 0;
      const retencaoPct = 100 - churnPct;

      const thisRev = (thisMonthRevenue || []).reduce((s, t) => s + Number(t.value_original || 0), 0);
      const lastRev = (lastMonthRevenue || []).reduce((s, t) => s + Number(t.value_original || 0), 0);
      const crescimentoPct = lastRev > 0 ? ((thisRev - lastRev) / lastRev) * 100 : 0;

      const receitaPerdida = (overdueFinancials || []).reduce((s, t) => s + Number(t.value_original || 0), 0);

      // Upsell: clients with fewer modules than available
      const totalModulesAvailable = (systemModules || []).length;
      const modulesByClient: Record<string, number> = {};
      (clientModules || []).forEach(cm => {
        modulesByClient[cm.client_id] = (modulesByClient[cm.client_id] || 0) + 1;
      });

      const topOportunidades = clients
        .map(c => ({
          nome: c.name,
          receita: Number(c.monthly_value_final || 0),
          modulosContratados: modulesByClient[c.id] || 0,
          totalModulos: totalModulesAvailable,
          planoAnual: (c.metadata as any)?.billing_plan === "anual",
          health: Number(c.health_score || 50),
        }))
        .filter(c => c.modulosContratados < totalModulesAvailable || !c.planoAnual)
        .sort((a, b) => (b.totalModulos - b.modulosContratados) - (a.totalModulos - a.modulosContratados))
        .slice(0, 15);

      const potencialUpsell = topOportunidades.reduce((s, c) => s + (c.totalModulos - c.modulosContratados) * 30, 0);

      // Losses: overdue by client
      const overdueByClient: Record<string, number> = {};
      (overdueFinancials || []).forEach(t => {
        if (t.client_id) overdueByClient[t.client_id] = (overdueByClient[t.client_id] || 0) + Number(t.value_original || 0);
      });
      const topPerdas = Object.entries(overdueByClient)
        .map(([cid, val]) => {
          const client = clients.find(c => c.id === cid);
          return { nome: client?.name || "Cliente", tipo: "inadimplencia", valor: val, descricao: `R$ ${val.toFixed(2)} em atraso` };
        })
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);

      // Low margin clients
      clients
        .filter(c => c.cost_active && Number(c.monthly_cost_value || 0) >= Number(c.monthly_value_final || 0) * 0.8)
        .forEach(c => {
          topPerdas.push({
            nome: c.name,
            tipo: "margem_baixa",
            valor: Number(c.monthly_value_final || 0) - Number(c.monthly_cost_value || 0),
            descricao: `Margem de apenas R$ ${(Number(c.monthly_value_final || 0) - Number(c.monthly_cost_value || 0)).toFixed(2)}/mês`,
          });
        });

      const reativacao = (cancelledClients || []).map(c => ({
        nome: c.name,
        canceladoHaDias: Math.floor((now.getTime() - new Date(c.cancelled_at || now).getTime()) / 86400000),
        receitaAnterior: Number(c.monthly_value_final || 0),
      }));

      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
      const propostasArr = (proposals || []) as any[];
      const propostasEsquecidas = propostasArr.filter((p: any) => {
        if (p.first_viewed_at) return false;
        if (!p.sent_at) return false;
        return new Date(p.sent_at) < sevenDaysAgo;
      }).length;

      const valorFunil = propostasArr.reduce((s: number, p: any) => s + Number(p.monthly_value || 0), 0);

      return {
        mrr, arr, ticketMedio, clientesAtivos: clients.length,
        churnPct, retencaoPct, crescimentoPct, receitaPerdida,
        potencialUpsell, propostasAbertas: propostasArr.length,
        valorFunil, propostasEsquecidas,
        topOportunidades, topPerdas: topPerdas.slice(0, 10), reativacao,
      } as GrowthRadarContext;
    },
  });

  // AI diagnosis
  const { data: diagnosis, isLoading: diagnosisLoading, refetch } = useQuery({
    queryKey: ["growth_radar_diagnosis", contextData],
    enabled: !!contextData,
    staleTime: 300_000,
    queryFn: async () => {
      if (!contextData) return null;
      const { data, error } = await supabase.functions.invoke("ai-consultant", {
        body: { type: "growth_radar", context: contextData },
      });
      if (error) throw error;
      return data as GrowthDiagnosis;
    },
  });

  return {
    context: contextData,
    diagnosis,
    isLoading: contextLoading || diagnosisLoading,
    contextLoading,
    diagnosisLoading,
    refetch,
  };
}
