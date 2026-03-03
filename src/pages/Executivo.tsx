import { useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { usePropostas } from "@/contexts/PropostasContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Rocket, Headphones, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { calcularScoreSaude, scoreSaudeLabel } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from "recharts";

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
  const now = new Date();

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

  const kpis = [
    { label: "Clientes Ativos", value: clientesAtivos, icon: Users, color: "text-primary" },
    { label: "Em Implantação", value: clientesEmImplantacao, icon: Rocket, color: "text-purple-600" },
    { label: "Receita Recorrente", value: `R$ ${receitaRecorrente.toLocaleString("pt-BR")}`, icon: DollarSign, color: "text-emerald-600" },
    { label: "Impl. Atrasadas", value: implantacoesAtrasadas, icon: AlertTriangle, color: "text-destructive" },
    { label: "Chamados Abertos", value: chamadosAbertos, icon: Headphones, color: "text-orange-600" },
    { label: "Clientes Risco", value: clientesRisco, icon: AlertTriangle, color: "text-destructive" },
    { label: "Ticket Médio", value: `R$ ${ticketMedio}`, icon: TrendingUp, color: "text-blue-600" },
    { label: "Propostas", value: propostas.length, icon: BarChart3, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Painel Executivo</h1>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className={`h-4 w-4 ${k.color}`} />
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
