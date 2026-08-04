import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook centralizado para gestão de clientes.
 * Encapsula lógica de cache, mutations e tratamento de erros.
 */
export function useClientes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .neq("status", "excluido")
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutos como solicitado
  });

  const createMutation = useMutation({
    mutationFn: async (newClient: any) => {
      const { data, error } = await supabase.from("clients").insert(newClient).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente criado com sucesso");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar cliente: " + error.message);
    }
  });

  return {
    clientes: query.data || [],
    isLoading: query.isLoading,
    createCliente: createMutation.mutateAsync,
  };
}
