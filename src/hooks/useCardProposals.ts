import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CardProposal {
  id: string;
  org_id: string;
  card_client_id: string;
  public_token: string;
  title: string;
  machine_type: string;
  commission_percent: number;
  fee_profile_snapshot: any;
  validity_days: number;
  status: string;
  sent_at: string | null;
  first_viewed_at: string | null;
  accepted_at: string | null;
  refused_at: string | null;
  accepted_by_name: string | null;
  created_at: string;
  updated_at: string;
  card_clients?: { name: string; company_name: string | null };
}

export function useCardProposals() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["card_proposals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_proposals")
        .select("*, card_clients(name, company_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CardProposal[];
    },
    enabled: !!profile,
  });

  const create = useMutation({
    mutationFn: async (input: any) => {
      const { data, error } = await supabase
        .from("card_proposals")
        .insert({ ...input, org_id: profile!.org_id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CardProposal;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card_proposals"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: any) => {
      const { error } = await supabase.from("card_proposals").update(rest as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card_proposals"] }),
  });

  return { ...query, create, update };
}

export function useCardOnboarding() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["card_onboarding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_proposal_onboarding")
        .select("*, card_clients(name), card_proposals(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });
}
