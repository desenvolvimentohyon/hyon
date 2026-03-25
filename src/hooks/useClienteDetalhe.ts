import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type ClienteFull = {
  id: string;
  org_id: string;
  name: string;
  trade_name: string | null;
  legal_name: string | null;
  document: string | null;
  state_registration: string | null;
  company_branch_type: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  notes: string | null;
  status: string;
  system_name: string | null;
  plan_id: string | null;
  monthly_value_base: number;
  monthly_value_final: number;
  monthly_cost_value: number;
  cost_active: boolean;
  cost_system_name: string | null;
  recurrence_active: boolean;
  health_score: number | null;
  health_status: string | null;
  risk_reason: string | null;
  // Address
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_uf: string | null;
  address_reference: string | null;
  // Primary contact
  primary_contact_name: string | null;
  primary_contact_role: string | null;
  primary_contact_phone: string | null;
  primary_contact_email: string | null;
  primary_contact_best_time: string | null;
  // Fiscal
  tax_regime: string | null;
  cnae_principal: string | null;
  fiscal_notes: string | null;
  // Accountant
  accountant_name: string | null;
  accountant_office: string | null;
  accountant_phone: string | null;
  accountant_email: string | null;
  // Contract
  contract_signed_at: string | null;
  contract_start_at: string | null;
  adjustment_base_date: string | null;
  adjustment_type: string | null;
  adjustment_percent: number | null;
  // Certificate
  cert_serial: string | null;
  cert_issuer: string | null;
  cert_recognition_date: string | null;
  cert_expires_at: string | null;
  cert_file_path: string | null;
  // Support
  support_type: string | null;
  preferred_channel: string | null;
  environment_notes: string | null;
  technical_notes: string | null;
  tags: string[] | null;
  default_due_day: number | null;
  // Billing
  billing_document: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  // Metadata
  metadata: Record<string, any> | null;
  billing_plan: string | null;
  plan_start_date: string | null;
  plan_end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ClienteContact = {
  id: string;
  org_id: string;
  client_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  roles: string[];
  is_billing_preferred: boolean;
  is_support_preferred: boolean;
  created_at: string;
  updated_at: string;
};

export type ClienteAttachment = {
  id: string;
  org_id: string;
  client_id: string;
  file_path: string;
  file_type: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export function useClienteDetalhe(clienteId: string | null) {
  const { profile } = useAuth();
  const orgId = profile?.org_id;
  const [cliente, setCliente] = useState<ClienteFull | null>(null);
  const [contacts, setContacts] = useState<ClienteContact[]>([]);
  const [attachments, setAttachments] = useState<ClienteAttachment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCliente = useCallback(async () => {
    if (!clienteId || !orgId) return;
    setLoading(true);
    try {
      const [cRes, contRes, attRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", clienteId).single(),
        supabase.from("client_contacts").select("*").eq("client_id", clienteId).order("created_at"),
        supabase.from("client_attachments").select("*").eq("client_id", clienteId).order("created_at", { ascending: false }),
      ]);
      if (cRes.data) {
        const meta = (cRes.data as any).metadata || {};
        setCliente({ ...cRes.data, billing_plan: meta.billing_plan || null, plan_start_date: meta.plan_start_date || null, plan_end_date: meta.plan_end_date || null } as any);
      }
      if (contRes.data) setContacts(contRes.data as any);
      if (attRes.data) setAttachments(attRes.data as any);
    } catch (err) {
      console.error("Error fetching client detail:", err);
    }
    setLoading(false);
  }, [clienteId, orgId]);

  useEffect(() => { fetchCliente(); }, [fetchCliente]);

  const updateCliente = useCallback(async (changes: Partial<ClienteFull>) => {
    if (!clienteId) return false;
    const { error } = await supabase.from("clients").update(changes as any).eq("id", clienteId);
    if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); return false; }
    toast({ title: "Salvo com sucesso!" });
    fetchCliente();
    return true;
  }, [clienteId, fetchCliente]);

  const addContact = useCallback(async (contact: Omit<ClienteContact, "id" | "org_id" | "client_id" | "created_at" | "updated_at">) => {
    if (!clienteId || !orgId) return;
    const { error } = await supabase.from("client_contacts").insert({ ...contact, org_id: orgId, client_id: clienteId } as any);
    if (error) { toast({ title: "Erro ao adicionar contato", variant: "destructive" }); return; }
    toast({ title: "Contato adicionado!" });
    fetchCliente();
  }, [clienteId, orgId, fetchCliente]);

  const updateContact = useCallback(async (id: string, changes: Partial<ClienteContact>) => {
    const { error } = await supabase.from("client_contacts").update(changes as any).eq("id", id);
    if (error) { toast({ title: "Erro ao atualizar contato", variant: "destructive" }); return; }
    fetchCliente();
  }, [fetchCliente]);

  const deleteContact = useCallback(async (id: string) => {
    const { error } = await supabase.from("client_contacts").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao remover contato", variant: "destructive" }); return; }
    fetchCliente();
  }, [fetchCliente]);

  const addAttachment = useCallback(async (att: { file_path: string; file_type: string; description?: string }) => {
    if (!clienteId || !orgId) return;
    const { error } = await supabase.from("client_attachments").insert({
      ...att, org_id: orgId, client_id: clienteId, uploaded_by: profile?.id || null,
    } as any);
    if (error) { toast({ title: "Erro ao salvar anexo", variant: "destructive" }); return; }
    fetchCliente();
  }, [clienteId, orgId, profile?.id, fetchCliente]);

  const deleteAttachment = useCallback(async (id: string, filePath: string) => {
    await supabase.storage.from("client-attachments").remove([filePath]);
    const { error } = await supabase.from("client_attachments").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao remover anexo", variant: "destructive" }); return; }
    fetchCliente();
  }, [fetchCliente]);

  return {
    cliente, contacts, attachments, loading,
    updateCliente, addContact, updateContact, deleteContact,
    addAttachment, deleteAttachment, refetch: fetchCliente,
  };
}
