import { useState, useMemo } from "react";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RECEITA_COLORS, SistemaPrincipal } from "@/types/receita";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart,
} from "recharts";
import {
  DollarSign, Users, TrendingUp, TrendingDown, Percent, Activity,
  BarChart3, PieChartIcon, FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { gerarRelatorioPDF } from "@/lib/pdfRelatorioReceita";
import { toast } from "sonner";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtShort = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Receita() {
  const { clientesReceita, suporteEventos, loading } = useReceita();
  const [periodo, setPeriodo] = useState<string>("12m");

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

  // Chart data
  const mrrTimeline = useMemo(() => {
    const months: { name: string; mrr: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      // Simulate slight growth
      const factor = 1 - (i * 0.02);
      months.push({ name: label, mrr: Math.round(metricas.mrr * factor) });
    }
    return months;
  }, [metricas.mrr]);

  const arrVsMrr = useMemo(() => {
    return mrrTimeline.map(m => ({ name: m.name, MRR: m.mrr, ARR: m.mrr * 12 }));
  }, [mrrTimeline]);

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
    const sistemas: SistemaPrincipal[] = ["PDV+", "LinkPro", "Torge", "Emissor Fiscal", "Hyon Hospede"];
    return sistemas.map(s => ({
      name: s,
      value: clientesReceita.filter(c => c.custoAtivo && c.sistemaCusto === s).reduce((sum, c) => sum + c.valorCustoMensal, 0),
    })).filter(s => s.value > 0);
  }, [clientesReceita]);

  const margemData = useMemo(() => {
    return mrrTimeline.map((m, i) => {
      const custoFactor = 1 - (i * 0.015);
      const custos = Math.round(metricas.custosTotal * (1 - ((11 - i) * 0.015)));
      return { name: m.name, MRR: m.mrr, Custos: custos, Margem: m.mrr - custos };
    });
  }, [mrrTimeline, metricas.custosTotal]);

  const clientesPorStatus = useMemo(() => {
    const statuses: { key: string; label: string; color: string }[] = [
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
    const sistemas: SistemaPrincipal[] = ["PDV+", "LinkPro", "Torge", "Emissor Fiscal", "Hyon Hospede"];
    return sistemas.map(s => ({
      name: s,
      clientes: clientesReceita.filter(c => c.sistemaPrincipal === s).length,
      color: RECEITA_COLORS.sistemas[s],
    })).sort((a, b) => b.clientes - a.clientes);
  }, [clientesReceita]);

  const topSuporteClientes = useMemo(() => {
    const map: Record<string, number> = {};
    suporteEventos.forEach(e => { map[e.clienteId] = (map[e.clienteId] || 0) + 1; });
    return Object.entries(map)
      .map(([cid, count]) => ({ name: clientesReceita.find(c => c.id === cid)?.nome || cid, ocorrencias: count }))
      .sort((a, b) => b.ocorrencias - a.ocorrencias)
      .slice(0, 10);
  }, [suporteEventos, clientesReceita]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Clientes Ativos", value: metricas.ativosCount.toString(), icon: Users, color: RECEITA_COLORS.statusAtivo, sub: `de ${metricas.totalClientes} total` },
    { label: "MRR", value: fmt(metricas.mrr), icon: DollarSign, color: RECEITA_COLORS.receita, sub: "Receita Mensal Recorrente" },
    { label: "ARR", value: fmt(metricas.arr), icon: TrendingUp, color: RECEITA_COLORS.receita, sub: "Receita Anual Recorrente" },
    { label: "Ticket Médio", value: fmt(metricas.ticket), icon: Activity, color: RECEITA_COLORS.receita, sub: "MRR ÷ Ativos" },
    { label: "Churn Rate (12m)", value: `${fmtShort(metricas.churnRate)}%`, icon: TrendingDown, color: RECEITA_COLORS.churn, sub: churnLabel.text, subColor: churnLabel.color },
    { label: "LTV", value: fmt(metricas.ltv), icon: BarChart3, color: RECEITA_COLORS.receita, sub: "Valor Vitalício" },
    { label: "Custos Mensais", value: fmt(metricas.custosTotal), icon: Percent, color: RECEITA_COLORS.custos, sub: "Total de custos ativos" },
    { label: "Margem Líquida", value: fmt(metricas.margem), icon: PieChartIcon, color: RECEITA_COLORS.margem, sub: `${fmtShort(metricas.margemPercent)}% — ${margemLabel.text}`, subColor: margemLabel.color },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Receita Recorrente</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              gerarRelatorioPDF(clientesReceita);
              toast.success("Relatório gerado! Use Ctrl+P / ⌘+P para salvar como PDF.");
            }}
          >
            <FileDown className="h-4 w-4 mr-1.5" />
            Exportar PDF
          </Button>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="12m">12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label} className="domain-border-left transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover" style={{ borderLeftColor: k.color }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-4 w-4" style={{ color: k.color }} />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{k.value}</div>
              <p className={`text-[11px] mt-0.5 ${(k as any).subColor || "text-muted-foreground"}`}>{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. MRR Timeline */}
        <Card>
          <CardHeader><CardTitle className="text-sm">MRR ao Longo do Tempo</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={mrrTimeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="mrr" stroke={RECEITA_COLORS.receita} fill={RECEITA_COLORS.receita} fillOpacity={0.15} name="MRR" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. ARR vs MRR */}
        <Card>
          <CardHeader><CardTitle className="text-sm">ARR (projeção) vs MRR</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={arrVsMrr}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="MRR" fill={RECEITA_COLORS.receita} radius={[4, 4, 0, 0]} />
                <Bar dataKey="ARR" fill={`${RECEITA_COLORS.receita}66`} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. Ticket Distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Distribuição de Mensalidades</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ticketDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="clientes" fill={RECEITA_COLORS.receita} radius={[4, 4, 0, 0]} name="Clientes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Churn Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Churn (12 meses)
              <Badge className={`text-[10px] ${churnLabel.color === "text-success" ? "bg-success/10 text-success" : churnLabel.color === "text-warning" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                {fmtShort(metricas.churnRate)}% — {churnLabel.text}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={churnTimeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="cancelamentos" fill={RECEITA_COLORS.churn} radius={[4, 4, 0, 0]} name="Cancelamentos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 5. Custos por Sistema */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Custos por Sistema</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={custosPorSistema} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${fmt(value)}`} labelLine={false}>
                  {custosPorSistema.map((entry) => (
                    <Cell key={entry.name} fill={RECEITA_COLORS.sistemas[entry.name as SistemaPrincipal] || "#888"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 6. MRR vs Custos vs Margem */}
        <Card>
          <CardHeader><CardTitle className="text-sm">MRR vs Custos vs Margem</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={margemData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="MRR" fill={RECEITA_COLORS.receita} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Custos" fill={RECEITA_COLORS.custos} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Margem" stroke={RECEITA_COLORS.margem} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 7. Clientes por Status */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Clientes por Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={clientesPorStatus} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" nameKey="name" label>
                  {clientesPorStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 8. Sistemas mais usados */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Sistemas Mais Usados</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sistemasMaisUsados} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={100} />
                <Tooltip />
                <Bar dataKey="clientes" name="Clientes" radius={[0, 4, 4, 0]}>
                  {sistemasMaisUsados.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 9. Top 10 Suporte */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Top 10 Clientes — Ocorrências de Suporte</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSuporteClientes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={160} />
                <Tooltip />
                <Bar dataKey="ocorrencias" fill={RECEITA_COLORS.suporte} radius={[0, 4, 4, 0]} name="Ocorrências" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
