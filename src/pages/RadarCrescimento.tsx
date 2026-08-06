import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Rocket, TrendingUp, TrendingDown, DollarSign, Users, Percent, Target, Sparkles, CheckCircle2
} from "lucide-react";
import { useReceita } from "@/contexts/ReceitaContext";
import { useApp } from "@/contexts/AppContext";
import { GrowthGoals } from "@/components/inteligencia/GrowthGoals";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function RadarCrescimento() {
  const { clientesReceita } = useReceita();
  const { clientes } = useApp();

  const { tecnicoAtualId } = useApp();

  const { data: conversionMetrics } = useQuery({
    queryKey: ["recovery_plans_conversion", tecnicoAtualId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recovery_plans")
        .select("conversion_status, risk_type");
      if (error) throw error;
      return data || [];
    }
  });

  const conversionStats = useMemo(() => {
    if (!conversionMetrics) return [];
    const statusMap: Record<string, { total: number; converted: number }> = {};
    
    conversionMetrics.forEach(m => {
      if (!statusMap[m.risk_type]) statusMap[m.risk_type] = { total: 0, converted: 0 };
      statusMap[m.risk_type].total++;
      if (m.conversion_status === 'concluido') statusMap[m.risk_type].converted++;
    });

    return Object.entries(statusMap).map(([type, stats]) => ({
      name: type === 'inadimplencia' ? 'Inadimplência' : 'Churn',
      rate: (stats.converted / stats.total) * 100,
      total: stats.total,
      converted: stats.converted
    }));
  }, [conversionMetrics]);

  const metricas = useMemo(() => {
    const ativos = clientesReceita.filter(c => c.mensalidadeAtiva);
    const mrr = ativos.reduce((s, c) => s + c.valorMensalidade, 0);
    const cancelados = clientesReceita.filter(c => c.statusCliente === "cancelado").length;
    const total = clientesReceita.length || 1;
    const churnPct = (cancelados / total) * 100;
    const retencaoPct = 100 - churnPct;
    const ticket = ativos.length > 0 ? mrr / ativos.length : 0;
    const custos = clientesReceita.filter(c => c.custoAtivo).reduce((s, c) => s + c.valorCustoMensal, 0);
    const margem = mrr - custos;
    
    const totalPlans = conversionStats.reduce((s, c) => s + c.total, 0);
    const totalConverted = conversionStats.reduce((s, c) => s + c.converted, 0);
    const avgConversion = totalPlans > 0 ? (totalConverted / totalPlans) * 100 : 0;

    return { mrr, churnPct, retencaoPct, ticket, margem, ativos: ativos.length, cancelados, avgConversion };
  }, [clientesReceita, conversionStats]);

  const kpiCards = [
    { label: "MRR Atual", value: fmt(metricas.mrr), icon: DollarSign, color: "text-success" },
    { label: "Churn", value: `${metricas.churnPct.toFixed(1)}%`, icon: TrendingDown, color: "text-destructive" },
    { label: "Retenção", value: `${metricas.retencaoPct.toFixed(1)}%`, icon: Users, color: "text-primary" },
    { label: "Ticket Médio", value: fmt(metricas.ticket), icon: TrendingUp, color: "text-info" },
    { label: "Sucesso IA", value: `${metricas.avgConversion.toFixed(1)}%`, icon: Sparkles, color: "text-purple" },
    { label: "Margem", value: fmt(metricas.margem), icon: Percent, color: metricas.margem >= 0 ? "text-success" : "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Radar de Crescimento"
        subtitle="Métricas estratégicas para crescer mais rápido"
        icon={Rocket}
        iconClassName="text-success"
      />
      <ModuleNavGrid moduleId="inteligencia" />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {kpiCards.map(k => (
          <Card key={k.label} className="neon-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{k.label}</span>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className="text-xl font-bold tracking-tight">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="neon-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-purple">
              <Sparkles className="h-4 w-4" /> Taxa de Conversão por Risco (Planos IA)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
            {conversionStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionStats} layout="vertical">
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 500 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border border-primary/20 p-2 rounded shadow-lg text-[10px]">
                            <p className="font-bold text-primary">{data.name}</p>
                            <p className="text-muted-foreground">Conversão: {data.rate.toFixed(1)}%</p>
                            <p className="text-muted-foreground">Executados: {data.total}</p>
                            <p className="text-success">Sucesso: {data.converted}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={24}>
                    {conversionStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#8B5CF6" : "#A78BFA"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">
                Aguardando execução de planos IA para gerar métricas...
              </div>
            )}
          </CardContent>
        </Card>

        <GrowthGoals />
      </div>
    </div>
  );
}
