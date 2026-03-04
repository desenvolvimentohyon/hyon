import { useMemo, useState } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Percent, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Area } from "recharts";
import { FINANCEIRO_COLORS } from "@/types/financeiro";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const C = FINANCEIRO_COLORS.raw;

export default function Financeiro() {
  const { titulos, movimentos, contasBancarias, getSaldoConta, loading } = useFinanceiro();
  const { clientesReceita } = useReceita();
  const [periodo, setPeriodo] = useState<string>("12m");

  const kpis = useMemo(() => {
    const saldoBancos = contasBancarias.filter(c => c.ativo).reduce((s, c) => s + getSaldoConta(c.id), 0);
    const receber = titulos.filter(t => t.tipo === "receber" && (t.status === "aberto" || t.status === "parcial"));
    const pagar = titulos.filter(t => t.tipo === "pagar" && (t.status === "aberto" || t.status === "parcial"));
    const vencidos = titulos.filter(t => t.tipo === "receber" && t.status === "vencido");
    const mrr = clientesReceita.filter(c => c.mensalidadeAtiva).reduce((s, c) => s + c.valorMensalidade, 0);
    
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const receitasMes = titulos.filter(t => t.tipo === "receber" && t.competenciaMes === mesAtual && t.status === "pago").reduce((s, t) => s + t.valorOriginal, 0);
    const despesasMes = titulos.filter(t => t.tipo === "pagar" && t.competenciaMes === mesAtual && t.status === "pago").reduce((s, t) => s + t.valorOriginal, 0);
    const lucro = receitasMes - despesasMes;
    const margem = receitasMes > 0 ? (lucro / receitasMes) * 100 : 0;

    return {
      saldoBancos, totalReceber: receber.reduce((s, t) => s + t.valorOriginal, 0),
      totalPagar: pagar.reduce((s, t) => s + t.valorOriginal, 0),
      inadimplencia: vencidos.reduce((s, t) => s + t.valorOriginal + t.juros + t.multa, 0),
      mrr, lucro, margem
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

  const pieCols = [C.receita, C.conciliacao, C.atraso, C.lucro, C.despesa];

  if (loading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
    </div>
  );

  const kpiCards = [
    { label: "Saldo em Bancos", value: fmt(kpis.saldoBancos), icon: Landmark, color: "text-info" },
    { label: "Contas a Receber", value: fmt(kpis.totalReceber), icon: TrendingUp, color: "text-info" },
    { label: "Contas a Pagar", value: fmt(kpis.totalPagar), icon: TrendingDown, color: "text-destructive" },
    { label: "Inadimplência", value: fmt(kpis.inadimplencia), icon: AlertTriangle, color: "text-warning" },
    { label: "MRR Atual", value: fmt(kpis.mrr), icon: DollarSign, color: "text-info" },
    { label: "Lucro Líquido Mês", value: fmt(kpis.lucro), icon: kpis.lucro >= 0 ? ArrowUpRight : ArrowDownRight, color: kpis.lucro >= 0 ? "text-success" : "text-destructive" },
    { label: "Margem % Mês", value: fmtPct(kpis.margem), icon: Percent, color: kpis.margem >= 0 ? "text-success" : "text-destructive" },
  ];

  return (
    <div className="p-6 space-y-6 chart-container">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] lg:text-[32px] font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Visão geral financeira</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="90d">90 dias</SelectItem>
            <SelectItem value="12m">12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpiCards.map(k => (
          <Card key={k.label} className="group transition-all duration-200 hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className={`h-4 w-4 ${k.color}`} />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{k.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Fluxo de Caixa (12 meses)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={fluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill={C.receita} radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill={C.despesa} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">DRE Resumida do Mês</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dreResumo} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis dataKey="nome" type="category" tick={{ fontSize: 11 }} width={80} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {dreResumo.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Receita por Sistema</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={receitaPorSistema} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {receitaPorSistema.map((_, i) => <Cell key={i} fill={pieCols[i % pieCols.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Evolução MRR (12 meses)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={fluxoCaixa.map((f, i) => ({ ...f, mrr: kpis.mrr * (0.85 + i * 0.015) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="mrr" name="MRR" stroke={C.receita} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
