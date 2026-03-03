import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  ContaBancaria, PlanoContas, TituloFinanceiro, MovimentoBancario, ConfigFinanceira
} from "@/types/financeiro";
import {
  seedContasBancarias, seedPlanoContas, seedTitulos, seedMovimentos, seedConfigFinanceira
} from "@/data/seedFinanceiro";

function uid() { return Math.random().toString(36).slice(2, 11); }

interface FinanceiroState {
  contasBancarias: ContaBancaria[];
  planoContas: PlanoContas[];
  titulos: TituloFinanceiro[];
  movimentos: MovimentoBancario[];
  config: ConfigFinanceira;
  loading: boolean;
}

interface FinanceiroContextType extends FinanceiroState {
  // Contas Bancárias
  addContaBancaria: (c: Omit<ContaBancaria, "id">) => void;
  updateContaBancaria: (id: string, changes: Partial<ContaBancaria>) => void;
  deleteContaBancaria: (id: string) => void;
  getSaldoConta: (id: string) => number;
  // Plano de Contas
  addPlanoContas: (p: Omit<PlanoContas, "id">) => void;
  updatePlanoContas: (id: string, changes: Partial<PlanoContas>) => void;
  deletePlanoContas: (id: string) => boolean;
  getFilhosPlanoContas: (paiId: string | null) => PlanoContas[];
  // Títulos
  addTitulo: (t: Omit<TituloFinanceiro, "id" | "criadoEm" | "atualizadoEm">) => void;
  updateTitulo: (id: string, changes: Partial<TituloFinanceiro>) => void;
  deleteTitulo: (id: string) => void;
  baixarTitulo: (id: string, contaBancariaId: string, valorPago?: number) => void;
  // Movimentos
  addMovimento: (m: Omit<MovimentoBancario, "id" | "criadoEm">) => void;
  updateMovimento: (id: string, changes: Partial<MovimentoBancario>) => void;
  conciliarMovimento: (movimentoId: string, tituloId: string) => void;
  desconciliarMovimento: (movimentoId: string) => void;
  importarExtrato: () => void;
  // Config
  updateConfig: (c: Partial<ConfigFinanceira>) => void;
  resetFinanceiro: () => void;
  exportFinanceiro: () => string;
  importFinanceiro: (json: string) => boolean;
}

const FinanceiroContext = createContext<FinanceiroContextType | null>(null);
const STORAGE_KEY = "financeiro-data";

function loadFromStorage(): Omit<FinanceiroState, "loading"> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function createInitial(): Omit<FinanceiroState, "loading"> {
  return {
    contasBancarias: seedContasBancarias,
    planoContas: seedPlanoContas,
    titulos: seedTitulos,
    movimentos: seedMovimentos,
    config: seedConfigFinanceira,
  };
}

export function FinanceiroProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [planoContas, setPlanoContas] = useState<PlanoContas[]>([]);
  const [titulos, setTitulos] = useState<TituloFinanceiro[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoBancario[]>([]);
  const [config, setConfig] = useState<ConfigFinanceira>(seedConfigFinanceira);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const timer = setTimeout(() => {
      const saved = loadFromStorage();
      if (saved) {
        setContasBancarias(saved.contasBancarias);
        setPlanoContas(saved.planoContas);
        setTitulos(saved.titulos);
        setMovimentos(saved.movimentos);
        setConfig(saved.config || seedConfigFinanceira);
      } else {
        const initial = createInitial();
        setContasBancarias(initial.contasBancarias);
        setPlanoContas(initial.planoContas);
        setTitulos(initial.titulos);
        setMovimentos(initial.movimentos);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ contasBancarias, planoContas, titulos, movimentos, config }));
  }, [contasBancarias, planoContas, titulos, movimentos, config, loading]);

  // ===== Contas Bancárias =====
  const addContaBancaria = useCallback((c: Omit<ContaBancaria, "id">) => {
    setContasBancarias(prev => [...prev, { ...c, id: uid() }]);
  }, []);
  const updateContaBancaria = useCallback((id: string, changes: Partial<ContaBancaria>) => {
    setContasBancarias(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));
  }, []);
  const deleteContaBancaria = useCallback((id: string) => {
    setContasBancarias(prev => prev.filter(c => c.id !== id));
  }, []);
  const getSaldoConta = useCallback((id: string) => {
    const conta = contasBancarias.find(c => c.id === id);
    if (!conta) return 0;
    const totalMov = movimentos.filter(m => m.contaBancariaId === id).reduce((sum, m) => sum + m.valor, 0);
    return conta.saldoInicial + totalMov;
  }, [contasBancarias, movimentos]);

  // ===== Plano de Contas =====
  const addPlanoContas = useCallback((p: Omit<PlanoContas, "id">) => {
    setPlanoContas(prev => [...prev, { ...p, id: uid() }]);
  }, []);
  const updatePlanoContas = useCallback((id: string, changes: Partial<PlanoContas>) => {
    setPlanoContas(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  }, []);
  const deletePlanoContas = useCallback((id: string) => {
    const hasChildren = planoContas.some(p => p.paiId === id);
    const hasLancamentos = titulos.some(t => t.categoriaPlanoContasId === id);
    if (hasChildren || hasLancamentos) return false;
    setPlanoContas(prev => prev.filter(p => p.id !== id));
    return true;
  }, [planoContas, titulos]);
  const getFilhosPlanoContas = useCallback((paiId: string | null) => {
    return planoContas.filter(p => p.paiId === paiId).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [planoContas]);

  // ===== Títulos =====
  const addTitulo = useCallback((t: Omit<TituloFinanceiro, "id" | "criadoEm" | "atualizadoEm">) => {
    const now = new Date().toISOString();
    setTitulos(prev => [...prev, { ...t, id: uid(), criadoEm: now, atualizadoEm: now }]);
  }, []);
  const updateTitulo = useCallback((id: string, changes: Partial<TituloFinanceiro>) => {
    setTitulos(prev => prev.map(t => t.id === id ? { ...t, ...changes, atualizadoEm: new Date().toISOString() } : t));
  }, []);
  const deleteTitulo = useCallback((id: string) => {
    setTitulos(prev => prev.filter(t => t.id !== id));
  }, []);
  const baixarTitulo = useCallback((id: string, contaBancariaId: string, valorPago?: number) => {
    const titulo = titulos.find(t => t.id === id);
    if (!titulo) return;
    const valorFinal = valorPago || (titulo.valorOriginal - titulo.desconto + titulo.juros + titulo.multa);
    const isParcial = valorPago && valorPago < (titulo.valorOriginal - titulo.desconto + titulo.juros + titulo.multa);
    
    setTitulos(prev => prev.map(t => t.id === id ? {
      ...t, status: isParcial ? "parcial" as const : "pago" as const, contaBancariaId, atualizadoEm: new Date().toISOString()
    } : t));

    const mov: MovimentoBancario = {
      id: uid(),
      contaBancariaId,
      data: new Date().toISOString().split("T")[0],
      descricao: titulo.descricao,
      valor: titulo.tipo === "receber" ? valorFinal : -valorFinal,
      tipo: titulo.tipo === "receber" ? "credito" : "debito",
      conciliado: true,
      tituloVinculadoId: id,
      categoriaSugestao: null,
      criadoEm: new Date().toISOString(),
    };
    setMovimentos(prev => [...prev, mov]);
  }, [titulos]);

  // ===== Movimentos =====
  const addMovimento = useCallback((m: Omit<MovimentoBancario, "id" | "criadoEm">) => {
    setMovimentos(prev => [...prev, { ...m, id: uid(), criadoEm: new Date().toISOString() }]);
  }, []);
  const updateMovimento = useCallback((id: string, changes: Partial<MovimentoBancario>) => {
    setMovimentos(prev => prev.map(m => m.id === id ? { ...m, ...changes } : m));
  }, []);
  const conciliarMovimento = useCallback((movimentoId: string, tituloId: string) => {
    setMovimentos(prev => prev.map(m => m.id === movimentoId ? { ...m, conciliado: true, tituloVinculadoId: tituloId } : m));
    setTitulos(prev => prev.map(t => t.id === tituloId ? { ...t, status: "pago" as const, atualizadoEm: new Date().toISOString() } : t));
  }, []);
  const desconciliarMovimento = useCallback((movimentoId: string) => {
    setMovimentos(prev => prev.map(m => m.id === movimentoId ? { ...m, conciliado: false, tituloVinculadoId: null } : m));
  }, []);
  const importarExtrato = useCallback(() => {
    const descs = ["PIX Recebido", "TED Recebida", "Pagamento cartão", "Débito automático", "Transferência", "Tarifa bancária", "Crédito avulso"];
    const newMovs: MovimentoBancario[] = Array.from({ length: 10 }, (_, i) => {
      const isCredit = Math.random() > 0.4;
      return {
        id: uid(),
        contaBancariaId: Math.random() > 0.5 ? "cb1" : "cb2",
        data: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().split("T")[0],
        descricao: descs[Math.floor(Math.random() * descs.length)],
        valor: isCredit ? Math.round((100 + Math.random() * 3000) * 100) / 100 : -Math.round((20 + Math.random() * 500) * 100) / 100,
        tipo: isCredit ? "credito" as const : "debito" as const,
        conciliado: false,
        tituloVinculadoId: null,
        categoriaSugestao: null,
        criadoEm: new Date().toISOString(),
      };
    });
    setMovimentos(prev => [...prev, ...newMovs]);
  }, []);

  // ===== Config =====
  const updateConfig = useCallback((c: Partial<ConfigFinanceira>) => {
    setConfig(prev => ({ ...prev, ...c }));
  }, []);
  const resetFinanceiro = useCallback(() => {
    const initial = createInitial();
    setContasBancarias(initial.contasBancarias);
    setPlanoContas(initial.planoContas);
    setTitulos(initial.titulos);
    setMovimentos(initial.movimentos);
    setConfig(initial.config);
  }, []);
  const exportFinanceiro = useCallback(() => {
    return JSON.stringify({ contasBancarias, planoContas, titulos, movimentos, config }, null, 2);
  }, [contasBancarias, planoContas, titulos, movimentos, config]);
  const importFinanceiro = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.contasBancarias) setContasBancarias(data.contasBancarias);
      if (data.planoContas) setPlanoContas(data.planoContas);
      if (data.titulos) setTitulos(data.titulos);
      if (data.movimentos) setMovimentos(data.movimentos);
      if (data.config) setConfig(data.config);
      return true;
    } catch { return false; }
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
