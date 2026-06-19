import {
  Cliente, Tecnico, Tarefa, Configuracoes, StatusTarefa, Prioridade,
  STATUS_LABELS_DEFAULT, PRIORIDADE_LABELS_DEFAULT,
} from "@/types";

export const defaultConfig: Configuracoes = {
  labelsStatus: { ...STATUS_LABELS_DEFAULT },
  labelsPrioridade: { ...PRIORIDADE_LABELS_DEFAULT },
  modoCompacto: false,
};

export function dbToCliente(r: any): Cliente {
  const m = r.metadata || {};
  return {
    id: r.id, nome: r.trade_name || r.legal_name || r.name,
    nomeFantasia: r.trade_name || undefined, razaoSocial: r.legal_name || undefined,
    telefone: r.phone || undefined, email: r.email || undefined,
    documento: r.document || undefined, observacoes: r.notes || undefined, criadoEm: r.created_at,
    sistemaUsado: m.sistemaUsado, usaCloud: m.usaCloud, usaTEF: m.usaTEF,
    usaPagamentoIntegrado: m.usaPagamentoIntegrado, tipoNegocio: m.tipoNegocio,
    perfilCliente: m.perfilCliente, mensalidadeAtual: Number(r.monthly_value_final) || undefined,
    custoMensal: Number(r.monthly_cost_value) || 0,
    statusFinanceiro: m.statusFinanceiro, riscoCancelamento: m.riscoCancelamento,
  };
}

export function clienteToDb(c: Omit<Cliente, "id" | "criadoEm">, orgId: string) {
  return {
    org_id: orgId, name: c.nomeFantasia || c.nome, phone: c.telefone || null, email: c.email || null,
    document: c.documento || null, notes: c.observacoes || null,
    trade_name: c.nomeFantasia || null, legal_name: c.razaoSocial || null,
    monthly_value_final: c.mensalidadeAtual || 0,
    metadata: {
      sistemaUsado: c.sistemaUsado, usaCloud: c.usaCloud, usaTEF: c.usaTEF,
      usaPagamentoIntegrado: c.usaPagamentoIntegrado, tipoNegocio: c.tipoNegocio,
      perfilCliente: c.perfilCliente, statusFinanceiro: c.statusFinanceiro,
      riscoCancelamento: c.riscoCancelamento,
    },
  };
}

export function dbToTecnico(r: any): Tecnico {
  return { id: r.id, nome: r.full_name, ativo: r.is_active, email: r.email || undefined };
}

export function dbToTarefa(r: any): Tarefa {
  const m = r.metadata || {};
  const comments = (r.task_comments || []).map((c: any) => ({
    id: c.id, autorNome: c.author_name || "Usuário", texto: c.text, criadoEm: c.created_at,
  }));
  const historico = (r.task_history || []).map((h: any) => ({
    id: h.id, acao: h.action, detalhes: h.details || "", criadoEm: h.created_at,
  }));
  return {
    id: r.id, titulo: r.title, descricao: r.description, clienteId: r.client_id,
    nomeClienteAvulso: m.nomeClienteAvulso || undefined,
    responsavelId: r.assignee_profile_id || "", prioridade: r.priority as Prioridade,
    status: r.status as StatusTarefa, prazoDataHora: r.due_at || undefined,
    criadoEm: r.created_at, atualizadoEm: r.updated_at, tags: r.tags || [],
    checklist: m.checklist || [], anexosFake: m.anexosFake || [],
    comentarios: comments, historico,
    tempoTotalSegundos: r.total_seconds || 0, timerRodando: r.timer_running || false,
    timerInicioTimestamp: r.timer_started_at ? new Date(r.timer_started_at).getTime() : undefined,
    tipoOperacional: r.tipo_operacional || "interno",
    sistemaRelacionado: r.sistema_relacionado || undefined,
    moduloRelacionado: m.moduloRelacionado, slaHoras: m.slaHoras,
    reincidente: m.reincidente, geraCobrancaExtra: m.geraCobrancaExtra,
    valorCobrancaExtra: m.valorCobrancaExtra, etapaImplantacao: m.etapaImplantacao,
    riscoCancelamento: m.riscoCancelamento, valorProposta: m.valorProposta,
    tipoPlano: m.tipoPlano, dataPrevisaoFechamento: m.dataPrevisaoFechamento,
    origemLead: m.origemLead, statusComercial: m.statusComercial,
    motivoPerda: m.motivoPerda, objecoes: m.objecoes,
    setorTreinamento: m.setorTreinamento, horasMinistradas: m.horasMinistradas,
    participantes: m.participantes, treinamentoExtraCobrado: m.treinamentoExtraCobrado,
    valorTreinamentoExtra: m.valorTreinamentoExtra, implantacaoId: m.implantacaoId,
    linkedTicketId: r.linked_ticket_id || undefined,
    observacoes: m.observacoes || undefined,
    fotos: m.fotos || [],
  };
}

export function tarefaToDb(t: any, orgId: string) {
  return {
    org_id: orgId, title: t.titulo, description: t.descricao || "",
    client_id: t.clienteId || null, assignee_profile_id: t.responsavelId || null,
    priority: t.prioridade || "media", status: t.status || "a_fazer",
    due_at: t.prazoDataHora || null, tags: t.tags || [],
    tipo_operacional: t.tipoOperacional || "interno",
    sistema_relacionado: t.sistemaRelacionado || null,
    linked_ticket_id: t.linkedTicketId || null,
    metadata: {
      nomeClienteAvulso: t.nomeClienteAvulso || undefined,
      checklist: t.checklist || [], anexosFake: t.anexosFake || [],
      moduloRelacionado: t.moduloRelacionado, slaHoras: t.slaHoras,
      reincidente: t.reincidente, geraCobrancaExtra: t.geraCobrancaExtra,
      valorCobrancaExtra: t.valorCobrancaExtra, etapaImplantacao: t.etapaImplantacao,
      riscoCancelamento: t.riscoCancelamento, valorProposta: t.valorProposta,
      tipoPlano: t.tipoPlano, dataPrevisaoFechamento: t.dataPrevisaoFechamento,
      origemLead: t.origemLead, statusComercial: t.statusComercial,
      motivoPerda: t.motivoPerda, objecoes: t.objecoes,
      setorTreinamento: t.setorTreinamento, horasMinistradas: t.horasMinistradas,
      participantes: t.participantes, treinamentoExtraCobrado: t.treinamentoExtraCobrado,
      valorTreinamentoExtra: t.valorTreinamentoExtra, implantacaoId: t.implantacaoId,
      observacoes: t.observacoes, fotos: t.fotos,
    },
  };
}
