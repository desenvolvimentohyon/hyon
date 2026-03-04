import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CardRevenue {
  id: string;
  org_id: string;
  card_client_id: string;
  competency: string;
  gross_volume: number;
  notes: string | null;
  created_at: string;
}

export interface CardCommission {
  id: string;
  org_id: string;
  card_client_id: string;
  competency: string;
  gross_volume: number;
  commission_percent: number;
  commission_value: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export function useCardRevenue() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const revenue = useQuery({
    queryKey: ["card_revenue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_revenue_monthly")
        .select("*, card_clients(name)")
        .order("competency", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!profile,
  });

  const commissions = useQuery({
    queryKey: ["card_commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_commissions")
        .select("*, card_clients(name)")
        .order("competency", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!profile,
  });

  const createRevenue = useMutation({
    mutationFn: async (input: { card_client_id: string; competency: string; gross_volume: number; notes?: string; commission_percent?: number }) => {
      const orgId = profile!.org_id;
      const commPercent = input.commission_percent ?? 30;
      const commValue = input.gross_volume * (commPercent / 100);

      // Upsert revenue
      const { error: revErr } = await supabase
        .from("card_revenue_monthly")
        .upsert(
          { org_id: orgId, card_client_id: input.card_client_id, competency: input.competency, gross_volume: input.gross_volume, notes: input.notes || null } as any,
          { onConflict: "org_id,card_client_id,competency" }
        );
      if (revErr) throw revErr;

      // Upsert commission
      const { error: comErr } = await supabase
        .from("card_commissions")
        .upsert(
          { org_id: orgId, card_client_id: input.card_client_id, competency: input.competency, gross_volume: input.gross_volume, commission_percent: commPercent, commission_value: commValue } as any,
          { onConflict: "org_id,card_client_id,competency" }
        );
      if (comErr) throw comErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["card_revenue"] });
      qc.invalidateQueries({ queryKey: ["card_commissions"] });
    },
  });

  const updateCommissionStatus = useMutation({
    mutationFn: async ({ id, status, paid_at }: { id: string; status: string; paid_at?: string }) => {
      const { error } = await supabase
        .from("card_commissions")
        .update({ status, paid_at: paid_at || null } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card_commissions"] }),
  });

  return { revenue, commissions, createRevenue, updateCommissionStatus };
}
