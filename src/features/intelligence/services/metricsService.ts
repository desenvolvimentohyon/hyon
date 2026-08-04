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
      // Criar as RPCs de banco de dados (calculate_mrr, calculate_churn) para alimentar a IA com dados reais.
      // Em produção, estas chamadas seriam rpc() reais.
      return {
        mrr: 125000,
        churn: 1.2,
        activeTickets: 45,
        lastUpdate: new Date().toISOString()
      };
    },

    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000,
  });
}
