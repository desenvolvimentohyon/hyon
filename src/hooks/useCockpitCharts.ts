import { useQuery } from "@tanstack/react-query";
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
  const now = new Date();
  const currentMonth = format(now, "yyyy-MM");

  const { data, isLoading } = useQuery({
    queryKey: ["cockpit-charts", currentMonth],
    staleTime: 10 * 60 * 1000, // 10 minutos de cache
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<CockpitChartsData> => {
      const months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        months.push(format(subMonths(now, i), "yyyy-MM"));
      }

      // queries em paralelo para performance
      const [titlesRes, newClientsRes, cancelledClientsRes, propsRes, taskRes] = await Promise.all([
        supabase
          .from("financial_titles")
          .select("competency, value_final")
          .eq("type", "receber")
          .eq("status", "pago")
          .in("competency", months),
        supabase
          .from("clients")
          .select("created_at")
          .gte("created_at", format(subMonths(now, 6), "yyyy-MM-dd")),
        supabase
          .from("clients")
          .select("cancelled_at")
          .not("cancelled_at", "is", null)
          .gte("cancelled_at", format(subMonths(now, 6), "yyyy-MM-dd")),
        supabase
          .from("proposals" as any)
          .select("status"),
        supabase
          .from("tasks" as any)
          .select("status")
      ]);

      // MRR Processamento
      const mrrMap: Record<string, number> = {};
      months.forEach(m => mrrMap[m] = 0);
      titlesRes.data?.forEach(t => {
        if (t.competency && mrrMap[t.competency] !== undefined) {
          mrrMap[t.competency] += Number(t.value_final) || 0;
        }
      });
      const mrr: MrrPoint[] = months.map(m => ({ month: m.slice(5), value: mrrMap[m] }));

      // Evolução de Clientes
      const novosMap: Record<string, number> = {};
      const canceladosMap: Record<string, number> = {};
      months.forEach(m => { novosMap[m] = 0; canceladosMap[m] = 0; });
      newClientsRes.data?.forEach(c => {
        const cm = format(new Date(c.created_at), "yyyy-MM");
        if (novosMap[cm] !== undefined) novosMap[cm]++;
      });
      cancelledClientsRes.data?.forEach(c => {
        if (c.cancelled_at) {
          const ccm = format(new Date(c.cancelled_at), "yyyy-MM");
          if (canceladosMap[ccm] !== undefined) canceladosMap[ccm]++;
        }
      });
      const clients: ClientEvolution[] = months.map(m => ({
        month: m.slice(5), novos: novosMap[m], cancelados: canceladosMap[m],
      }));

      // Funil
      const funnelCounts: Record<string, number> = { enviada: 0, aceita: 0, recusada: 0 };
      (propsRes.data as any[])?.forEach(p => {
        if (p.status === "enviada" || p.status === "draft") funnelCounts.enviada++;
        else if (p.status === "aceita") funnelCounts.aceita++;
        else if (p.status === "recusada" || p.status === "perdida") funnelCounts.recusada++;
      });
      const funnel: FunnelItem[] = [
        { label: "Abertas", count: funnelCounts.enviada, color: "hsl(var(--primary))" },
        { label: "Aceitas", count: funnelCounts.aceita, color: "#10b981" },
        { label: "Perdidas", count: funnelCounts.recusada, color: "hsl(var(--destructive))" },
      ];

      // Tarefas
      const taskCounts: Record<string, number> = { pendente: 0, andamento: 0, concluida: 0 };
      (taskRes.data as any[])?.forEach(t => {
        if (t.status === "backlog" || t.status === "a_fazer") taskCounts.pendente++;
        else if (t.status === "em_andamento" || t.status === "aguardando_cliente") taskCounts.andamento++;
        else if (t.status === "concluida") taskCounts.concluida++;
      });
      const tasks: TaskDistribution[] = [
        { label: "Pendentes", count: taskCounts.pendente, color: "#f59e0b" },
        { label: "Andamento", count: taskCounts.andamento, color: "hsl(var(--primary))" },
        { label: "Concluídas", count: taskCounts.concluida, color: "#10b981" },
      ];

      return { mrr, clients, funnel, tasks };
    }
  });

  return { data: data || { mrr: [], clients: [], funnel: [], tasks: [] }, isLoading };
}
