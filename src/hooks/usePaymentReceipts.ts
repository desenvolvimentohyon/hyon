import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type PaymentReceipt = {
  id: string;
  org_id: string;
  client_id: string;
  payment_id: string | null;
  payment_type: string;
  plan_type: string | null;
  period_start: string | null;
  period_end: string | null;
  competency: string | null;
  amount: number;
  paid_at: string;
  method: string;
  notes: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
};

export type NewPaymentReceipt = {
  payment_type: string;
  plan_type?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  competency?: string | null;
  amount: number;
  paid_at: string;
  method: string;
  notes?: string | null;
};

export function usePaymentReceipts(clientId: string | null) {
  const { profile } = useAuth();
  const orgId = profile?.org_id;
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!clientId || !orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_receipts")
      .select("*")
      .eq("client_id", clientId)
      .order("paid_at", { ascending: false });
    if (data) setReceipts(data as any);
    if (error) console.error("Error fetching receipts:", error);
    setLoading(false);
  }, [clientId, orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addReceipt = useCallback(async (
    receipt: NewPaymentReceipt,
    file?: File | null
  ): Promise<boolean> => {
    if (!clientId || !orgId) return false;

    let filePath: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;

    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${orgId}/${clientId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(path, file);
      if (uploadError) {
        toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
        return false;
      }
      filePath = path;
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type;
    }

    const { error } = await supabase.from("payment_receipts").insert({
      org_id: orgId,
      client_id: clientId,
      ...receipt,
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize,
      mime_type: mimeType,
    } as any);

    if (error) {
      toast({ title: "Erro ao salvar pagamento", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Pagamento registrado com sucesso!" });
    fetch();
    return true;
  }, [clientId, orgId, fetch]);

  const deleteReceipt = useCallback(async (id: string, filePath?: string | null) => {
    if (filePath) {
      await supabase.storage.from("payment-receipts").remove([filePath]);
    }
    const { error } = await supabase.from("payment_receipts").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pagamento excluído" });
    fetch();
  }, [fetch]);

  const getFileUrl = useCallback(async (filePath: string): Promise<string | null> => {
    const { data } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl || null;
  }, []);

  return { receipts, loading, addReceipt, deleteReceipt, getFileUrl, refetch: fetch };
}
