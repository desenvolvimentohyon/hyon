import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/contexts/AppContext";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis
} from "recharts";
import { AlertTriangle, TrendingDown, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Severity = 'baixo' | 'medio' | 'alto' | 'todos';

export function RecoveryFailureAnalytics() {
  const { tecnicoAtualId } = useApp();
  const [filterSeverity, setFilterSeverity] = useState<Severity>('todos');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["recovery_failure_analytics", tecnicoAtualId, filterSeverity],
    queryFn: async () => {
      let query = supabase
        .from("recovery_plans")
        .select("failure_reason, risk_type, conversion_status, severity, source_insight, created_at")
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

    const tableData = analytics.map(p => [
      new Date(p.created_at).toLocaleDateString(),
      p.risk_type === 'inadimplencia' ? 'Inadimplência' : 'Churn',
      (p as any).severity?.toUpperCase() || 'MÉDIO',
      p.failure_reason || 'N/A',
      p.source_insight?.substring(0, 50) + '...'
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Data', 'Tipo', 'Gravidade', 'Motivo', 'Insight Origem']],
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

  const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

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

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="neon-border border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-semibold flex items-center gap-2 text-destructive uppercase tracking-wider">
              <AlertTriangle className="h-3 w-3" /> Motivos de Falha (IA)
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
                Sem dados para este filtro
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="neon-border border-purple/20 bg-purple/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-semibold flex items-center gap-2 text-purple uppercase tracking-wider">
              <TrendingDown className="h-3 w-3" /> Impacto por Risco
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
                Sem dados para este filtro
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
