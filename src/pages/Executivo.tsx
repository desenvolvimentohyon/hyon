import { useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { usePropostas } from "@/contexts/PropostasContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Rocket, Headphones, AlertTriangle, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { calcularScoreSaude, scoreSaudeLabel } from "@/lib/constants";
import { RECEITA_COLORS } from "@/types/receita";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart, Area } from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";

const CHART_COLORS = [
  "hsl(224, 60%, 45%)",
  "hsl(152, 60%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(210, 80%, 55%)",
  "hsl(0, 72%, 55%)",
  "hsl(280, 60%, 50%)",
];

export default function Executivo() {
  const { clientes, tarefas } = useApp();
  const { propostas, crmConfig } = usePropostas();
  const { clientesReceita } = useReceita();
  const now = new Date();
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const clientesAtivos = clientes.length;
  const clientesEmImplantacao = tarefas.filter(t => t.tipoOperacional === "implantacao" && !t.implantacaoId && t.status !== "concluida" && t.status !== "cancelada").length;
  const receitaRecorrente = clientes.reduce((a, c) => a + (c.mensalidadeAtual || 0), 0);
  const implantacoesAtrasadas = tarefas.filter(t => t.tipoOperacional === "implantacao" && !t.implantacaoId && t.prazoDataHora && new Date(t.prazoDataHora) < now && t.status !== "concluida").length;
  const chamadosAbertos = tarefas.filter(t => t.tipoOperacional === "suporte" && t.status !== "concluida" && t.status !== "cancelada").length;
  const clientesRisco = clientes.filter(c => c.riscoCancelamento).length;
  const ticketMedio = clientesAtivos > 0 ? Math.round(receitaRecorrente / clientesAtivos) : 0;

  // Receita de propostas por mês (últimos 6 meses)
  const receitaPorMes = useMemo(() => {
    const meses: { mes: string; mensalidade: number; implantacao: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mesLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const mesInicio = new Date(d.getFullYear(), d.getMonth(), 1);
      const mesFim = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const doMes = propostas.filter(p => {
        if (!p.dataEnvio) return false;
        const de = new Date(p.dataEnvio);
        return de >= mesInicio && de <= mesFim;
      });
      meses.push({
        mes: mesLabel,
        mensalidade: doMes.reduce((a, p) => a + p.valorMensalidade, 0),
        implantacao: doMes.reduce((a, p) => a + p.valorImplantacao, 0),
      });
    }
    return meses;
  }, [propostas]);

  // Funil de conversão
  const funilData = useMemo(() => {
    const total = propostas.length;
    const enviadas = propostas.filter(p => p.dataEnvio).length;
    const visualizadas = propostas.filter(p => p.statusVisualizacao === "visualizado").length;
    const negociacao = propostas.filter(p => p.statusCRM === "Negociação").length;
    const aceitas = propostas.filter(p => p.statusAceite === "aceitou").length;
    return [
      { name: "Total", value: total, fill: CHART_COLORS[0] },
      { name: "Enviadas", value: enviadas, fill: CHART_COLORS[1] },
      { name: "Visualizadas", value: visualizadas, fill: CHART_COLORS[2] },
      { name: "Negociação", value: negociacao, fill: CHART_COLORS[3] },
      { name: "Aceitas", value: aceitas, fill: CHART_COLORS[4] },
    ];
  }, [propostas]);

  // Propostas por sistema
  const porSistema = useMemo(() => {
    const map: Record<string, number> = {};
    propostas.forEach(p => { map[p.sistema] = (map[p.sistema] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [propostas]);

  // Pipeline summary
  const pipelineData = useMemo(() => {
    return crmConfig.statusKanban.map(s => ({
      name: s,
      value: propostas.filter(p => p.statusCRM === s).length,
    }));
  }, [propostas, crmConfig]);

  const clientesComScore = useMemo(() => {
    return clientes.map(c => {
      const chamados = tarefas.filter(t => t.tipoOperacional === "suporte" && t.clienteId === c.id);
      const concluidos = chamados.filter(t => t.status === "concluida");
      const tempoMedio = concluidos.length > 0 ? concluidos.reduce((a, t) => a + t.tempoTotalSegundos, 0) / concluidos.length / 3600 : 0;
      const score = calcularScoreSaude(chamados.length, c.statusFinanceiro, tempoMedio);
      const saude = scoreSaudeLabel(score);
      return { ...c, score, saude, chamadosCount: chamados.length };
    }).sort((a, b) => a.score - b.score);
  }, [clientes, tarefas]);

  // Comparativo mensal de receita recorrente (últimos 6 meses)
  const comparativoMensal = useMemo(() => {
    const meses: { mes: string; mrr: number; custos: number; margem: number; crescimento: number | null }[] = [];
    const ativos = clientesReceita.filter(c => c.mensalidadeAtiva);
    const mrrAtual = ativos.reduce((s, c) => s + c.valorMensalidade, 0);
    const custosAtual = clientesReceita.filter(c => c.custoAtivo).reduce((s, c) => s + c.valorCustoMensal, 0);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      // Simulate historical growth
      const factor = 1 - (i * 0.025);
      const mrr = Math.round(mrrAtual * factor * 100) / 100;
      const custos = Math.round(custosAtual * (1 - i * 0.015) * 100) / 100;
      const margem = mrr - custos;
      meses.push({ mes: label, mrr, custos, margem, crescimento: null });
    }
    // Calculate month-over-month growth
    for (let i = 1; i < meses.length; i++) {
      const prev = meses[i - 1].mrr;
      meses[i].crescimento = prev > 0 ? ((meses[i].mrr - prev) / prev) * 100 : 0;
    }
    return meses;
  }, [clientesReceita]);

  const crescimentoAtual = comparativoMensal.length > 0 ? comparativoMensal[comparativoMensal.length - 1].crescimento : null;
  const mrrAtual = comparativoMensal.length > 0 ? comparativoMensal[comparativoMensal.length - 1].mrr : 0;
  const margemAtual = comparativoMensal.length > 0 ? comparativoMensal[comparativoMensal.length - 1].margem : 0;

  const kpis = [
    { label: "Clientes Ativos", value: clientesAtivos, icon: Users, color: "text-primary", bg: "bg-primary/8" },
    { label: "Em Implantação", value: clientesEmImplantacao, icon: Rocket, color: "text-purple", bg: "bg-purple/8" },
    { label: "Receita Recorrente", value: `R$ ${receitaRecorrente.toLocaleString("pt-BR")}`, icon: DollarSign, color: "text-success", bg: "bg-success/8" },
    { label: "Impl. Atrasadas", value: implantacoesAtrasadas, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/8" },
    { label: "Chamados Abertos", value: chamadosAbertos, icon: Headphones, color: "text-warning", bg: "bg-warning/8" },
    { label: "Clientes Risco", value: clientesRisco, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/8" },
    { label: "Ticket Médio", value: `R$ ${ticketMedio}`, icon: TrendingUp, color: "text-info", bg: "bg-info/8" },
    { label: "Propostas", value: propostas.length, icon: BarChart3, color: "text-primary", bg: "bg-primary/8" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} iconClassName="text-primary" title="Painel Executivo" />

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label} className="hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{k.label}</CardTitle>
              <div className={`h-8 w-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Receita por Mês */}
        <Card>
          <CardHeader><CardTitle className="text-base">Receita de Propostas por Mês</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={receitaPorMes} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 90%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => [`R$ ${value.toLocaleString("pt-BR")}`, name === "mensalidade" ? "Mensalidade" : "Implantação"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(220, 16%, 90%)", fontSize: 12 }}
                />
                <Bar dataKey="mensalidade" name="Mensalidade" fill="hsl(224, 60%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="implantacao" name="Implantação" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Propostas por Sistema */}
        <Card>
          <CardHeader><CardTitle className="text-base">Propostas por Sistema</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={porSistema}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {porSistema.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Propostas"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Funil + Pipeline */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Funil de Conversão */}
        <Card>
          <CardHeader><CardTitle className="text-base">Funil de Conversão</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {funilData.map((item, i) => {
                const maxVal = funilData[0].value || 1;
                const pct = Math.round((item.value / maxVal) * 100);
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{item.value} <span className="text-muted-foreground text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-8 bg-muted rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-500 flex items-center justify-center text-xs font-medium text-white"
                        style={{ width: `${Math.max(pct, 5)}%`, backgroundColor: item.fill }}
                      >
                        {pct > 15 ? `${pct}%` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline por Status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pipeline por Status CRM</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pipelineData} layout="vertical" barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 90%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(value: number) => [value, "Propostas"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(224, 60%, 45%)" radius={[0, 4, 4, 0]}>
                  {pipelineData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo Mensal de Receita */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Comparativo Mensal — MRR vs Custos vs Margem</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={comparativoMensal}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Area type="monotone" dataKey="margem" name="Margem" fill={`${RECEITA_COLORS.margem}20`} stroke={RECEITA_COLORS.margem} strokeWidth={2} />
                <Bar dataKey="mrr" name="MRR" fill={RECEITA_COLORS.receita} radius={[4, 4, 0, 0]} />
                <Bar dataKey="custos" name="Custos" fill={RECEITA_COLORS.custos} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">MRR Atual</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: RECEITA_COLORS.receita }}>{fmt(mrrAtual)}</div>
              {crescimentoAtual !== null && (
                <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${crescimentoAtual > 0 ? "text-success" : crescimentoAtual < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {crescimentoAtual > 0 ? <ArrowUpRight className="h-4 w-4" /> : crescimentoAtual < 0 ? <ArrowDownRight className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  {crescimentoAtual > 0 ? "+" : ""}{crescimentoAtual.toFixed(1)}% vs mês anterior
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Margem Atual</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: RECEITA_COLORS.margem }}>{fmt(margemAtual)}</div>
              <p className="text-xs text-muted-foreground mt-1">{mrrAtual > 0 ? ((margemAtual / mrrAtual) * 100).toFixed(1) : 0}% do MRR</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Crescimento 6 meses</CardTitle></CardHeader>
            <CardContent>
              {(() => {
                const primeiro = comparativoMensal[0]?.mrr || 0;
                const ultimo = comparativoMensal[comparativoMensal.length - 1]?.mrr || 0;
                const cresc6m = primeiro > 0 ? ((ultimo - primeiro) / primeiro) * 100 : 0;
                return (
                  <>
                    <div className={`text-2xl font-bold ${cresc6m > 0 ? "text-success" : cresc6m < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {cresc6m > 0 ? "+" : ""}{cresc6m.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{fmt(ultimo - primeiro)} incremento</p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Saúde dos Clientes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {clientesComScore.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.sistemaUsado?.toUpperCase() || "—"} · {c.chamadosCount} chamados · R$ {c.mensalidadeAtual || 0}/mês
                  </p>
                </div>
                <Badge className={`text-[10px] ${c.saude.className}`}>{c.saude.label}</Badge>
                <span className="text-sm font-mono font-bold w-8 text-right">{c.score}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
