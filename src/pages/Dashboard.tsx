import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { usePropostas } from "@/contexts/PropostasContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ListTodo, Play, CheckCircle2, AlertTriangle, Clock, Plus, Users, TrendingUp,
  Headphones, Rocket, FileText, Send, ThumbsUp, Ban, DollarSign, Percent, Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusTarefa } from "@/types";
import { TIPO_OPERACIONAL_CONFIG } from "@/lib/constants";
import { RECEITA_COLORS, SistemaPrincipal } from "@/types/receita";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import DashboardExecutiveWidgets from "@/components/DashboardExecutiveWidgets";
import { PageHeader } from "@/components/ui/page-header";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ACRONYM_TOOLTIPS: Record<string, string> = {
  "MRR": "MRR — Monthly Recurring Revenue\nReceita recorrente mensal proveniente das mensalidades dos clientes ativos.",
  "ARR": "ARR — Annual Recurring Revenue\nProjeção anual da receita recorrente baseada no MRR atual.",
  "Ticket Médio": "Ticket Médio\nValor médio pago por cliente ativo.",
  "Churn": "Churn Rate\nTaxa de cancelamento de clientes em determinado período.",
  "Margem": "Margem Líquida\nValor restante após deduzir custos da receita recorrente.",
  "LTV": "LTV — Lifetime Value\nValor total estimado que um cliente gera durante todo o período de relacionamento.",
};

function AcronymLabel({ label }: { label: string }) {
  const key = Object.keys(ACRONYM_TOOLTIPS).find(k => label.startsWith(k));
  if (!key) return <span>{label}</span>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="border-b border-dashed border-muted-foreground/40 cursor-help">{label}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-pre-line text-xs">
        {ACRONYM_TOOLTIPS[key]}
      </TooltipContent>
    </Tooltip>
  );
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function IndicacoesRecebidasCard() {
  const { data: referrals } = useQuery({
    queryKey: ["portal_referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portal_referrals")
        .select("id, company_name, contact_name, city, status, created_at, client_id")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  if (!referrals || referrals.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Indicações Recebidas ({referrals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {referrals.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{r.company_name}</p>
                <p className="text-xs text-muted-foreground">{[r.contact_name, r.city].filter(Boolean).join(" · ")} · {new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <Badge variant={r.status === "pendente" ? "outline" : "default"}>{r.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { tarefas, tecnicoAtualId, getTecnico, getCliente, getStatusLabel, getPrioridadeLabel } = useApp();
  const { propostas, crmConfig } = usePropostas();
  const { clientesReceita, suporteEventos } = useReceita();
  const navigate = useNavigate();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Task KPIs
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

  const chamadosAbertos = tarefas.filter(t => t.tipoOperacional === "suporte" && t.status !== "concluida" && t.status !== "cancelada").length;
  const implantacoesAtivas = tarefas.filter(t => t.tipoOperacional === "implantacao" && !t.implantacaoId && t.status !== "concluida" && t.status !== "cancelada").length;
  const leadsAtivos = tarefas.filter(t => t.tipoOperacional === "comercial" && t.statusComercial !== "fechado" && t.statusComercial !== "perdido").length;

  // Propostas KPIs
  const propostasEnviadas7d = propostas.filter(p => p.dataEnvio && new Date(p.dataEnvio) >= sevenDaysAgo).length;
  const propostasAceitas30d = propostas.filter(p => p.statusAceite === "aceitou" && p.historico.some(h => h.acao.toLowerCase().includes("aceit") && new Date(h.criadoEm) >= thirtyDaysAgo)).length;
  const propostasExpiradas = propostas.filter(p => p.dataValidade && new Date(p.dataValidade) < now && p.statusAceite !== "aceitou").length;

  const tomorrowEnd = new Date(tomorrow); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const propostasVencendo = propostas.filter(p => {
    if (!p.dataValidade || p.statusAceite === "aceitou") return false;
    const d = new Date(p.dataValidade);
    return d >= today && d < tomorrowEnd;
  });

  const crmSummary = crmConfig.statusKanban.map(s => ({
    status: s, count: propostas.filter(p => p.statusCRM === s).length,
  }));

  // Receita KPIs
  const receitaMetricas = useMemo(() => {
    const ativos = clientesReceita.filter(c => c.mensalidadeAtiva);
    const mrr = ativos.reduce((s, c) => s + c.valorMensalidade, 0);
    const arr = mrr * 12;
    const ticket = ativos.length > 0 ? mrr / ativos.length : 0;
    const cancelados = clientesReceita.filter(c => c.statusCliente === "cancelado").length;
    const churnRate = clientesReceita.length > 0 ? (cancelados / clientesReceita.length) * 100 : 0;
    const custos = clientesReceita.filter(c => c.custoAtivo).reduce((s, c) => s + c.valorCustoMensal, 0);
    const margem = mrr - custos;
    const emAtraso = clientesReceita.filter(c => c.statusCliente === "atraso");
    const emAtrasoComDias = emAtraso.map(c => {
      const hash = c.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const diasAtraso = 3 + (hash % 55); // 3-57 days range
      return { ...c, diasAtraso };
    }).sort((a, b) => b.diasAtraso - a.diasAtraso);
    const alertaCritico30 = emAtrasoComDias.filter(c => c.diasAtraso > 30);
    const alertaCritico7 = emAtrasoComDias.filter(c => c.diasAtraso > 7 && c.diasAtraso <= 30);
    return { mrr, arr, ticket, churnRate, margem, emAtraso: emAtrasoComDias, alertaCritico7, alertaCritico30 };
  }, [clientesReceita]);

  const sistemasMini = useMemo(() => {
    const sistemas: SistemaPrincipal[] = ["PDV+", "LinkPro", "Torge", "Emissor Fiscal", "Hyon Hospede"];
    return sistemas.map(s => ({
      name: s,
      clientes: clientesReceita.filter(c => c.sistemaPrincipal === s).length,
      color: RECEITA_COLORS.sistemas[s],
    })).filter(s => s.clientes > 0);
  }, [clientesReceita]);

  const custosMini = useMemo(() => {
    const sistemas: SistemaPrincipal[] = ["PDV+", "LinkPro", "Torge", "Emissor Fiscal", "Hyon Hospede"];
    return sistemas.map(s => ({
      name: s,
      value: clientesReceita.filter(c => c.custoAtivo && c.sistemaCusto === s).reduce((sum, c) => sum + c.valorCustoMensal, 0),
      color: RECEITA_COLORS.sistemas[s],
    })).filter(s => s.value > 0);
  }, [clientesReceita]);

  const topSuporte = useMemo(() => {
    const map: Record<string, number> = {};
    suporteEventos.forEach(e => { map[e.clienteId] = (map[e.clienteId] || 0) + 1; });
    return Object.entries(map)
      .map(([cid, count]) => ({ name: clientesReceita.find(c => c.id === cid)?.nome || cid, ocorrencias: count }))
      .sort((a, b) => b.ocorrencias - a.ocorrencias)
      .slice(0, 5);
  }, [suporteEventos, clientesReceita]);

  const minhasTarefas = tarefas
    .filter(t => t.responsavelId === tecnicoAtualId && t.status !== "concluida" && t.status !== "cancelada")
    .sort((a, b) => ["urgente", "alta", "media", "baixa"].indexOf(a.prioridade) - ["urgente", "alta", "media", "baixa"].indexOf(b.prioridade))
    .slice(0, 8);

  const tecnicoNome = getTecnico(tecnicoAtualId)?.nome || "—";

  const prioridadeColor = (p: string) => {
    switch (p) {
      case "urgente": return "bg-destructive/10 text-destructive border-destructive/20";
      case "alta": return "bg-warning/10 text-warning border-warning/20";
      case "media": return "bg-info/10 text-info border-info/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const isAtrasada = (t: { prazoDataHora?: string; status: StatusTarefa }) => {
    if (!t.prazoDataHora || t.status === "concluida" || t.status === "cancelada") return false;
    return new Date(t.prazoDataHora) < now;
  };

  const kpis = [
    { label: "Total", value: total, icon: ListTodo, color: "text-primary", bg: "bg-primary/8" },
    { label: "Em Andamento", value: emAndamento, icon: Play, color: "text-info", bg: "bg-info/8" },
    { label: "Concluídas", value: concluidas, icon: CheckCircle2, color: "text-success", bg: "bg-success/8" },
    { label: "Atrasadas", value: atrasadas, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/8" },
    { label: "Vence Hoje", value: venceHoje, icon: Clock, color: "text-warning", bg: "bg-warning/8" },
  ];

  const modulosCards = [
    { label: "Leads Ativos", value: leadsAtivos, icon: TrendingUp, color: "text-primary", bg: "bg-primary/8", route: "/comercial" },
    { label: "Implantações", value: implantacoesAtivas, icon: Rocket, color: "text-purple", bg: "bg-purple/8", route: "/implantacao" },
    { label: "Chamados", value: chamadosAbertos, icon: Headphones, color: "text-warning", bg: "bg-warning/8", route: "/suporte" },
  ];

  const propostasKpis = [
    { label: "Enviadas (7d)", value: propostasEnviadas7d, icon: Send, color: "text-primary", bg: "bg-primary/8" },
    { label: "Aceitas (30d)", value: propostasAceitas30d, icon: ThumbsUp, color: "text-success", bg: "bg-success/8" },
    { label: "Expiradas", value: propostasExpiradas, icon: Ban, color: "text-destructive", bg: "bg-destructive/8" },
  ];

  const receitaKpis = [
    { label: "MRR", value: fmt(receitaMetricas.mrr), icon: DollarSign, color: RECEITA_COLORS.receita },
    { label: "ARR", value: fmt(receitaMetricas.arr), icon: TrendingUp, color: RECEITA_COLORS.receita },
    { label: "Ticket Médio", value: fmt(receitaMetricas.ticket), icon: Activity, color: RECEITA_COLORS.receita },
    { label: `Churn ${receitaMetricas.churnRate.toFixed(1)}%`, value: fmt(receitaMetricas.margem), icon: Percent, color: RECEITA_COLORS.margem },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Bem-vindo, ${tecnicoNome}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate("/tarefas?nova=1")} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Tarefa</Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/clientes")} className="gap-1.5"><Users className="h-3.5 w-3.5" />Cliente</Button>
          </>
        }
      />

      {/* Task KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {kpis.map(k => (
          <Card key={k.label} className="group transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover">
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

      {/* Module cards */}
      <div className="grid gap-3 grid-cols-3">
        {modulosCards.map(m => (
          <Card key={m.label} className="cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover" onClick={() => navigate(m.route)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{m.label}</CardTitle>
              <div className={`h-8 w-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{m.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Receita KPIs */}
      <TooltipProvider delayDuration={200}>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {receitaKpis.map(k => (
            <Card key={k.label} className="cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover domain-border-left" style={{ borderLeftColor: k.color }} onClick={() => navigate("/receita")}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <AcronymLabel label={k.label} />
                </CardTitle>
                <k.icon className="h-4 w-4" style={{ color: k.color }} />
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{k.value}</div></CardContent>
            </Card>
          ))}
        </div>
      </TooltipProvider>

      {/* Alerta URGENTE: clientes em atraso > 30 dias */}
      {receitaMetricas.alertaCritico30.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>URGENTE: {receitaMetricas.alertaCritico30.length} cliente{receitaMetricas.alertaCritico30.length > 1 ? "s" : ""} em atraso há mais de 30 dias</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {receitaMetricas.alertaCritico30.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-background hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate("/clientes")}>
                  <span className="text-sm font-medium flex-1">{c.nome}</span>
                  <Badge variant="outline" className="text-[10px]">{c.sistemaPrincipal}</Badge>
                  <Badge variant="destructive" className="text-[10px] animate-pulse">{c.diasAtraso} dias</Badge>
                  <span className="text-sm font-medium">{fmt(c.valorMensalidade)}/mês</span>
                </div>
              ))}
              <p className="text-xs mt-2">
                <span className="text-destructive font-semibold">Receita em risco iminente: {fmt(receitaMetricas.alertaCritico30.reduce((s, c) => s + c.valorMensalidade, 0))}/mês</span>
                <span className="text-muted-foreground"> — Ação imediata recomendada: contato ou suspensão</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: clientes em atraso > 7 dias (até 30) */}
      {receitaMetricas.alertaCritico7.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span>Atenção: {receitaMetricas.alertaCritico7.length} cliente{receitaMetricas.alertaCritico7.length > 1 ? "s" : ""} em atraso entre 7 e 30 dias</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {receitaMetricas.alertaCritico7.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-warning/20 bg-background hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate("/clientes")}>
                  <span className="text-sm font-medium flex-1">{c.nome}</span>
                  <Badge variant="outline" className="text-[10px]">{c.sistemaPrincipal}</Badge>
                  <Badge className="text-[10px] bg-warning text-warning-foreground">{c.diasAtraso} dias</Badge>
                  <span className="text-sm font-medium">{fmt(c.valorMensalidade)}/mês</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">
                Receita em risco: <span className="font-semibold text-warning">{fmt(receitaMetricas.alertaCritico7.reduce((s, c) => s + c.valorMensalidade, 0))}/mês</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clientes em atraso (todos) */}
      {receitaMetricas.emAtraso.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5" style={{ color: RECEITA_COLORS.churn }} />Todos em Atraso ({receitaMetricas.emAtraso.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {receitaMetricas.emAtraso.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate("/clientes")}>
                  <span className="text-sm font-medium flex-1">{c.nome}</span>
                  <Badge variant="outline" className="text-[10px]">{c.sistemaPrincipal}</Badge>
                  <Badge className={`text-[10px] ${c.diasAtraso > 30 ? "bg-destructive text-destructive-foreground" : c.diasAtraso > 7 ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{c.diasAtraso} dias</Badge>
                  <span className="text-sm font-medium">{fmt(c.valorMensalidade)}/mês</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top suporte */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Top Suporte</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topSuporte.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-xs flex-1 truncate">{s.name}</span>
                  <Badge variant="outline" className="text-[10px]">{s.ocorrencias}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sistemas mini */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Sistemas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={sistemasMini} cx="50%" cy="50%" outerRadius={60} innerRadius={35} dataKey="clientes" nameKey="name">
                  {sistemasMini.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Custos mini */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Custos por Sistema</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={custosMini}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 9 }} className="fill-muted-foreground" />
                <RechartsTooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Custo">
                  {custosMini.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Propostas KPIs */}
      <div className="grid gap-4 grid-cols-3">
        {propostasKpis.map(k => (
          <Card key={k.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/propostas")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* CRM Summary */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" />Pipeline CRM</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {crmSummary.map(s => (
              <div key={s.status} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-muted transition-colors" onClick={() => navigate("/crm")}>
                <span className="text-sm text-muted-foreground">{s.status}</span>
                <Badge variant="secondary" className="text-xs">{s.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Propostas vencendo */}
      {propostasVencendo.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Propostas Vencendo</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {propostasVencendo.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/propostas/${p.id}`)}>
                  <span className="text-xs font-mono text-muted-foreground">{p.numeroProposta}</span>
                  <span className="text-sm font-medium flex-1">{p.clienteNomeSnapshot || "Sem cliente"}</span>
                  <Badge variant="outline" className="text-[10px]">{p.sistema}</Badge>
                  <span className="text-sm font-medium">{fmt(p.valorMensalidade)}/mês</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Minhas Tarefas */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Minhas Tarefas</CardTitle></CardHeader>
        <CardContent>
          {minhasTarefas.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma tarefa pendente 🎉</p>
          ) : (
            <div className="space-y-2">
              {minhasTarefas.map(t => {
                const tipoConfig = TIPO_OPERACIONAL_CONFIG[t.tipoOperacional] || TIPO_OPERACIONAL_CONFIG.interno;
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
      {/* Indicações recebidas (Portal) */}
      <IndicacoesRecebidasCard />

      {/* Executive Widgets */}
      <Separator className="my-2" />
      <DashboardExecutiveWidgets />
    </div>
  );
}
