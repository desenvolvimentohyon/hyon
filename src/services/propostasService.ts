import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook centralizado para gestão de propostas.
 */
export function usePropostas() {
  const query = useQuery({
    queryKey: ["propostas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*, proposal_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
  });

  return {
    propostas: query.data || [],
    isLoading: query.isLoading,
  };
}
