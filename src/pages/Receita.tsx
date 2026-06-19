import { useState, useMemo } from "react";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RECEITA_COLORS } from "@/types/receita";
import { useParametros } from "@/contexts/ParametrosContext";
import {
  DollarSign, Users, TrendingUp, TrendingDown, Percent, Activity,
  BarChart3, PieChartIcon, FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { gerarRelatorioPDF } from "@/lib/pdfRelatorioReceita";
import { toast } from "sonner";

import { fmt, fmtShort, useReceitaMetricas } from "./receita/useReceitaMetricas";
import { ReceitaCharts } from "./receita/ReceitaCharts";

export default function Receita() {
  const { clientesReceita, suporteEventos, loading } = useReceita();
  const { sistemas: sistemaCatalogo } = useParametros();
  const [periodo, setPeriodo] = useState<string>("12m");

  const activeSystemNames = useMemo(() => sistemaCatalogo.filter(s => s.ativo).map(s => s.nome), [sistemaCatalogo]);
  const data = useReceitaMetricas(clientesReceita, suporteEventos, activeSystemNames);
  const { metricas, churnLabel, margemLabel } = data;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Clientes Ativos", value: metricas.ativosCount.toString(), icon: Users, color: RECEITA_COLORS.statusAtivo, sub: `de ${metricas.totalClientes} total` },
    { label: "MRR", value: fmt(metricas.mrr), icon: DollarSign, color: RECEITA_COLORS.receita, sub: "Receita Mensal Recorrente" },
    { label: "ARR", value: fmt(metricas.arr), icon: TrendingUp, color: RECEITA_COLORS.receita, sub: "Receita Anual Recorrente" },
    { label: "Ticket Médio", value: fmt(metricas.ticket), icon: Activity, color: RECEITA_COLORS.receita, sub: "MRR ÷ Ativos" },
    { label: "Churn Rate (12m)", value: `${fmtShort(metricas.churnRate)}%`, icon: TrendingDown, color: RECEITA_COLORS.churn, sub: churnLabel.text, subColor: churnLabel.color },
    { label: "LTV", value: fmt(metricas.ltv), icon: BarChart3, color: RECEITA_COLORS.receita, sub: "Valor Vitalício" },
    { label: "Custos Mensais", value: fmt(metricas.custosTotal), icon: Percent, color: RECEITA_COLORS.custos, sub: "Total de custos ativos" },
    { label: "Margem Líquida", value: fmt(metricas.margem), icon: PieChartIcon, color: RECEITA_COLORS.margem, sub: `${fmtShort(metricas.margemPercent)}% — ${margemLabel.text}`, subColor: margemLabel.color },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={DollarSign}
        iconClassName="text-primary"
        title="Receita Recorrente"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                gerarRelatorioPDF(clientesReceita);
                toast.success("Relatório gerado! Use Ctrl+P / ⌘+P para salvar como PDF.");
              }}
            >
              <FileDown className="h-4 w-4 mr-1.5" />
              Exportar PDF
            </Button>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="12m">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
      <ModuleNavGrid moduleId="clientes" />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label} className="domain-border-left transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover" style={{ borderLeftColor: k.color }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-4 w-4" style={{ color: k.color }} />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{k.value}</div>
              <p className={`text-[11px] mt-0.5 ${(k as any).subColor || "text-muted-foreground"}`}>{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReceitaCharts data={data} />
    </div>
  );
}
