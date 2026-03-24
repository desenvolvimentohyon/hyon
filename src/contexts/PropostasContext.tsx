import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Proposta, CRMConfig, PropostaHistorico, DEFAULT_CRM_CONFIG } from "@/types/propostas";

// ===== Mappers =====
function dbToProposta(r: any): Proposta {
  const items = (r.proposal_items || []).map((i: any) => ({
    id: i.id, descricao: i.description, quantidade: Number(i.quantity) || 1, valor: Number(i.unit_value) || 0,
  }));
  return {
    id: r.id, numeroProposta: r.proposal_number,
    clienteId: r.client_id, clienteNomeSnapshot: r.client_name_snapshot || "",
    sistema: r.system_name || "OUTRO", planoNome: r.plan_name || "",
    valorMensalidade: Number(r.monthly_value) || 0,
    valorImplantacao: Number(r.implementation_value) || 0,
    fluxoPagamentoImplantacao: r.implementation_flow || "a_vista",
    parcelasImplantacao: r.implementation_installments,
    dataEnvio: r.sent_at, validadeDias: r.valid_days || 15,
    dataValidade: r.valid_until, statusCRM: r.crm_status || "Rascunho",
    statusVisualizacao: r.view_status || "nao_enviado",
    statusAceite: r.acceptance_status || "pendente",
    linkAceite: `/proposta/${r.acceptance_link || r.proposal_number}`, pdfGeradoEm: r.pdf_generated_at,
    observacoesInternas: r.notes_internal || "",
    informacoesAdicionais: r.additional_info || "",
    itens: items, historico: [],
    criadoEm: r.created_at, atualizadoEm: r.updated_at,
    partnerId: r.partner_id || null,
    partnerCommissionPercent: r.partner_commission_percent != null ? Number(r.partner_commission_percent) : null,
    partnerCommissionValue: r.partner_commission_value != null ? Number(r.partner_commission_value) : null,
    commissionGenerated: r.commission_generated || false,
    // Advanced fields
    partnerCommissionImplantPercent: r.partner_commission_implant_percent != null ? Number(r.partner_commission_implant_percent) : null,
    partnerCommissionImplantValue: r.partner_commission_implant_value != null ? Number(r.partner_commission_implant_value) : null,
    partnerCommissionRecurPercent: r.partner_commission_recur_percent != null ? Number(r.partner_commission_recur_percent) : null,
    partnerCommissionRecurMonths: r.partner_commission_recur_months != null ? Number(r.partner_commission_recur_months) : null,
    partnerCommissionRecurApplyOn: r.partner_commission_recur_apply_on || null,
    commissionImplantGenerated: r.commission_implant_generated || false,
    whatsappSentAt: r.whatsapp_sent_at || null,
    whatsappSendCount: Number(r.whatsapp_send_count) || 0,
  };
}

function dbToCRMConfig(settings: any, statuses: any[]): CRMConfig {
  return {
    statusKanban: statuses.sort((a: any, b: any) => a.sort_order - b.sort_order).map((s: any) => s.name),
    validadePadraoDias: settings?.default_valid_days || 15,
    formaEnvioPadrao: (settings?.default_send_method || "whatsapp") as any,
    mensagemPadraoEnvio: settings?.default_message_template || DEFAULT_CRM_CONFIG.mensagemPadraoEnvio,
    nomeEmpresa: settings?.company_name || DEFAULT_CRM_CONFIG.nomeEmpresa,
    informacoesAdicionaisPadrao: settings?.additional_info_default || DEFAULT_CRM_CONFIG.informacoesAdicionaisPadrao,
    rodapePDF: settings?.pdf_footer || DEFAULT_CRM_CONFIG.rodapePDF,
    corTemaPDF: DEFAULT_CRM_CONFIG.corTemaPDF,
    exibirAssinaturaDigitalFake: DEFAULT_CRM_CONFIG.exibirAssinaturaDigitalFake,
  };
}

async function gerarNumero(orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("proposals")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  return `PROP-${year}-${String((count || 0) + 1).padStart(4, "0")}`;
}

interface PropostasState { propostas: Proposta[]; crmConfig: CRMConfig; loading: boolean; }

interface PropostasContextType extends PropostasState {
  addProposta: (p: Omit<Proposta, "id" | "numeroProposta" | "criadoEm" | "atualizadoEm" | "historico" | "linkAceite">) => Proposta;
  updateProposta: (id: string, changes: Partial<Proposta>, acao?: string) => void;
  deleteProposta: (id: string) => void;
  cloneProposta: (id: string) => Proposta | null;
  getProposta: (id: string) => Proposta | undefined;
  getPropostaByNumero: (numero: string) => Proposta | undefined;
  updateCRMConfig: (changes: Partial<CRMConfig>) => void;
  resetCRMConfig: () => void;
  resetPropostas: () => void;
}

const PropostasContext = createContext<PropostasContextType | null>(null);

export function PropostasProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const orgId = profile?.org_id;

  const [loading, setLoading] = useState(true);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [crmConfig, setCRMConfig] = useState<CRMConfig>({ ...DEFAULT_CRM_CONFIG });

  const fetchAll = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [pRes, sRes, csRes] = await Promise.all([
      supabase.from("proposals").select("*, proposal_items(*)"),
      supabase.from("proposal_settings").select("*").maybeSingle(),
      supabase.from("crm_statuses").select("*"),
    ]);
    if (pRes.data) setPropostas(pRes.data.map(dbToProposta));
    if (sRes.data || csRes.data) {
      setCRMConfig(dbToCRMConfig(sRes.data, csRes.data || []));
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addProposta = useCallback((p: any): Proposta => {
    if (!orgId) return {} as Proposta;
    const placeholder: Proposta = {
      ...p, id: "", numeroProposta: "...", linkAceite: "",
      historico: [], criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString(),
    };
    (async () => {
      const numero = await gerarNumero(orgId);
      const { data, error } = await supabase.from("proposals").insert({
        org_id: orgId, proposal_number: numero, client_id: p.clienteId || null,
        client_name_snapshot: p.clienteNomeSnapshot, system_name: p.sistema,
        plan_name: p.planoNome, monthly_value: p.valorMensalidade,
        implementation_value: p.valorImplantacao,
        implementation_flow: p.fluxoPagamentoImplantacao,
        implementation_installments: p.parcelasImplantacao,
        valid_days: p.validadeDias, crm_status: p.statusCRM || "Rascunho",
        view_status: p.statusVisualizacao || "nao_enviado",
        acceptance_status: p.statusAceite || "pendente",
        acceptance_link: `/aceite/${numero}`,
        notes_internal: p.observacoesInternas, additional_info: p.informacoesAdicionais,
        partner_id: p.partnerId || null,
        partner_commission_percent: p.partnerCommissionPercent || null,
        partner_commission_value: p.partnerCommissionValue || null,
        partner_commission_implant_percent: p.partnerCommissionImplantPercent || null,
        partner_commission_implant_value: p.partnerCommissionImplantValue || null,
        partner_commission_recur_percent: p.partnerCommissionRecurPercent || null,
        partner_commission_recur_months: p.partnerCommissionRecurMonths || null,
        partner_commission_recur_apply_on: p.partnerCommissionRecurApplyOn || null,
      } as any).select().single();
      if (error) { toast.error("Erro ao criar proposta: " + error.message); return; }
      if (p.itens?.length && data) {
        await supabase.from("proposal_items").insert(
          p.itens.map((i: any) => ({
            org_id: orgId, proposal_id: data.id,
            description: i.descricao, quantity: i.quantidade, unit_value: i.valor,
          }))
        );
      }
      fetchAll();
    })();
    return placeholder;
  }, [orgId, fetchAll]);

  const updateProposta = useCallback(async (id: string, changes: Partial<Proposta>, _acao?: string) => {
    const upd: any = {};
    if (changes.clienteId !== undefined) upd.client_id = changes.clienteId;
    if (changes.clienteNomeSnapshot !== undefined) upd.client_name_snapshot = changes.clienteNomeSnapshot;
    if (changes.sistema !== undefined) upd.system_name = changes.sistema;
    if (changes.planoNome !== undefined) upd.plan_name = changes.planoNome;
    if (changes.valorMensalidade !== undefined) upd.monthly_value = changes.valorMensalidade;
    if (changes.valorImplantacao !== undefined) upd.implementation_value = changes.valorImplantacao;
    if (changes.fluxoPagamentoImplantacao !== undefined) upd.implementation_flow = changes.fluxoPagamentoImplantacao;
    if (changes.parcelasImplantacao !== undefined) upd.implementation_installments = changes.parcelasImplantacao;
    if (changes.dataEnvio !== undefined) upd.sent_at = changes.dataEnvio;
    if (changes.validadeDias !== undefined) upd.valid_days = changes.validadeDias;
    if (changes.dataValidade !== undefined) upd.valid_until = changes.dataValidade;
    if (changes.statusCRM !== undefined) upd.crm_status = changes.statusCRM;
    if (changes.statusVisualizacao !== undefined) upd.view_status = changes.statusVisualizacao;
    if (changes.statusAceite !== undefined) upd.acceptance_status = changes.statusAceite;
    if (changes.pdfGeradoEm !== undefined) upd.pdf_generated_at = changes.pdfGeradoEm;
    if (changes.observacoesInternas !== undefined) upd.notes_internal = changes.observacoesInternas;
    if (changes.informacoesAdicionais !== undefined) upd.additional_info = changes.informacoesAdicionais;
    if (changes.partnerId !== undefined) upd.partner_id = changes.partnerId;
    if (changes.partnerCommissionPercent !== undefined) upd.partner_commission_percent = changes.partnerCommissionPercent;
    if (changes.partnerCommissionValue !== undefined) upd.partner_commission_value = changes.partnerCommissionValue;
    if (changes.commissionGenerated !== undefined) upd.commission_generated = changes.commissionGenerated;
    // Advanced fields
    if (changes.partnerCommissionImplantPercent !== undefined) upd.partner_commission_implant_percent = changes.partnerCommissionImplantPercent;
    if (changes.partnerCommissionImplantValue !== undefined) upd.partner_commission_implant_value = changes.partnerCommissionImplantValue;
    if (changes.partnerCommissionRecurPercent !== undefined) upd.partner_commission_recur_percent = changes.partnerCommissionRecurPercent;
    if (changes.partnerCommissionRecurMonths !== undefined) upd.partner_commission_recur_months = changes.partnerCommissionRecurMonths;
    if (changes.partnerCommissionRecurApplyOn !== undefined) upd.partner_commission_recur_apply_on = changes.partnerCommissionRecurApplyOn;
    if (changes.commissionImplantGenerated !== undefined) upd.commission_implant_generated = changes.commissionImplantGenerated;
    if (changes.whatsappSentAt !== undefined) upd.whatsapp_sent_at = changes.whatsappSentAt;
    if (changes.whatsappSendCount !== undefined) upd.whatsapp_send_count = changes.whatsappSendCount;

    if (Object.keys(upd).length > 0) {
      const { error } = await supabase.from("proposals").update(upd).eq("id", id);
      if (error) { toast.error("Erro ao atualizar proposta"); return; }
    }
    // Update items if changed
    if (changes.itens && orgId) {
      await supabase.from("proposal_items").delete().eq("proposal_id", id);
      if (changes.itens.length > 0) {
        await supabase.from("proposal_items").insert(
          changes.itens.map(i => ({
            org_id: orgId, proposal_id: id,
            description: i.descricao, quantity: i.quantidade, unit_value: i.valor,
          }))
        );
      }
    }

    // === Auto-comissão implantação: gerar título financeiro quando aceite ===
    if (changes.statusAceite === "aceitou") {
      const current = propostas.find(p => p.id === id);
      const mergedPartnerId = changes.partnerId !== undefined ? changes.partnerId : current?.partnerId;
      const mergedImplantacao = changes.valorImplantacao !== undefined ? changes.valorImplantacao : current?.valorImplantacao;
      const mergedCommissionImplantValue = changes.partnerCommissionImplantValue !== undefined ? changes.partnerCommissionImplantValue : (current?.partnerCommissionImplantValue || current?.partnerCommissionValue);
      const mergedCommissionImplantGenerated = changes.commissionImplantGenerated !== undefined ? changes.commissionImplantGenerated : (current?.commissionImplantGenerated || current?.commissionGenerated);
      const mergedNumero = current?.numeroProposta || "";
      const mergedClienteId = changes.clienteId !== undefined ? changes.clienteId : current?.clienteId;
      const mergedRecurPercent = changes.partnerCommissionRecurPercent !== undefined ? changes.partnerCommissionRecurPercent : current?.partnerCommissionRecurPercent;
      const mergedRecurMonths = changes.partnerCommissionRecurMonths !== undefined ? changes.partnerCommissionRecurMonths : current?.partnerCommissionRecurMonths;
      const mergedRecurApplyOn = changes.partnerCommissionRecurApplyOn !== undefined ? changes.partnerCommissionRecurApplyOn : current?.partnerCommissionRecurApplyOn;

      // Generate implantation commission
      if (mergedPartnerId && mergedImplantacao && mergedImplantacao > 0 && mergedCommissionImplantValue && mergedCommissionImplantValue > 0 && !mergedCommissionImplantGenerated && orgId) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        const competency = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}`;
        const { error: ftError } = await supabase.from("financial_titles").insert({
          org_id: orgId,
          type: "pagar",
          origin: "comissao_parceiro",
          commission_type: "implantacao",
          description: `Comissão de implantação - Proposta ${mergedNumero}`,
          client_id: mergedClienteId || null,
          value_original: mergedCommissionImplantValue,
          value_final: mergedCommissionImplantValue,
          due_at: dueDate.toISOString().split("T")[0],
          status: "aberto",
          partner_id: mergedPartnerId,
          reference_proposal_id: id,
          competency,
        } as any);
        if (!ftError) {
          await supabase.from("proposals").update({
            commission_generated: true,
            commission_implant_generated: true,
          } as any).eq("id", id);
          toast.success(`Comissão de implantação R$ ${mergedCommissionImplantValue.toFixed(2)} gerada!`);
        }
      }

      // Bind partner to client (ref_partner_*)
      if (mergedPartnerId && mergedClienteId && orgId) {
        const { data: clientData } = await supabase.from("clients").select("ref_partner_id").eq("id", mergedClienteId).single();
        if (clientData && !clientData.ref_partner_id) {
          await supabase.from("clients").update({
            ref_partner_id: mergedPartnerId,
            ref_partner_start_at: new Date().toISOString().split("T")[0],
            ref_partner_recur_percent: mergedRecurPercent || null,
            ref_partner_recur_months: mergedRecurMonths || null,
            ref_partner_recur_apply_on: mergedRecurApplyOn || null,
          } as any).eq("id", mergedClienteId);
        } else if (clientData?.ref_partner_id && clientData.ref_partner_id !== mergedPartnerId) {
          toast.info("Cliente já possui parceiro vinculado. Mantido o parceiro original.");
        }
      }
    }

    fetchAll();
  }, [orgId, propostas, fetchAll]);

  const deleteProposta = useCallback(async (id: string) => {
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir proposta"); return; }
    fetchAll();
  }, [fetchAll]);

  const cloneProposta = useCallback((id: string): Proposta | null => {
    const original = propostas.find(p => p.id === id);
    if (!original || !orgId) return null;
    const cloned: Proposta = {
      ...original, id: "", numeroProposta: "...", linkAceite: "",
      statusCRM: "Rascunho", statusVisualizacao: "nao_enviado", statusAceite: "pendente",
      dataEnvio: null, dataValidade: null, pdfGeradoEm: null,
      commissionGenerated: false, commissionImplantGenerated: false,
      historico: [], criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString(),
    };
    (async () => {
      const numero = await gerarNumero(orgId);
      const { data, error } = await supabase.from("proposals").insert({
        org_id: orgId, proposal_number: numero, client_id: original.clienteId || null,
        client_name_snapshot: original.clienteNomeSnapshot, system_name: original.sistema,
        plan_name: original.planoNome, monthly_value: original.valorMensalidade,
        implementation_value: original.valorImplantacao,
        implementation_flow: original.fluxoPagamentoImplantacao,
        implementation_installments: original.parcelasImplantacao,
        valid_days: original.validadeDias, acceptance_link: `/aceite/${numero}`,
        notes_internal: original.observacoesInternas, additional_info: original.informacoesAdicionais,
      }).select().single();
      if (error) { toast.error("Erro ao clonar proposta"); return; }
      if (original.itens?.length && data) {
        await supabase.from("proposal_items").insert(
          original.itens.map(i => ({
            org_id: orgId, proposal_id: data.id,
            description: i.descricao, quantity: i.quantidade, unit_value: i.valor,
          }))
        );
      }
      fetchAll();
    })();
    return cloned;
  }, [orgId, propostas, fetchAll]);

  const getProposta = useCallback((id: string) => propostas.find(p => p.id === id), [propostas]);
  const getPropostaByNumero = useCallback((n: string) => propostas.find(p => p.numeroProposta === n), [propostas]);

  const updateCRMConfig = useCallback(async (changes: Partial<CRMConfig>) => {
    if (!orgId) return;
    const newConfig = { ...crmConfig, ...changes };
    setCRMConfig(newConfig);
    await supabase.from("proposal_settings").upsert({
      org_id: orgId,
      default_valid_days: newConfig.validadePadraoDias,
      default_send_method: newConfig.formaEnvioPadrao,
      default_message_template: newConfig.mensagemPadraoEnvio,
      company_name: newConfig.nomeEmpresa,
      additional_info_default: newConfig.informacoesAdicionaisPadrao,
      pdf_footer: newConfig.rodapePDF,
    }, { onConflict: "org_id" });
    if (changes.statusKanban) {
      await supabase.from("crm_statuses").delete().eq("org_id", orgId);
      await supabase.from("crm_statuses").insert(
        changes.statusKanban.map((name, i) => ({
          org_id: orgId, name, sort_order: i, is_default: i === 0,
        }))
      );
    }
  }, [orgId, crmConfig]);

  const resetCRMConfig = useCallback(() => setCRMConfig({ ...DEFAULT_CRM_CONFIG }), []);
  const resetPropostas = useCallback(() => {
    toast.info("Funcionalidade de reset não disponível.");
  }, []);

  const value: PropostasContextType = {
    propostas, crmConfig, loading,
    addProposta, updateProposta, deleteProposta, cloneProposta,
    getProposta, getPropostaByNumero,
    updateCRMConfig, resetCRMConfig, resetPropostas,
  };

  return <PropostasContext.Provider value={value}>{children}</PropostasContext.Provider>;
}

export function usePropostas() {
  const ctx = useContext(PropostasContext);
  if (!ctx) throw new Error("usePropostas must be used within PropostasProvider");
  return ctx;
}
