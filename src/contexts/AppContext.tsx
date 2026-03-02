import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Cliente, Tecnico, Tarefa, Configuracoes, StatusTarefa, Prioridade, STATUS_LABELS_DEFAULT, PRIORIDADE_LABELS_DEFAULT, HistoricoItem } from "@/types";
import { seedClientes, seedTecnicos, seedTarefas } from "@/data/seed";

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

interface AppState {
  clientes: Cliente[];
  tecnicos: Tecnico[];
  tarefas: Tarefa[];
  configuracoes: Configuracoes;
  tecnicoAtualId: string;
  loading: boolean;
}

interface AppContextType extends AppState {
  // Tarefas
  addTarefa: (t: Omit<Tarefa, "id" | "criadoEm" | "atualizadoEm" | "historico" | "tempoTotalSegundos" | "timerRodando"> & { tipoOperacional?: Tarefa["tipoOperacional"] }) => void;
  updateTarefa: (id: string, changes: Partial<Tarefa>, acao?: string) => void;
  deleteTarefa: (id: string) => void;
  // Timer
  startTimer: (tarefaId: string) => void;
  stopTimer: (tarefaId: string) => void;
  // Clientes
  addCliente: (c: Omit<Cliente, "id" | "criadoEm">) => void;
  updateCliente: (id: string, changes: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;
  // Técnicos
  addTecnico: (t: Omit<Tecnico, "id">) => void;
  updateTecnico: (id: string, changes: Partial<Tecnico>) => void;
  deleteTecnico: (id: string) => void;
  setTecnicoAtual: (id: string) => void;
  // Configurações
  updateConfiguracoes: (c: Partial<Configuracoes>) => void;
  resetDados: () => void;
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
  // Helpers
  getCliente: (id: string | null) => Cliente | undefined;
  getTecnico: (id: string) => Tecnico | undefined;
  getStatusLabel: (s: StatusTarefa) => string;
  getPrioridadeLabel: (p: Prioridade) => string;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "task-manager-data";

function loadFromStorage(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToStorage(state: Omit<AppState, "loading">) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const defaultConfig: Configuracoes = {
  labelsStatus: { ...STATUS_LABELS_DEFAULT },
  labelsPrioridade: { ...PRIORIDADE_LABELS_DEFAULT },
  modoCompacto: false,
};

function createInitialState(): Omit<AppState, "loading"> {
  return {
    clientes: seedClientes,
    tecnicos: seedTecnicos,
    tarefas: seedTarefas,
    configuracoes: defaultConfig,
    tecnicoAtualId: "t1",
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>(defaultConfig);
  const [tecnicoAtualId, setTecnicoAtualId] = useState("t1");
  const initialized = useRef(false);

  // Load on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const timer = setTimeout(() => {
      const saved = loadFromStorage();
      if (saved) {
        setClientes(saved.clientes);
        setTecnicos(saved.tecnicos);
        setTarefas(saved.tarefas);
        setConfiguracoes(saved.configuracoes);
        setTecnicoAtualId(saved.tecnicoAtualId);
      } else {
        const initial = createInitialState();
        setClientes(initial.clientes);
        setTecnicos(initial.tecnicos);
        setTarefas(initial.tarefas);
        setConfiguracoes(initial.configuracoes);
        setTecnicoAtualId(initial.tecnicoAtualId);
        saveToStorage(initial);
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Persist on change
  useEffect(() => {
    if (loading) return;
    saveToStorage({ clientes, tecnicos, tarefas, configuracoes, tecnicoAtualId });
  }, [clientes, tecnicos, tarefas, configuracoes, tecnicoAtualId, loading]);

  const addHistorico = (acao: string, detalhes: string): HistoricoItem => ({
    id: uid(), acao, detalhes, criadoEm: new Date().toISOString(),
  });

  const addTarefa = useCallback((t: Omit<Tarefa, "id" | "criadoEm" | "atualizadoEm" | "historico" | "tempoTotalSegundos" | "timerRodando"> & { tipoOperacional?: Tarefa["tipoOperacional"] }) => {
    const now = new Date().toISOString();
    const nova: Tarefa = {
      ...t, id: uid(), criadoEm: now, atualizadoEm: now,
      historico: [addHistorico("Criação", "Tarefa criada")],
      tempoTotalSegundos: 0, timerRodando: false,
      tipoOperacional: t.tipoOperacional || "interno",
    };
    setTarefas(prev => [...prev, nova]);
  }, []);

  const updateTarefa = useCallback((id: string, changes: Partial<Tarefa>, acao?: string) => {
    setTarefas(prev => prev.map(t => {
      if (t.id !== id) return t;
      const hist = acao ? [...t.historico, addHistorico(acao, JSON.stringify(changes))] : t.historico;
      return { ...t, ...changes, atualizadoEm: new Date().toISOString(), historico: changes.historico || hist };
    }));
  }, []);

  const deleteTarefa = useCallback((id: string) => {
    setTarefas(prev => prev.filter(t => t.id !== id));
  }, []);

  const startTimer = useCallback((tarefaId: string) => {
    const now = Date.now();
    setTarefas(prev => prev.map(t => {
      if (t.timerRodando && t.id !== tarefaId) {
        const elapsed = Math.floor((now - (t.timerInicioTimestamp || now)) / 1000);
        return { ...t, timerRodando: false, timerInicioTimestamp: undefined, tempoTotalSegundos: t.tempoTotalSegundos + elapsed, atualizadoEm: new Date().toISOString(), historico: [...t.historico, addHistorico("Timer pausado", "Pausado automaticamente")] };
      }
      if (t.id === tarefaId) {
        return { ...t, timerRodando: true, timerInicioTimestamp: now, atualizadoEm: new Date().toISOString(), historico: [...t.historico, addHistorico("Timer iniciado", "")] };
      }
      return t;
    }));
  }, []);

  const stopTimer = useCallback((tarefaId: string) => {
    const now = Date.now();
    setTarefas(prev => prev.map(t => {
      if (t.id === tarefaId && t.timerRodando) {
        const elapsed = Math.floor((now - (t.timerInicioTimestamp || now)) / 1000);
        return { ...t, timerRodando: false, timerInicioTimestamp: undefined, tempoTotalSegundos: t.tempoTotalSegundos + elapsed, atualizadoEm: new Date().toISOString(), historico: [...t.historico, addHistorico("Timer pausado", `+${elapsed}s`)] };
      }
      return t;
    }));
  }, []);

  const addCliente = useCallback((c: Omit<Cliente, "id" | "criadoEm">) => {
    setClientes(prev => [...prev, { ...c, id: uid(), criadoEm: new Date().toISOString() }]);
  }, []);

  const updateCliente = useCallback((id: string, changes: Partial<Cliente>) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));
  }, []);

  const deleteCliente = useCallback((id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
  }, []);

  const addTecnico = useCallback((t: Omit<Tecnico, "id">) => {
    setTecnicos(prev => [...prev, { ...t, id: uid() }]);
  }, []);

  const updateTecnico = useCallback((id: string, changes: Partial<Tecnico>) => {
    setTecnicos(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
  }, []);

  const deleteTecnico = useCallback((id: string) => {
    setTecnicos(prev => prev.filter(t => t.id !== id));
  }, []);

  const setTecnicoAtual = useCallback((id: string) => {
    setTecnicoAtualId(id);
  }, []);

  const updateConfiguracoes = useCallback((c: Partial<Configuracoes>) => {
    setConfiguracoes(prev => ({ ...prev, ...c }));
  }, []);

  const resetDados = useCallback(() => {
    const initial = createInitialState();
    setClientes(initial.clientes);
    setTecnicos(initial.tecnicos);
    setTarefas(initial.tarefas);
    setConfiguracoes(initial.configuracoes);
    setTecnicoAtualId(initial.tecnicoAtualId);
  }, []);

  const exportJSON = useCallback(() => {
    return JSON.stringify({ clientes, tecnicos, tarefas, configuracoes, tecnicoAtualId }, null, 2);
  }, [clientes, tecnicos, tarefas, configuracoes, tecnicoAtualId]);

  const importJSON = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.clientes) setClientes(data.clientes);
      if (data.tecnicos) setTecnicos(data.tecnicos);
      if (data.tarefas) setTarefas(data.tarefas);
      if (data.configuracoes) setConfiguracoes(data.configuracoes);
      if (data.tecnicoAtualId) setTecnicoAtualId(data.tecnicoAtualId);
      return true;
    } catch { return false; }
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
