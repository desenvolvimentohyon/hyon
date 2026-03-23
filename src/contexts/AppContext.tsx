import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Cliente, Tecnico, Tarefa, Configuracoes, StatusTarefa, Prioridade,
  STATUS_LABELS_DEFAULT, PRIORIDADE_LABELS_DEFAULT, HistoricoItem,
} from "@/types";

// ===== Mappers =====
function dbToCliente(r: any): Cliente {
  const m = r.metadata || {};
  return {
    id: r.id, nome: r.name, telefone: r.phone || undefined, email: r.email || undefined,
    documento: r.document || undefined, observacoes: r.notes || undefined, criadoEm: r.created_at,
    sistemaUsado: m.sistemaUsado, usaCloud: m.usaCloud, usaTEF: m.usaTEF,
    usaPagamentoIntegrado: m.usaPagamentoIntegrado, tipoNegocio: m.tipoNegocio,
    perfilCliente: m.perfilCliente, mensalidadeAtual: Number(r.monthly_value_final) || undefined,
    statusFinanceiro: m.statusFinanceiro, riscoCancelamento: m.riscoCancelamento,
  };
}

function clienteToDb(c: Omit<Cliente, "id" | "criadoEm">, orgId: string) {
  return {
    org_id: orgId, name: c.nome, phone: c.telefone || null, email: c.email || null,
    document: c.documento || null, notes: c.observacoes || null,
    monthly_value_final: c.mensalidadeAtual || 0,
    metadata: {
      sistemaUsado: c.sistemaUsado, usaCloud: c.usaCloud, usaTEF: c.usaTEF,
      usaPagamentoIntegrado: c.usaPagamentoIntegrado, tipoNegocio: c.tipoNegocio,
      perfilCliente: c.perfilCliente, statusFinanceiro: c.statusFinanceiro,
      riscoCancelamento: c.riscoCancelamento,
    },
  };
}

function dbToTecnico(r: any): Tecnico {
  return { id: r.id, nome: r.full_name, ativo: r.is_active, email: r.email || undefined };
}

function dbToTarefa(r: any): Tarefa {
  const m = r.metadata || {};
  const comments = (r.task_comments || []).map((c: any) => ({
    id: c.id, autorNome: c.author_name || "Usuário", texto: c.text, criadoEm: c.created_at,
  }));
  const historico = (r.task_history || []).map((h: any) => ({
    id: h.id, acao: h.action, detalhes: h.details || "", criadoEm: h.created_at,
  }));
  return {
    id: r.id, titulo: r.title, descricao: r.description, clienteId: r.client_id,
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
  };
}

function tarefaToDb(t: any, orgId: string) {
  return {
    org_id: orgId, title: t.titulo, description: t.descricao || "",
    client_id: t.clienteId || null, assignee_profile_id: t.responsavelId || null,
    priority: t.prioridade || "media", status: t.status || "a_fazer",
    due_at: t.prazoDataHora || null, tags: t.tags || [],
    tipo_operacional: t.tipoOperacional || "interno",
    sistema_relacionado: t.sistemaRelacionado || null,
    linked_ticket_id: t.linkedTicketId || null,
    metadata: {
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
    },
  };
}

// ===== Context =====
const defaultConfig: Configuracoes = {
  labelsStatus: { ...STATUS_LABELS_DEFAULT },
  labelsPrioridade: { ...PRIORIDADE_LABELS_DEFAULT },
  modoCompacto: false,
};

interface AppState {
  clientes: Cliente[];
  tecnicos: Tecnico[];
  tarefas: Tarefa[];
  configuracoes: Configuracoes;
  tecnicoAtualId: string;
  loading: boolean;
}

interface AppContextType extends AppState {
  addTarefa: (t: Omit<Tarefa, "id" | "criadoEm" | "atualizadoEm" | "historico" | "tempoTotalSegundos" | "timerRodando"> & { tipoOperacional?: Tarefa["tipoOperacional"] }) => void;
  updateTarefa: (id: string, changes: Partial<Tarefa>, acao?: string) => void;
  deleteTarefa: (id: string) => void;
  startTimer: (tarefaId: string) => void;
  stopTimer: (tarefaId: string) => void;
  addCliente: (c: Omit<Cliente, "id" | "criadoEm">) => void;
  updateCliente: (id: string, changes: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;
  addTecnico: (t: Omit<Tecnico, "id">) => void;
  updateTecnico: (id: string, changes: Partial<Tecnico>) => void;
  deleteTecnico: (id: string) => void;
  setTecnicoAtual: (id: string) => void;
  updateConfiguracoes: (c: Partial<Configuracoes>) => void;
  resetDados: () => void;
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
  getCliente: (id: string | null) => Cliente | undefined;
  getTecnico: (id: string) => Tecnico | undefined;
  getStatusLabel: (s: StatusTarefa) => string;
  getPrioridadeLabel: (p: Prioridade) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth();
  const orgId = profile?.org_id;

  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>(defaultConfig);
  const [tecnicoAtualId, setTecnicoAtualId] = useState("");

  // Set current user as tecnico atual
  useEffect(() => {
    if (user?.id) setTecnicoAtualId(user.id);
  }, [user?.id]);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [clientsRes, profilesRes, tasksRes, settingsRes] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("profiles").select("*"),
        supabase.from("tasks").select("*, task_comments(id, text, created_at, author_profile_id), task_history(id, action, details, created_at)"),
        user?.id
          ? supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (clientsRes.data) setClientes(clientsRes.data.map(dbToCliente));
      if (profilesRes.data) {
        // Enrich comments with author names
        const profileMap = new Map(profilesRes.data.map((p: any) => [p.id, p.full_name]));
        setTecnicos(profilesRes.data.map(dbToTecnico));

        if (tasksRes.data) {
          const enriched = tasksRes.data.map((t: any) => {
            const task = { ...t };
            if (task.task_comments) {
              task.task_comments = task.task_comments.map((c: any) => ({
                ...c,
                author_name: profileMap.get(c.author_profile_id) || "Usuário",
              }));
            }
            return task;
          });
          setTarefas(enriched.map(dbToTarefa));
        }
      }

      if (settingsRes.data?.settings) {
        const s = settingsRes.data.settings as any;
        if (s.configuracoes) setConfiguracoes({ ...defaultConfig, ...s.configuracoes });
      }
    } catch (err) {
      console.error("Error fetching app data:", err);
    }
    setLoading(false);
  }, [orgId, user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ===== Tarefas =====
  const addTarefa = useCallback(async (t: any) => {
    if (!orgId) return;
    const dbData = tarefaToDb(t, orgId);
    const { data, error } = await supabase.from("tasks").insert(dbData).select().single();
    if (error) { toast.error("Erro ao criar tarefa: " + error.message); return; }
    // Add initial history
    await supabase.from("task_history").insert({
      org_id: orgId, task_id: data.id, action: "Criação", details: "Tarefa criada",
    });
    fetchAll();
  }, [orgId, fetchAll]);

  const updateTarefa = useCallback(async (id: string, changes: Partial<Tarefa>, acao?: string) => {
    if (!orgId) return;
    const existing = tarefas.find(t => t.id === id);
    if (!existing) return;
    const merged = { ...existing, ...changes };
    const dbUpdate: any = {};
    if (changes.titulo !== undefined) dbUpdate.title = changes.titulo;
    if (changes.descricao !== undefined) dbUpdate.description = changes.descricao;
    if (changes.clienteId !== undefined) dbUpdate.client_id = changes.clienteId;
    if (changes.responsavelId !== undefined) dbUpdate.assignee_profile_id = changes.responsavelId;
    if (changes.prioridade !== undefined) dbUpdate.priority = changes.prioridade;
    if (changes.status !== undefined) dbUpdate.status = changes.status;
    if (changes.prazoDataHora !== undefined) dbUpdate.due_at = changes.prazoDataHora;
    if (changes.tags !== undefined) dbUpdate.tags = changes.tags;
    if (changes.tipoOperacional !== undefined) dbUpdate.tipo_operacional = changes.tipoOperacional;
    if (changes.sistemaRelacionado !== undefined) dbUpdate.sistema_relacionado = changes.sistemaRelacionado;
    if ((changes as any).linkedTicketId !== undefined) dbUpdate.linked_ticket_id = (changes as any).linkedTicketId;
    if (changes.tempoTotalSegundos !== undefined) dbUpdate.total_seconds = changes.tempoTotalSegundos;
    if (changes.timerRodando !== undefined) dbUpdate.timer_running = changes.timerRodando;
    if (changes.timerInicioTimestamp !== undefined) {
      dbUpdate.timer_started_at = changes.timerInicioTimestamp ? new Date(changes.timerInicioTimestamp).toISOString() : null;
    }
    // Update metadata for extended fields
    const metaFields = ["checklist", "anexosFake", "moduloRelacionado", "slaHoras", "reincidente",
      "geraCobrancaExtra", "valorCobrancaExtra", "etapaImplantacao", "riscoCancelamento",
      "valorProposta", "tipoPlano", "dataPrevisaoFechamento", "origemLead", "statusComercial",
      "motivoPerda", "objecoes", "setorTreinamento", "horasMinistradas", "participantes",
      "treinamentoExtraCobrado", "valorTreinamentoExtra", "implantacaoId"];
    const existingMeta = (existing as any).metadata || {};
    const newMeta = { ...existingMeta };
    let metaChanged = false;
    for (const f of metaFields) {
      if ((changes as any)[f] !== undefined) {
        newMeta[f] = (changes as any)[f];
        metaChanged = true;
      }
    }
    if (metaChanged) dbUpdate.metadata = newMeta;

    if (Object.keys(dbUpdate).length > 0) {
      const { error } = await supabase.from("tasks").update(dbUpdate).eq("id", id);
      if (error) { toast.error("Erro ao atualizar tarefa: " + error.message); return; }
    }
    if (acao) {
      await supabase.from("task_history").insert({
        org_id: orgId, task_id: id, action: acao,
        details: JSON.stringify(changes).slice(0, 200),
      });
    }
    // Handle new comments
    if (changes.comentarios && changes.comentarios.length > (existing.comentarios?.length || 0)) {
      const newComments = changes.comentarios.slice(existing.comentarios?.length || 0);
      for (const c of newComments) {
        await supabase.from("task_comments").insert({
          org_id: orgId, task_id: id, text: c.texto,
          author_profile_id: user?.id || "",
        });
      }
    }
    fetchAll();
  }, [orgId, tarefas, user?.id, fetchAll]);

  const deleteTarefa = useCallback(async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir tarefa"); return; }
    setTarefas(prev => prev.filter(t => t.id !== id));
  }, []);

  const startTimer = useCallback(async (tarefaId: string) => {
    if (!orgId) return;
    const now = Date.now();
    // Stop any running timers first
    const running = tarefas.find(t => t.timerRodando && t.id !== tarefaId);
    if (running) {
      const elapsed = Math.floor((now - (running.timerInicioTimestamp || now)) / 1000);
      await supabase.from("tasks").update({
        timer_running: false, timer_started_at: null,
        total_seconds: running.tempoTotalSegundos + elapsed,
      }).eq("id", running.id);
    }
    await supabase.from("tasks").update({
      timer_running: true, timer_started_at: new Date(now).toISOString(),
    }).eq("id", tarefaId);
    fetchAll();
  }, [orgId, tarefas, fetchAll]);

  const stopTimer = useCallback(async (tarefaId: string) => {
    const task = tarefas.find(t => t.id === tarefaId);
    if (!task?.timerRodando) return;
    const elapsed = Math.floor((Date.now() - (task.timerInicioTimestamp || Date.now())) / 1000);
    await supabase.from("tasks").update({
      timer_running: false, timer_started_at: null,
      total_seconds: task.tempoTotalSegundos + elapsed,
    }).eq("id", tarefaId);
    fetchAll();
  }, [tarefas, fetchAll]);

  // ===== Clientes =====
  const addCliente = useCallback(async (c: Omit<Cliente, "id" | "criadoEm">) => {
    if (!orgId) return;
    const { error } = await supabase.from("clients").insert(clienteToDb(c, orgId));
    if (error) { toast.error("Erro ao criar cliente: " + error.message); return; }
    fetchAll();
  }, [orgId, fetchAll]);

  const updateCliente = useCallback(async (id: string, changes: Partial<Cliente>) => {
    const upd: any = {};
    if (changes.nome !== undefined) upd.name = changes.nome;
    if (changes.telefone !== undefined) upd.phone = changes.telefone;
    if (changes.email !== undefined) upd.email = changes.email;
    if (changes.documento !== undefined) upd.document = changes.documento;
    if (changes.observacoes !== undefined) upd.notes = changes.observacoes;
    if (changes.mensalidadeAtual !== undefined) upd.monthly_value_final = changes.mensalidadeAtual;
    // Metadata fields
    const existing = clientes.find(c => c.id === id);
    const meta = { ...(existing as any)?.metadata };
    const metaKeys = ["sistemaUsado", "usaCloud", "usaTEF", "usaPagamentoIntegrado", "tipoNegocio", "perfilCliente", "statusFinanceiro", "riscoCancelamento"];
    let metaChanged = false;
    for (const k of metaKeys) {
      if ((changes as any)[k] !== undefined) { meta[k] = (changes as any)[k]; metaChanged = true; }
    }
    if (metaChanged) upd.metadata = meta;
    if (Object.keys(upd).length > 0) {
      const { error } = await supabase.from("clients").update(upd).eq("id", id);
      if (error) { toast.error("Erro ao atualizar cliente"); return; }
    }
    fetchAll();
  }, [clientes, fetchAll]);

  const deleteCliente = useCallback(async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir cliente"); return; }
    setClientes(prev => prev.filter(c => c.id !== id));
  }, []);

  // ===== Técnicos (profiles) =====
  const addTecnico = useCallback(async (_t: Omit<Tecnico, "id">) => {
    toast.info("Para adicionar membros da equipe, use a gestão de usuários.");
  }, []);

  const updateTecnico = useCallback(async (id: string, changes: Partial<Tecnico>) => {
    const upd: any = {};
    if (changes.nome !== undefined) upd.full_name = changes.nome;
    if (changes.ativo !== undefined) upd.is_active = changes.ativo;
    const { error } = await supabase.from("profiles").update(upd).eq("id", id);
    if (error) { toast.error("Erro ao atualizar técnico"); return; }
    fetchAll();
  }, [fetchAll]);

  const deleteTecnico = useCallback(async (_id: string) => {
    toast.info("Técnicos são gerenciados via gestão de usuários.");
  }, []);

  const setTecnicoAtual = useCallback((id: string) => setTecnicoAtualId(id), []);

  // ===== Configurações =====
  const updateConfiguracoes = useCallback(async (c: Partial<Configuracoes>) => {
    const newConfig = { ...configuracoes, ...c };
    setConfiguracoes(newConfig);
    if (user?.id && orgId) {
      await supabase.from("user_settings" as any).upsert({
        user_id: user.id, org_id: orgId,
        settings: { configuracoes: newConfig },
      }, { onConflict: "user_id" });
    }
  }, [configuracoes, user?.id, orgId]);

  const resetDados = useCallback(() => {
    toast.info("Funcionalidade de reset não disponível.");
  }, []);

  const exportJSON = useCallback(() => {
    return JSON.stringify({ clientes, tecnicos, tarefas, configuracoes, tecnicoAtualId }, null, 2);
  }, [clientes, tecnicos, tarefas, configuracoes, tecnicoAtualId]);

  const importJSON = useCallback((_json: string) => {
    toast.info("Importação JSON não disponível com backend cloud.");
    return false;
  }, []);

  const getCliente = useCallback((id: string | null) => id ? clientes.find(c => c.id === id) : undefined, [clientes]);
  const getTecnico = useCallback((id: string) => tecnicos.find(t => t.id === id), [tecnicos]);
  const getStatusLabel = useCallback((s: StatusTarefa) => configuracoes.labelsStatus[s] || s, [configuracoes]);
  const getPrioridadeLabel = useCallback((p: Prioridade) => configuracoes.labelsPrioridade[p] || p, [configuracoes]);

  const value: AppContextType = {
    clientes, tecnicos, tarefas, configuracoes, tecnicoAtualId, loading,
    addTarefa, updateTarefa, deleteTarefa, startTimer, stopTimer,
    addCliente, updateCliente, deleteCliente,
    addTecnico, updateTecnico, deleteTecnico, setTecnicoAtual,
    updateConfiguracoes, resetDados, exportJSON, importJSON,
    getCliente, getTecnico, getStatusLabel, getPrioridadeLabel,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
