import { useState } from "react";
import { useCockpitCharts } from "@/hooks/useCockpitCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import {
  Gauge, Eye, EyeOff, DollarSign, TrendingUp, Users, ListTodo,
  RefreshCw,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useApp } from "@/contexts/AppContext";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { usePropostas } from "@/contexts/PropostasContext";
import { useReceita } from "@/contexts/ReceitaContext";

/* ── KPI Mini Card ────────────────────────────────── */
function KpiPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg bg-card/60 backdrop-blur-sm border border-border/40 min-w-[90px]">
      <span className={cn("text-lg font-bold tabular-nums", color || "text-foreground")}>{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

/* ── Cockpit Card wrapper ─────────────────────────── */
function CockpitCard({ title, icon: Icon, color, children, className, hidden }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode; className?: string; hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <Card className={cn("bg-card/80 backdrop-blur-sm border-border/30 shadow-sm hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className={cn("p-1.5 rounded-md", color)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
    </Card>
  );
}

export default function Cockpit() {
  const charts = useCockpitCharts();
  const { tarefas } = useApp();
  const { propostas } = usePropostas();
  const { clientesReceita } = useReceita();
  const [focusMode, setFocusMode] = useState(() => localStorage.getItem("cockpit_focus") === "1");

  const toggleFocus = () => {
    setFocusMode(p => {
      const v = !p;
      localStorage.setItem("cockpit_focus", v ? "1" : "0");
      return v;
    });
  };

  // Metrics
  const ativos = clientesReceita.filter(c => c.statusCliente === "ativo");
  const mrr = ativos.reduce((s, c) => s + c.valorMensalidade, 0);
  const clientesAtivos = ativos.length;
  const inadimplentes = clientesReceita.filter(c => c.statusCliente === "atraso").length;
  const propostasAbertas = propostas.filter(p => p.statusAceite === "pendente").length;
  const tarefasPendentes = tarefas.filter(t => t.status !== "concluida" && t.status !== "cancelada").length;
  const tarefasUrgentes = tarefas.filter(t => t.prioridade === "urgente" && t.status !== "concluida" && t.status !== "cancelada").length;
  const now = new Date();
  const tarefasAtrasadas = tarefas.filter(t => {
    if (!t.prazoDataHora || t.status === "concluida" || t.status === "cancelada") return false;
    return new Date(t.prazoDataHora) < now;
  }).length;
  const tickets = tarefas.filter(t => t.tipoOperacional === "suporte" && t.status !== "concluida" && t.status !== "cancelada").length;
  const propostasAceitasMes = propostas.filter(p => p.statusAceite === "aceitou").length;

  return (
    <div className="space-y-4">
      <PageHeader title="Modo Cockpit" icon={Gauge} iconClassName="text-cyan-400" subtitle="Central de Comando"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleFocus} className="gap-1.5 text-xs">
              {focusMode ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {focusMode ? "Visão Completa" : "Modo Foco"}
            </Button>
          </div>
        }
      />
      <ModuleNavGrid moduleId="dashboard" />

      {/* ── TOP: KPIs ─────────────────────── */}
      <Card className="bg-gradient-to-r from-card via-card/95 to-card border-border/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <KpiPill label="MRR" value={`R$ ${(mrr / 1000).toFixed(1)}k`} color="text-emerald-500" />
            <KpiPill label="Clientes" value={clientesAtivos} color="text-primary" />
            <KpiPill label="Inadimp." value={inadimplentes} color={inadimplentes > 0 ? "text-destructive" : "text-muted-foreground"} />
            <KpiPill label="Propostas" value={propostasAbertas} color="text-amber-500" />
            <KpiPill label="Tarefas" value={tarefasPendentes} color="text-violet-500" />
            {!focusMode && <KpiPill label="Tickets" value={tickets} color="text-orange-500" />}
          </div>
        </CardContent>
      </Card>

      {/* ── MAIN GRID ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CockpitCard title="Financeiro" icon={DollarSign} color="bg-emerald-500/10 text-emerald-500">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">MRR</span><span className="font-semibold text-emerald-500">R$ {mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Clientes em Atraso</span><span className="font-semibold">{inadimplentes}</span></div>
          </div>
          {charts.data.mrr.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.data.mrr}>
                    <defs>
                      <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#mrrGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CockpitCard>

        <CockpitCard title="Comercial" icon={TrendingUp} color="bg-indigo-500/10 text-indigo-500">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Propostas Abertas</span><span className="font-semibold">{propostasAbertas}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Aceitas</span><span className="font-semibold text-emerald-500">{propostasAceitasMes}</span></div>
          </div>
          {charts.data.funnel.some(f => f.count > 0) && (
            <>
              <Separator className="my-2" />
              <div className="space-y-1.5">
                {charts.data.funnel.map(f => {
                  const maxCount = Math.max(...charts.data.funnel.map(x => x.count), 1);
                  return (
                    <div key={f.label} className="flex items-center gap-2 text-[11px]">
                      <span className="w-14 text-muted-foreground shrink-0">{f.label}</span>
                      <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(f.count / maxCount) * 100}%`, backgroundColor: f.color }} />
                      </div>
                      <span className="w-6 text-right font-medium tabular-nums">{f.count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CockpitCard>

        <CockpitCard title="Clientes" icon={Users} color="bg-primary/10 text-primary">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Ativos</span><span className="font-semibold">{clientesAtivos}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Em Atraso</span><span className="font-semibold text-destructive">{inadimplentes}</span></div>
          </div>
          {charts.data.clients.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.data.clients} barGap={1}>
                    <Bar dataKey="novos" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="cancelados" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CockpitCard>

        <CockpitCard title="Tarefas do Dia" icon={ListTodo} color="bg-violet-500/10 text-violet-500">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Pendentes</span><span className="font-semibold">{tarefasPendentes}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Urgentes</span><span className="font-semibold text-destructive">{tarefasUrgentes}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Atrasadas</span><span className="font-semibold text-amber-500">{tarefasAtrasadas}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tickets Abertos</span><span className="font-semibold">{tickets}</span></div>
          </div>
          {charts.data.tasks.some(t => t.count > 0) && (
            <>
              <Separator className="my-2" />
              <div className="flex items-end gap-1 h-8 justify-center">
                {charts.data.tasks.map(t => {
                  const maxCount = Math.max(...charts.data.tasks.map(x => x.count), 1);
                  const h = Math.max((t.count / maxCount) * 100, 8);
                  return (
                    <div key={t.label} className="flex flex-col items-center gap-0.5">
                      <div className="w-5 rounded-t" style={{ height: `${h}%`, backgroundColor: t.color }} />
                      <span className="text-[8px] text-muted-foreground">{t.label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CockpitCard>
      </div>
    </div>
  );
}
