import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ClienteReceita, SuporteEvento, MetricasConfig, MensalidadeAjuste } from "@/types/receita";

// ===== Mappers =====
function dbToClienteReceita(r: any): ClienteReceita {
  const m = r.metadata || {};
  return {
    id: r.id, nome: r.name, documento: r.document || undefined,
    telefone: r.phone || undefined, email: r.email || undefined, cidade: r.city || undefined,
    sistemaPrincipal: r.system_name || m.sistemaPrincipal || "PDV+",
    statusCliente: r.status === "ativo" ? "ativo" : r.status === "cancelado" ? "cancelado" : r.status === "suspenso" ? "suspenso" : r.status === "inativo" ? "inativo" : "ativo",
    mensalidadeAtiva: r.recurrence_active,
    valorMensalidade: Number(r.monthly_value_final) || 0,
    dataInicio: r.contract_signed_at || r.created_at,
    dataCancelamento: r.cancelled_at || null,
    motivoCancelamento: r.cancellation_reason || null,
    observacoes: r.notes || undefined,
    custoAtivo: r.cost_active || false,
    valorCustoMensal: Number(r.monthly_cost_value) || 0,
    sistemaCusto: r.cost_system_name || m.sistemaCusto || "PDV+",
  };
}

function dbToSuporteEvento(r: any): SuporteEvento {
  return {
    id: r.id, clienteId: r.client_id, tipo: r.type as any,
    criadoEm: r.created_at, duracaoMinutos: r.duration_minutes, resolvido: r.resolved,
  };
}

function dbToAjuste(r: any): MensalidadeAjuste {
  return {
    id: r.id, clienteId: r.client_id, data: r.adjustment_date,
    valorAnterior: Number(r.previous_value) || 0, valorNovo: Number(r.new_value) || 0,
    motivo: r.reason,
  };
}

const defaultMetricasConfig: MetricasConfig = {
  periodoPadrao: "12m", churnWindowMeses: 12, moeda: "BRL",
};

interface ReceitaState {
  clientesReceita: ClienteReceita[];
  suporteEventos: SuporteEvento[];
  mensalidadeAjustes: MensalidadeAjuste[];
  metricasConfig: MetricasConfig;
  loading: boolean;
}

interface ReceitaContextType extends ReceitaState {
  addClienteReceita: (c: Omit<ClienteReceita, "id">, moduleIds?: string[]) => void;
  updateClienteReceita: (id: string, changes: Partial<ClienteReceita>) => void;
  deleteClienteReceita: (id: string, justificativa?: string) => Promise<boolean>;
  addMensalidadeAjuste: (clienteId: string, valorNovo: number, motivo: string) => void;
  getAjustesCliente: (clienteId: string) => MensalidadeAjuste[];
  updateMetricasConfig: (c: Partial<MetricasConfig>) => void;
  resetReceita: () => void;
  getClienteReceita: (id: string) => ClienteReceita | undefined;
}

const ReceitaContext = createContext<ReceitaContextType | null>(null);

export function ReceitaProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const orgId = profile?.org_id;

  const [loading, setLoading] = useState(true);
  const [clientesReceita, setClientesReceita] = useState<ClienteReceita[]>([]);
  const [suporteEventos, setSuporteEventos] = useState<SuporteEvento[]>([]);
  const [mensalidadeAjustes, setMensalidadeAjustes] = useState<MensalidadeAjuste[]>([]);
  const [metricasConfig, setMetricasConfig] = useState<MetricasConfig>(defaultMetricasConfig);
  const initialLoadedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!orgId) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!initialLoadedRef.current) setLoading(true);
    const [cRes, seRes, maRes] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("support_events").select("*"),
      supabase.from("monthly_adjustments" as any).select("*"),
    ]);
    if (cRes.data) setClientesReceita(cRes.data.map(dbToClienteReceita));
    if (seRes.data) setSuporteEventos(seRes.data.map(dbToSuporteEvento));
    if (maRes.data) setMensalidadeAjustes((maRes.data as any[]).map(dbToAjuste));
    setLoading(false);
    initialLoadedRef.current = true;
    isFetchingRef.current = false;
  }, [orgId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addClienteReceita = useCallback(async (c: Omit<ClienteReceita, "id">, moduleIds?: string[]) => {
    if (!orgId) return;
    const { data, error } = await supabase.from("clients").insert({
      org_id: orgId, name: c.nome, trade_name: c.nome, document: c.documento || null,
      phone: c.telefone || null, email: c.email || null, city: c.cidade || null,
      system_name: c.sistemaPrincipal, status: c.statusCliente,
      recurrence_active: c.mensalidadeAtiva, monthly_value_final: c.valorMensalidade,
      monthly_value_base: c.valorMensalidade,
      contract_signed_at: c.dataInicio || null, cancelled_at: c.dataCancelamento || null,
      cancellation_reason: c.motivoCancelamento || null, notes: c.observacoes || null,
      cost_active: c.custoAtivo, monthly_cost_value: c.valorCustoMensal,
      cost_system_name: c.sistemaCusto,
    } as any).select("id").single();
    if (error) { toast.error("Erro ao criar cliente: " + error.message); return; }
    if (data && moduleIds && moduleIds.length > 0) {
      const moduleInserts = moduleIds.map(moduleId => ({
        org_id: orgId,
        client_id: data.id,
        module_id: moduleId,
      }));
      await supabase.from("client_modules").insert(moduleInserts);
    }
    fetchAll();
  }, [orgId, fetchAll]);

  const updateClienteReceita = useCallback(async (id: string, changes: Partial<ClienteReceita>) => {
    // Optimistic
    setClientesReceita(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));

    const upd: any = {};
    if (changes.nome !== undefined) upd.name = changes.nome;
    if (changes.documento !== undefined) upd.document = changes.documento;
    if (changes.telefone !== undefined) upd.phone = changes.telefone;
    if (changes.email !== undefined) upd.email = changes.email;
    if (changes.cidade !== undefined) upd.city = changes.cidade;
    if (changes.sistemaPrincipal !== undefined) upd.system_name = changes.sistemaPrincipal;
    if (changes.statusCliente !== undefined) upd.status = changes.statusCliente;
    if (changes.mensalidadeAtiva !== undefined) upd.recurrence_active = changes.mensalidadeAtiva;
    if (changes.valorMensalidade !== undefined) upd.monthly_value_final = changes.valorMensalidade;
    if (changes.dataCancelamento !== undefined) upd.cancelled_at = changes.dataCancelamento;
    if (changes.motivoCancelamento !== undefined) upd.cancellation_reason = changes.motivoCancelamento;
    if (changes.observacoes !== undefined) upd.notes = changes.observacoes;
    if (changes.custoAtivo !== undefined) upd.cost_active = changes.custoAtivo;
    if (changes.valorCustoMensal !== undefined) upd.monthly_cost_value = changes.valorCustoMensal;
    if (changes.sistemaCusto !== undefined) upd.cost_system_name = changes.sistemaCusto;
    const { error } = await supabase.from("clients").update(upd).eq("id", id);
    if (error) { toast.error("Erro ao atualizar cliente"); fetchAll(); }
  }, [fetchAll]);

  const deleteClienteReceita = useCallback(async (id: string, justificativa?: string): Promise<boolean> => {
    setClientesReceita(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from("clients").update({
      status: "cancelado",
      cancellation_reason: justificativa || "Excluído pelo usuário",
      cancelled_at: new Date().toISOString().split("T")[0],
    }).eq("id", id);
    if (error) { console.error("Error deleting client:", error); fetchAll(); return false; }
    return true;
  }, [fetchAll]);

  const addMensalidadeAjuste = useCallback(async (clienteId: string, valorNovo: number, motivo: string) => {
    if (!orgId) return;
    const cliente = clientesReceita.find(c => c.id === clienteId);
    if (!cliente) return;
    await supabase.from("monthly_adjustments" as any).insert({
      org_id: orgId, client_id: clienteId,
      previous_value: cliente.valorMensalidade, new_value: valorNovo, reason: motivo,
    });
    await supabase.from("clients").update({ monthly_value_final: valorNovo }).eq("id", clienteId);
    fetchAll();
  }, [orgId, clientesReceita, fetchAll]);

  const getAjustesCliente = useCallback((clienteId: string) =>
    mensalidadeAjustes.filter(a => a.clienteId === clienteId)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()),
  [mensalidadeAjustes]);

  const updateMetricasConfig = useCallback((c: Partial<MetricasConfig>) => {
    setMetricasConfig(prev => ({ ...prev, ...c }));
  }, []);

  const resetReceita = useCallback(() => {
    toast.info("Funcionalidade de reset não disponível.");
  }, []);

  const getClienteReceita = useCallback((id: string) => clientesReceita.find(c => c.id === id), [clientesReceita]);

  const value = useMemo<ReceitaContextType>(() => ({
    clientesReceita, suporteEventos, mensalidadeAjustes, metricasConfig, loading,
    addClienteReceita, updateClienteReceita, deleteClienteReceita,
    addMensalidadeAjuste, getAjustesCliente,
    updateMetricasConfig, resetReceita, getClienteReceita,
  }), [
    clientesReceita, suporteEventos, mensalidadeAjustes, metricasConfig, loading,
    addClienteReceita, updateClienteReceita, deleteClienteReceita,
    addMensalidadeAjuste, getAjustesCliente,
    updateMetricasConfig, resetReceita, getClienteReceita,
  ]);

  return <ReceitaContext.Provider value={value}>{children}</ReceitaContext.Provider>;
}

export function useReceita() {
  const ctx = useContext(ReceitaContext);
  if (!ctx) throw new Error("useReceita must be used within ReceitaProvider");
  return ctx;
}
