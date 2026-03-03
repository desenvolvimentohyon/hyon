import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ContaBancaria, PlanoContas, TituloFinanceiro, MovimentoBancario, ConfigFinanceira,
} from "@/types/financeiro";
import { seedConfigFinanceira } from "@/data/seedFinanceiro";

// ===== Mappers =====
function dbToConta(r: any): ContaBancaria {
  return {
    id: r.id, nome: r.name, banco: r.bank || "", agencia: r.agency || "",
    conta: r.account || "", tipoConta: (r.type as any) || "corrente",
    saldoInicial: 0, ativo: true,
  };
}

function dbToPlanoContas(r: any): PlanoContas {
  return {
    id: r.id, codigo: r.code, nome: r.name, tipo: r.type as any,
    paiId: r.parent_id, ativo: r.active,
  };
}

function dbToTitulo(r: any): TituloFinanceiro {
  const m = r.metadata || {};
  return {
    id: r.id, tipo: r.type as any, origem: (r.origin || "outro") as any,
    clienteId: r.client_id, fornecedorNome: r.supplier_name || null,
    descricao: r.description, categoriaPlanoContasId: r.plan_account_code || "",
    competenciaMes: r.competency || "", dataEmissao: r.issued_at || r.created_at,
    vencimento: r.due_at || "", valorOriginal: Number(r.value_original) || 0,
    desconto: Number(r.discount) || 0, juros: Number(r.interest) || 0,
    multa: Number(r.fine) || 0, status: r.status as any,
    formaPagamento: (m.formaPagamento || "boleto") as any,
    contaBancariaId: r.bank_account_id, anexosFake: m.anexosFake || [],
    observacoes: r.notes || "", criadoEm: r.created_at, atualizadoEm: r.updated_at,
  };
}

function dbToMovimento(r: any): MovimentoBancario {
  return {
    id: r.id, contaBancariaId: r.bank_account_id, data: r.date,
    descricao: r.description, valor: Number(r.value) || 0,
    tipo: r.type as any, conciliado: r.reconciled,
    tituloVinculadoId: r.linked_title_id, categoriaSugestao: null,
    criadoEm: r.created_at,
  };
}

interface FinanceiroState {
  contasBancarias: ContaBancaria[];
  planoContas: PlanoContas[];
  titulos: TituloFinanceiro[];
  movimentos: MovimentoBancario[];
  config: ConfigFinanceira;
  loading: boolean;
}

interface FinanceiroContextType extends FinanceiroState {
  addContaBancaria: (c: Omit<ContaBancaria, "id">) => void;
  updateContaBancaria: (id: string, changes: Partial<ContaBancaria>) => void;
  deleteContaBancaria: (id: string) => void;
  getSaldoConta: (id: string) => number;
  addPlanoContas: (p: Omit<PlanoContas, "id">) => void;
  updatePlanoContas: (id: string, changes: Partial<PlanoContas>) => void;
  deletePlanoContas: (id: string) => boolean;
  getFilhosPlanoContas: (paiId: string | null) => PlanoContas[];
  addTitulo: (t: Omit<TituloFinanceiro, "id" | "criadoEm" | "atualizadoEm">) => void;
  updateTitulo: (id: string, changes: Partial<TituloFinanceiro>) => void;
  deleteTitulo: (id: string) => void;
  baixarTitulo: (id: string, contaBancariaId: string, valorPago?: number) => void;
  addMovimento: (m: Omit<MovimentoBancario, "id" | "criadoEm">) => void;
  updateMovimento: (id: string, changes: Partial<MovimentoBancario>) => void;
  conciliarMovimento: (movimentoId: string, tituloId: string) => void;
  desconciliarMovimento: (movimentoId: string) => void;
  importarExtrato: () => void;
  updateConfig: (c: Partial<ConfigFinanceira>) => void;
  resetFinanceiro: () => void;
  exportFinanceiro: () => string;
  importFinanceiro: (json: string) => boolean;
}

const FinanceiroContext = createContext<FinanceiroContextType | null>(null);

export function FinanceiroProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth();
  const orgId = profile?.org_id;

  const [loading, setLoading] = useState(true);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [planoContas, setPlanoContas] = useState<PlanoContas[]>([]);
  const [titulos, setTitulos] = useState<TituloFinanceiro[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoBancario[]>([]);
  const [config, setConfig] = useState<ConfigFinanceira>(seedConfigFinanceira);

  const fetchAll = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [cbRes, pcRes, tRes, mRes] = await Promise.all([
      supabase.from("bank_accounts").select("*"),
      supabase.from("plan_accounts" as any).select("*"),
      supabase.from("financial_titles").select("*"),
      supabase.from("bank_transactions").select("*"),
    ]);
    if (cbRes.data) setContasBancarias(cbRes.data.map(dbToConta));
    if (pcRes.data) setPlanoContas((pcRes.data as any[]).map(dbToPlanoContas));
    if (tRes.data) setTitulos(tRes.data.map(dbToTitulo));
    if (mRes.data) setMovimentos(mRes.data.map(dbToMovimento));
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ===== Contas Bancárias =====
  const addContaBancaria = useCallback(async (c: Omit<ContaBancaria, "id">) => {
    if (!orgId) return;
    const { error } = await supabase.from("bank_accounts").insert({
      org_id: orgId, name: c.nome, bank: c.banco, agency: c.agencia,
      account: c.conta, type: c.tipoConta,
    });
    if (error) { toast.error("Erro ao criar conta bancária"); return; }
    fetchAll();
  }, [orgId, fetchAll]);

  const updateContaBancaria = useCallback(async (id: string, changes: Partial<ContaBancaria>) => {
    const upd: any = {};
    if (changes.nome !== undefined) upd.name = changes.nome;
    if (changes.banco !== undefined) upd.bank = changes.banco;
    if (changes.agencia !== undefined) upd.agency = changes.agencia;
    if (changes.conta !== undefined) upd.account = changes.conta;
    if (changes.tipoConta !== undefined) upd.type = changes.tipoConta;
    const { error } = await supabase.from("bank_accounts").update(upd).eq("id", id);
    if (error) { toast.error("Erro ao atualizar conta bancária"); return; }
    fetchAll();
  }, [fetchAll]);

  const deleteContaBancaria = useCallback(async (id: string) => {
    const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir conta bancária"); return; }
    fetchAll();
  }, [fetchAll]);

  const getSaldoConta = useCallback((id: string) => {
    const conta = contasBancarias.find(c => c.id === id);
    if (!conta) return 0;
    return movimentos.filter(m => m.contaBancariaId === id).reduce((sum, m) => sum + m.valor, 0) + conta.saldoInicial;
  }, [contasBancarias, movimentos]);

  // ===== Plano de Contas =====
  const addPlanoContas = useCallback(async (p: Omit<PlanoContas, "id">) => {
    if (!orgId) return;
    const { error } = await supabase.from("plan_accounts" as any).insert({
      org_id: orgId, code: p.codigo, name: p.nome, type: p.tipo,
      parent_id: p.paiId, active: p.ativo,
    });
    if (error) { toast.error("Erro ao criar plano de contas"); return; }
    fetchAll();
  }, [orgId, fetchAll]);

  const updatePlanoContas = useCallback(async (id: string, changes: Partial<PlanoContas>) => {
    const upd: any = {};
    if (changes.codigo !== undefined) upd.code = changes.codigo;
    if (changes.nome !== undefined) upd.name = changes.nome;
    if (changes.tipo !== undefined) upd.type = changes.tipo;
    if (changes.paiId !== undefined) upd.parent_id = changes.paiId;
    if (changes.ativo !== undefined) upd.active = changes.ativo;
    const { error } = await supabase.from("plan_accounts" as any).update(upd).eq("id", id);
    if (error) { toast.error("Erro ao atualizar plano de contas"); return; }
    fetchAll();
  }, [fetchAll]);

  const deletePlanoContas = useCallback((id: string): boolean => {
    const hasChildren = planoContas.some(p => p.paiId === id);
    const hasLancamentos = titulos.some(t => t.categoriaPlanoContasId === id);
    if (hasChildren || hasLancamentos) return false;
    (async () => {
      const { error } = await supabase.from("plan_accounts" as any).delete().eq("id", id);
      if (error) { toast.error("Erro ao excluir plano de contas"); return; }
      fetchAll();
    })();
    return true;
  }, [planoContas, titulos, fetchAll]);

  const getFilhosPlanoContas = useCallback((paiId: string | null) => {
    return planoContas.filter(p => p.paiId === paiId).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [planoContas]);

  // ===== Títulos =====
  const addTitulo = useCallback(async (t: Omit<TituloFinanceiro, "id" | "criadoEm" | "atualizadoEm">) => {
    if (!orgId) return;
    const { error } = await supabase.from("financial_titles").insert({
      org_id: orgId, type: t.tipo, origin: t.origem, client_id: t.clienteId || null,
      supplier_name: t.fornecedorNome, description: t.descricao,
      plan_account_code: t.categoriaPlanoContasId, competency: t.competenciaMes,
      issued_at: t.dataEmissao || null, due_at: t.vencimento || null,
      value_original: t.valorOriginal, discount: t.desconto,
      interest: t.juros, fine: t.multa, status: t.status,
      bank_account_id: t.contaBancariaId || null, notes: t.observacoes,
      metadata: { formaPagamento: t.formaPagamento, anexosFake: t.anexosFake },
    } as any);
    if (error) { toast.error("Erro ao criar título: " + error.message); return; }
    fetchAll();
  }, [orgId, fetchAll]);

  const updateTitulo = useCallback(async (id: string, changes: Partial<TituloFinanceiro>) => {
    const upd: any = {};
    if (changes.tipo !== undefined) upd.type = changes.tipo;
    if (changes.origem !== undefined) upd.origin = changes.origem;
    if (changes.clienteId !== undefined) upd.client_id = changes.clienteId;
    if (changes.fornecedorNome !== undefined) upd.supplier_name = changes.fornecedorNome;
    if (changes.descricao !== undefined) upd.description = changes.descricao;
    if (changes.categoriaPlanoContasId !== undefined) upd.plan_account_code = changes.categoriaPlanoContasId;
    if (changes.competenciaMes !== undefined) upd.competency = changes.competenciaMes;
    if (changes.vencimento !== undefined) upd.due_at = changes.vencimento;
    if (changes.valorOriginal !== undefined) upd.value_original = changes.valorOriginal;
    if (changes.desconto !== undefined) upd.discount = changes.desconto;
    if (changes.juros !== undefined) upd.interest = changes.juros;
    if (changes.multa !== undefined) upd.fine = changes.multa;
    if (changes.status !== undefined) upd.status = changes.status;
    if (changes.contaBancariaId !== undefined) upd.bank_account_id = changes.contaBancariaId;
    if (changes.observacoes !== undefined) upd.notes = changes.observacoes;
    const { error } = await supabase.from("financial_titles").update(upd).eq("id", id);
    if (error) { toast.error("Erro ao atualizar título"); return; }
    fetchAll();
  }, [fetchAll]);

  const deleteTitulo = useCallback(async (id: string) => {
    const { error } = await supabase.from("financial_titles").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir título"); return; }
    fetchAll();
  }, [fetchAll]);

  const baixarTitulo = useCallback(async (id: string, contaBancariaId: string, valorPago?: number) => {
    if (!orgId) return;
    const titulo = titulos.find(t => t.id === id);
    if (!titulo) return;
    const valorFinal = valorPago || (titulo.valorOriginal - titulo.desconto + titulo.juros + titulo.multa);
    const isParcial = valorPago && valorPago < (titulo.valorOriginal - titulo.desconto + titulo.juros + titulo.multa);

    await supabase.from("financial_titles").update({
      status: isParcial ? "parcial" : "pago", bank_account_id: contaBancariaId,
    }).eq("id", id);

    await supabase.from("bank_transactions").insert({
      org_id: orgId, bank_account_id: contaBancariaId,
      date: new Date().toISOString().split("T")[0], description: titulo.descricao,
      value: titulo.tipo === "receber" ? valorFinal : -valorFinal,
      type: titulo.tipo === "receber" ? "credito" : "debito",
      reconciled: true, linked_title_id: id,
    });

    // === Auto recurring commission on_invoice_paid ===
    if (titulo.tipo === "receber" && !isParcial && titulo.clienteId) {
      try {
        // Get the raw title to access competency and client ref_partner data
        const { data: rawTitle } = await supabase.from("financial_titles").select("competency, client_id").eq("id", id).single();
        if (rawTitle?.client_id && rawTitle?.competency) {
          const { data: client } = await supabase.from("clients").select("ref_partner_id, ref_partner_start_at, ref_partner_recur_percent, ref_partner_recur_months, ref_partner_recur_apply_on, status").eq("id", rawTitle.client_id).single();
          if (client?.ref_partner_id && client.ref_partner_recur_apply_on === "on_invoice_paid" && client.ref_partner_recur_percent && client.ref_partner_recur_percent > 0 && client.status !== "cancelado") {
            // Check period eligibility
            let eligible = true;
            if (client.ref_partner_recur_months && client.ref_partner_recur_months > 0 && client.ref_partner_start_at) {
              const startDate = new Date(client.ref_partner_start_at);
              const [compYear, compMonth] = rawTitle.competency.split("-").map(Number);
              const monthsDiff = (compYear - startDate.getFullYear()) * 12 + (compMonth - (startDate.getMonth() + 1));
              if (monthsDiff >= client.ref_partner_recur_months) eligible = false;
            }
            if (eligible) {
              const commissionValue = Math.round(valorFinal * client.ref_partner_recur_percent / 100 * 100) / 100;
              if (commissionValue > 0) {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 7);
                await supabase.from("financial_titles").insert({
                  org_id: orgId,
                  type: "pagar",
                  origin: "comissao_parceiro",
                  commission_type: "recorrente",
                  partner_id: client.ref_partner_id,
                  reference_title_id: id,
                  client_id: rawTitle.client_id,
                  competency: rawTitle.competency,
                  description: `Comissão recorrente ${rawTitle.competency}`,
                  value_original: commissionValue,
                  value_final: commissionValue,
                  due_at: dueDate.toISOString().split("T")[0],
                  status: "aberto",
                } as any);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error generating recurring commission:", err);
      }
    }

    fetchAll();
  }, [orgId, titulos, fetchAll]);

  // ===== Movimentos =====
  const addMovimento = useCallback(async (m: Omit<MovimentoBancario, "id" | "criadoEm">) => {
    if (!orgId) return;
    const { error } = await supabase.from("bank_transactions").insert({
      org_id: orgId, bank_account_id: m.contaBancariaId, date: m.data,
      description: m.descricao, value: m.valor, type: m.tipo,
      reconciled: m.conciliado, linked_title_id: m.tituloVinculadoId || null,
    });
    if (error) { toast.error("Erro ao criar movimento"); return; }
    fetchAll();
  }, [orgId, fetchAll]);

  const updateMovimento = useCallback(async (id: string, changes: Partial<MovimentoBancario>) => {
    const upd: any = {};
    if (changes.descricao !== undefined) upd.description = changes.descricao;
    if (changes.valor !== undefined) upd.value = changes.valor;
    if (changes.conciliado !== undefined) upd.reconciled = changes.conciliado;
    if (changes.tituloVinculadoId !== undefined) upd.linked_title_id = changes.tituloVinculadoId;
    const { error } = await supabase.from("bank_transactions").update(upd).eq("id", id);
    if (error) { toast.error("Erro ao atualizar movimento"); return; }
    fetchAll();
  }, [fetchAll]);

  const conciliarMovimento = useCallback(async (movimentoId: string, tituloId: string) => {
    await supabase.from("bank_transactions").update({
      reconciled: true, linked_title_id: tituloId,
    }).eq("id", movimentoId);
    await supabase.from("financial_titles").update({ status: "pago" }).eq("id", tituloId);
    fetchAll();
  }, [fetchAll]);

  const desconciliarMovimento = useCallback(async (movimentoId: string) => {
    await supabase.from("bank_transactions").update({
      reconciled: false, linked_title_id: null,
    }).eq("id", movimentoId);
    fetchAll();
  }, [fetchAll]);

  const importarExtrato = useCallback(async () => {
    if (!orgId) return;
    const descs = ["PIX Recebido", "TED Recebida", "Pagamento cartão", "Débito automático", "Transferência", "Tarifa bancária"];
    const conta = contasBancarias[0];
    if (!conta) { toast.error("Nenhuma conta bancária cadastrada"); return; }
    const newMovs = Array.from({ length: 10 }, () => {
      const isCredit = Math.random() > 0.4;
      return {
        org_id: orgId, bank_account_id: conta.id,
        date: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().split("T")[0],
        description: descs[Math.floor(Math.random() * descs.length)],
        value: isCredit ? Math.round((100 + Math.random() * 3000) * 100) / 100 : -Math.round((20 + Math.random() * 500) * 100) / 100,
        type: isCredit ? "credito" : "debito",
        reconciled: false,
      };
    });
    await supabase.from("bank_transactions").insert(newMovs);
    fetchAll();
  }, [orgId, contasBancarias, fetchAll]);

  const updateConfig = useCallback((c: Partial<ConfigFinanceira>) => {
    setConfig(prev => ({ ...prev, ...c }));
  }, []);

  const resetFinanceiro = useCallback(() => {
    toast.info("Use a função de seed da organização para resetar dados financeiros.");
  }, []);

  const exportFinanceiro = useCallback(() => {
    return JSON.stringify({ contasBancarias, planoContas, titulos, movimentos, config }, null, 2);
  }, [contasBancarias, planoContas, titulos, movimentos, config]);

  const importFinanceiro = useCallback((_json: string) => {
    toast.info("Importação não disponível com backend cloud.");
    return false;
  }, []);

  return (
    <FinanceiroContext.Provider value={{
      contasBancarias, planoContas, titulos, movimentos, config, loading,
      addContaBancaria, updateContaBancaria, deleteContaBancaria, getSaldoConta,
      addPlanoContas, updatePlanoContas, deletePlanoContas, getFilhosPlanoContas,
      addTitulo, updateTitulo, deleteTitulo, baixarTitulo,
      addMovimento, updateMovimento, conciliarMovimento, desconciliarMovimento, importarExtrato,
      updateConfig, resetFinanceiro, exportFinanceiro, importFinanceiro,
    }}>
      {children}
    </FinanceiroContext.Provider>
  );
}

export function useFinanceiro() {
  const ctx = useContext(FinanceiroContext);
  if (!ctx) throw new Error("useFinanceiro must be used within FinanceiroProvider");
  return ctx;
}
