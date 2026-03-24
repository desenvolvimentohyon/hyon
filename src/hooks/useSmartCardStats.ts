import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, format, subMonths } from "date-fns";

export interface CardStats {
  mainValue: string;
  mainLabel: string;
  secondaryValue?: string;
  secondaryLabel?: string;
  trend?: "up" | "down" | "neutral";
  sparklineData?: number[];
}

export function useSmartCardStats() {
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const currentComp = format(now, "yyyy-MM");

  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ["smart-card-stats", currentComp],
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const result: Record<string, CardStats> = {};

      // --- CLIENTS ---
      const [{ count: activeClients }, { count: newClients }] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("status", "ativo").gte("created_at", monthStart),
      ]);
      result["/clientes"] = {
        mainValue: String(activeClients ?? 0),
        mainLabel: "ativos",
        secondaryValue: `+${newClients ?? 0}`,
        secondaryLabel: "este mês",
        trend: (newClients ?? 0) > 0 ? "up" : "neutral",
      };

      // --- MRR ---
      const { data: mrrData } = await supabase
        .from("clients")
        .select("monthly_value_final")
        .eq("status", "ativo");
      const mrr = (mrrData ?? []).reduce((s, c) => s + (c.monthly_value_final || 0), 0);
      
      // Previous month MRR via sparkline approach
      const months: number[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = format(subMonths(now, i), "yyyy-MM");
        // We approximate using current active clients - a real sparkline would need historical data
        months.push(i === 0 ? mrr : 0);
      }
      
      result["/receita"] = {
        mainValue: `R$ ${(mrr / 1000).toFixed(1)}k`,
        mainLabel: "MRR",
        trend: mrr > 0 ? "up" : "neutral",
      };

      // --- PROPOSALS ---
      const [{ count: sentThisMonth }, { count: acceptedThisMonth }] = await Promise.all([
        supabase.from("proposals").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
        supabase.from("proposals").select("*", { count: "exact", head: true }).eq("acceptance_status", "aceita").gte("created_at", monthStart),
      ]);
      const sent = sentThisMonth ?? 0;
      const accepted = acceptedThisMonth ?? 0;
      const convRate = sent > 0 ? Math.round((accepted / sent) * 100) : 0;
      result["/propostas"] = {
        mainValue: String(sent),
        mainLabel: "enviadas",
        secondaryValue: `${convRate}%`,
        secondaryLabel: "conversão",
        trend: convRate >= 30 ? "up" : convRate > 0 ? "neutral" : "neutral",
      };

      // --- CRM ---
      const { count: crmLeads } = await supabase
        .from("proposals")
        .select("*", { count: "exact", head: true })
        .not("crm_status", "in", '("ganho","perdido")');
      result["/crm"] = {
        mainValue: String(crmLeads ?? 0),
        mainLabel: "leads ativos",
      };

      // --- COMERCIAL ---
      const { data: acceptedData } = await supabase
        .from("proposals")
        .select("monthly_value")
        .eq("acceptance_status", "aceita")
        .gte("created_at", monthStart);
      const totalAcceptedValue = (acceptedData ?? []).reduce((s, p) => s + (p.monthly_value || 0), 0);
      result["/comercial"] = {
        mainValue: String(accepted),
        mainLabel: "aceitas no mês",
        secondaryValue: `R$ ${(totalAcceptedValue / 1000).toFixed(1)}k`,
        secondaryLabel: "valor",
        trend: accepted > 0 ? "up" : "neutral",
      };

      // --- PARTNERS ---
      const { count: activePartners } = await supabase
        .from("partners")
        .select("*", { count: "exact", head: true })
        .eq("active", true);
      result["/parceiros"] = {
        mainValue: String(activePartners ?? 0),
        mainLabel: "ativos",
      };

      // --- FINANCEIRO ---
      const today = format(now, "yyyy-MM-dd");
      const [{ data: recPaid }, { count: overdueCount }] = await Promise.all([
        supabase.from("financial_titles").select("value_final").eq("type", "receber").eq("status", "pago").eq("competency", currentComp),
        supabase.from("financial_titles").select("*", { count: "exact", head: true }).eq("type", "receber").eq("status", "aberto").lt("due_at", today),
      ]);
      const receitaMes = (recPaid ?? []).reduce((s, t) => s + (t.value_final || 0), 0);
      result["/financeiro"] = {
        mainValue: `R$ ${(receitaMes / 1000).toFixed(1)}k`,
        mainLabel: "receita do mês",
        secondaryValue: String(overdueCount ?? 0),
        secondaryLabel: "em atraso",
        trend: (overdueCount ?? 0) > 0 ? "down" : "up",
      };

      // Contas a receber
      const { data: arOpen } = await supabase
        .from("financial_titles")
        .select("value_final")
        .eq("type", "receber")
        .eq("status", "aberto");
      const totalAR = (arOpen ?? []).reduce((s, t) => s + (t.value_final || 0), 0);
      result["/financeiro/contas-a-receber"] = {
        mainValue: `R$ ${(totalAR / 1000).toFixed(1)}k`,
        mainLabel: "a receber",
        secondaryValue: String(overdueCount ?? 0),
        secondaryLabel: "em atraso",
        trend: (overdueCount ?? 0) > 0 ? "down" : "up",
      };

      // Contas a pagar
      const [{ data: apOpen }, { count: apOverdue }] = await Promise.all([
        supabase.from("financial_titles").select("value_final").eq("type", "pagar").eq("status", "aberto"),
        supabase.from("financial_titles").select("*", { count: "exact", head: true }).eq("type", "pagar").eq("status", "aberto").lt("due_at", today),
      ]);
      const totalAP = (apOpen ?? []).reduce((s, t) => s + (t.value_final || 0), 0);
      result["/financeiro/contas-a-pagar"] = {
        mainValue: `R$ ${(totalAP / 1000).toFixed(1)}k`,
        mainLabel: "a pagar",
        secondaryValue: String(apOverdue ?? 0),
        secondaryLabel: "vencidas",
        trend: (apOverdue ?? 0) > 0 ? "down" : "neutral",
      };

      // --- SUPORTE (portal_tickets) ---
      const [{ count: ticketsOpen }, { count: ticketsProgress }] = await Promise.all([
        supabase.from("portal_tickets").select("*", { count: "exact", head: true }).eq("status", "aberto"),
        supabase.from("portal_tickets").select("*", { count: "exact", head: true }).eq("status", "em_andamento"),
      ]);
      result["/suporte"] = {
        mainValue: String(ticketsOpen ?? 0),
        mainLabel: "abertos",
        secondaryValue: String(ticketsProgress ?? 0),
        secondaryLabel: "em andamento",
        trend: (ticketsOpen ?? 0) > 5 ? "down" : "neutral",
      };

      // --- TAREFAS ---
      const [{ count: tasksPending }, { count: tasksProgress }] = await Promise.all([
        supabase.from("tasks").select("*", { count: "exact", head: true }).in("status", ["backlog", "a_fazer"]),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "em_andamento"),
      ]);
      result["/tarefas"] = {
        mainValue: String(tasksPending ?? 0),
        mainLabel: "pendentes",
        secondaryValue: String(tasksProgress ?? 0),
        secondaryLabel: "em andamento",
        trend: (tasksPending ?? 0) > 10 ? "down" : "neutral",
      };

      // --- CARTÕES ---
      const { count: cardActive } = await supabase
        .from("card_clients")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");
      result["/cartoes"] = {
        mainValue: String(cardActive ?? 0),
        mainLabel: "clientes ativos",
      };

      // --- DASHBOARD ---
      result["/"] = {
        mainValue: String(activeClients ?? 0),
        mainLabel: "clientes",
        secondaryValue: `R$ ${(mrr / 1000).toFixed(1)}k`,
        secondaryLabel: "MRR",
        trend: "up",
      };

      result["/executivo"] = {
        mainValue: `R$ ${(mrr * 12 / 1000).toFixed(0)}k`,
        mainLabel: "ARR",
        trend: mrr > 0 ? "up" : "neutral",
      };

      return result;
    },
  });

  return { stats, isLoading };
}
