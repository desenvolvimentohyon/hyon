import { useMemo, useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { usePropostas } from "@/contexts/PropostasContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle, Plus, Users, TrendingUp, TrendingDown,
  Headphones, FileText, Send, ThumbsUp, Ban, DollarSign, Percent, Activity,
  Shield, BarChart3, PieChart as PieChartIcon,
  ExternalLink, RefreshCw, Download, Clock, Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RECEITA_COLORS, getSystemColor } from "@/types/receita";
import { useParametros } from "@/contexts/ParametrosContext";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, Area, AreaChart,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TIPO_OPERACIONAL_CONFIG } from "@/lib/constants";
import { StatusTarefa } from "@/types";

const DashboardExecutiveWidgets = lazy(() => import("@/components/DashboardExecutiveWidgets"));

// ── Section Skeleton Loaders ─────────────────────────────────────────
function KpisSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="neon-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-28" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-7 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-8 neon-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-7 w-14" />
            </div>
          </div>
        </CardHeader>
        <CardContent><Skeleton className="h-[280px] w-full rounded-lg" /></CardContent>
      </Card>
      <div className="lg:col-span-4 grid gap-4">
        {[1, 2].map(i => (
          <Card key={i} className="neon-border">
            <CardHeader className="pb-1"><Skeleton className="h-4 w-32" /></CardHeader>
            <CardContent className="flex flex-col items-center gap-2 pb-3">
              <Skeleton className="h-[130px] w-[130px] rounded-full" />
              <div className="flex gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OperationalSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="neon-border">
          <CardHeader className="pb-2"><Skeleton className="h-4 w-36" /></CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[1, 2].map(i => (
        <Card key={i} className="neon-border">
          <CardHeader className="pb-2"><Skeleton className="h-4 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-[220px] w-full rounded-lg" /></CardContent>
        </Card>
      ))}
    </div>
  );
}

function TasksSkeleton() {
  return (
    <Card className="neon-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </CardContent>
    </Card>
  );
}

// ── Acronym tooltips ────────────────────────────────────────────────
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
      <TooltipContent className="max-w-xs whitespace-pre-line text-xs">{ACRONYM_TOOLTIPS[key]}</TooltipContent>
    </Tooltip>
  );
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtK = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : fmt(v);

// ── Sparkline mini component ────────────────────────────────────────
function Sparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={height} className="opacity-60">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Custom chart tooltip ─────────────────────────────────────────────
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-elevated text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-medium" style={{ color: p.color }}>{p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}</p>
      ))}
    </div>
  );
}

// ── Indicações Card ──────────────────────────────────────────────────
function IndicacoesRecebidasCard() {
  const { data: referrals } = useQuery({
    queryKey: ["portal_referrals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("portal_referrals")
        .select("id, company_name, contact_name, city, status, created_at, client_id")
        .order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data || [];
    },
  });
  if (!referrals || referrals.length === 0) return null;
  return (
    <Card className="neon-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />Indicações Recebidas ({referrals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {referrals.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors duration-150">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.company_name}</p>
                <p className="text-[11px] text-muted-foreground">{[r.contact_name, r.city].filter(Boolean).join(" · ")}</p>
              </div>
              <Badge variant={r.status === "pendente" ? "outline" : "default"} className="text-[10px]">{r.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Planos Vencendo Card ─────────────────────────────────────────────
function PlanosVencendoCard() {
  const navigate = useNavigate();
  const { data: expiring } = useQuery({
    queryKey: ["planos_vencendo"],
    queryFn: async () => {
      const today = new Date();
      const in7 = new Date(today);
      in7.setDate(in7.getDate() + 7);
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, plan_id, metadata")
        .eq("status", "ativo")
        .not("metadata->plan_end_date", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []).map((c: any) => {
        const planEndDate = c.metadata?.plan_end_date;
        if (!planEndDate) return null;
        const end = new Date(planEndDate + "T00:00:00");
        const now = new Date(); now.setHours(0,0,0,0);
        const days = Math.ceil((end.getTime() - now.getTime()) / (1000*60*60*24));
        if (days < 0 || days > 7) return null;
        return { ...c, plan_end_date: planEndDate, billing_plan: c.metadata?.billing_plan || "—", days_left: days };
      }).filter(Boolean);
    },
  });
  if (!expiring || expiring.length === 0) return null;
  return (
    <Card className="neon-border border-warning/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Planos Vencendo (7 dias)
          <Badge variant="outline" className="text-[10px]">{expiring.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {expiring.map((c: any) => (
            <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-accent/50 cursor-pointer transition-colors duration-150" onClick={() => navigate(`/clientes?id=${c.id}`)}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.billing_plan} · vence {new Date(c.plan_end_date + "T00:00:00").toLocaleDateString("pt-BR")}</p>
              </div>
              <Badge className={`text-[10px] ${c.days_left <= 2 ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}`}>{c.days_left}d</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Renovações em Andamento Card ─────────────────────────────────────
function RenovacoesCard() {
  const navigate = useNavigate();
  const { data: renewals } = useQuery({
    queryKey: ["renewal_requests_dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_renewal_requests")
        .select("id, client_id, renewal_for_end_date, status, proposal_public_token, created_at")
        .neq("status", "concluido")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const clientIds = [...new Set(data.map((r: any) => r.client_id))];
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name")
        .in("id", clientIds);
      const clientMap = new Map((clients || []).map((c: any) => [c.id, c.name]));
      return data.map((r: any) => ({ ...r, client_name: clientMap.get(r.client_id) || "—" }));
    },
  });

  // Fetch recent notification logs
  const { data: alertLogs } = useQuery({
    queryKey: ["notification_logs_dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_logs")
        .select("id, client_id, channel, plan_end_date, status, created_at")
        .eq("type", "plan_renewal")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const clientIds = [...new Set(data.map((l: any) => l.client_id))];
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name")
        .in("id", clientIds);
      const clientMap = new Map((clients || []).map((c: any) => [c.id, c.name]));
      return data.map((l: any) => ({ ...l, client_name: clientMap.get(l.client_id) || "—" }));
    },
  });

  const hasRenewals = renewals && renewals.length > 0;
  const hasAlerts = alertLogs && alertLogs.length > 0;

  if (!hasRenewals && !hasAlerts) return null;

  const statusColors: Record<string, string> = {
    pendente: "bg-muted text-muted-foreground",
    proposta_enviada: "bg-primary/10 text-primary",
    aceita: "bg-primary text-primary-foreground",
    recusada: "bg-destructive/10 text-destructive",
    expirada: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="neon-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-primary" />
          Renovações em Andamento
          {hasRenewals && <Badge variant="outline" className="text-[10px]">{renewals.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasRenewals && (
          <div className="space-y-2">
            {renewals.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-accent/50 cursor-pointer transition-colors duration-150"
                onClick={() => {
                  if (r.proposal_public_token) window.open(`/proposta/${r.proposal_public_token}`, "_blank");
                  else navigate(`/clientes?id=${r.client_id}`);
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.client_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    vence {new Date(r.renewal_for_end_date + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Badge className={`text-[10px] ${statusColors[r.status] || ""}`}>{r.status}</Badge>
              </div>
            ))}
          </div>
        )}

        {hasAlerts && (
          <>
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Alertas Enviados Recentes
              </p>
              <div className="space-y-1.5">
                {alertLogs.map((l: any) => (
                  <div key={l.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-muted/30">
                    <Badge variant="outline" className="text-[9px] shrink-0">{l.channel}</Badge>
                    <span className="text-xs font-medium flex-1 truncate">{l.client_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      vence {new Date(l.plan_end_date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </span>
                    <Badge className={`text-[9px] ${l.status === "sent" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {l.status === "sent" ? "enviado" : "falha"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { tarefas, tecnicoAtualId, getTecnico, getCliente, getStatusLabel, getPrioridadeLabel, loading: appLoading } = useApp();
  const { propostas, crmConfig, loading: propostasLoading } = usePropostas();
  const { clientesReceita, suporteEventos, loading: receitaLoading } = useReceita();
  const navigate = useNavigate();
  const [chartMode, setChartMode] = useState<"mrr" | "custos" | "margem">("mrr");

  const dataLoading = appLoading || receitaLoading;
  const allLoading = dataLoading || propostasLoading;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // ── Task KPIs ───────────────────────────────────────────────────────
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

  // ── Propostas KPIs ──────────────────────────────────────────────────
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

  // ── Receita metrics ─────────────────────────────────────────────────
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
      return { ...c, diasAtraso: 0 };
    }).sort((a, b) => b.diasAtraso - a.diasAtraso);
    const alertaCritico30 = emAtrasoComDias.filter(c => c.diasAtraso > 30);
    const alertaCritico7 = emAtrasoComDias.filter(c => c.diasAtraso > 7 && c.diasAtraso <= 30);
    return { mrr, arr, ticket, churnRate, margem, custos, emAtraso: emAtrasoComDias, alertaCritico7, alertaCritico30, ativosCount: ativos.length };
  }, [clientesReceita]);

  // ── Systems distribution ────────────────────────────────────────────
  const { sistemas: sistemaCatalogo } = useParametros();
  const activeSystemNames = useMemo(() => sistemaCatalogo.filter(s => s.ativo).map(s => s.nome), [sistemaCatalogo]);

  const sistemasMini = useMemo(() => {
    const systemsInUse = new Set(clientesReceita.map(c => c.sistemaPrincipal).filter(Boolean));
    const allSystems = [...new Set([...activeSystemNames, ...systemsInUse])];
    return allSystems.map(s => ({
      name: s,
      clientes: clientesReceita.filter(c => c.sistemaPrincipal === s).length,
      color: getSystemColor(s),
    })).filter(s => s.clientes > 0);
  }, [clientesReceita, activeSystemNames]);

  const custosMini = useMemo(() => {
    const systemsInUse = new Set(clientesReceita.filter(c => c.custoAtivo).map(c => c.sistemaCusto).filter(Boolean));
    const allSystems = [...new Set([...activeSystemNames, ...systemsInUse])];
    return allSystems.map(s => ({
      name: s,
      value: clientesReceita.filter(c => c.custoAtivo && c.sistemaCusto === s).reduce((sum, c) => sum + c.valorCustoMensal, 0),
      color: getSystemColor(s),
    })).filter(s => s.value > 0);
  }, [clientesReceita, activeSystemNames]);

  // ── Status distribution for donut ───────────────────────────────────
  const statusDistribution = useMemo(() => {
    const counts = { ativo: 0, atraso: 0, suspenso: 0, cancelado: 0 };
    clientesReceita.forEach(c => { if (counts[c.statusCliente] !== undefined) counts[c.statusCliente]++; });
    return [
      { name: "Ativos", value: counts.ativo, color: "hsl(var(--success))" },
      { name: "Atraso", value: counts.atraso, color: "hsl(var(--warning))" },
      { name: "Suspensos", value: counts.suspenso, color: "hsl(var(--muted-foreground))" },
      { name: "Cancelados", value: counts.cancelado, color: "hsl(var(--destructive))" },
    ].filter(s => s.value > 0);
  }, [clientesReceita]);

  // ── Top suporte ─────────────────────────────────────────────────────
  const topSuporte = useMemo(() => {
    const map: Record<string, number> = {};
    suporteEventos.forEach(e => { map[e.clienteId] = (map[e.clienteId] || 0) + 1; });
    return Object.entries(map)
      .map(([cid, count]) => ({ name: clientesReceita.find(c => c.id === cid)?.nome || cid, ocorrencias: count }))
      .sort((a, b) => b.ocorrencias - a.ocorrencias)
      .slice(0, 10);
  }, [suporteEventos, clientesReceita]);

  // ── Evolution chart data (from financial_titles) ──────────────────
  const { data: evolutionRaw } = useQuery({
    queryKey: ["dashboard_evolution"],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const { data, error } = await supabase
        .from("financial_titles")
        .select("type, value_original, competency, status")
        .gte("competency", sixMonthsAgo.toISOString().slice(0, 7))
        .in("status", ["pago", "aberto", "vencido"]);
      if (error) throw error;
      return data || [];
    },
  });

  const evolutionData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      });
    }
    return months.map(m => {
      const items = (evolutionRaw || []).filter((t: any) => t.competency === m.key);
      const receita = items.filter((t: any) => t.type === "receber").reduce((s: number, t: any) => s + Number(t.value_original), 0);
      const despesa = items.filter((t: any) => t.type === "pagar").reduce((s: number, t: any) => s + Number(t.value_original), 0);
      return { name: m.label, MRR: receita, Custos: despesa, Margem: receita - despesa };
    });
  }, [evolutionRaw]);

  // ── Sparkline data for KPIs ─────────────────────────────────────────
  const sparkMrr = useMemo(() => evolutionData.map(d => d.MRR), [evolutionData]);
  const sparkArr = useMemo(() => evolutionData.map(d => d.MRR * 12), [evolutionData]);
  const sparkTicket = useMemo(() => evolutionData.map(d => receitaMetricas.ativosCount > 0 ? d.MRR / receitaMetricas.ativosCount : 0), [evolutionData, receitaMetricas.ativosCount]);
  const sparkChurn = useMemo(() => [5.2, 4.8, 4.5, 3.9, 3.5, receitaMetricas.churnRate], [receitaMetricas.churnRate]);
  const sparkMargem = useMemo(() => evolutionData.map(d => d.Margem), [evolutionData]);

  // ── My tasks ────────────────────────────────────────────────────────
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

  // ── KPI card definitions ────────────────────────────────────────────
  const receitaKpis = [
    { label: "MRR", value: fmt(receitaMetricas.mrr), icon: DollarSign, color: RECEITA_COLORS.receita, domain: "receita" as const, spark: sparkMrr },
    { label: "ARR", value: fmt(receitaMetricas.arr), icon: TrendingUp, color: RECEITA_COLORS.receita, domain: "receita" as const, spark: sparkArr },
    { label: "Ticket Médio", value: fmt(receitaMetricas.ticket), icon: Activity, color: RECEITA_COLORS.receita, domain: "receita" as const, spark: sparkTicket },
    { label: `Churn ${receitaMetricas.churnRate.toFixed(1)}%`, value: `${receitaMetricas.churnRate.toFixed(1)}%`, icon: Percent, color: RECEITA_COLORS.churn, domain: "churn" as const, spark: sparkChurn },
    { label: "Margem", value: fmt(receitaMetricas.margem), icon: BarChart3, color: RECEITA_COLORS.margem, domain: "margem" as const, spark: sparkMargem },
  ];

  const propostasKpis = [
    { label: "Enviadas (7d)", value: propostasEnviadas7d, icon: Send, color: "text-primary" },
    { label: "Aceitas (30d)", value: propostasAceitas30d, icon: ThumbsUp, color: "text-success" },
    { label: "Expiradas", value: propostasExpiradas, icon: Ban, color: "text-destructive" },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6 chart-container">
        {/* ── Header ─────────────────────────────────────────────── */}
        <PageHeader
          title="Visão Geral"
          subtitle={`Bem-vindo, ${tecnicoNome}`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              <Button size="sm" onClick={() => navigate("/tarefas?nova=1")} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />Nova Tarefa
              </Button>
            </div>
          }
        />
        <ModuleNavGrid moduleId="dashboard" />

        {/* ══ LINHA 1 — KPIs executivos (5 cards) ══════════════════ */}
        {dataLoading ? <KpisSkeleton /> : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {receitaKpis.map(k => (
            <Card
              key={k.label}
              className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 neon-border domain-border-left"
              style={{ borderLeftColor: k.color }}
              onClick={() => navigate("/receita")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    <AcronymLabel label={k.label.split(" ")[0]} />
                  </span>
                  <k.icon className="h-4 w-4 opacity-50" style={{ color: k.color }} />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-lg lg:text-xl font-bold tracking-tight leading-none">{k.value}</p>
                  </div>
                  <Sparkline data={k.spark} color={k.color} height={28} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* ══ LINHA 2 — Painel grande + laterais ═══════════════════ */}
        {dataLoading ? <ChartsSkeleton /> : (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Painel principal — Evolução */}
          <Card className="lg:col-span-8 neon-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />Evolução
                </CardTitle>
                <div className="flex gap-1">
                  {(["mrr", "custos", "margem"] as const).map(m => (
                    <Button key={m} variant={chartMode === m ? "secondary" : "ghost"} size="sm" className="text-[11px] h-7 px-2.5"
                      onClick={() => setChartMode(m)}>
                      {m === "mrr" ? "MRR" : m === "custos" ? "Custos" : "Margem"}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={evolutionData}>
                  <defs>
                    <linearGradient id="gradMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={RECEITA_COLORS.receita} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={RECEITA_COLORS.receita} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCustos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={RECEITA_COLORS.custos} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={RECEITA_COLORS.custos} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradMargem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={RECEITA_COLORS.margem} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={RECEITA_COLORS.margem} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  {chartMode === "mrr" && (
                    <Area type="monotone" dataKey="MRR" stroke={RECEITA_COLORS.receita} fill="url(#gradMrr)" strokeWidth={2} dot={false} />
                  )}
                  {chartMode === "custos" && (
                    <Area type="monotone" dataKey="Custos" stroke={RECEITA_COLORS.custos} fill="url(#gradCustos)" strokeWidth={2} dot={false} />
                  )}
                  {chartMode === "margem" && (
                    <Area type="monotone" dataKey="Margem" stroke={RECEITA_COLORS.margem} fill="url(#gradMargem)" strokeWidth={2} dot={false} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lateral — 2 donuts empilhados */}
          <div className="lg:col-span-4 grid gap-4">
            {/* Status de Clientes */}
            <Card className="neon-border">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" />Status de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={statusDistribution} cx="50%" cy="50%" outerRadius={55} innerRadius={35} dataKey="value" nameKey="name" strokeWidth={0}>
                        {statusDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                  {statusDistribution.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="font-semibold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sistemas mais usados */}
            <Card className="neon-border">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-purple" />Sistemas
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={sistemasMini} cx="50%" cy="50%" outerRadius={55} innerRadius={35} dataKey="clientes" nameKey="name" strokeWidth={0}>
                        {sistemasMini.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                  {sistemasMini.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="font-semibold">{s.clientes}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {/* ══ LINHA 3 — Operacional (3 painéis) ════════════════════ */}
        {allLoading ? <OperationalSkeleton /> : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Clientes em atraso */}
          <Card className="neon-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Clientes em Atraso
                <Badge variant="outline" className="ml-auto text-[10px]">{receitaMetricas.emAtraso.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {receitaMetricas.emAtraso.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente em atraso ✨</p>
              ) : (
                <div className="space-y-2">
                  {receitaMetricas.emAtraso.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate("/clientes")}>
                      <span className="text-xs font-medium flex-1 truncate">{c.nome}</span>
                      <Badge className={`text-[9px] ${c.diasAtraso > 30 ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}`}>{c.diasAtraso}d</Badge>
                      <span className="text-[11px] font-medium text-muted-foreground">{fmt(c.valorMensalidade)}</span>
                    </div>
                  ))}
                  {receitaMetricas.emAtraso.length > 5 && (
                    <p className="text-[11px] text-muted-foreground text-center pt-1">+{receitaMetricas.emAtraso.length - 5} clientes</p>
                  )}
                  <p className="text-[11px] text-warning font-medium pt-1">
                    Total em risco: {fmt(receitaMetricas.emAtraso.reduce((s, c) => s + c.valorMensalidade, 0))}/mês
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Propostas no funil */}
          <Card className="neon-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />Pipeline CRM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {crmSummary.map(s => (
                  <div key={s.status} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate("/crm")}>
                    <span className="text-xs flex-1 truncate text-muted-foreground">{s.status}</span>
                    <Badge variant="secondary" className="text-[10px] font-bold">{s.count}</Badge>
                  </div>
                ))}
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  {propostasKpis.map(k => (
                    <div key={k.label} className="flex-1 text-center p-2 rounded-lg bg-accent/30">
                      <p className="text-lg font-bold">{k.value}</p>
                      <p className="text-[10px] text-muted-foreground">{k.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Módulos operacionais */}
          <Card className="neon-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />Operacional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/comercial")}>
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div className="flex-1"><p className="text-xs text-muted-foreground">Leads Ativos</p><p className="text-base font-semibold">{leadsAtivos}</p></div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/implantacao")}>
                  <Activity className="h-5 w-5 text-purple" />
                  <div className="flex-1"><p className="text-xs text-muted-foreground">Implantações</p><p className="text-base font-semibold">{implantacoesAtivas}</p></div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/suporte")}>
                  <Headphones className="h-5 w-5 text-warning" />
                  <div className="flex-1"><p className="text-xs text-muted-foreground">Chamados</p><p className="text-base font-semibold">{chamadosAbertos}</p></div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* ══ LINHA 4 — Suporte + Custos ═══════════════════════════ */}
        {dataLoading ? <AnalyticsSkeleton /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top Suporte */}
          <Card className="neon-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Headphones className="h-4 w-4 text-info" />Suporte por Cliente
                <Badge variant="outline" className="ml-auto text-[10px]">Top 10</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topSuporte.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sem dados de suporte</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topSuporte} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} className="fill-muted-foreground" axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={100} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="ocorrencias" fill={RECEITA_COLORS.suporte} radius={[0, 4, 4, 0]} name="Chamados" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Custos por Sistema */}
          <Card className="neon-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-destructive" />Custos por Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              {custosMini.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sem dados de custos</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={custosMini}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Custo">
                      {custosMini.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {/* ══ ALERTAS ══════════════════════════════════════════════ */}
        {receitaMetricas.alertaCritico30.length > 0 && (
          <Card className="border-destructive/40 bg-destructive/5 neon-border" style={{ borderLeftColor: RECEITA_COLORS.custos }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
                URGENTE: {receitaMetricas.alertaCritico30.length} cliente{receitaMetricas.alertaCritico30.length > 1 ? "s" : ""} em atraso há mais de 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {receitaMetricas.alertaCritico30.map(c => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-destructive/20 hover:bg-destructive/5 cursor-pointer transition-colors" onClick={() => navigate("/clientes")}>
                    <span className="text-xs font-medium flex-1 truncate">{c.nome}</span>
                    <Badge variant="outline" className="text-[9px]">{c.sistemaPrincipal}</Badge>
                    <Badge variant="destructive" className="text-[9px]">{c.diasAtraso}d</Badge>
                    <span className="text-[11px] font-medium">{fmt(c.valorMensalidade)}</span>
                  </div>
                ))}
                <p className="text-[11px] text-destructive font-semibold pt-1">
                  Receita em risco: {fmt(receitaMetricas.alertaCritico30.reduce((s, c) => s + c.valorMensalidade, 0))}/mês
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {receitaMetricas.alertaCritico7.length > 0 && (
          <Card className="border-warning/40 bg-warning/5 neon-border" style={{ borderLeftColor: RECEITA_COLORS.churn }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Atenção: {receitaMetricas.alertaCritico7.length} cliente{receitaMetricas.alertaCritico7.length > 1 ? "s" : ""} em atraso entre 7 e 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {receitaMetricas.alertaCritico7.map(c => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-warning/20 hover:bg-warning/5 cursor-pointer transition-colors" onClick={() => navigate("/clientes")}>
                    <span className="text-xs font-medium flex-1 truncate">{c.nome}</span>
                    <Badge variant="outline" className="text-[9px]">{c.sistemaPrincipal}</Badge>
                    <Badge className="text-[9px] bg-warning text-warning-foreground">{c.diasAtraso}d</Badge>
                    <span className="text-[11px] font-medium">{fmt(c.valorMensalidade)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══ LINHA 5 — Propostas vencendo + Tarefas ═══════════════ */}
        {propostasVencendo.length > 0 && (
          <Card className="neon-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />Propostas Vencendo
                <Badge variant="outline" className="ml-auto text-[10px]">{propostasVencendo.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {propostasVencendo.map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => navigate(`/propostas/${p.id}`)}>
                    <span className="text-[11px] font-mono text-muted-foreground">{p.numeroProposta}</span>
                    <span className="text-xs font-medium flex-1 truncate">{p.clienteNomeSnapshot || "Sem cliente"}</span>
                    <Badge variant="outline" className="text-[9px]">{p.sistema}</Badge>
                    <span className="text-[11px] font-medium">{fmt(p.valorMensalidade)}/mês</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Minhas Tarefas */}
        {appLoading ? <TasksSkeleton /> : (
        <Card className="neon-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />Minhas Tarefas
                <Badge variant="outline" className="text-[10px]">{minhasTarefas.length}</Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-[11px] h-7" onClick={() => navigate("/tarefas")}>Ver todas</Button>
            </div>
          </CardHeader>
          <CardContent>
            {minhasTarefas.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhuma tarefa pendente 🎉</p>
            ) : (
              <div className="space-y-1.5">
                {minhasTarefas.map(t => {
                  const tipoConfig = TIPO_OPERACIONAL_CONFIG[t.tipoOperacional] || TIPO_OPERACIONAL_CONFIG.interno;
                  return (
                    <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 hover:bg-accent/50 cursor-pointer transition-colors duration-150" onClick={() => navigate(`/tarefas/${t.id}`)}>
                      <Badge className={`text-[9px] shrink-0 ${prioridadeColor(t.prioridade)}`}>{getPrioridadeLabel(t.prioridade)}</Badge>
                      <Badge className={`text-[8px] shrink-0 ${tipoConfig.bgClass}`}>{tipoConfig.label}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{t.titulo}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {t.clienteId ? getCliente(t.clienteId)?.nome : "Avulsa"} · {getStatusLabel(t.status)}
                        </p>
                      </div>
                      {isAtrasada(t) && <Badge variant="destructive" className="text-[9px] shrink-0">Atrasada</Badge>}
                      {t.prazoDataHora && !isAtrasada(t) && (() => {
                        const d = new Date(t.prazoDataHora);
                        return d >= today && d < tomorrow;
                      })() && <Badge className="text-[9px] shrink-0 bg-warning text-warning-foreground">Hoje</Badge>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Indicações + Planos Vencendo + Renovações + Executive Widgets */}
        <IndicacoesRecebidasCard />
        <PlanosVencendoCard />
        <RenovacoesCard />

        <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
          <DashboardExecutiveWidgets />
        </Suspense>
      </div>
    </TooltipProvider>
  );
}
