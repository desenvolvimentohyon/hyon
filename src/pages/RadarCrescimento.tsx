import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { Card, CardContent } from "@/components/ui/card";
import {
  Rocket, TrendingUp, TrendingDown, DollarSign, Users, Percent,
} from "lucide-react";
import { useReceita } from "@/contexts/ReceitaContext";
import { useApp } from "@/contexts/AppContext";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function RadarCrescimento() {
  const { clientesReceita } = useReceita();
  const { clientes } = useApp();

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
    return { mrr, churnPct, retencaoPct, ticket, margem, ativos: ativos.length, cancelados };
  }, [clientesReceita]);

  const kpiCards = [
    { label: "MRR Atual", value: fmt(metricas.mrr), icon: DollarSign, color: "text-success" },
    { label: "Churn", value: `${metricas.churnPct.toFixed(1)}%`, icon: TrendingDown, color: "text-destructive" },
    { label: "Retenção", value: `${metricas.retencaoPct.toFixed(1)}%`, icon: Users, color: "text-primary" },
    { label: "Ticket Médio", value: fmt(metricas.ticket), icon: TrendingUp, color: "text-info" },
    { label: "Margem", value: fmt(metricas.margem), icon: Percent, color: metricas.margem >= 0 ? "text-success" : "text-destructive" },
    { label: "Clientes Ativos", value: String(metricas.ativos), icon: Users, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Radar de Crescimento"
        subtitle="Métricas estratégicas para crescer mais rápido"
        icon={Rocket}
        iconClassName="text-success"
      />
      <ModuleNavGrid moduleId="dashboard" />

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
    </div>
  );
}
