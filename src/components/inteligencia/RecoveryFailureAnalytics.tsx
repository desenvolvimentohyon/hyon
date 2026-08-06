import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/contexts/AppContext";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis
} from "recharts";
import { AlertTriangle, TrendingDown } from "lucide-react";

export function RecoveryFailureAnalytics() {
  const { tecnicoAtualId } = useApp();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["recovery_failure_analytics", tecnicoAtualId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recovery_plans")
        .select("failure_reason, risk_type, conversion_status")
        .eq("conversion_status", "abortado");
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading || !analytics || analytics.length === 0) return null;

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
    <div className="grid gap-4 md:grid-cols-2 mt-4">
      <Card className="neon-border border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-semibold flex items-center gap-2 text-destructive uppercase tracking-wider">
            <AlertTriangle className="h-3 w-3" /> Motivos de Falha (IA)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[150px]">
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
        </CardContent>
      </Card>

      <Card className="neon-border border-purple/20 bg-purple/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-semibold flex items-center gap-2 text-purple uppercase tracking-wider">
            <TrendingDown className="h-3 w-3" /> Impacto por Risco
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[150px]">
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
        </CardContent>
      </Card>
    </div>
  );
}
