import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Heart, TrendingUp, Shield, Zap, Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function MrrLabel({ children }: { children: string }) {
  const tooltips: Record<string, string> = {
    "MRR Atual": "MRR — Monthly Recurring Revenue\nReceita recorrente mensal dos clientes ativos.",
    "Crescimento MRR": "Crescimento MRR\nVariação percentual do MRR em relação ao mês anterior.",
    "Reajuste Este Mês": "Reajuste contratual\nImpacto dos reajustes aplicados no mês corrente.",
  };
  const tip = tooltips[children];
  if (!tip) return <span>{children}</span>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="border-b border-dashed border-muted-foreground/40 cursor-help">{children}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-pre-line text-xs">{tip}</TooltipContent>
    </Tooltip>
  );
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface OverdueClient { name: string; days_late: number; value: number }
interface CertExpiring { name: string; days_remaining: number }
interface HealthClient { name: string; health_score: number; health_status: string }
interface UpsellItem { client_name: string; module_name: string; status: string }
interface CommissionStats { totalAPagar: number; totalPago: number; geradoMes: number; recorrentePrevista: number; ranking: { name: string; total: number }[] }

export default function DashboardExecutiveWidgets() {
  const [loading, setLoading] = useState(true);
  const [overdueClients, setOverdueClients] = useState<OverdueClient[]>([]);
  const [certExpiring, setCertExpiring] = useState<CertExpiring[]>([]);
  const [healthRed, setHealthRed] = useState<HealthClient[]>([]);
  const [upsellItems, setUpsellItems] = useState<UpsellItem[]>([]);
  const [mrrAdjusted, setMrrAdjusted] = useState(0);
  const [mrrGrowth, setMrrGrowth] = useState({ current: 0, previous: 0 });
  const [commissions, setCommissions] = useState<CommissionStats>({ totalAPagar: 0, totalPago: 0, geradoMes: 0, recorrentePrevista: 0, ranking: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // 1. Clients with 7+ days overdue titles
      const { data: overdueTitles } = await supabase
        .from("financial_titles")
        .select("client_id, due_at, value_original, value_final")
        .eq("type", "receber")
        .eq("status", "vencido")
        .not("client_id", "is", null);

      if (overdueTitles) {
        const clientMap = new Map<string, { days: number; value: number }>();
        overdueTitles.forEach(t => {
          if (!t.due_at || !t.client_id) return;
          const daysLate = Math.ceil((today.getTime() - new Date(t.due_at).getTime()) / (1000 * 60 * 60 * 24));
          if (daysLate >= 7) {
            const existing = clientMap.get(t.client_id);
            if (!existing || daysLate > existing.days) {
              clientMap.set(t.client_id, { days: daysLate, value: t.value_final || t.value_original });
            }
          }
        });

        if (clientMap.size > 0) {
          const { data: clients } = await supabase
            .from("clients")
            .select("id, name")
            .in("id", Array.from(clientMap.keys()));

          if (clients) {
            setOverdueClients(
              clients.map(c => ({
                name: c.name,
                days_late: clientMap.get(c.id)!.days,
                value: clientMap.get(c.id)!.value,
              })).sort((a, b) => b.days_late - a.days_late).slice(0, 10)
            );
          }
        }
      }

      // 2. Certificates expiring in 15 days
      const fifteenDaysFromNow = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: certClients } = await supabase
        .from("clients")
        .select("name, cert_expires_at")
        .not("cert_expires_at", "is", null)
        .lte("cert_expires_at", fifteenDaysFromNow)
        .eq("status", "ativo");

      if (certClients) {
        setCertExpiring(
          certClients.map(c => ({
            name: c.name,
            days_remaining: Math.ceil((new Date(c.cert_expires_at!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
          })).sort((a, b) => a.days_remaining - b.days_remaining)
        );
      }

      // 3. Health score red
      const { data: redClients } = await supabase
        .from("clients")
        .select("name, health_score, health_status")
        .eq("health_status", "vermelho")
        .eq("status", "ativo")
        .order("health_score", { ascending: true })
        .limit(5);

      if (redClients) setHealthRed(redClients);

      // 4. MRR with adjustments this month
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      const { data: adjustments } = await supabase
        .from("contract_adjustments")
        .select("new_value, old_value")
        .gte("applied_at", monthStart);

      if (adjustments) {
        setMrrAdjusted(adjustments.reduce((s, a) => s + (a.new_value - a.old_value), 0));
      }

      // 5. MRR growth
      const { data: activeClients } = await supabase
        .from("clients")
        .select("monthly_value_final, created_at")
        .eq("status", "ativo")
        .eq("recurrence_active", true);

      if (activeClients) {
        const currentMrr = activeClients.reduce((s, c) => s + c.monthly_value_final, 0);
        // Approximate previous month MRR (current minus new clients this month)
        const newThisMonth = activeClients.filter(c => c.created_at >= monthStart);
        const prevMrr = currentMrr - newThisMonth.reduce((s, c) => s + c.monthly_value_final, 0);
        setMrrGrowth({ current: currentMrr, previous: prevMrr || currentMrr });
      }

      // 6. Commissions (partners)
      const { data: commTitles } = await supabase
        .from("financial_titles")
        .select("partner_id, value_original, status, created_at")
        .eq("origin", "comissao_parceiro");

      if (commTitles && commTitles.length > 0) {
        const totalAPagar = commTitles.filter(t => t.status === "aberto" || t.status === "parcial").reduce((s, t) => s + t.value_original, 0);
        const totalPago = commTitles.filter(t => t.status === "pago").reduce((s, t) => s + t.value_original, 0);
        const geradoMes = commTitles.filter(t => t.created_at >= monthStart).reduce((s, t) => s + t.value_original, 0);

        // Ranking by partner
        const partnerTotals = new Map<string, number>();
        commTitles.forEach(t => {
          if (!t.partner_id) return;
          partnerTotals.set(t.partner_id, (partnerTotals.get(t.partner_id) || 0) + t.value_original);
        });
        const partnerIds = Array.from(partnerTotals.keys());
        let ranking: { name: string; total: number }[] = [];
        if (partnerIds.length > 0) {
          const { data: pNames } = await supabase.from("partners").select("id, name").in("id", partnerIds);
          const nameMap = new Map((pNames || []).map(p => [p.id, p.name]));
          ranking = Array.from(partnerTotals.entries())
            .map(([id, total]) => ({ name: nameMap.get(id) || "—", total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
        }
        setCommissions({ totalAPagar, totalPago, geradoMes, recorrentePrevista: 0, ranking });
      }

      // 7. Upsell suggestions
      const { data: upsells } = await supabase
        .from("upsell_suggestions")
        .select("client_id, suggested_module_id, status")
        .eq("status", "pendente")
        .limit(5);

      if (upsells && upsells.length > 0) {
        const clientIds = [...new Set(upsells.map(u => u.client_id))];
        const moduleIds = [...new Set(upsells.filter(u => u.suggested_module_id).map(u => u.suggested_module_id!))];

        const [{ data: uClients }, { data: uModules }] = await Promise.all([
          supabase.from("clients").select("id, name").in("id", clientIds),
          moduleIds.length > 0 ? supabase.from("system_modules").select("id, name").in("id", moduleIds) : { data: [] },
        ]);

        const clientNameMap = new Map((uClients || []).map(c => [c.id, c.name]));
        const moduleNameMap = new Map((uModules || []).map(m => [m.id, m.name]));

        setUpsellItems(upsells.map(u => ({
          client_name: clientNameMap.get(u.client_id) || "—",
          module_name: u.suggested_module_id ? (moduleNameMap.get(u.suggested_module_id) || "—") : "—",
          status: u.status,
        })));
      }
    } catch (err) {
      console.error("Error loading executive widgets:", err);
    }
    setLoading(false);
  };

  const mrrGrowthPercent = mrrGrowth.previous > 0
    ? ((mrrGrowth.current - mrrGrowth.previous) / mrrGrowth.previous * 100).toFixed(1)
    : "0.0";

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Painel Executivo</h2>

      {/* MRR row */}
      <TooltipProvider delayDuration={200}>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase"><MrrLabel>MRR Atual</MrrLabel></CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold text-primary">{fmt(mrrGrowth.current)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase"><MrrLabel>Crescimento MRR</MrrLabel></CardTitle></CardHeader>
            <CardContent>
              <p className={`text-xl font-bold ${Number(mrrGrowthPercent) >= 0 ? "text-green-600" : "text-destructive"}`}>
                {Number(mrrGrowthPercent) >= 0 ? "+" : ""}{mrrGrowthPercent}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase"><MrrLabel>Reajuste Este Mês</MrrLabel></CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold text-primary">{mrrAdjusted > 0 ? `+${fmt(mrrAdjusted)}` : fmt(0)}</p></CardContent>
          </Card>
        </div>
      </TooltipProvider>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Overdue 7+ */}
        {overdueClients.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Atraso 7+ dias ({overdueClients.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdueClients.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{c.name}</span>
                    <Badge variant="destructive" className="text-[10px]">{c.days_late}d</Badge>
                    <span className="text-xs font-medium">{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates expiring */}
        {certExpiring.length > 0 && (
          <Card className="border-orange-300/50">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-orange-500" /> Certificados Vencendo ({certExpiring.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {certExpiring.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{c.name}</span>
                    <Badge variant={c.days_remaining <= 0 ? "destructive" : "secondary"} className="text-[10px]">
                      {c.days_remaining <= 0 ? `Vencido ${Math.abs(c.days_remaining)}d` : `${c.days_remaining}d`}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health red */}
        {healthRed.length > 0 && (
          <Card className="border-red-300/50">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-red-500" /> Saúde Crítica ({healthRed.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {healthRed.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{c.name}</span>
                    <Badge variant="destructive" className="text-[10px]">Score: {c.health_score}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upsell */}
        {upsellItems.length > 0 && (
          <Card className="border-green-300/50">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" /> Oportunidades de Upsell ({upsellItems.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upsellItems.map((u, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{u.client_name}</span>
                    <Badge variant="outline" className="text-[10px]">{u.module_name}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comissões de Parceiros */}
      {(commissions.totalAPagar > 0 || commissions.totalPago > 0 || commissions.ranking.length > 0) && (
        <>
          <h3 className="text-sm font-bold flex items-center gap-2 mt-4"><Handshake className="h-4 w-4 text-primary" /> Comissões de Parceiros</h3>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">A Pagar</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-destructive">{fmt(commissions.totalAPagar)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Pago</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-green-600">{fmt(commissions.totalPago)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Gerado Este Mês</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-primary">{fmt(commissions.geradoMes)}</p></CardContent>
            </Card>
          </div>
          {commissions.ranking.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Top Parceiros por Comissão</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {commissions.ranking.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-[10px] w-6 justify-center">{i + 1}</Badge>
                      <span className="flex-1 truncate">{r.name}</span>
                      <span className="font-semibold">{fmt(r.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
