import { useMemo, useState, lazy, Suspense, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { usePropostas } from "@/contexts/PropostasContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  AlertTriangle, Plus, Users, TrendingUp, TrendingDown,
  Headphones, FileText, Send, ThumbsUp, Ban, DollarSign, Percent, Activity,
  Shield, BarChart3, PieChart as PieChartIcon,
  ExternalLink, RefreshCw, Download, Clock, Zap, CalendarPlus, Target,
  Sparkles
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

// ── Certificados Digitais Vencendo Card ──────────────────────────────
function CertificadosVencendoCard() {
  const navigate = useNavigate();
  const { data: expiring } = useQuery({
    queryKey: ["certificados_vencendo"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const limit = new Date(today); limit.setDate(limit.getDate() + 30);
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, cert_expires_at, primary_contact_phone, phone, billing_phone")
        .not("cert_expires_at", "is", null)
        .lte("cert_expires_at", limit.toISOString().slice(0, 10))
        .order("cert_expires_at", { ascending: true })
        .limit(15);
      if (error) throw error;
      return (data || []).map((c: any) => {
        const end = new Date(c.cert_expires_at + "T00:00:00");
        const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...c, days_left: days };
      });
    },
  });

  if (!expiring || expiring.length === 0) return null;

  const openWhatsApp = (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const raw = c.primary_contact_phone || c.phone || c.billing_phone || "";
    const digits = String(raw).replace(/\D/g, "");
    if (!digits) {
      navigate(`/clientes?id=${c.id}`);
      return;
    }
    const phone = digits.startsWith("55") ? digits : `55${digits}`;
    const dateStr = new Date(c.cert_expires_at + "T00:00:00").toLocaleDateString("pt-BR");
    const status = c.days_left < 0
      ? `venceu em ${dateStr}`
      : c.days_left === 0
      ? `vence hoje (${dateStr})`
      : `vence em ${c.days_left} dia${c.days_left !== 1 ? "s" : ""} (${dateStr})`;
    const msg = `Olá, ${c.name}! Passando para avisar que o certificado digital A1 da sua empresa ${status}. Gostaria de renovar conosco?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Card className="neon-border border-warning/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-warning" />
          Certificados Digitais Vencendo (30 dias)
          <Badge variant="outline" className="text-[10px]">{expiring.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {expiring.map((c: any) => (
            <div
              key={c.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-accent/50 cursor-pointer transition-colors duration-150"
              onClick={(e) => openWhatsApp(c, e)}
              title="Clique para falar no WhatsApp sobre a renovação"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {c.days_left < 0
                    ? `Vencido há ${Math.abs(c.days_left)}d · ${new Date(c.cert_expires_at + "T00:00:00").toLocaleDateString("pt-BR")}`
                    : `Vence ${new Date(c.cert_expires_at + "T00:00:00").toLocaleDateString("pt-BR")}`}
                </p>
              </div>
              <Badge
                className={`text-[10px] ${
                  c.days_left < 0 || c.days_left <= 7
                    ? "bg-destructive text-destructive-foreground"
                    : c.days_left <= 15
                    ? "bg-warning text-warning-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {c.days_left < 0 ? "Vencido" : `${c.days_left}d`}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── IA Insights Card ────────────────────────────────────────────────
function IAInsightsCard({ receitaMetricas }: { receitaMetricas: any }) {
  const { tarefas, tecnicoAtualId } = useApp();
  const { clientesReceita } = useReceita();
  const [activeAnalysis, setActiveAnalysis] = useState<any>(null);

  const { data: insights, isLoading } = useQuery({
    queryKey: ["ia_dashboard_insights", tarefas.length, clientesReceita.length],
    queryFn: async () => {
      const mrrTotal = clientesReceita.reduce((acc, c) => acc + (c.valorMensalidade || 0), 0);
      const { data, error } = await supabase.functions.invoke("ia-assistant", {
        body: { 
          question: "Gere um resumo diário inteligente (3-4 pontos). Foco em: 1. Prioridades imediatas (tarefas), 2. Progresso financeiro (MRR/Metas), 3. Bloqueios ou riscos (clientes em atraso). Seja direto e profissional.",
          context: {
            module: "dashboard",
            summary: {
              tarefas_pendentes: tarefas.filter(t => t.status !== 'concluida' && t.status !== 'cancelada').length,
              mrr: mrrTotal,
              total_clientes: clientesReceita.length,
              clientes_ativos: clientesReceita.filter(c => c.statusCliente === 'ativo').length
            }
          }
        },
      });
      if (error) throw error;
      return data?.answer?.split('\n').filter((l: string) => l.trim().length > 10).slice(0, 4) || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const sendPushAlert = async (title: string, body: string, targetUserIds?: string[]) => {
    try {
      const { error } = await supabase.functions.invoke("push-notifications", {
        body: {
          action: "send",
          userIds: targetUserIds || [tecnicoAtualId],
          title,
          messageBody: body,
          url: "/dashboard"
        }
      });
      if (error) throw error;
      toast.success("Alerta enviado com sucesso!");
    } catch (err) {
      console.error("Erro ao enviar push:", err);
      toast.error("Erro ao disparar notificação.");
    }
  };

  useEffect(() => {
    const checkExpiredPlans = async () => {
      const { data: expiredPlans } = await supabase
        .from('recovery_plans')
        .select('id, risk_type, expires_at')
        .eq('conversion_status', 'pendente')
        .lt('expires_at', new Date().toISOString());

      if (expiredPlans && expiredPlans.length > 0) {
        expiredPlans.forEach(plan => {
          sendPushAlert(
            "Plano de Recuperação Expirado",
            `O plano para risco de ${plan.risk_type === 'inadimplencia' ? 'Inadimplência' : 'Churn'} atingiu a data limite sem conclusão.`
          );
        });
        
        // Update status to expired or just notify? Let's keep them as pending but notify
      }
    };

    checkExpiredPlans();
  }, [tecnicoAtualId]);

  const handleGeneratePlan = async (level: "critico" | "atencao", riskType: string) => {
    const context = level === "critico" ? receitaMetricas.alertaCritico30 : receitaMetricas.alertaCritico7;
    const insight = level === "critico" 
      ? `Alto risco de churn identificado para ${context.length} clientes com +30 dias de atraso.`
      : `Gargalo financeiro identificado para ${context.length} clientes entre 7 e 30 dias de atraso.`;
    
    await showRecoveryPlan(insight, riskType);
  };

  const showRecoveryPlan = async (insight: string, riskType: string = "inadimplencia") => {
    setActiveAnalysis({
      title: "Plano de Recuperação IA",
      content: "Analisando dados históricos e comportamento do cliente para gerar estratégia...",
      loading: true
    });

    try {
      const { data, error } = await supabase.functions.invoke("ia-assistant", {
        body: { 
          question: `Com base no alerta: "${insight}", detalhe um plano de recuperação estratégica em 5 passos para o risco de "${riskType}".`,
          context: { module: "dashboard_recovery_plan", source_insight: insight, risk_type: riskType }
        }
      });
      if (error) throw error;

      // Persist the generated plan
      await supabase.from('recovery_plans').insert({
        source_insight: insight,
        plan_content: data.answer,
        org_id: tecnicoAtualId,
        risk_type: riskType,
        conversion_status: 'pendente',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiration
      });

      setActiveAnalysis({
        title: "Plano de Recuperação IA",
        content: data.answer,
        loading: false
      });
    } catch (err) {
      setActiveAnalysis(null);
      toast.error("Erro ao gerar plano de recuperação.");
    }
  };

  if (isLoading) return <Card className="neon-border border-primary/20 bg-primary/5 mb-4"><CardContent className="p-4"><div className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" /></div></CardContent></Card>;
  if (!insights || insights.length === 0) return null;

  return (
    <>
      <Card className="neon-border border-primary/20 bg-primary/5 mb-4 shadow-glow-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-2 text-primary uppercase tracking-wider">
            <Sparkles className="h-3 w-3 animate-pulse" /> Resumo Inteligente · Hyon IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-5">
          {insights.map((insight: string, i: number) => {
            const cleanInsight = insight.replace(/^[0-9*.\-\s]+/, '');
            const isRisk = cleanInsight.toLowerCase().includes('risco') || cleanInsight.toLowerCase().includes('atraso') || cleanInsight.toLowerCase().includes('churn');
            
            return (
              <div key={i} className="flex flex-col gap-2 p-2 rounded-lg hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10">
                <div className="flex gap-3 items-start group">
                  <div className="mt-1.5 w-1 h-1 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                  <p className="text-[11px] leading-relaxed text-foreground/90 font-medium flex-1">{cleanInsight}</p>
                </div>
                {isRisk && (
                  <div className="flex gap-2 ml-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[9px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => sendPushAlert("Alerta de Risco Hyon", cleanInsight)}
                    >
                      <Send className="h-2.5 w-2.5" /> Disparar Alerta
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[9px] gap-1 text-purple hover:text-purple hover:bg-purple/10"
                      onClick={() => showRecoveryPlan(cleanInsight)}
                    >
                      <Zap className="h-2.5 w-2.5" /> Ver Plano
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <RecoveryHistoryCard />

      <AlertDialog open={!!activeAnalysis} onOpenChange={() => setActiveAnalysis(null)}>
        <AlertDialogContent className="max-w-2xl glass-premium border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" /> {activeAnalysis?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/90 text-sm whitespace-pre-line leading-relaxed overflow-y-auto max-h-[60vh] py-4">
              {activeAnalysis?.loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[90%]" />
                  <Skeleton className="h-4 w-[95%]" />
                  <Skeleton className="h-4 w-[85%]" />
                </div>
              ) : activeAnalysis?.content}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-primary text-primary-foreground hover:bg-primary/90">
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RecoveryHistoryCard() {
  const { tecnicoAtualId } = useApp();
  const [filterRiskType, setFilterRiskType] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("7d");
  const [showOnlyExpired, setShowOnlyExpired] = useState(false);
  const [editingFailureReason, setEditingFailureReason] = useState<{ id: string, reason: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["recovery_plans_history", tecnicoAtualId, filterRiskType, filterDate, showOnlyExpired],
    queryFn: async () => {
      let query = supabase
        .from("recovery_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterRiskType !== "all") {
        query = query.eq("risk_type", filterRiskType);
      }

      if (showOnlyExpired) {
        query = query.lt("expires_at", new Date().toISOString())
                     .neq("conversion_status", "concluido");
      }

      if (filterDate !== "all") {
        const date = new Date();
        if (filterDate === "7d") date.setDate(date.getDate() - 7);
        if (filterDate === "30d") date.setDate(date.getDate() - 30);
        query = query.gte("created_at", date.toISOString());
      }

      const { data, error } = await query.limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updateData: any = { 
        conversion_status: status,
        executed_at: status === 'concluido' ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from("recovery_plans")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Status atualizado!");
      queryClient.invalidateQueries({ queryKey: ["recovery_plans_history"] });
    } catch (err) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleSaveFailureReason = async () => {
    if (!editingFailureReason) return;
    try {
      const { error } = await supabase
        .from("recovery_plans")
        .update({ failure_reason: editingFailureReason.reason })
        .eq("id", editingFailureReason.id);
      
      if (error) throw error;
      toast.success("Motivo salvo!");
      setEditingFailureReason(null);
      queryClient.invalidateQueries({ queryKey: ["recovery_plans_history"] });
    } catch (err) {
      toast.error("Erro ao salvar motivo.");
    }
  };

  if (!plans && !isLoading) return null;

  return (
    <Card className="neon-border border-purple/20 bg-purple/5 mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-2 text-purple uppercase tracking-wider">
            <Clock className="h-3 w-3" /> Histórico de Planos IA
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 mr-2 px-1.5 py-0.5 rounded bg-purple/10 border border-purple/20">
              <input 
                type="checkbox" 
                id="expired-only"
                className="w-3 h-3 accent-purple cursor-pointer"
                checked={showOnlyExpired}
                onChange={(e) => setShowOnlyExpired(e.target.checked)}
              />
              <label htmlFor="expired-only" className="text-[9px] text-purple font-medium cursor-pointer whitespace-nowrap">
                Expirados
              </label>
            </div>
            <select 
              className="bg-purple/10 border-none text-[10px] rounded px-1.5 h-6 text-purple outline-none cursor-pointer"
              value={filterRiskType}
              onChange={(e) => setFilterRiskType(e.target.value)}
            >
              <option value="all">Todos Riscos</option>
              <option value="inadimplencia">Inadimplência</option>
              <option value="churn">Churn</option>
            </select>
            <select 
              className="bg-purple/10 border-none text-[10px] rounded px-1.5 h-6 text-purple outline-none cursor-pointer"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="all">Tudo</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-5">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : plans?.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum plano encontrado com estes filtros.</p>
        ) : (
          plans?.map((plan: any) => {
            const isExpired = plan.expires_at && new Date(plan.expires_at) < new Date();
            const hasFailure = plan.conversion_status === 'abortado';
            
            return (
              <div key={plan.id} className={`p-2.5 rounded-lg border transition-all hover:bg-purple/10 space-y-2 group ${
                isExpired && plan.conversion_status !== 'concluido' ? 'border-destructive/30 bg-destructive/5' : 'border-purple/10 bg-purple/5'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[8px] h-4 uppercase ${
                      isExpired && plan.conversion_status !== 'concluido' ? 'border-destructive/30 text-destructive' : 'border-purple/30 text-purple'
                    }`}>
                      {plan.risk_type || 'Geral'} {isExpired && '• EXPIRADO'}
                    </Badge>
                    <span className="text-[10px] text-purple/70 font-medium truncate max-w-[120px]">Insight: {plan.source_insight.substring(0, 30)}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      className={`text-[9px] rounded px-1 h-5 outline-none cursor-pointer border-none font-bold ${
                        plan.conversion_status === 'concluido' ? 'bg-success/20 text-success' : 
                        plan.conversion_status === 'em_execucao' ? 'bg-info/20 text-info' : 
                        plan.conversion_status === 'abortado' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
                      }`}
                      value={plan.conversion_status || 'pendente'}
                      onChange={(e) => handleStatusChange(plan.id, e.target.value)}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_execucao">Em Execução</option>
                      <option value="concluido">Concluído</option>
                      <option value="abortado">Abortado / Falha</option>
                    </select>
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                      {new Date(plan.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                <p className="text-[10px] text-foreground/80 line-clamp-2 italic leading-relaxed">
                  "{plan.plan_content}"
                </p>

                {(hasFailure || plan.failure_reason) && (
                  <div className="mt-2 pt-2 border-t border-purple/10">
                    {editingFailureReason?.id === plan.id ? (
                      <div className="flex flex-col gap-1.5">
                        <textarea
                          className="text-[9px] w-full bg-purple/5 border border-purple/20 rounded p-1.5 text-foreground outline-none resize-none h-12"
                          placeholder="Descreva o motivo da falha para a IA..."
                          value={editingFailureReason.reason}
                          onChange={(e) => setEditingFailureReason({ ...editingFailureReason, reason: e.target.value })}
                        />
                        <div className="flex justify-end gap-1">
                          <Button size="xs" variant="ghost" className="h-5 text-[8px]" onClick={() => setEditingFailureReason(null)}>Cancelar</Button>
                          <Button size="xs" className="h-5 text-[8px] bg-purple text-white" onClick={handleSaveFailureReason}>Salvar Motivo</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[9px] text-destructive/80 leading-tight">
                          <span className="font-bold block text-[8px] uppercase mb-0.5">Motivo da Falha:</span>
                          {plan.failure_reason || "Sem motivo registrado."}
                        </div>
                        <Button 
                          size="xs" 
                          variant="ghost" 
                          className="h-5 w-5 p-0 text-purple/50 hover:text-purple"
                          onClick={() => setEditingFailureReason({ id: plan.id, reason: plan.failure_reason || "" })}
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
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
  const [evolutionScope, setEvolutionScope] = useState<"realizado" | "previsto">("realizado");

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

  // ── Overdue days from financial_titles (real) ──────────────────────
  const { data: overdueRaw } = useQuery({
    queryKey: ["dashboard_overdue_titles"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("financial_titles")
        .select("client_id, due_at")
        .eq("type", "receber")
        .in("status", ["aberto", "vencido"])
        .lt("due_at", today);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  const overdueByClient = useMemo(() => {
    const map = new Map<string, number>();
    const now = Date.now();
    (overdueRaw || []).forEach((t: any) => {
      if (!t.client_id || !t.due_at) return;
      const dias = Math.floor((now - new Date(t.due_at + "T00:00:00").getTime()) / 86400000);
      const prev = map.get(t.client_id) || 0;
      if (dias > prev) map.set(t.client_id, dias);
    });
    return map;
  }, [overdueRaw]);

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
    const emAtrasoComDias = emAtraso
      .map(c => ({ ...c, diasAtraso: overdueByClient.get(c.id) || 0 }))
      .sort((a, b) => b.diasAtraso - a.diasAtraso);
    const alertaCritico30 = emAtrasoComDias.filter(c => c.diasAtraso > 30);
    const alertaCritico7 = emAtrasoComDias.filter(c => c.diasAtraso > 7 && c.diasAtraso <= 30);
    return { mrr, arr, ticket, churnRate, margem, custos, emAtraso: emAtrasoComDias, alertaCritico7, alertaCritico30, ativosCount: ativos.length };
  }, [clientesReceita, overdueByClient]);

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
    queryKey: ["dashboard_evolution", evolutionScope],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const statuses = evolutionScope === "realizado" ? ["pago"] : ["pago", "aberto", "vencido"];
      const { data, error } = await supabase
        .from("financial_titles")
        .select("type, value_final, competency, status")
        .gte("competency", sixMonthsAgo.toISOString().slice(0, 7))
        .in("status", statuses);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  const evolutionData = useMemo(() => {
    const nowD = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      });
    }
    return months.map(m => {
      const items = (evolutionRaw || []).filter((t: any) => t.competency === m.key);
      const receita = items.filter((t: any) => t.type === "receber").reduce((s: number, t: any) => s + Number(t.value_final || 0), 0);
      const despesa = items.filter((t: any) => t.type === "pagar").reduce((s: number, t: any) => s + Number(t.value_final || 0), 0);
      return { name: m.label, MRR: receita, Custos: despesa, Margem: receita - despesa };
    });
  }, [evolutionRaw]);

  const evolutionHasData = useMemo(() => evolutionData.some(d => d.MRR > 0 || d.Custos > 0), [evolutionData]);

  // ── Historical churn (real) ─────────────────────────────────────────
  const { data: churnHistoric } = useQuery({
    queryKey: ["dashboard_churn_history"],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const [{ data: cancels }, { data: created }] = await Promise.all([
        supabase.from("clients").select("cancelled_at").not("cancelled_at", "is", null).gte("cancelled_at", sixMonthsAgo.toISOString()),
        supabase.from("clients").select("created_at").lt("created_at", new Date().toISOString()),
      ]);
      return { cancels: cancels || [], created: created || [] };
    },
    staleTime: 300_000,
  });

  // ── Sparkline data for KPIs ─────────────────────────────────────────
  const sparkMrr = useMemo(() => evolutionData.map(d => d.MRR), [evolutionData]);
  const sparkArr = useMemo(() => evolutionData.map(d => d.MRR * 12), [evolutionData]);
  const sparkTicket = useMemo(() => evolutionData.map(d => receitaMetricas.ativosCount > 0 ? d.MRR / receitaMetricas.ativosCount : 0), [evolutionData, receitaMetricas.ativosCount]);
  const sparkChurn = useMemo(() => {
    const nowD = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const cancels = churnHistoric?.cancels || [];
    const created = churnHistoric?.created || [];
    return months.map(m => {
      const cancelados = cancels.filter((c: any) => (c.cancelled_at || "").slice(0, 7) === m).length;
      const baseAtivos = created.filter((c: any) => (c.created_at || "").slice(0, 7) <= m).length;
      return baseAtivos > 0 ? (cancelados / baseAtivos) * 100 : 0;
    });
  }, [churnHistoric]);
  const sparkMargem = useMemo(() => evolutionData.map(d => d.Margem), [evolutionData]);

  // ── Variação MoM ────────────────────────────────────────────────────
  const pctChange = (arr: number[]) => {
    if (arr.length < 2) return null;
    const prev = arr[arr.length - 2];
    const cur = arr[arr.length - 1];
    if (prev === 0) return cur === 0 ? 0 : null;
    return ((cur - prev) / Math.abs(prev)) * 100;
  };
  const varMrr = pctChange(sparkMrr);
  const varArr = pctChange(sparkArr);
  const varTicket = pctChange(sparkTicket);
  const varChurn = pctChange(sparkChurn);
  const varMargem = pctChange(sparkMargem);

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
    { label: "MRR", value: fmt(receitaMetricas.mrr), icon: DollarSign, color: RECEITA_COLORS.receita, spark: sparkMrr, variation: varMrr, invertColor: false },
    { label: "ARR", value: fmt(receitaMetricas.arr), icon: TrendingUp, color: RECEITA_COLORS.receita, spark: sparkArr, variation: varArr, invertColor: false },
    { label: "Ticket Médio", value: fmt(receitaMetricas.ticket), icon: Activity, color: RECEITA_COLORS.receita, spark: sparkTicket, variation: varTicket, invertColor: false },
    { label: `Churn ${receitaMetricas.churnRate.toFixed(1)}%`, value: `${receitaMetricas.churnRate.toFixed(1)}%`, icon: Percent, color: RECEITA_COLORS.churn, spark: sparkChurn, variation: varChurn, invertColor: true },
    { label: "Margem", value: fmt(receitaMetricas.margem), icon: BarChart3, color: RECEITA_COLORS.margem, spark: sparkMargem, variation: varMargem, invertColor: false },
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
          title="Dashboard"
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/reunioes?new=1")}
                    className="gap-1.5"
                    aria-label="Agendar reunião"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Agendar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Agendar reunião</TooltipContent>
              </Tooltip>
              <Button size="sm" onClick={() => navigate("/tarefas?nova=1")} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />Nova Tarefa
              </Button>
            </div>
          }
        />
        <ModuleNavGrid moduleId="dashboard" />

        {/* ══ LINHA 1 — KPIs executivos (5 cards) ══════════════════ */}
        {dataLoading ? <KpisSkeleton /> : (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
          {receitaKpis.map(k => (
            <Card
              key={k.label}
              className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated border border-border/60 bg-card"
              onClick={() => navigate("/clientes?tab=receita")}
            >
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10.5px] font-semibold text-muted-foreground/80 uppercase tracking-[0.08em]">
                    <AcronymLabel label={k.label.split(" ")[0]} />
                  </span>
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${k.color}18` }}
                  >
                    <k.icon className="h-3.5 w-3.5" style={{ color: k.color }} />
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <p className="text-[22px] lg:text-[26px] font-bold tabular-nums tracking-[-0.02em] leading-none text-foreground">
                    {k.value}
                  </p>
                  <Sparkline data={k.spark} color={k.color} height={28} />
                </div>
                {k.variation !== null && k.variation !== undefined && (
                  <div className="mt-2 flex items-center gap-1">
                    {(() => {
                      const positive = k.invertColor ? k.variation < 0 : k.variation > 0;
                      const neutral = k.variation === 0;
                      const cls = neutral ? "text-muted-foreground" : positive ? "text-success" : "text-destructive";
                      const Icon = neutral ? Activity : k.variation > 0 ? TrendingUp : TrendingDown;
                      return (
                        <span className={`inline-flex items-center gap-0.5 text-[10.5px] font-semibold ${cls}`}>
                          <Icon className="h-3 w-3" />
                          {k.variation > 0 ? "+" : ""}{k.variation.toFixed(1)}%
                          <span className="text-muted-foreground/60 font-normal ml-0.5">vs mês ant.</span>
                        </span>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        )}

        {/* ══ LINHA 2 — Painel grande + laterais ═══════════════════ */}
        <div className="grid gap-4 lg:grid-cols-4 mb-4">
           <Card className="neon-border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-all group" onClick={() => navigate("/radar")}>
             <CardContent className="p-4 flex items-center justify-between">
               <div>
                 <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Metas e Crescimento</p>
                 <p className="text-xs text-muted-foreground leading-tight">Acompanhe objetivos e KPIs<br/>de forma inteligente.</p>
               </div>
               <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Target className="h-5 w-5 text-primary" />
               </div>
             </CardContent>
           </Card>
        </div>

        {dataLoading ? <ChartsSkeleton /> : (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Painel principal — Evolução */}
          <Card className="lg:col-span-8 neon-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />Evolução
                  <Badge variant="outline" className="text-[9px] font-normal uppercase tracking-wider">
                    {evolutionScope === "realizado" ? "Pagos" : "Faturados"}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 bg-muted/40 rounded-md p-0.5">
                    {(["realizado", "previsto"] as const).map(s => (
                      <Button key={s} variant={evolutionScope === s ? "secondary" : "ghost"} size="sm" className="text-[10.5px] h-6 px-2"
                        onClick={() => setEvolutionScope(s)}>
                        {s === "realizado" ? "Realizado" : "Previsto"}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {(["mrr", "custos", "margem"] as const).map(m => (
                      <Button key={m} variant={chartMode === m ? "secondary" : "ghost"} size="sm" className="text-[11px] h-7 px-2.5"
                        onClick={() => setChartMode(m)}>
                        {m === "mrr" ? "MRR" : m === "custos" ? "Custos" : "Margem"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {!evolutionHasData ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-center text-muted-foreground gap-2">
                  <BarChart3 className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Sem lançamentos no período</p>
                  <p className="text-[11px] opacity-70">Registre títulos financeiros para ver a evolução</p>
                </div>
              ) : (
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
              )}
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
            <IAInsightsCard receitaMetricas={receitaMetricas} />
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

        {/* ══ ALERTAS INTELIGENTES ═══════════════════════════════════════ */}
        {(receitaMetricas.alertaCritico30.length > 0 || receitaMetricas.alertaCritico7.length > 0) && (
          <div className="grid gap-4 lg:grid-cols-2">
            {receitaMetricas.alertaCritico30.length > 0 && (
              <Card className="border-destructive/40 bg-destructive/5 neon-border h-full" style={{ borderLeftColor: RECEITA_COLORS.custos }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
                      Crítico: +30 dias
                    </CardTitle>
                    <Badge variant="destructive" className="text-[10px]">{receitaMetricas.alertaCritico30.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {receitaMetricas.alertaCritico30.slice(0, 3).map(c => (
                      <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-destructive/20 hover:bg-destructive/5 cursor-pointer transition-colors" onClick={() => navigate("/clientes")}>
                        <span className="text-xs font-medium flex-1 truncate">{c.nome}</span>
                        <Badge variant="destructive" className="text-[9px]">{c.diasAtraso}d</Badge>
                        <span className="text-[11px] font-medium">{fmt(c.valorMensalidade)}</span>
                      </div>
                    ))}
                    
                    <div className="mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-destructive animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">Análise de Risco IA</span>
                        </div>
                        <Badge variant="outline" className="text-[8px] h-4 border-destructive/30 text-destructive">CRÍTICO</Badge>
                      </div>
                      <p className="text-[10px] text-foreground/80 leading-relaxed italic mb-2">
                        "Alto risco de churn identificado. A receita impactada ({fmt(receitaMetricas.alertaCritico30.reduce((s, c) => s + c.valorMensalidade, 0))}) requer ação imediata de cobrança e renegociação para evitar perda definitiva."
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 text-[9px] border-destructive/30 hover:bg-destructive/10 text-destructive w-full" 
                          onClick={() => {
                            // Este componente não tem acesso ao handleGeneratePlan de IAInsightsCard
                            // Mas IAInsightsCard está logo abaixo no JSX. 
                            // O melhor seria mover a lógica para um hook ou context se for compartilhado,
                            // mas como é visual, vamos apenas disparar um alerta genérico ou navegar.
                            navigate("/dashboard");
                            toast.info("Gere o plano no card 'Resumo Inteligente' abaixo.");
                          }}
                        >
                          Ver Plano sugerido pela IA
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {receitaMetricas.alertaCritico7.length > 0 && (
              <Card className="border-warning/40 bg-warning/5 neon-border h-full" style={{ borderLeftColor: RECEITA_COLORS.churn }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      Atenção: 7-30 dias
                    </CardTitle>
                    <Badge className="text-[10px] bg-warning text-warning-foreground">{receitaMetricas.alertaCritico7.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {receitaMetricas.alertaCritico7.slice(0, 3).map(c => (
                      <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-warning/20 hover:bg-warning/5 cursor-pointer transition-colors" onClick={() => navigate("/clientes")}>
                        <span className="text-xs font-medium flex-1 truncate">{c.nome}</span>
                        <Badge className="text-[9px] bg-warning text-warning-foreground">{c.diasAtraso}d</Badge>
                        <span className="text-[11px] font-medium">{fmt(c.valorMensalidade)}</span>
                      </div>
                    ))}

                    <div className="mt-3 p-2.5 rounded-lg bg-warning/10 border border-warning/20 relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-warning animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-warning">Gargalo Identificado IA</span>
                        </div>
                        <Badge className="text-[8px] h-4 bg-warning/20 border-warning/30 text-warning">ATENÇÃO</Badge>
                      </div>
                      <p className="text-[10px] text-foreground/80 leading-relaxed italic mb-2">
                        "Tendência de atraso em cascata detectada. Recomenda-se envio automático de lembrete via WhatsApp para os {receitaMetricas.alertaCritico7.length} clientes afetados."
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 text-[9px] border-warning/30 hover:bg-warning/10 text-warning w-full" 
                          onClick={() => {
                            navigate("/dashboard");
                            toast.info("Gere o plano no card 'Resumo Inteligente' abaixo.");
                          }}
                        >
                          Ver Estratégia de Retenção
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
        <CertificadosVencendoCard />
        <RenovacoesCard />

        <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
          <DashboardExecutiveWidgets />
        </Suspense>
      </div>
    </TooltipProvider>
  );
}
