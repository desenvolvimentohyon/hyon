import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CardClient {
  id: string;
  org_id: string;
  linked_client_id: string | null;
  name: string;
  company_name: string | null;
  trade_name: string | null;
  cnpj: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  status: string;
  card_machine_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCardClients() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["card_clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CardClient[];
    },
    enabled: !!profile,
  });

  const create = useMutation({
    mutationFn: async (input: Partial<CardClient>) => {
      const { data, error } = await supabase
        .from("card_clients")
        .insert({ ...input, org_id: profile!.org_id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card_clients"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: Partial<CardClient> & { id: string }) => {
      const { error } = await supabase.from("card_clients").update(rest as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card_clients"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("card_clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card_clients"] }),
  });

  return { ...query, create, update, remove };
}

export function useCardFeeProfiles(clientId: string | undefined) {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["card_fee_profiles", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_fee_profiles")
        .select("*")
        .eq("card_client_id", clientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile && !!clientId,
  });

  const create = useMutation({
    mutationFn: async (input: any) => {
      // Deactivate previous
      if (clientId) {
        await supabase
          .from("card_fee_profiles")
          .update({ active: false } as any)
          .eq("card_client_id", clientId)
          .eq("active", true);
      }
      const { data, error } = await supabase
        .from("card_fee_profiles")
        .insert({ ...input, org_id: profile!.org_id, card_client_id: clientId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card_fee_profiles", clientId] }),
  });

  return { ...query, create };
}
