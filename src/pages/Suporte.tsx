import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Headphones, AlertTriangle, Clock, CheckCircle2, Users, Timer, Star, BarChart3, Target, Award, Wrench, Filter, Download, Plus, Link2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { exportSLAPDF } from "@/lib/pdfRelatorioSLA";
import { toast } from "sonner";
import { useSuporteMetricas } from "./suporte/useSuporteMetricas";
import { PortalTicketsTab } from "./suporte/PortalTicketsTab";
import { PIE_COLORS, rankIcons, rankColors, satisfacaoLabel, getSlaStatus } from "./suporte/helpers";

export default function Suporte() {
  const { tarefas, getCliente, getTecnico, getStatusLabel } = useApp();
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<string>("todos");

  const periodoFilter = useMemo(() => {
    if (periodo === "todos") return null;
    const dias = parseInt(periodo);
    return new Date(Date.now() - dias * 86400000);
  }, [periodo]);

  const now = new Date();

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

  const { slaMetrics, rankingTecnicos } = useSuporteMetricas(chamados, concluidos, slaVencido.length, getTecnico);

  const tempoMedioSeg = concluidos.length > 0
    ? Math.round(concluidos.reduce((a, t) => a + t.tempoTotalSegundos, 0) / concluidos.length)
    : 0;
  const tempoMedioH = (tempoMedioSeg / 3600).toFixed(1);

  const clienteCounts = chamados.reduce<Record<string, number>>((acc, t) => {
    if (t.clienteId) acc[t.clienteId] = (acc[t.clienteId] || 0) + 1;
    return acc;
  }, {});
  const topClientes = Object.entries(clienteCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const sat = satisfacaoLabel(slaMetrics.satisfacao);

  const kpis = [
    { label: "Abertos", value: abertos.length, icon: Headphones, color: "text-orange-600" },
    { label: "SLA Vencido", value: slaVencido.length, icon: AlertTriangle, color: "text-destructive" },
    { label: "Tempo Médio", value: `${tempoMedioH}h`, icon: Clock, color: "text-blue-600" },
    { label: "Resolvidos", value: concluidos.length, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "SLA Cumprido", value: `${slaMetrics.taxaCumprimento}%`, icon: Target, color: "text-purple-600" },
    { label: "Satisfação", value: `${slaMetrics.satisfacao}%`, icon: Star, color: sat.color },
  ];

  const handleExport = () => {
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
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Headphones}
        iconClassName="text-orange-600"
        title="Suporte Técnico"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> Exportar PDF
            </Button>
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
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

        <TabsContent value="sla" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
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

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Distribuição por Status</CardTitle></CardHeader>
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
              <CardHeader><CardTitle className="text-lg">Volume por Sistema</CardTitle></CardHeader>
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
                    <div className="text-right"><Badge variant="outline">{count} chamados</Badge></div>
                  </div>
                );
              })}
              {topClientes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tecnicos" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
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

        <TabsContent value="portal" className="space-y-4">
          <PortalTicketsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
