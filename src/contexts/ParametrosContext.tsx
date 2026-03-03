import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SistemaCatalogo, ModuloCatalogo, FormaPagamentoCatalogo, PlanoCatalogo } from "@/types/parametros";

// ===== Mappers =====
function dbToSistema(r: any): SistemaCatalogo {
  return {
    id: r.id, nome: r.name, descricao: r.description || "",
    valorCusto: Number(r.cost_value) || 0, valorVenda: Number(r.sale_value) || 0, ativo: r.active,
  };
}
function dbToModulo(r: any): ModuloCatalogo {
  return {
    id: r.id, nome: r.name, descricao: r.description || "",
    valorCusto: Number(r.cost_value) || 0, valorVenda: Number(r.sale_value) || 0,
    ativo: r.active, sistemaId: r.system_id || undefined,
  };
}
function dbToFormaPagamento(r: any): FormaPagamentoCatalogo {
  return { id: r.id, nome: r.name, ativo: r.active, observacao: r.notes || undefined };
}
function dbToPlano(r: any): PlanoCatalogo {
  return {
    id: r.id, nomePlano: r.name, descontoPercentual: Number(r.discount_percent) || 0,
    validadeMeses: r.months_validity || 1, ativo: r.active,
  };
}

interface ParametrosState {
  sistemas: SistemaCatalogo[];
  modulos: ModuloCatalogo[];
  formasPagamento: FormaPagamentoCatalogo[];
  planos: PlanoCatalogo[];
  alertaCertificadoDias: number;
}

interface ParametrosContextType extends ParametrosState {
  addSistema: (s: Omit<SistemaCatalogo, "id">) => void;
  updateSistema: (id: string, c: Partial<SistemaCatalogo>) => void;
  deleteSistema: (id: string) => void;
  addModulo: (m: Omit<ModuloCatalogo, "id">) => void;
  updateModulo: (id: string, c: Partial<ModuloCatalogo>) => void;
  deleteModulo: (id: string) => void;
  addFormaPagamento: (f: Omit<FormaPagamentoCatalogo, "id">) => void;
  updateFormaPagamento: (id: string, c: Partial<FormaPagamentoCatalogo>) => void;
  deleteFormaPagamento: (id: string) => void;
  addPlano: (p: Omit<PlanoCatalogo, "id">) => void;
  updatePlano: (id: string, c: Partial<PlanoCatalogo>) => void;
  deletePlano: (id: string) => void;
  setAlertaCertificadoDias: (d: number) => void;
  getSistema: (id: string) => SistemaCatalogo | undefined;
  getPlano: (id: string) => PlanoCatalogo | undefined;
  calcularDesconto: (valorBase: number, planoId: string) => { valorOriginal: number; desconto: number; valorFinal: number };
  resetParametros: () => void;
}

const ParametrosContext = createContext<ParametrosContextType | null>(null);

export function ParametrosProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const orgId = profile?.org_id;

  const [sistemas, setSistemas] = useState<SistemaCatalogo[]>([]);
  const [modulos, setModulos] = useState<ModuloCatalogo[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoCatalogo[]>([]);
  const [planos, setPlanos] = useState<PlanoCatalogo[]>([]);
  const [alertaCertificadoDias, setAlertaCertificadoDiasState] = useState(30);

  const fetchAll = useCallback(async () => {
    if (!orgId) return;
    const [sRes, mRes, fpRes, pRes] = await Promise.all([
      supabase.from("systems_catalog").select("*"),
      supabase.from("system_modules").select("*"),
      supabase.from("payment_methods").select("*"),
      supabase.from("plans").select("*"),
    ]);
    if (sRes.data) setSistemas(sRes.data.map(dbToSistema));
    if (mRes.data) setModulos(mRes.data.map(dbToModulo));
    if (fpRes.data) setFormasPagamento(fpRes.data.map(dbToFormaPagamento));
    if (pRes.data) setPlanos(pRes.data.map(dbToPlano));
  }, [orgId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ===== Sistemas =====
  const addSistema = useCallback(async (s: Omit<SistemaCatalogo, "id">) => {
    if (!orgId) return;
    const { error } = await supabase.from("systems_catalog").insert({
      org_id: orgId, name: s.nome, description: s.descricao,
      cost_value: s.valorCusto, sale_value: s.valorVenda, active: s.ativo,
    });
    if (error) { toast.error("Erro ao criar sistema"); return; }
    fetchAll();
  }, [orgId, fetchAll]);

  const updateSistema = useCallback(async (id: string, c: Partial<SistemaCatalogo>) => {
    const upd: any = {};
    if (c.nome !== undefined) upd.name = c.nome;
    if (c.descricao !== undefined) upd.description = c.descricao;
    if (c.valorCusto !== undefined) upd.cost_value = c.valorCusto;
    if (c.valorVenda !== undefined) upd.sale_value = c.valorVenda;
    if (c.ativo !== undefined) upd.active = c.ativo;
    const { error } = await supabase.from("systems_catalog").update(upd).eq("id", id);
    if (error) { toast.error("Erro ao atualizar sistema"); return; }
    fetchAll();
  }, [fetchAll]);

  const deleteSistema = useCallback(async (id: string) => {
    const { error } = await supabase.from("systems_catalog").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir sistema"); return; }
    fetchAll();
  }, [fetchAll]);

  // ===== Módulos =====
  const addModulo = useCallback(async (m: Omit<ModuloCatalogo, "id">) => {
    if (!orgId) return;
    const { error } = await supabase.from("system_modules").insert({
      org_id: orgId, name: m.nome, description: m.descricao,
      cost_value: m.valorCusto, sale_value: m.valorVenda, active: m.ativo,
      system_id: m.sistemaId || null,
    });
    if (error) { toast.error("Erro ao criar módulo"); return; }
    fetchAll();
  }, [orgId, fetchAll]);

  const updateModulo = useCallback(async (id: string, c: Partial<ModuloCatalogo>) => {
    const upd: any = {};
    if (c.nome !== undefined) upd.name = c.nome;
    if (c.descricao !== undefined) upd.description = c.descricao;
    if (c.valorCusto !== undefined) upd.cost_value = c.valorCusto;
    if (c.valorVenda !== undefined) upd.sale_value = c.valorVenda;
    if (c.ativo !== undefined) upd.active = c.ativo;
    if (c.sistemaId !== undefined) upd.system_id = c.sistemaId;
    const { error } = await supabase.from("system_modules").update(upd).eq("id", id);
    if (error) { toast.error("Erro ao atualizar módulo"); return; }
    fetchAll();
  }, [fetchAll]);

  const deleteModulo = useCallback(async (id: string) => {
    const { error } = await supabase.from("system_modules").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir módulo"); return; }
    fetchAll();
  }, [fetchAll]);

  // ===== Formas de Pagamento =====
  const addFormaPagamento = useCallback(async (f: Omit<FormaPagamentoCatalogo, "id">) => {
    if (!orgId) return;
    const { error } = await supabase.from("payment_methods").insert({
      org_id: orgId, name: f.nome, active: f.ativo, notes: f.observacao || null,
    });
    if (error) { toast.error("Erro ao criar forma de pagamento"); return; }
    fetchAll();
  }, [orgId, fetchAll]);

  const updateFormaPagamento = useCallback(async (id: string, c: Partial<FormaPagamentoCatalogo>) => {
    const upd: any = {};
    if (c.nome !== undefined) upd.name = c.nome;
    if (c.ativo !== undefined) upd.active = c.ativo;
    if (c.observacao !== undefined) upd.notes = c.observacao;
    const { error } = await supabase.from("payment_methods").update(upd).eq("id", id);
    if (error) { toast.error("Erro ao atualizar forma de pagamento"); return; }
    fetchAll();
  }, [fetchAll]);

  const deleteFormaPagamento = useCallback(async (id: string) => {
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir forma de pagamento"); return; }
    fetchAll();
  }, [fetchAll]);

  // ===== Planos =====
  const addPlano = useCallback(async (p: Omit<PlanoCatalogo, "id">) => {
    if (!orgId) return;
    const { error } = await supabase.from("plans").insert({
      org_id: orgId, name: p.nomePlano, discount_percent: p.descontoPercentual,
      months_validity: p.validadeMeses, active: p.ativo,
    });
    if (error) { toast.error("Erro ao criar plano"); return; }
    fetchAll();
  }, [orgId, fetchAll]);

  const updatePlano = useCallback(async (id: string, c: Partial<PlanoCatalogo>) => {
    const upd: any = {};
    if (c.nomePlano !== undefined) upd.name = c.nomePlano;
    if (c.descontoPercentual !== undefined) upd.discount_percent = c.descontoPercentual;
    if (c.validadeMeses !== undefined) upd.months_validity = c.validadeMeses;
    if (c.ativo !== undefined) upd.active = c.ativo;
    const { error } = await supabase.from("plans").update(upd).eq("id", id);
    if (error) { toast.error("Erro ao atualizar plano"); return; }
    fetchAll();
  }, [fetchAll]);

  const deletePlano = useCallback(async (id: string) => {
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir plano"); return; }
    fetchAll();
  }, [fetchAll]);

  const setAlertaCertificadoDias = useCallback((d: number) => setAlertaCertificadoDiasState(d), []);
  const getSistema = useCallback((id: string) => sistemas.find(s => s.id === id), [sistemas]);
  const getPlano = useCallback((id: string) => planos.find(p => p.id === id), [planos]);

  const calcularDesconto = useCallback((valorBase: number, planoId: string) => {
    const plano = planos.find(p => p.id === planoId);
    const desconto = plano ? plano.descontoPercentual : 0;
    const valorFinal = valorBase * (1 - desconto / 100);
    return { valorOriginal: valorBase, desconto, valorFinal };
  }, [planos]);

  const resetParametros = useCallback(() => {
    toast.info("Use a função de seed da organização para resetar parâmetros.");
  }, []);

  const value: ParametrosContextType = {
    sistemas, modulos, formasPagamento, planos, alertaCertificadoDias,
    addSistema, updateSistema, deleteSistema,
    addModulo, updateModulo, deleteModulo,
    addFormaPagamento, updateFormaPagamento, deleteFormaPagamento,
    addPlano, updatePlano, deletePlano,
    setAlertaCertificadoDias, getSistema, getPlano, calcularDesconto, resetParametros,
  };

  return <ParametrosContext.Provider value={value}>{children}</ParametrosContext.Provider>;
}

export function useParametros() {
  const ctx = useContext(ParametrosContext);
  if (!ctx) throw new Error("useParametros must be used within ParametrosProvider");
  return ctx;
}
