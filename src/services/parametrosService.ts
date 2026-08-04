import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook centralizado para gestão do catálogo de sistemas.
 */
export function useCatalogos() {
  const query = useQuery({
    queryKey: ["catalogos"],
    queryFn: async () => {
      const [systems, modules, plans] = await Promise.all([
        supabase.from("systems_catalog").select("*").eq("active", true),
        supabase.from("system_modules").select("*").eq("active", true),
        supabase.from("plans").select("*").eq("active", true),
      ]);
      
      return {
        sistemas: systems.data || [],
        modulos: modules.data || [],
        planos: plans.data || [],
      };
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 horas como solicitado (dados estáticos do catálogo)
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
  };
}
