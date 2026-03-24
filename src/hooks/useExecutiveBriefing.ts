import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BriefingAlerta {
  prioridade: "alta" | "media" | "baixa";
  categoria: "comercial" | "financeiro" | "clientes" | "suporte" | "renovacoes";
  titulo: string;
  descricao: string;
  acao_sugerida: string;
}

export interface BriefingSugestao {
  titulo: string;
  descricao: string;
  tipo_acao: "tarefa" | "contato" | "proposta" | "cobranca" | "renovacao";
}

export interface BriefingMetricas {
  mrr: number;
  clientes_ativos: number;
  inadimplentes: number;
  propostas_abertas: number;
  tickets_abertos: number;
  tarefas_pendentes: number;
}

export interface ExecutiveBriefing {
  saudacao: string;
  resumoDia: string;
  alertas: BriefingAlerta[];
  sugestoes: BriefingSugestao[];
  metricas: BriefingMetricas;
}

async function fetchSystemContext() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const in30d = new Date(now); in30d.setDate(in30d.getDate() + 30);
  const in7d = new Date(now); in7d.setDate(in7d.getDate() + 7);
  const todayStr = now.toISOString().split("T")[0];

  // Split into smaller batches to avoid TS2589 (excessive type depth)
  const [clientesAtivosRes, clientesAtrasoRes, clientesNovosMesRes, certVencendoRes, mrrRes] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "ativo"),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "ativo").contains("metadata", { statusFinanceiro: "2_mais_atrasos" }),
    supabase.from("clients").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "ativo").not("cert_expires_at", "is", null).lte("cert_expires_at", in30d.toISOString().split("T")[0]),
    supabase.from("clients").select("monthly_value_final").eq("status", "ativo").eq("recurrence_active", true),
  ]);

  const propostasAbertasRes = await supabase.from("proposals" as any).select("id", { count: "exact", head: true }).in("status_aceite", ["pendente", "enviada"]);
  const propostasSemViewRes = await supabase.from("proposals" as any).select("id", { count: "exact", head: true }).is("first_viewed_at", null).in("status_aceite", ["pendente", "enviada"]);
  const propostasAceitasMesRes = await supabase.from("proposals" as any).select("id", { count: "exact", head: true }).eq("status_aceite", "aceitou").gte("created_at", startOfMonth);

  const [titulosVencidosRes, tarefasPendentesRes] = await Promise.all([
    supabase.from("financial_titles").select("id, value_final", { count: "exact" }).eq("type", "receber").eq("status", "aberto").lt("due_at", todayStr),
    supabase.from("tasks" as any).select("id", { count: "exact", head: true }).in("status", ["backlog", "a_fazer", "em_andamento"]),
  ]);

  const [tarefasUrgentesRes, tarefasAtrasadasRes, ticketsAbertosRes, planosVencendoRes, comissoesPendentesRes] = await Promise.all([
    supabase.from("tasks" as any).select("id", { count: "exact", head: true }).eq("priority", "urgente").in("status", ["backlog", "a_fazer", "em_andamento"]),
    supabase.from("tasks" as any).select("id", { count: "exact", head: true }).in("status", ["backlog", "a_fazer", "em_andamento"]).lt("due_at", now.toISOString()),
    supabase.from("portal_tickets" as any).select("id", { count: "exact", head: true }).in("status", ["aberto", "em_andamento"]),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "ativo").not("metadata->plan_end_date", "is", null),
    supabase.from("financial_titles").select("id", { count: "exact", head: true }).eq("type", "pagar").eq("status", "aberto").eq("commission_type", "parceiro"),
  ]);

  const mrr = (mrrRes.data || []).reduce((s, c) => s + Number(c.monthly_value_final || 0), 0);
  const valorAtraso = (titulosVencidosRes.data || []).reduce((s: number, t: any) => s + Number(t.value_final || 0), 0);

  return {
    clientesAtivos: clientesAtivosRes.count ?? 0,
    clientesAtraso: clientesAtrasoRes.count ?? 0,
    clientesNovosMes: clientesNovosMesRes.count ?? 0,
    certVencendo: certVencendoRes.count ?? 0,
    mrr,
    titulosVencidos: titulosVencidosRes.count ?? 0,
    valorAtraso,
    propostasAbertas: propostasAbertasRes.count ?? 0,
    propostasSemView: propostasSemViewRes.count ?? 0,
    propostasAceitasMes: propostasAceitasMesRes.count ?? 0,
    tarefasPendentes: tarefasPendentesRes.count ?? 0,
    tarefasUrgentes: tarefasUrgentesRes.count ?? 0,
    tarefasAtrasadas: tarefasAtrasadasRes.count ?? 0,
    ticketsAbertos: ticketsAbertosRes.count ?? 0,
    planosVencendo: planosVencendoRes.count ?? 0,
    comissoesPendentes: comissoesPendentesRes.count ?? 0,
  };
}

export function useExecutiveBriefing() {
  const { profile } = useAuth();

  const contextQuery = useQuery({
    queryKey: ["executive-context"],
    queryFn: fetchSystemContext,
    staleTime: 300_000,
    refetchOnWindowFocus: true,
    enabled: !!profile,
  });

  const briefingQuery = useQuery({
    queryKey: ["executive-briefing", contextQuery.data],
    queryFn: async () => {
      if (!contextQuery.data) throw new Error("No context");
      const hora = new Date().getHours();
      const { data, error } = await supabase.functions.invoke("ai-consultant", {
        body: {
          type: "executive_briefing",
          context: contextQuery.data,
          userName: profile?.full_name || "Usuário",
          hora,
        },
      });
      if (error) throw error;
      return data as ExecutiveBriefing;
    },
    enabled: !!contextQuery.data && !!profile,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  return {
    briefing: briefingQuery.data,
    context: contextQuery.data,
    isLoading: contextQuery.isLoading || briefingQuery.isLoading,
    isError: briefingQuery.isError,
    error: briefingQuery.error,
    refetch: () => {
      contextQuery.refetch();
      briefingQuery.refetch();
    },
  };
}
