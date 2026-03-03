import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { ClienteReceita, SuporteEvento, MetricasConfig } from "@/types/receita";
import { seedClientesReceita, seedSuporteEventos } from "@/data/seedReceita";

function uid() { return Math.random().toString(36).slice(2, 11); }

interface ReceitaState {
  clientesReceita: ClienteReceita[];
  suporteEventos: SuporteEvento[];
  metricasConfig: MetricasConfig;
  loading: boolean;
}

interface ReceitaContextType extends ReceitaState {
  addClienteReceita: (c: Omit<ClienteReceita, "id">) => void;
  updateClienteReceita: (id: string, changes: Partial<ClienteReceita>) => void;
  deleteClienteReceita: (id: string) => void;
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
    metricasConfig: defaultMetricasConfig,
  };
}

export function ReceitaProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [clientesReceita, setClientesReceita] = useState<ClienteReceita[]>([]);
  const [suporteEventos, setSuporteEventos] = useState<SuporteEvento[]>([]);
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
        setMetricasConfig(saved.metricasConfig || defaultMetricasConfig);
      } else {
        const initial = createInitial();
        setClientesReceita(initial.clientesReceita);
        setSuporteEventos(initial.suporteEventos);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ clientesReceita, suporteEventos, metricasConfig }));
  }, [clientesReceita, suporteEventos, metricasConfig, loading]);

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

  const updateMetricasConfig = useCallback((c: Partial<MetricasConfig>) => {
    setMetricasConfig(prev => ({ ...prev, ...c }));
  }, []);

  const resetReceita = useCallback(() => {
    const initial = createInitial();
    setClientesReceita(initial.clientesReceita);
    setSuporteEventos(initial.suporteEventos);
    setMetricasConfig(defaultMetricasConfig);
  }, []);

  const getClienteReceita = useCallback((id: string) => clientesReceita.find(c => c.id === id), [clientesReceita]);

  return (
    <ReceitaContext.Provider value={{
      clientesReceita, suporteEventos, metricasConfig, loading,
      addClienteReceita, updateClienteReceita, deleteClienteReceita,
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
