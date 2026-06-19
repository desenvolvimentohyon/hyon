import { useMemo } from "react";
import { FINANCEIRO_COLORS, type TituloFinanceiro } from "@/types/financeiro";

const C = FINANCEIRO_COLORS.raw;

export function useFinanceiroDashboard(
  titulos: TituloFinanceiro[],
  contasBancarias: any[],
  getSaldoConta: (id: string) => number,
  clientesReceita: any[],
  filtroTipo: string,
) {
  const kpis = useMemo(() => {
    const now = new Date();
    const saldoBancos = contasBancarias.filter(c => c.ativo).reduce((s, c) => s + getSaldoConta(c.id), 0);
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const mesFim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const hj = now.toISOString().split("T")[0];

    const receber = titulos.filter(t => {
      if (t.tipo !== "receber" || (t.status !== "aberto" && t.status !== "parcial")) return false;
      if (t.vencimento >= mesInicio && t.vencimento <= mesFim) return true;
      if (t.vencimento < mesInicio && t.vencimento < hj) return true;
      return false;
    });
    const pagar = titulos.filter(t => {
      if (t.tipo !== "pagar" || (t.status !== "aberto" && t.status !== "parcial")) return false;
      if (t.vencimento >= mesInicio && t.vencimento <= mesFim) return true;
      if (t.vencimento < mesInicio && t.vencimento < hj) return true;
      return false;
    });
    const vencidos = titulos.filter(t => t.tipo === "receber" && t.status === "vencido");
    const mrr = clientesReceita.filter(c => c.statusCliente === "ativo" && c.mensalidadeAtiva).reduce((s, c) => s + c.valorMensalidade, 0);

    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const receitasMes = titulos.filter(t => t.tipo === "receber" && t.competenciaMes === mesAtual && t.status === "pago").reduce((s, t) => s + t.valorOriginal, 0);
    const despesasMes = titulos.filter(t => t.tipo === "pagar" && t.competenciaMes === mesAtual && t.status === "pago").reduce((s, t) => s + t.valorOriginal, 0);
    const lucro = receitasMes - despesasMes;
    const margem = receitasMes > 0 ? (lucro / receitasMes) * 100 : 0;

    const cortesiasTitulos = titulos.filter(t => t.isCourtesy && t.competenciaMes === mesAtual);
    const cortesiaCount = cortesiasTitulos.length;
    const cortesiaValor = cortesiasTitulos.reduce((s, t) => {
      const cliente = clientesReceita.find(c => c.id === t.clienteId);
      return s + (cliente?.valorMensalidade || 0);
    }, 0);

    return {
      saldoBancos,
      totalReceber: receber.reduce((s, t) => s + t.valorOriginal, 0),
      totalPagar: pagar.reduce((s, t) => s + t.valorOriginal, 0),
      inadimplencia: vencidos.reduce((s, t) => s + t.valorOriginal + t.juros + t.multa, 0),
      mrr, lucro, margem, cortesiaCount, cortesiaValor,
    };
  }, [titulos, contasBancarias, getSaldoConta, clientesReceita]);

  const fluxoCaixa = useMemo(() => {
    const months: Record<string, { mes: string; entradas: number; saidas: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      months[key] = { mes: label, entradas: 0, saidas: 0 };
    }
    titulos.filter(t => t.status === "pago").forEach(t => {
      if (months[t.competenciaMes]) {
        if (t.tipo === "receber") months[t.competenciaMes].entradas += t.valorOriginal;
        else months[t.competenciaMes].saidas += t.valorOriginal;
      }
    });
    return Object.values(months);
  }, [titulos]);

  const dreResumo = useMemo(() => {
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const mesTitulos = titulos.filter(t => t.competenciaMes === mesAtual && t.status === "pago");
    const receitas = mesTitulos.filter(t => t.tipo === "receber").reduce((s, t) => s + t.valorOriginal, 0);
    const repasses = mesTitulos.filter(t => t.origem === "repasse").reduce((s, t) => s + t.valorOriginal, 0);
    const despesas = mesTitulos.filter(t => t.origem === "despesa_operacional").reduce((s, t) => s + t.valorOriginal, 0);
    const impostos = mesTitulos.filter(t => t.origem === "imposto").reduce((s, t) => s + t.valorOriginal, 0);
    const lucro = receitas - repasses - despesas - impostos;
    return [
      { nome: "Receitas", valor: receitas, fill: C.receita },
      { nome: "Repasses", valor: repasses, fill: C.despesa },
      { nome: "Despesas", valor: despesas, fill: C.atraso },
      { nome: "Impostos", valor: impostos, fill: C.imposto },
      { nome: "Lucro", valor: lucro, fill: C.lucro },
    ];
  }, [titulos]);

  const receitaPorSistema = useMemo(() => {
    const sistemas: Record<string, number> = {};
    clientesReceita.filter(c => c.mensalidadeAtiva).forEach(c => {
      sistemas[c.sistemaPrincipal] = (sistemas[c.sistemaPrincipal] || 0) + c.valorMensalidade;
    });
    return Object.entries(sistemas).map(([name, value]) => ({ name, value }));
  }, [clientesReceita]);

  const mrrEvolucao = useMemo(() => {
    const months: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = 0;
    }
    titulos.filter(t => t.tipo === "receber" && t.status === "pago" && t.origem === "mensalidade")
      .forEach(t => { if (t.competenciaMes && months[t.competenciaMes] !== undefined) months[t.competenciaMes] += t.valorOriginal; });
    return Object.entries(months).map(([key, value]) => {
      const d = new Date(key + "-01");
      return { mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), mrr: value };
    });
  }, [titulos]);

  const lancamentosRecentes = useMemo(() => {
    return titulos
      .filter(t => filtroTipo === "todos" || (filtroTipo === "receber" ? t.tipo === "receber" : t.tipo === "pagar"))
      .sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime());
  }, [titulos, filtroTipo]);

  const lancamentosPorDia = useMemo(() => {
    const agrupado: Record<string, { date: string; receitas: number; despesas: number }> = {};
    lancamentosRecentes.forEach(t => {
      const d = t.dataEmissao.slice(0, 10);
      if (!agrupado[d]) agrupado[d] = { date: d, receitas: 0, despesas: 0 };
      if (t.tipo === "receber") agrupado[d].receitas += t.valorOriginal;
      else agrupado[d].despesas += t.valorOriginal;
    });
    return Object.values(agrupado)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map(item => ({
        ...item,
        label: new Date(item.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      }));
  }, [lancamentosRecentes]);

  return { kpis, fluxoCaixa, dreResumo, receitaPorSistema, mrrEvolucao, lancamentosRecentes, lancamentosPorDia };
}
