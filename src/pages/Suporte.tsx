import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Headphones, AlertTriangle, Clock, CheckCircle2, Users, TrendingUp, Timer, Star, BarChart3, ThumbsUp, ThumbsDown, Minus, Target, Trophy, Medal, Award, Wrench, Filter, Download, Plus, Link2, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { exportSLAPDF } from "@/lib/pdfRelatorioSLA";
import { toast } from "sonner";

export default function Suporte() {
  const { tarefas, clientes, getCliente, getTecnico, getStatusLabel } = useApp();
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<string>("todos");

  const now = new Date();
  const periodoFilter = useMemo(() => {
    if (periodo === "todos") return null;
    const dias = parseInt(periodo);
    return new Date(now.getTime() - dias * 86400000);
  }, [periodo]);

  const chamadosTodos = useMemo(() => tarefas.filter(t => t.tipoOperacional === "suporte"), [tarefas]);
  const chamados = useMemo(() => {
    if (!periodoFilter) return chamadosTodos;
    return chamadosTodos.filter(t => new Date(t.criadoEm) >= periodoFilter);
  }, [chamadosTodos, periodoFilter]);

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

  // ── Ranking de Técnicos ──
  const rankingTecnicos = useMemo(() => {
    const tecnicoMap: Record<string, { total: number; resolvidos: number; tempoTotal: number; dentroSla: number; comSla: number; reincidentes: number; abertos: number }> = {};
    chamados.forEach(t => {
      if (!t.responsavelId) return;
      if (!tecnicoMap[t.responsavelId]) tecnicoMap[t.responsavelId] = { total: 0, resolvidos: 0, tempoTotal: 0, dentroSla: 0, comSla: 0, reincidentes: 0, abertos: 0 };
      const m = tecnicoMap[t.responsavelId];
      m.total++;
      if (t.reincidente) m.reincidentes++;
      if (t.status === "concluida") {
        m.resolvidos++;
        m.tempoTotal += t.tempoTotalSegundos;
        if (t.slaHoras && t.criadoEm) {
          m.comSla++;
          const deadline = new Date(new Date(t.criadoEm).getTime() + t.slaHoras * 3600000);
          if (new Date(t.atualizadoEm) <= deadline) m.dentroSla++;
        }
      } else if (t.status !== "cancelada") {
        m.abertos++;
      }
    });
    return Object.entries(tecnicoMap)
      .map(([id, m]) => ({
        id,
        nome: getTecnico(id)?.nome || "Desconhecido",
        ...m,
        tempoMedioH: m.resolvidos > 0 ? m.tempoTotal / m.resolvidos / 3600 : 0,
        taxaSla: m.comSla > 0 ? Math.round((m.dentroSla / m.comSla) * 100) : 100,
        // Score: peso em resolução, SLA e baixa reincidência
        score: m.resolvidos * 10 + (m.comSla > 0 ? (m.dentroSla / m.comSla) * 30 : 30) - m.reincidentes * 5,
      }))
      .sort((a, b) => b.score - a.score);
  }, [chamados, getTecnico]);

  const rankIcons = [Trophy, Medal, Award];
  const rankColors = ["text-yellow-500", "text-muted-foreground", "text-amber-700"];

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
      <PageHeader
        icon={Headphones}
        iconClassName="text-orange-600"
        title="Suporte Técnico"
        actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const periodoLabel = periodo === "todos" ? "Todos os períodos" : `Últimos ${periodo} dias`;
            const chamadosAbertosData = abertos.map(t => {
              const sla = getSlaStatus(t);
              return { titulo: t.titulo, cliente: t.clienteId ? getCliente(t.clienteId)?.nome || "—" : "—", status: getStatusLabel(t.status), sla: sla?.label || "—" };
            });
            exportSLAPDF({
              periodo: periodoLabel,
              kpis: kpis.map(k => ({ label: k.label, value: k.value })),
              taxaCumprimento: slaMetrics.taxaCumprimento,
              dentroSla: slaMetrics.dentroSlaCount,
              totalComSla: slaMetrics.totalComSla,
              satisfacao: slaMetrics.satisfacao,
              tempoMedioH: slaMetrics.tempoMedioH,
              reincidentes: slaMetrics.reincidentes.length,
              slaVencido: slaVencido.length,
              porPrioridade: slaMetrics.porPrioridade,
              porSistema: slaMetrics.porSistema,
              rankingTecnicos: rankingTecnicos.map(t => ({ nome: t.nome, total: t.total, resolvidos: t.resolvidos, tempoMedioH: t.tempoMedioH, taxaSla: t.taxaSla, reincidentes: t.reincidentes, score: t.score })),
              chamadosAbertos: chamadosAbertosData,
            });
            toast.success("Relatório SLA exportado com sucesso!");
          }}>
            <Download className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        }
      />
      <ModuleNavGrid moduleId="operacional" />

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
          <TabsTrigger value="tecnicos">Ranking Técnicos</TabsTrigger>
          <TabsTrigger value="chamados">Chamados</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="portal">Tickets Portal</TabsTrigger>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Chamados Abertos</CardTitle>
              <Button size="sm" onClick={() => navigate("/tarefas?nova=1&tipo=suporte")}>
                <Plus className="h-4 w-4 mr-1" /> Novo Chamado
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chamado</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>Ticket</TableHead>
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
                          <TableCell>
                            {t.linkedTicketId ? (
                              <Badge variant="secondary" className="text-[9px] gap-1">
                                <Link2 className="h-3 w-3" /> Vinculado
                              </Badge>
                            ) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {abertos.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum chamado aberto 🎉</TableCell></TableRow>}
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

        {/* ── Tab: Ranking Técnicos ── */}
        <TabsContent value="tecnicos" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Pódio */}
            {rankingTecnicos.slice(0, 3).map((tec, i) => {
              const RankIcon = rankIcons[i] || Award;
              return (
                <Card key={tec.id} className={i === 0 ? "border-yellow-400/50 shadow-md" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <RankIcon className={`h-5 w-5 ${rankColors[i]}`} />
                      <CardTitle className="text-base">{tec.nome}</CardTitle>
                    </div>
                    <CardDescription>#{i + 1} no ranking geral</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg border p-2 text-center">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold">{tec.total}</p>
                      </div>
                      <div className="rounded-lg border p-2 text-center">
                        <p className="text-xs text-muted-foreground">Resolvidos</p>
                        <p className="text-lg font-bold text-emerald-600">{tec.resolvidos}</p>
                      </div>
                      <div className="rounded-lg border p-2 text-center">
                        <p className="text-xs text-muted-foreground">Tempo Médio</p>
                        <p className="text-lg font-bold">{tec.tempoMedioH.toFixed(1)}h</p>
                      </div>
                      <div className="rounded-lg border p-2 text-center">
                        <p className="text-xs text-muted-foreground">SLA</p>
                        <p className={`text-lg font-bold ${tec.taxaSla >= 80 ? "text-emerald-600" : tec.taxaSla >= 50 ? "text-yellow-600" : "text-destructive"}`}>{tec.taxaSla}%</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Performance</span>
                        <span>{Math.round(tec.score)} pts</span>
                      </div>
                      <Progress value={Math.min(100, (tec.score / (rankingTecnicos[0]?.score || 1)) * 100)} className="h-2" />
                    </div>
                    {tec.reincidentes > 0 && (
                      <Badge variant="destructive" className="text-[9px]">{tec.reincidentes} reincidência(s)</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tabela completa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Wrench className="h-4 w-4" />Ranking Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Resolvidos</TableHead>
                      <TableHead className="text-center">Abertos</TableHead>
                      <TableHead className="text-center">Tempo Médio</TableHead>
                      <TableHead className="text-center">SLA %</TableHead>
                      <TableHead className="text-center">Reincid.</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankingTecnicos.map((tec, i) => (
                      <TableRow key={tec.id}>
                        <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{tec.nome}</TableCell>
                        <TableCell className="text-center">{tec.total}</TableCell>
                        <TableCell className="text-center text-emerald-600 font-medium">{tec.resolvidos}</TableCell>
                        <TableCell className="text-center">{tec.abertos}</TableCell>
                        <TableCell className="text-center">{tec.tempoMedioH.toFixed(1)}h</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-[10px] ${tec.taxaSla >= 80 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : tec.taxaSla >= 50 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"}`}>{tec.taxaSla}%</Badge>
                        </TableCell>
                        <TableCell className="text-center">{tec.reincidentes > 0 ? <Badge variant="destructive" className="text-[9px]">{tec.reincidentes}</Badge> : "—"}</TableCell>
                        <TableCell className="text-center font-bold">{Math.round(tec.score)}</TableCell>
                      </TableRow>
                    ))}
                    {rankingTecnicos.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Sem dados</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico comparativo */}
          {rankingTecnicos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-4 w-4" />Comparativo de Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={rankingTecnicos} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="nome" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="resolvidos" fill="hsl(var(--chart-2))" name="Resolvidos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="abertos" fill="hsl(var(--chart-4))" name="Abertos" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab: Tickets Portal ── */}
        <TabsContent value="portal" className="space-y-4">
          <PortalTicketsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PortalTicketsTab() {
  const queryClient = useQueryClient();
  const { getCliente, tarefas, addTarefa } = useApp();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkingTicketId, setLinkingTicketId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ["portal_tickets_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portal_tickets")
        .select("id, title, description, status, created_at, updated_at, client_id, linked_task_id, protocol_number, tracking_token")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["portal_ticket_messages_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portal_ticket_messages")
        .select("id, ticket_id, sender_type, sender_name, message, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const selected = tickets?.find(t => t.id === selectedId);
  const ticketMsgs = messages?.filter(m => m.ticket_id === selectedId) || [];

  // Support tasks without a linked ticket (for linking dialog)
  const unlinkedSupportTasks = useMemo(() =>
    tarefas.filter(t => t.tipoOperacional === "suporte" && !t.linkedTicketId),
    [tarefas]
  );

  const handleCreateTaskFromTicket = async (ticket: any) => {
    if (!profile?.org_id) return;
    setSaving(true);
    try {
      // Create the task
      const dbData = {
        org_id: profile.org_id,
        title: `[Ticket] ${ticket.title}`,
        description: ticket.description || "",
        client_id: ticket.client_id || null,
        priority: "media",
        status: "a_fazer",
        tipo_operacional: "suporte",
        linked_ticket_id: ticket.id,
        tags: ["ticket-portal"],
        metadata: {},
      };
      const { data: newTask, error } = await supabase.from("tasks").insert(dbData).select("id").single();
      if (error) throw error;

      // Update ticket with linked_task_id
      await supabase.from("portal_tickets").update({ linked_task_id: newTask.id }).eq("id", ticket.id);

      // Add history
      await supabase.from("task_history").insert({
        org_id: profile.org_id, task_id: newTask.id,
        action: "Criação", details: "Tarefa criada a partir de ticket do portal",
      });

      toast.success("Tarefa de suporte criada com sucesso!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["portal_tickets_admin"] });
    } catch (err: any) {
      toast.error("Erro ao criar tarefa: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLinkTask = async (ticketId: string, taskId: string) => {
    if (!taskId) return;
    setSaving(true);
    try {
      await supabase.from("tasks").update({ linked_ticket_id: ticketId }).eq("id", taskId);
      await supabase.from("portal_tickets").update({ linked_task_id: taskId }).eq("id", ticketId);
      toast.success("Tarefa vinculada ao ticket!");
      setLinkingTicketId(null);
      setSelectedTaskId("");
      refetch();
    } catch {
      toast.error("Erro ao vincular tarefa");
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSaving(true);
    try {
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", (await supabase.auth.getUser()).data.user?.id || "").single();
      await supabase.from("portal_ticket_messages").insert({
        ticket_id: selected.id,
        org_id: (await supabase.from("portal_tickets").select("org_id").eq("id", selected.id).single()).data?.org_id || "",
        sender_type: "staff",
        sender_name: prof?.full_name || "Equipe",
        message: reply.trim(),
      });
      setReply("");
      refetch();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    await supabase.from("portal_tickets").update({ status }).eq("id", ticketId);
    refetch();
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground text-sm">Carregando tickets...</div>;

  if (selected) {
    const linkedTask = selected.linked_task_id ? tarefas.find(t => t.id === selected.linked_task_id) : null;
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>← Voltar</Button>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{selected.title}</CardTitle>
              <Select value={selected.status} onValueChange={v => handleStatusChange(selected.id, v)}>
                <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="respondido">Respondido</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>Cliente: {getCliente(selected.client_id)?.nome || selected.client_id} · {new Date(selected.created_at).toLocaleDateString("pt-BR")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Linked task info or action buttons */}
            {linkedTask ? (
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                <Link2 className="h-4 w-4 text-primary" />
                <span className="text-sm flex-1">Vinculado à tarefa: <strong>{linkedTask.titulo}</strong></span>
                <Button variant="outline" size="sm" onClick={() => navigate(`/tarefas/${linkedTask.id}`)}>
                  <ExternalLink className="h-3 w-3 mr-1" /> Ver Tarefa
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleCreateTaskFromTicket(selected)} disabled={saving}>
                  <Plus className="h-3 w-3 mr-1" /> Criar Tarefa
                </Button>
                <Button size="sm" variant="outline" onClick={() => setLinkingTicketId(selected.id)} disabled={saving}>
                  <Link2 className="h-3 w-3 mr-1" /> Vincular Tarefa Existente
                </Button>
              </div>
            )}

            {/* Link existing task dialog */}
            {linkingTicketId === selected.id && (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/20">
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                  <SelectTrigger className="flex-1 h-8"><SelectValue placeholder="Selecione uma tarefa..." /></SelectTrigger>
                  <SelectContent>
                    {unlinkedSupportTasks.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => handleLinkTask(selected.id, selectedTaskId)} disabled={!selectedTaskId || saving}>Vincular</Button>
                <Button size="sm" variant="ghost" onClick={() => { setLinkingTicketId(null); setSelectedTaskId(""); }}>Cancelar</Button>
              </div>
            )}

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {ticketMsgs.map(m => (
                <div key={m.id} className={`p-3 rounded-lg text-sm ${m.sender_type === "client" ? "bg-muted mr-4" : "bg-primary/5 ml-4"}`}>
                  <p className="font-medium text-xs mb-1">{m.sender_name} <span className="text-muted-foreground">· {new Date(m.created_at).toLocaleDateString("pt-BR")}</span></p>
                  <p className="whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Responder..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <Button size="sm" onClick={handleReply} disabled={saving || !reply.trim()}>Enviar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!tickets || tickets.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhum ticket do portal encontrado.</CardContent></Card>
      ) : tickets.map(t => (
        <Card key={t.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedId(t.id)}>
          <CardContent className="py-3 flex items-center gap-3">
            <Headphones className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.title}</p>
              <p className="text-xs text-muted-foreground">{getCliente(t.client_id)?.nome || "Cliente"} · {new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
            {t.linked_task_id && (
              <Badge variant="secondary" className="text-[9px] gap-1 shrink-0">
                <Link2 className="h-3 w-3" /> Tarefa
              </Badge>
            )}
            <Badge variant={t.status === "aberto" ? "outline" : t.status === "finalizado" ? "secondary" : "default"}>{t.status}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}