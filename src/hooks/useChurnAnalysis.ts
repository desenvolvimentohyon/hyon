import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChurnClientRisk {
  id: string;
  nome: string;
  scoreChurn: number;
  classificacao: "alto" | "medio" | "baixo";
  receitaMensal: number;
  healthScore: number;
  titulosVencidos: number;
  ticketsSuporte: number;
  renovacaoPendente: boolean;
  canceladoHa?: number;
}

export interface ChurnDiagnosis {
  resumo: string;
  clientes_risco: Array<{
    nome: string;
    score_churn: number;
    classificacao: "alto" | "medio" | "baixo";
    motivos: string[];
    receita_mensal: number;
    impacto_cancelamento: string;
    acoes_sugeridas: Array<{ titulo: string; tipo: string }>;
  }>;
  metricas: {
    total_risco_alto: number;
    total_risco_medio: number;
    churn_mes_atual: number;
    retencao_pct: number;
    valor_em_risco: number;
  };
  alertas: Array<{ prioridade: string; titulo: string; descricao: string }>;
  recuperacao: Array<{ nome: string; cancelado_ha_dias: number; receita_anterior: number; sugestao: string }>;
}

export function useChurnAnalysis(enabled = true) {
  const { profile } = useAuth();

  return useQuery<ChurnDiagnosis>({
    queryKey: ["churn-analysis"],
    enabled: enabled && !!profile?.org_id,
    staleTime: 300_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // 1. Fetch active + recently cancelled clients
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name, status, monthly_value_final, monthly_cost_value, health_score, health_status, cancelled_at, metadata, cert_expires_at")
        .in("status", ["ativo", "cancelado"])
        .limit(500);

      const allClients = clients || [];
      const activeClients = allClients.filter(c => c.status === "ativo");
      const cancelledRecent = allClients.filter(c => {
        if (c.status !== "cancelado" || !c.cancelled_at) return false;
        const days = Math.floor((Date.now() - new Date(c.cancelled_at).getTime()) / 86400000);
        return days <= 90;
      });

      // 2. Fetch overdue titles
      const today = new Date().toISOString().split("T")[0];
      const { data: overdueTitles } = await supabase
        .from("financial_titles")
        .select("client_id, value_final")
        .eq("type", "receita")
        .eq("status", "aberto")
        .lt("due_at", today)
        .not("client_id", "is", null);

      // 3. Build overdue map
      const overdueMap = new Map<string, number>();
      (overdueTitles || []).forEach(t => {
        if (t.client_id) overdueMap.set(t.client_id, (overdueMap.get(t.client_id) || 0) + 1);
      });

      // 4. Calculate churn score per client
      const scored: ChurnClientRisk[] = activeClients.map(c => {
        const titulosVencidos = overdueMap.get(c.id) || 0;
        const healthScore = c.health_score ?? 100;
        const meta = c.metadata as any;
        const planEnd = meta?.plan_end_date;
        const renovacaoPendente = planEnd ? new Date(planEnd) <= new Date(Date.now() + 15 * 86400000) : false;

        // Weighted score: higher = more risk
        const inadScore = Math.min(titulosVencidos * 25, 100) * 0.3;
        const healthRisk = (100 - healthScore) * 0.3;
        const renewalRisk = renovacaoPendente ? 20 : 0; // 20% weight
        const ticketsSuporte = 0; // simplified - no portal_tickets query for perf

        const raw = inadScore + healthRisk + renewalRisk;
        const scoreChurn = Math.min(Math.round(raw), 100);

        return {
          id: c.id,
          nome: c.name,
          scoreChurn,
          classificacao: scoreChurn >= 60 ? "alto" : scoreChurn >= 35 ? "medio" : "baixo",
          receitaMensal: c.monthly_value_final || 0,
          healthScore,
          titulosVencidos,
          ticketsSuporte,
          renovacaoPendente,
        } as ChurnClientRisk;
      });

      // Sort by risk descending
      scored.sort((a, b) => b.scoreChurn - a.scoreChurn);
      const top20 = scored.slice(0, 20);

      // Cancelled clients for recovery
      const recovery = cancelledRecent.map(c => ({
        nome: c.name,
        canceladoHaDias: c.cancelled_at ? Math.floor((Date.now() - new Date(c.cancelled_at).getTime()) / 86400000) : 0,
        receitaAnterior: c.monthly_value_final || 0,
      }));

      // Metrics
      const totalAtivos = activeClients.length;
      const churnMes = cancelledRecent.filter(c => {
        if (!c.cancelled_at) return false;
        const d = new Date(c.cancelled_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;
      const riscoAlto = scored.filter(s => s.classificacao === "alto").length;
      const riscoMedio = scored.filter(s => s.classificacao === "medio").length;
      const valorEmRisco = scored.filter(s => s.classificacao === "alto").reduce((s, c) => s + c.receitaMensal, 0);

      // 5. Call AI for enriched analysis
      const context = {
        clientesAtivos: totalAtivos,
        churnMes,
        riscoAlto,
        riscoMedio,
        valorEmRisco,
        retencaoPct: totalAtivos > 0 ? ((totalAtivos - churnMes) / totalAtivos * 100) : 100,
        topClientes: top20.map(c => ({
          nome: c.nome,
          score: c.scoreChurn,
          classificacao: c.classificacao,
          receita: c.receitaMensal,
          titulosVencidos: c.titulosVencidos,
          healthScore: c.healthScore,
          renovacaoPendente: c.renovacaoPendente,
        })),
        recuperacao: recovery.slice(0, 5),
      };

      const { data: diagnosis, error } = await supabase.functions.invoke("ai-consultant", {
        body: { type: "churn_analysis", context },
      });

      if (error) throw error;
      return diagnosis as ChurnDiagnosis;
    },
  });
}
