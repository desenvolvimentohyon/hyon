import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Headphones, AlertTriangle, Clock, CheckCircle2, Users, TrendingUp, Timer, Star, BarChart3, ThumbsUp, ThumbsDown, Minus, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

export default function Suporte() {
  const { tarefas, clientes, getCliente, getTecnico, getStatusLabel } = useApp();
  const navigate = useNavigate();

  const chamados = useMemo(() => tarefas.filter(t => t.tipoOperacional === "suporte"), [tarefas]);
  const now = new Date();

  const abertos = chamados.filter(t => t.status !== "concluida" && t.status !== "cancelada");
  const slaVencido = abertos.filter(t => {
    if (!t.slaHoras || !t.criadoEm) return false;
    const deadline = new Date(new Date(t.criadoEm).getTime() + t.slaHoras * 3600000);
    return deadline < now;
  });
  const concluidos = chamados.filter(t => t.status === "concluida");

  // ── Métricas de SLA ──
  const slaMetrics = useMemo(() => {
    const comSla = chamados.filter(t => t.slaHoras && t.criadoEm);
    const concluidosComSla = concluidos.filter(t => t.slaHoras && t.criadoEm);

    // Taxa de cumprimento de SLA
    const dentroSla = concluidosComSla.filter(t => {
      const deadline = new Date(new Date(t.criadoEm).getTime() + (t.slaHoras || 0) * 3600000);
      const conclusao = new Date(t.atualizadoEm);
      return conclusao <= deadline;
    });
    const taxaCumprimento = concluidosComSla.length > 0 ? Math.round((dentroSla.length / concluidosComSla.length) * 100) : 100;

    // Tempo médio de resolução
    const tempoMedioSeg = concluidos.length > 0
      ? concluidos.reduce((a, t) => a + t.tempoTotalSegundos, 0) / concluidos.length
      : 0;
    const tempoMedioH = tempoMedioSeg / 3600;

    // Tempo médio por prioridade
    const porPrioridade = ["urgente", "alta", "media", "baixa"].map(p => {
      const items = concluidos.filter(t => t.prioridade === p);
      const media = items.length > 0 ? items.reduce((a, t) => a + t.tempoTotalSegundos, 0) / items.length / 3600 : 0;
      return { prioridade: p.charAt(0).toUpperCase() + p.slice(1), horas: parseFloat(media.toFixed(1)), count: items.length };
    });

    // Satisfação simulada baseada em métricas reais
    const satisfacao = (() => {
      let score = 85;
      if (taxaCumprimento < 80) score -= 15;
      if (tempoMedioH > 8) score -= 10;
      if (slaVencido.length > 3) score -= 10;
      const reincidentes = chamados.filter(t => t.reincidente).length;
      if (reincidentes > 2) score -= 5;
      return Math.max(0, Math.min(100, score));
    })();

    // Distribuição por status
    const statusDist = [
      { name: "Backlog", value: chamados.filter(t => t.status === "backlog").length },
      { name: "A Fazer", value: chamados.filter(t => t.status === "a_fazer").length },
      { name: "Em Andamento", value: chamados.filter(t => t.status === "em_andamento").length },
      { name: "Aguardando", value: chamados.filter(t => t.status === "aguardando_cliente").length },
      { name: "Concluída", value: chamados.filter(t => t.status === "concluida").length },
      { name: "Cancelada", value: chamados.filter(t => t.status === "cancelada").length },
    ].filter(d => d.value > 0);

    // Volume por sistema
    const porSistema = [
      { sistema: "Hyon", total: chamados.filter(t => t.sistemaRelacionado === "hyon").length, resolvidos: concluidos.filter(t => t.sistemaRelacionado === "hyon").length },
      { sistema: "LinkPro", total: chamados.filter(t => t.sistemaRelacionado === "linkpro").length, resolvidos: concluidos.filter(t => t.sistemaRelacionado === "linkpro").length },
      { sistema: "Outros", total: chamados.filter(t => !t.sistemaRelacionado).length, resolvidos: concluidos.filter(t => !t.sistemaRelacionado).length },
    ].filter(d => d.total > 0);

    // Reincidentes
    const reincidentes = chamados.filter(t => t.reincidente);

    // Volume mensal (últimos 6 meses)
    const volumeMensal = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const mes = d.toLocaleString("pt-BR", { month: "short" });
      const ano = d.getFullYear();
      const mesNum = d.getMonth();
      const abertosM = chamados.filter(t => {
        const dt = new Date(t.criadoEm);
        return dt.getMonth() === mesNum && dt.getFullYear() === ano;
      }).length;
      const resolvidosM = concluidos.filter(t => {
        const dt = new Date(t.atualizadoEm);
        return dt.getMonth() === mesNum && dt.getFullYear() === ano;
      }).length;
      return { mes: mes.charAt(0).toUpperCase() + mes.slice(1), abertos: abertosM, resolvidos: resolvidosM };
    });

    return { taxaCumprimento, tempoMedioH, porPrioridade, satisfacao, statusDist, porSistema, reincidentes, volumeMensal, dentroSlaCount: dentroSla.length, totalComSla: concluidosComSla.length };
  }, [chamados, concluidos, slaVencido]);

  const tempoMedioSeg = concluidos.length > 0
    ? Math.round(concluidos.reduce((a, t) => a + t.tempoTotalSegundos, 0) / concluidos.length)
    : 0;
  const tempoMedioH = (tempoMedioSeg / 3600).toFixed(1);

  // Top clientes
  const clienteCounts = chamados.reduce<Record<string, number>>((acc, t) => {
    if (t.clienteId) acc[t.clienteId] = (acc[t.clienteId] || 0) + 1;
    return acc;
  }, {});
  const topClientes = Object.entries(clienteCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const getSlaStatus = (t: typeof chamados[0]) => {
    if (!t.slaHoras || !t.criadoEm) return null;
    const deadline = new Date(new Date(t.criadoEm).getTime() + t.slaHoras * 3600000);
    const remaining = deadline.getTime() - now.getTime();
    if (t.status === "concluida") return { label: "OK", class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" };
    if (remaining < 0) return { label: "Vencido", class: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" };
    const hoursLeft = Math.ceil(remaining / 3600000);
    if (hoursLeft <= 2) return { label: `${hoursLeft}h restante`, class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" };
    return { label: `${hoursLeft}h restante`, class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" };
  };

  const PIE_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--muted-foreground))",
  ];

  const satisfacaoLabel = (score: number) => {
    if (score >= 80) return { label: "Excelente", icon: ThumbsUp, color: "text-emerald-600" };
    if (score >= 60) return { label: "Bom", icon: Minus, color: "text-yellow-600" };
    return { label: "Crítico", icon: ThumbsDown, color: "text-destructive" };
  };

  const sat = satisfacaoLabel(slaMetrics.satisfacao);

  const kpis = [
    { label: "Abertos", value: abertos.length, icon: Headphones, color: "text-orange-600" },
    { label: "SLA Vencido", value: slaVencido.length, icon: AlertTriangle, color: "text-destructive" },
    { label: "Tempo Médio", value: `${tempoMedioH}h`, icon: Clock, color: "text-blue-600" },
    { label: "Resolvidos", value: concluidos.length, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "SLA Cumprido", value: `${slaMetrics.taxaCumprimento}%`, icon: Target, color: "text-purple-600" },
    { label: "Satisfação", value: `${slaMetrics.satisfacao}%`, icon: Star, color: sat.color },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Headphones className="h-6 w-6 text-orange-600" />
        <h1 className="text-2xl font-bold tracking-tight">Suporte Técnico</h1>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="sla" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sla">Métricas SLA</TabsTrigger>
          <TabsTrigger value="chamados">Chamados</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>

        {/* ── Tab: Métricas SLA ── */}
        <TabsContent value="sla" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Cumprimento de SLA */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Target className="h-4 w-4" />Cumprimento de SLA</CardTitle>
                <CardDescription>{slaMetrics.dentroSlaCount} de {slaMetrics.totalComSla} chamados resolvidos dentro do prazo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">{slaMetrics.taxaCumprimento}%</div>
                  <Progress value={slaMetrics.taxaCumprimento} className="flex-1 h-3" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Dentro do SLA</p>
                    <p className="text-xl font-bold text-emerald-600">{slaMetrics.dentroSlaCount}</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Fora do SLA</p>
                    <p className="text-xl font-bold text-destructive">{slaMetrics.totalComSla - slaMetrics.dentroSlaCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Satisfação do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Star className="h-4 w-4" />Satisfação do Cliente</CardTitle>
                <CardDescription>Score calculado com base em SLA, reincidência e tempo de resolução</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold ${sat.color}`}>{slaMetrics.satisfacao}%</div>
                  <div className="flex-1 space-y-1">
                    <Progress value={slaMetrics.satisfacao} className="h-3" />
                    <div className="flex items-center gap-1">
                      <sat.icon className={`h-4 w-4 ${sat.color}`} />
                      <span className={`text-sm font-medium ${sat.color}`}>{sat.label}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reincidências</span>
                    <Badge variant={slaMetrics.reincidentes.length > 2 ? "destructive" : "outline"}>{slaMetrics.reincidentes.length} chamados</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SLA Vencido (abertos)</span>
                    <Badge variant={slaVencido.length > 0 ? "destructive" : "outline"}>{slaVencido.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tempo Médio Resolução</span>
                    <Badge variant="outline">{slaMetrics.tempoMedioH.toFixed(1)}h</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tempo por Prioridade + Volume Mensal */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Timer className="h-4 w-4" />Tempo Médio por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                {slaMetrics.porPrioridade.some(p => p.count > 0) ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={slaMetrics.porPrioridade} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="prioridade" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" unit="h" />
                      <Tooltip formatter={(v: number) => [`${v}h`, "Tempo Médio"]} />
                      <Bar dataKey="horas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados de resolução</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-4 w-4" />Volume Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={slaMetrics.volumeMensal}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="abertos" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Abertos" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="resolvidos" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Resolvidos" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Distribuição + Por Sistema */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                {slaMetrics.statusDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={slaMetrics.statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {slaMetrics.statusDist.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem chamados</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volume por Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                {slaMetrics.porSistema.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={slaMetrics.porSistema} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="sistema" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="hsl(var(--chart-3))" name="Total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolvidos" fill="hsl(var(--chart-2))" name="Resolvidos" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab: Chamados ── */}
        <TabsContent value="chamados">
          <Card>
            <CardHeader><CardTitle className="text-lg">Chamados Abertos</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chamado</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {abertos.map(t => {
                      const sla = getSlaStatus(t);
                      return (
                        <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/tarefas/${t.id}`)}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{t.titulo}</p>
                              <div className="flex gap-1 mt-1">
                                {t.reincidente && <Badge variant="destructive" className="text-[9px]">Reincidente</Badge>}
                                {t.sistemaRelacionado && <Badge variant="outline" className="text-[9px]">{t.sistemaRelacionado.toUpperCase()}</Badge>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{t.clienteId ? getCliente(t.clienteId)?.nome : "—"}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{getStatusLabel(t.status)}</Badge></TableCell>
                          <TableCell>{sla && <Badge className={`text-[10px] ${sla.class}`}>{sla.label}</Badge>}</TableCell>
                        </TableRow>
                      );
                    })}
                    {abertos.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum chamado aberto 🎉</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Clientes ── */}
        <TabsContent value="clientes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Users className="h-4 w-4" />Top Clientes por Chamados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topClientes.map(([cId, count]) => {
                const cliente = getCliente(cId);
                const clienteChamados = chamados.filter(t => t.clienteId === cId);
                const reincidentes = clienteChamados.filter(t => t.reincidente).length;
                const resolvidos = clienteChamados.filter(t => t.status === "concluida").length;
                return (
                  <div key={cId} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <span className="text-sm font-medium">{cliente?.nome}</span>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{resolvidos}/{count} resolvidos</span>
                        {reincidentes > 0 && <Badge variant="destructive" className="text-[9px]">{reincidentes} reincid.</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{count} chamados</Badge>
                    </div>
                  </div>
                );
              })}
              {topClientes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
