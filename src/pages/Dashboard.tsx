import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListTodo, Play, CheckCircle2, AlertTriangle, Clock, Plus, Users, Wrench, TrendingUp, Headphones, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusTarefa } from "@/types";
import { TIPO_OPERACIONAL_CONFIG } from "@/lib/constants";

export default function Dashboard() {
  const { tarefas, tecnicoAtualId, getTecnico, getCliente, getStatusLabel, getPrioridadeLabel } = useApp();
  const navigate = useNavigate();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const total = tarefas.length;
  const emAndamento = tarefas.filter(t => t.status === "em_andamento").length;
  const concluidas = tarefas.filter(t => t.status === "concluida").length;
  const atrasadas = tarefas.filter(t => {
    if (!t.prazoDataHora || t.status === "concluida" || t.status === "cancelada") return false;
    return new Date(t.prazoDataHora) < now;
  }).length;
  const venceHoje = tarefas.filter(t => {
    if (!t.prazoDataHora || t.status === "concluida" || t.status === "cancelada") return false;
    const d = new Date(t.prazoDataHora);
    return d >= today && d < tomorrow;
  }).length;

  // Module counts
  const chamadosAbertos = tarefas.filter(t => t.tipoOperacional === "suporte" && t.status !== "concluida" && t.status !== "cancelada").length;
  const implantacoesAtivas = tarefas.filter(t => t.tipoOperacional === "implantacao" && !t.implantacaoId && t.status !== "concluida" && t.status !== "cancelada").length;
  const leadsAtivos = tarefas.filter(t => t.tipoOperacional === "comercial" && t.statusComercial !== "fechado" && t.statusComercial !== "perdido").length;

  const minhasTarefas = tarefas
    .filter(t => t.responsavelId === tecnicoAtualId && t.status !== "concluida" && t.status !== "cancelada")
    .sort((a, b) => {
      const pa = ["urgente", "alta", "media", "baixa"].indexOf(a.prioridade);
      const pb = ["urgente", "alta", "media", "baixa"].indexOf(b.prioridade);
      return pa - pb;
    })
    .slice(0, 8);

  const tecnicoNome = getTecnico(tecnicoAtualId)?.nome || "—";

  const prioridadeColor = (p: string) => {
    switch (p) {
      case "urgente": return "bg-destructive text-destructive-foreground";
      case "alta": return "bg-warning text-warning-foreground";
      case "media": return "bg-info text-info-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const isAtrasada = (t: { prazoDataHora?: string; status: StatusTarefa }) => {
    if (!t.prazoDataHora || t.status === "concluida" || t.status === "cancelada") return false;
    return new Date(t.prazoDataHora) < now;
  };

  const kpis = [
    { label: "Total", value: total, icon: ListTodo, color: "text-primary" },
    { label: "Em Andamento", value: emAndamento, icon: Play, color: "text-info" },
    { label: "Concluídas", value: concluidas, icon: CheckCircle2, color: "text-success" },
    { label: "Atrasadas", value: atrasadas, icon: AlertTriangle, color: "text-destructive" },
    { label: "Vence Hoje", value: venceHoje, icon: Clock, color: "text-warning" },
  ];

  const modulosCards = [
    { label: "Leads Ativos", value: leadsAtivos, icon: TrendingUp, color: "text-blue-600", route: "/comercial" },
    { label: "Implantações", value: implantacoesAtivas, icon: Rocket, color: "text-purple-600", route: "/implantacao" },
    { label: "Chamados", value: chamadosAbertos, icon: Headphones, color: "text-orange-600", route: "/suporte" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Bem-vindo, {tecnicoNome}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/tarefas?nova=1")} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Tarefa</Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/clientes?novo=1")} className="gap-1.5"><Users className="h-3.5 w-3.5" />Cliente</Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
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

      <div className="grid gap-4 grid-cols-3">
        {modulosCards.map(m => (
          <Card key={m.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(m.route)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{m.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Minhas Tarefas</CardTitle></CardHeader>
        <CardContent>
          {minhasTarefas.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma tarefa pendente 🎉</p>
          ) : (
            <div className="space-y-2">
              {minhasTarefas.map(t => {
                const tipoConfig = TIPO_OPERACIONAL_CONFIG[t.tipoOperacional];
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/tarefas/${t.id}`)}>
                    <Badge className={`text-[10px] shrink-0 ${prioridadeColor(t.prioridade)}`}>{getPrioridadeLabel(t.prioridade)}</Badge>
                    <Badge className={`text-[9px] shrink-0 ${tipoConfig.bgClass}`}>{tipoConfig.label}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.clienteId ? getCliente(t.clienteId)?.nome : "Avulsa"} · {getStatusLabel(t.status)}
                      </p>
                    </div>
                    {isAtrasada(t) && <Badge variant="destructive" className="text-[10px] shrink-0">Atrasada</Badge>}
                    {t.prazoDataHora && !isAtrasada(t) && (() => {
                      const d = new Date(t.prazoDataHora);
                      return d >= today && d < tomorrow;
                    })() && <Badge className="text-[10px] shrink-0 bg-warning text-warning-foreground">Hoje</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
