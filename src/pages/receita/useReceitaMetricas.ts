import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RECEITA_COLORS, getSystemColor } from "@/types/receita";

export const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtShort = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function useReceitaMetricas(clientesReceita: any[], suporteEventos: any[], activeSystemNames: string[]) {
  const metricas = useMemo(() => {
    const ativos = clientesReceita.filter(c => c.mensalidadeAtiva);
    const totalClientes = clientesReceita.length;
    const ativosCount = ativos.length;
    const mrr = ativos.reduce((s, c) => s + c.valorMensalidade, 0);
    const arr = mrr * 12;
    const ticket = ativosCount > 0 ? mrr / ativosCount : 0;
    const cancelados = clientesReceita.filter(c => c.statusCliente === "cancelado").length;
    const churnRate = totalClientes > 0 ? (cancelados / totalClientes) * 100 : 0;
    const ltv = churnRate > 0 ? ticket / (churnRate / 100) : ticket * 120;
    const custosTotal = clientesReceita.filter(c => c.custoAtivo).reduce((s, c) => s + c.valorCustoMensal, 0);
    const margem = mrr - custosTotal;
    const margemPercent = mrr > 0 ? (margem / mrr) * 100 : 0;
    return { ativosCount, mrr, arr, ticket, cancelados, churnRate, ltv, custosTotal, margem, margemPercent, totalClientes };
  }, [clientesReceita]);

  const churnLabel = metricas.churnRate <= 5 ? { text: "Excelente", color: "text-success" }
    : metricas.churnRate <= 10 ? { text: "Atenção", color: "text-warning" }
    : { text: "Crítico", color: "text-destructive" };

  const margemLabel = metricas.margemPercent >= 70 ? { text: "Excelente", color: "text-success" }
    : metricas.margemPercent >= 50 ? { text: "Saudável", color: "text-info" }
    : metricas.margemPercent >= 30 ? { text: "Atenção", color: "text-warning" }
    : { text: "Revisar custos", color: "text-destructive" };

  // Real evolution from financial_titles (last 12 months)
  const months12 = useMemo(() => {
    const arr: { key: string; name: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      arr.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        name: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      });
    }
    return arr;
  }, []);

  const { data: evolutionRaw } = useQuery({
    queryKey: ["receita_evolution_12m", months12.map(m => m.key).join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_titles")
        .select("type, value_final, competency, status")
        .in("competency", months12.map(m => m.key))
        .eq("status", "pago");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  const mrrTimeline = useMemo(() => {
    return months12.map(m => {
      const receita = (evolutionRaw || [])
        .filter((t: any) => t.competency === m.key && t.type === "receber")
        .reduce((s: number, t: any) => s + Number(t.value_final || 0), 0);
      return { name: m.name, mrr: Math.round(receita) };
    });
  }, [evolutionRaw, months12]);

  const arrVsMrr = useMemo(() => mrrTimeline.map(m => ({ name: m.name, MRR: m.mrr, ARR: m.mrr * 12 })), [mrrTimeline]);

  const ticketDistribution = useMemo(() => {
    const faixas = [
      { name: "< R$100", min: 0, max: 100 },
      { name: "R$100-200", min: 100, max: 200 },
      { name: "R$200-300", min: 200, max: 300 },
      { name: "R$300-400", min: 300, max: 400 },
      { name: "> R$400", min: 400, max: Infinity },
    ];
    return faixas.map(f => ({
      name: f.name,
      clientes: clientesReceita.filter(c => c.mensalidadeAtiva && c.valorMensalidade >= f.min && c.valorMensalidade < f.max).length,
    }));
  }, [clientesReceita]);

  const churnTimeline = useMemo(() => {
    const months: { name: string; cancelamentos: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString("pt-BR", { month: "short" });
      const count = clientesReceita.filter(c => {
        if (!c.dataCancelamento) return false;
        const dc = new Date(c.dataCancelamento);
        return dc.getMonth() === d.getMonth() && dc.getFullYear() === d.getFullYear();
      }).length;
      months.push({ name: label, cancelamentos: count });
    }
    return months;
  }, [clientesReceita]);

  const custosPorSistema = useMemo(() => {
    const systemsInUse = new Set(clientesReceita.filter(c => c.custoAtivo).map(c => c.sistemaCusto).filter(Boolean));
    const allSystems = [...new Set([...activeSystemNames, ...systemsInUse])];
    return allSystems.map(s => ({
      name: s,
      value: clientesReceita.filter(c => c.custoAtivo && c.sistemaCusto === s).reduce((sum, c) => sum + c.valorCustoMensal, 0),
    })).filter(s => s.value > 0);
  }, [clientesReceita, activeSystemNames]);

  const margemData = useMemo(() => months12.map(m => {
    const receita = (evolutionRaw || [])
      .filter((t: any) => t.competency === m.key && t.type === "receber")
      .reduce((s: number, t: any) => s + Number(t.value_final || 0), 0);
    const custos = (evolutionRaw || [])
      .filter((t: any) => t.competency === m.key && t.type === "pagar")
      .reduce((s: number, t: any) => s + Number(t.value_final || 0), 0);
    return { name: m.name, MRR: Math.round(receita), Custos: Math.round(custos), Margem: Math.round(receita - custos) };
  }), [evolutionRaw, months12]);

  const clientesPorStatus = useMemo(() => {
    const statuses = [
      { key: "ativo", label: "Ativos", color: RECEITA_COLORS.statusAtivo },
      { key: "atraso", label: "Em Atraso", color: RECEITA_COLORS.statusAtraso },
      { key: "suspenso", label: "Suspensos", color: RECEITA_COLORS.statusSuspenso },
      { key: "cancelado", label: "Cancelados", color: RECEITA_COLORS.statusCancelado },
    ];
    return statuses.map(s => ({
      name: s.label,
      value: clientesReceita.filter(c => c.statusCliente === s.key).length,
      color: s.color,
    }));
  }, [clientesReceita]);

  const sistemasMaisUsados = useMemo(() => {
    const systemsInUse = new Set(clientesReceita.map(c => c.sistemaPrincipal).filter(Boolean));
    const allSystems = [...new Set([...activeSystemNames, ...systemsInUse])];
    return allSystems.map(s => ({
      name: s,
      clientes: clientesReceita.filter(c => c.sistemaPrincipal === s).length,
      color: getSystemColor(s),
    })).sort((a, b) => b.clientes - a.clientes);
  }, [clientesReceita, activeSystemNames]);

  const topSuporteClientes = useMemo(() => {
    const map: Record<string, number> = {};
    suporteEventos.forEach(e => { map[e.clienteId] = (map[e.clienteId] || 0) + 1; });
    return Object.entries(map)
      .map(([cid, count]) => ({ name: clientesReceita.find(c => c.id === cid)?.nome || cid, ocorrencias: count }))
      .sort((a, b) => b.ocorrencias - a.ocorrencias)
      .slice(0, 10);
  }, [suporteEventos, clientesReceita]);

  return {
    metricas, churnLabel, margemLabel, mrrTimeline, arrVsMrr, ticketDistribution,
    churnTimeline, custosPorSistema, margemData, clientesPorStatus, sistemasMaisUsados, topSuporteClientes,
  };
}
