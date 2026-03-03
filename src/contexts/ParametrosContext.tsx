import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { SistemaCatalogo, ModuloCatalogo, FormaPagamentoCatalogo, PlanoCatalogo } from "@/types/parametros";
import { seedSistemas, seedModulos, seedFormasPagamento, seedPlanos } from "@/data/seedParametros";

function uid() { return Math.random().toString(36).slice(2, 11); }

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
const STORAGE_KEY = "gestao-parametros";

function loadStorage(): Omit<ParametrosState, never> | null {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {} return null;
}
function saveStorage(s: ParametrosState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

function initial(): ParametrosState {
  return { sistemas: seedSistemas, modulos: seedModulos, formasPagamento: seedFormasPagamento, planos: seedPlanos, alertaCertificadoDias: 30 };
}

export function ParametrosProvider({ children }: { children: React.ReactNode }) {
  const [sistemas, setSistemas] = useState<SistemaCatalogo[]>([]);
  const [modulos, setModulos] = useState<ModuloCatalogo[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoCatalogo[]>([]);
  const [planos, setPlanos] = useState<PlanoCatalogo[]>([]);
  const [alertaCertificadoDias, setAlertaCertificadoDiasState] = useState(30);
  const init = useRef(false);

  useEffect(() => {
    if (init.current) return; init.current = true;
    const saved = loadStorage();
    if (saved) {
      setSistemas(saved.sistemas); setModulos(saved.modulos);
      setFormasPagamento(saved.formasPagamento); setPlanos(saved.planos);
      setAlertaCertificadoDiasState(saved.alertaCertificadoDias ?? 30);
    } else {
      const i = initial();
      setSistemas(i.sistemas); setModulos(i.modulos);
      setFormasPagamento(i.formasPagamento); setPlanos(i.planos);
      saveStorage(i);
    }
  }, []);

  useEffect(() => {
    if (!init.current) return;
    saveStorage({ sistemas, modulos, formasPagamento, planos, alertaCertificadoDias });
  }, [sistemas, modulos, formasPagamento, planos, alertaCertificadoDias]);

  const addSistema = useCallback((s: Omit<SistemaCatalogo, "id">) => setSistemas(p => [...p, { ...s, id: uid() }]), []);
  const updateSistema = useCallback((id: string, c: Partial<SistemaCatalogo>) => setSistemas(p => p.map(s => s.id === id ? { ...s, ...c } : s)), []);
  const deleteSistema = useCallback((id: string) => setSistemas(p => p.filter(s => s.id !== id)), []);

  const addModulo = useCallback((m: Omit<ModuloCatalogo, "id">) => setModulos(p => [...p, { ...m, id: uid() }]), []);
  const updateModulo = useCallback((id: string, c: Partial<ModuloCatalogo>) => setModulos(p => p.map(m => m.id === id ? { ...m, ...c } : m)), []);
  const deleteModulo = useCallback((id: string) => setModulos(p => p.filter(m => m.id !== id)), []);

  const addFormaPagamento = useCallback((f: Omit<FormaPagamentoCatalogo, "id">) => setFormasPagamento(p => [...p, { ...f, id: uid() }]), []);
  const updateFormaPagamento = useCallback((id: string, c: Partial<FormaPagamentoCatalogo>) => setFormasPagamento(p => p.map(f => f.id === id ? { ...f, ...c } : f)), []);
  const deleteFormaPagamento = useCallback((id: string) => setFormasPagamento(p => p.filter(f => f.id !== id)), []);

  const addPlano = useCallback((pl: Omit<PlanoCatalogo, "id">) => setPlanos(p => [...p, { ...pl, id: uid() }]), []);
  const updatePlano = useCallback((id: string, c: Partial<PlanoCatalogo>) => setPlanos(p => p.map(pl => pl.id === id ? { ...pl, ...c } : pl)), []);
  const deletePlano = useCallback((id: string) => setPlanos(p => p.filter(pl => pl.id !== id)), []);

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
    const i = initial();
    setSistemas(i.sistemas); setModulos(i.modulos);
    setFormasPagamento(i.formasPagamento); setPlanos(i.planos);
    setAlertaCertificadoDiasState(30);
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
