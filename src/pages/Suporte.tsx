import { useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Headphones, AlertTriangle, Clock, CheckCircle2, Users } from "lucide-react";

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

  const kpis = [
    { label: "Abertos", value: abertos.length, icon: Headphones, color: "text-orange-600" },
    { label: "SLA Vencido", value: slaVencido.length, icon: AlertTriangle, color: "text-destructive" },
    { label: "Tempo Médio", value: `${tempoMedioH}h`, icon: Clock, color: "text-info" },
    { label: "Resolvidos", value: concluidos.length, icon: CheckCircle2, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Headphones className="h-6 w-6 text-orange-600" />
        <h1 className="text-2xl font-bold tracking-tight">Suporte Técnico</h1>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-4 w-4" />Top Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topClientes.map(([cId, count]) => (
              <div key={cId} className="flex items-center justify-between">
                <span className="text-sm">{getCliente(cId)?.nome}</span>
                <Badge variant="outline">{count} chamados</Badge>
              </div>
            ))}
            {topClientes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
