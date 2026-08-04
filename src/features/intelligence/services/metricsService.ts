import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook centralizado para métricas e indicadores de inteligência.
 * Implementa cache inteligente para dashboards.
 */
export function useIntelligenceMetrics() {
  return useQuery({
    queryKey: ["intelligence_metrics"],
    queryFn: async () => {
      // Consultas paralelas para otimizar performance
      const [mrrRes, churnRes, ticketsRes] = await Promise.all([
        supabase.rpc('calculate_mrr'),
        supabase.rpc('calculate_churn'),
        supabase.rpc('get_active_tickets_count')
      ]);
      
      return {
        mrr: mrrRes.data || 0,
        churn: churnRes.data || 0,
        activeTickets: ticketsRes.data || 0,
        lastUpdate: new Date().toISOString()
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000,
  });
}
