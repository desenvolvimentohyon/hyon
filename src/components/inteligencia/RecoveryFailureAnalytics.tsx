import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/contexts/AppContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { AlertTriangle, TrendingDown, Download, Filter, DollarSign, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Severity = 'baixo' | 'medio' | 'alto' | 'todos';

export function RecoveryFailureAnalytics() {
  const { tecnicoAtualId } = useApp();
  const { clientesReceita } = useReceita();
  const [filterSeverity, setFilterSeverity] = useState<Severity>('todos');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["recovery_failure_analytics", tecnicoAtualId, filterSeverity],
    queryFn: async () => {
      let query = supabase
        .from("recovery_plans")
        .select("failure_reason, risk_type, conversion_status, severity, source_insight, created_at, client_id")
        .eq("conversion_status", "abortado");
      
      if (filterSeverity !== 'todos') {
        query = query.eq('severity', filterSeverity);
      }
      
      const { data: plans, error: plansError } = await query;
      
      if (plansError) throw plansError;
      return plans || [];
    }
  });

  const exportPDF = () => {
    if (!analytics || analytics.length === 0) return;
    
    const doc = new jsPDF();
    doc.text("Relatório de Falhas Estratégicas - Hyon IA", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Filtro Gravidade: ${filterSeverity.toUpperCase()}`, 14, 27);

    const tableData = analytics.map(p => {
      const client = clientesReceita.find(c => c.id === p.client_id);
      return [
        new Date(p.created_at).toLocaleDateString(),
        client?.nome || 'Cliente não encontrado',
        p.risk_type === 'inadimplencia' ? 'Inadimplência' : 'Churn',
        (p as any).severity?.toUpperCase() || 'MÉDIO',
        p.failure_reason || 'N/A',
        p.source_insight?.substring(0, 40) + '...'
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['Data', 'Cliente', 'Tipo', 'Gravidade', 'Motivo', 'Insight Origem']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }
    });

    doc.save(`falhas-ia-${filterSeverity}-${Date.now()}.pdf`);
  };

  if (isLoading || !analytics) return null;

  const failureReasons = analytics.reduce((acc: any[], plan) => {
    const reason = plan.failure_reason || "Sem motivo";
    const existing = acc.find(a => a.name === reason);
    if (existing) existing.value++;
    else acc.push({ name: reason, value: 1 });
    return acc;
  }, []);

  const riskImpact = analytics.reduce((acc: any[], plan) => {
    const type = plan.risk_type === 'inadimplencia' ? 'Inadimplência' : 'Churn';
    const existing = acc.find(a => a.name === type);
    if (existing) existing.value++;
    else acc.push({ name: type, value: 1 });
    return acc;
  }, []);

  // Conversão Financeira por Gravidade
  const financialLossBySeverity = analytics.reduce((acc: any[], plan) => {
    const severity = (plan as any).severity || 'medio';
    const client = clientesReceita.find(c => c.id === plan.client_id);
    const value = client?.valorMensalidade || 0;
    
    const labelMap: Record<string, string> = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' };
    const name = labelMap[severity] || 'Médio';
    
    const existing = acc.find(a => a.name === name);
    if (existing) existing.value += value;
    else acc.push({ name, value });
    return acc;
  }, []).sort((a, b) => {
    const order = { 'Alto': 0, 'Médio': 1, 'Baixo': 2 };
    return (order as any)[a.name] - (order as any)[b.name];
  });

  const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <div className="flex gap-1">
            {(['todos', 'baixo', 'medio', 'alto'] as Severity[]).map((s) => (
              <Button
                key={s}
                variant={filterSeverity === s ? "default" : "outline"}
                size="sm"
                className="h-6 text-[9px] px-2 capitalize"
                onClick={() => setFilterSeverity(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 text-[10px] gap-2 border-primary/20 hover:bg-primary/5"
          onClick={exportPDF}
          disabled={analytics.length === 0}
        >
          <Download className="h-3 w-3" /> Exportar PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Motivos de Falha */}
        <Card className="neon-border border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-semibold flex items-center gap-2 text-destructive uppercase tracking-wider">
              <AlertTriangle className="h-3 w-3" /> Motivos de Falha
              <Badge variant="outline" className="text-[8px] ml-auto">{analytics.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[150px]">
            {analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={failureReasons}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {failureReasons.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '9px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversão Financeira (Impacto Real) */}
        <Card className="neon-border border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-semibold flex items-center gap-2 text-primary uppercase tracking-wider">
              <DollarSign className="h-3 w-3" /> Perda por Gravidade
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[150px]">
            {financialLossBySeverity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialLossBySeverity} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={40} style={{ fontSize: '8px' }} />
                  <Tooltip 
                    formatter={(value: number) => fmt(value)}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '9px' }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground">
                Sem impacto
              </div>
            )}
          </CardContent>
        </Card>

        {/* Impacto por Risco */}
        <Card className="neon-border border-purple/20 bg-purple/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-semibold flex items-center gap-2 text-purple uppercase tracking-wider">
              <Activity className="h-3 w-3" /> Mix de Risco
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[150px]">
            {analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskImpact}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '9px' }}
                  />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
