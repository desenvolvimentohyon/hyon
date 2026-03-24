import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths } from "date-fns";

interface MrrPoint { month: string; value: number }
interface ClientEvolution { month: string; novos: number; cancelados: number }
interface FunnelItem { label: string; count: number; color: string }
interface TaskDistribution { label: string; count: number; color: string }

export interface CockpitChartsData {
  mrr: MrrPoint[];
  clients: ClientEvolution[];
  funnel: FunnelItem[];
  tasks: TaskDistribution[];
}

export function useCockpitCharts() {
  const [data, setData] = useState<CockpitChartsData>({ mrr: [], clients: [], funnel: [], tasks: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const now = new Date();
      const months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        months.push(format(subMonths(now, i), "yyyy-MM"));
      }

      try {
        // MRR: financial_titles type=receita, status=pago, grouped by competency
        const { data: titles } = await supabase
          .from("financial_titles")
          .select("competency, value_final")
          .eq("type", "receita")
          .eq("status", "pago")
          .in("competency", months);

        const mrrMap: Record<string, number> = {};
        months.forEach(m => mrrMap[m] = 0);
        titles?.forEach(t => {
          if (t.competency && mrrMap[t.competency] !== undefined) {
            mrrMap[t.competency] += Number(t.value_final) || 0;
          }
        });
        const mrr: MrrPoint[] = months.map(m => ({ month: m.slice(5), value: mrrMap[m] }));

        // Clients evolution
        const sixMonthsAgo = format(subMonths(now, 6), "yyyy-MM-dd");
        const { data: allClients } = await supabase
          .from("clients")
          .select("created_at, cancelled_at, status")
          .gte("created_at", sixMonthsAgo);

        const novosMap: Record<string, number> = {};
        const canceladosMap: Record<string, number> = {};
        months.forEach(m => { novosMap[m] = 0; canceladosMap[m] = 0; });
        allClients?.forEach(c => {
          const cm = format(new Date(c.created_at), "yyyy-MM");
          if (novosMap[cm] !== undefined) novosMap[cm]++;
          if (c.cancelled_at) {
            const ccm = format(new Date(c.cancelled_at), "yyyy-MM");
            if (canceladosMap[ccm] !== undefined) canceladosMap[ccm]++;
          }
        });
        const clients: ClientEvolution[] = months.map(m => ({
          month: m.slice(5), novos: novosMap[m], cancelados: canceladosMap[m],
        }));

        // Funnel: proposals by status
        const { data: props } = await supabase
          .from("proposals" as any)
          .select("status");

        const funnelCounts: Record<string, number> = { enviada: 0, aceita: 0, recusada: 0 };
        (props as any[])?.forEach(p => {
          if (p.status === "enviada" || p.status === "draft") funnelCounts.enviada++;
          else if (p.status === "aceita") funnelCounts.aceita++;
          else if (p.status === "recusada" || p.status === "perdida") funnelCounts.recusada++;
        });
        const funnel: FunnelItem[] = [
          { label: "Abertas", count: funnelCounts.enviada, color: "hsl(var(--primary))" },
          { label: "Aceitas", count: funnelCounts.aceita, color: "#10b981" },
          { label: "Perdidas", count: funnelCounts.recusada, color: "hsl(var(--destructive))" },
        ];

        // Tasks by status
        const { data: taskData } = await supabase
          .from("tasks" as any)
          .select("status");

        const taskCounts: Record<string, number> = { pendente: 0, andamento: 0, concluida: 0 };
        (taskData as any[])?.forEach(t => {
          if (t.status === "backlog" || t.status === "a_fazer") taskCounts.pendente++;
          else if (t.status === "em_andamento" || t.status === "aguardando_cliente") taskCounts.andamento++;
          else if (t.status === "concluida") taskCounts.concluida++;
        });
        const tasks: TaskDistribution[] = [
          { label: "Pendentes", count: taskCounts.pendente, color: "#f59e0b" },
          { label: "Andamento", count: taskCounts.andamento, color: "hsl(var(--primary))" },
          { label: "Concluídas", count: taskCounts.concluida, color: "#10b981" },
        ];

        if (!cancelled) setData({ mrr, clients, funnel, tasks });
      } catch (err) {
        console.error("useCockpitCharts error:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading };
}
