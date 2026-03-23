import { useCardClients } from "@/hooks/useCardClients";
import { useCardProposals, useCardOnboarding } from "@/hooks/useCardProposals";
import { useCardRevenue } from "@/hooks/useCardRevenue";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, DollarSign, TrendingUp, AlertTriangle, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts";
import { useMemo } from "react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CardDashboard() {
  const { data: clients, isLoading: cLoading } = useCardClients();
  const { data: proposals, isLoading: pLoading } = useCardProposals();
  const { data: onboarding } = useCardOnboarding();
  const { revenue, commissions } = useCardRevenue();
  const navigate = useNavigate();

  const loading = cLoading || pLoading || revenue.isLoading;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const leads = (clients || []).filter(c => c.status === "lead").length;
  const ativos = (clients || []).filter(c => c.status === "ativo").length;
  const propostasAceitas = (proposals || []).filter(p => p.status === "aceita").length;
  const onboardingPendente = (onboarding || []).filter((o: any) => o.status !== "concluido").length;

  const totalRevMonth = (revenue.data || []).filter((r: any) => r.competency === currentMonth).reduce((s: number, r: any) => s + Number(r.gross_volume), 0);
  const totalCommMonth = (commissions.data || []).filter((c: any) => c.competency === currentMonth).reduce((s: number, c: any) => s + Number(c.commission_value), 0);

  // Evolution chart (last 6 months of commissions)
  const evolutionData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return months.map(m => {
      const rev = (revenue.data || []).filter((r: any) => r.competency === m).reduce((s: number, r: any) => s + Number(r.gross_volume), 0);
      const com = (commissions.data || []).filter((c: any) => c.competency === m).reduce((s: number, c: any) => s + Number(c.commission_value), 0);
      return { name: m.slice(5) + "/" + m.slice(2, 4), Faturamento: rev, Comissão: com };
    });
  }, [revenue.data, commissions.data]);

  // Top clients
  const topClients = useMemo(() => {
    const map: Record<string, { name: string; total: number }> = {};
    (revenue.data || []).forEach((r: any) => {
      const id = r.card_client_id;
      if (!map[id]) map[id] = { name: r.card_clients?.name || "—", total: 0 };
      map[id].total += Number(r.gross_volume);
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [revenue.data]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  const kpis = [
    { label: "Faturamento Mês", value: fmt(totalRevMonth), icon: DollarSign, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Comissão Prevista", value: fmt(totalCommMonth), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Leads", value: leads, icon: Users, color: "text-amber-500", bg: "bg-amber-500/10", onClick: () => navigate("/cartoes/clientes") },
    { label: "Aceitas (mês)", value: propostasAceitas, icon: FileText, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { label: "Onboarding Pendente", value: onboardingPendente, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Dashboard — Cartões" subtitle={`${ativos} clientes ativos · ${(clients || []).length} total`} />

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {kpis.map((k, i) => (
          <Card key={i} className="neon-border cursor-pointer hover:shadow-md transition-shadow" onClick={k.onClick}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${k.bg}`}><k.icon className={`h-5 w-5 ${k.color}`} /></div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8 neon-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <RechartsTooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="Faturamento" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Comissão" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 neon-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Clientes por Faturamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topClients.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>}
            {topClients.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-sm font-medium truncate">{c.name}</span>
                </div>
                <span className="text-sm font-semibold">{fmt(c.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
