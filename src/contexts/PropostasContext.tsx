import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Proposta, CRMConfig, PropostaHistorico, DEFAULT_CRM_CONFIG } from "@/types/propostas";
import { seedPropostas, defaultCRMConfig } from "@/data/seedPropostas";

function uid() { return Math.random().toString(36).slice(2, 11); }

interface PropostasState {
  propostas: Proposta[];
  crmConfig: CRMConfig;
  loading: boolean;
}

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

const STORAGE_KEY = "propostas-data";

function loadFromStorage(): { propostas: Proposta[]; crmConfig: CRMConfig } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToStorage(data: { propostas: Proposta[]; crmConfig: CRMConfig }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function gerarNumero(propostas: Proposta[]): string {
  const year = new Date().getFullYear();
  let max = 0;
  propostas.forEach(p => {
    const match = p.numeroProposta.match(/PROP-\d{4}-(\d{4})/);
    if (match) max = Math.max(max, parseInt(match[1]));
  });
  return `PROP-${year}-${String(max + 1).padStart(4, "0")}`;
}

function addHistorico(acao: string, detalhes: string): PropostaHistorico {
  return { id: uid(), acao, detalhes, criadoEm: new Date().toISOString() };
}

export function PropostasProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [crmConfig, setCRMConfig] = useState<CRMConfig>(defaultCRMConfig);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const timer = setTimeout(() => {
      const saved = loadFromStorage();
      if (saved) {
        setPropostas(saved.propostas);
        setCRMConfig(saved.crmConfig);
      } else {
        setPropostas(seedPropostas);
        setCRMConfig(defaultCRMConfig);
        saveToStorage({ propostas: seedPropostas, crmConfig: defaultCRMConfig });
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    saveToStorage({ propostas, crmConfig });
  }, [propostas, crmConfig, loading]);

  const addProposta = useCallback((p: Omit<Proposta, "id" | "numeroProposta" | "criadoEm" | "atualizadoEm" | "historico" | "linkAceite">): Proposta => {
    const now = new Date().toISOString();
    let nova: Proposta = {} as any;
    setPropostas(prev => {
      const numero = gerarNumero(prev);
      nova = {
        ...p, id: uid(), numeroProposta: numero,
        linkAceite: `/aceite/${numero}`,
        historico: [addHistorico("Criação", "Proposta criada")],
        criadoEm: now, atualizadoEm: now,
      };
      return [...prev, nova];
    });
    return nova;
  }, []);

  const updateProposta = useCallback((id: string, changes: Partial<Proposta>, acao?: string) => {
    setPropostas(prev => prev.map(p => {
      if (p.id !== id) return p;
      const hist = acao ? [...p.historico, addHistorico(acao, JSON.stringify(changes).slice(0, 200))] : p.historico;
      return { ...p, ...changes, atualizadoEm: new Date().toISOString(), historico: changes.historico || hist };
    }));
  }, []);

  const deleteProposta = useCallback((id: string) => {
    setPropostas(prev => prev.filter(p => p.id !== id));
  }, []);

  const cloneProposta = useCallback((id: string): Proposta | null => {
    let cloned: Proposta | null = null;
    setPropostas(prev => {
      const original = prev.find(p => p.id === id);
      if (!original) return prev;
      const numero = gerarNumero(prev);
      const now = new Date().toISOString();
      cloned = {
        ...original, id: uid(), numeroProposta: numero,
        linkAceite: `/aceite/${numero}`,
        statusCRM: "Rascunho", statusVisualizacao: "nao_enviado", statusAceite: "pendente",
        dataEnvio: null, dataValidade: null, pdfGeradoEm: null,
        historico: [addHistorico("Criação", `Clonada de ${original.numeroProposta}`)],
        criadoEm: now, atualizadoEm: now,
      };
      return [...prev, cloned];
    });
    return cloned;
  }, []);

  const getProposta = useCallback((id: string) => propostas.find(p => p.id === id), [propostas]);
  const getPropostaByNumero = useCallback((numero: string) => propostas.find(p => p.numeroProposta === numero), [propostas]);

  const updateCRMConfig = useCallback((changes: Partial<CRMConfig>) => {
    setCRMConfig(prev => ({ ...prev, ...changes }));
  }, []);

  const resetCRMConfig = useCallback(() => {
    setCRMConfig({ ...DEFAULT_CRM_CONFIG });
  }, []);

  const resetPropostas = useCallback(() => {
    setPropostas(seedPropostas);
    setCRMConfig(defaultCRMConfig);
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
