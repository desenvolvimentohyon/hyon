import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { ClienteReceita, SuporteEvento, MetricasConfig, MensalidadeAjuste } from "@/types/receita";
import { seedClientesReceita, seedSuporteEventos, seedMensalidadeAjustes } from "@/data/seedReceita";

function uid() { return Math.random().toString(36).slice(2, 11); }

interface ReceitaState {
  clientesReceita: ClienteReceita[];
  suporteEventos: SuporteEvento[];
  mensalidadeAjustes: MensalidadeAjuste[];
  metricasConfig: MetricasConfig;
  loading: boolean;
}

interface ReceitaContextType extends ReceitaState {
  addClienteReceita: (c: Omit<ClienteReceita, "id">) => void;
  updateClienteReceita: (id: string, changes: Partial<ClienteReceita>) => void;
  deleteClienteReceita: (id: string) => void;
  addMensalidadeAjuste: (clienteId: string, valorNovo: number, motivo: string) => void;
  getAjustesCliente: (clienteId: string) => MensalidadeAjuste[];
  updateMetricasConfig: (c: Partial<MetricasConfig>) => void;
  resetReceita: () => void;
  getClienteReceita: (id: string) => ClienteReceita | undefined;
}

const ReceitaContext = createContext<ReceitaContextType | null>(null);
const STORAGE_KEY = "receita-data";

const defaultMetricasConfig: MetricasConfig = {
  periodoPadrao: "12m",
  churnWindowMeses: 12,
  moeda: "BRL",
};

function loadFromStorage(): Omit<ReceitaState, "loading"> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function createInitial(): Omit<ReceitaState, "loading"> {
  return {
    clientesReceita: seedClientesReceita,
    suporteEventos: seedSuporteEventos,
    mensalidadeAjustes: seedMensalidadeAjustes,
    metricasConfig: defaultMetricasConfig,
  };
}

export function ReceitaProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [clientesReceita, setClientesReceita] = useState<ClienteReceita[]>([]);
  const [suporteEventos, setSuporteEventos] = useState<SuporteEvento[]>([]);
  const [mensalidadeAjustes, setMensalidadeAjustes] = useState<MensalidadeAjuste[]>([]);
  const [metricasConfig, setMetricasConfig] = useState<MetricasConfig>(defaultMetricasConfig);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const timer = setTimeout(() => {
      const saved = loadFromStorage();
      if (saved) {
        setClientesReceita(saved.clientesReceita);
        setSuporteEventos(saved.suporteEventos);
        setMensalidadeAjustes(saved.mensalidadeAjustes || []);
        setMetricasConfig(saved.metricasConfig || defaultMetricasConfig);
      } else {
        const initial = createInitial();
        setClientesReceita(initial.clientesReceita);
        setSuporteEventos(initial.suporteEventos);
        setMensalidadeAjustes(initial.mensalidadeAjustes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ clientesReceita, suporteEventos, mensalidadeAjustes, metricasConfig }));
  }, [clientesReceita, suporteEventos, mensalidadeAjustes, metricasConfig, loading]);

  const addClienteReceita = useCallback((c: Omit<ClienteReceita, "id">) => {
    setClientesReceita(prev => [...prev, { ...c, id: uid() }]);
  }, []);

  const updateClienteReceita = useCallback((id: string, changes: Partial<ClienteReceita>) => {
    setClientesReceita(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));
  }, []);

  const deleteClienteReceita = useCallback((id: string) => {
    setClientesReceita(prev => prev.filter(c => c.id !== id));
    setSuporteEventos(prev => prev.filter(e => e.clienteId !== id));
  }, []);

  const addMensalidadeAjuste = useCallback((clienteId: string, valorNovo: number, motivo: string) => {
    const cliente = clientesReceita.find(c => c.id === clienteId);
    if (!cliente) return;
    const ajuste: MensalidadeAjuste = {
      id: uid(),
      clienteId,
      data: new Date().toISOString(),
      valorAnterior: cliente.valorMensalidade,
      valorNovo,
      motivo,
    };
    setMensalidadeAjustes(prev => [...prev, ajuste]);
    setClientesReceita(prev => prev.map(c => c.id === clienteId ? { ...c, valorMensalidade: valorNovo } : c));
  }, [clientesReceita]);

  const getAjustesCliente = useCallback((clienteId: string) =>
    mensalidadeAjustes.filter(a => a.clienteId === clienteId).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()),
  [mensalidadeAjustes]);

  const updateMetricasConfig = useCallback((c: Partial<MetricasConfig>) => {
    setMetricasConfig(prev => ({ ...prev, ...c }));
  }, []);

  const resetReceita = useCallback(() => {
    const initial = createInitial();
    setClientesReceita(initial.clientesReceita);
    setSuporteEventos(initial.suporteEventos);
    setMensalidadeAjustes(initial.mensalidadeAjustes);
    setMetricasConfig(defaultMetricasConfig);
  }, []);

  const getClienteReceita = useCallback((id: string) => clientesReceita.find(c => c.id === id), [clientesReceita]);

  return (
    <ReceitaContext.Provider value={{
      clientesReceita, suporteEventos, mensalidadeAjustes, metricasConfig, loading,
      addClienteReceita, updateClienteReceita, deleteClienteReceita,
      addMensalidadeAjuste, getAjustesCliente,
      updateMetricasConfig, resetReceita, getClienteReceita,
    }}>
      {children}
    </ReceitaContext.Provider>
  );
}

export function useReceita() {
  const ctx = useContext(ReceitaContext);
  if (!ctx) throw new Error("useReceita must be used within ReceitaProvider");
  return ctx;
}
