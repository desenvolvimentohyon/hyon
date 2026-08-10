import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Download } from "lucide-react";
import { exportMRRPDF } from "@/lib/pdfRelatorioFinanceiro";
import { toast } from "sonner";
import { fmt, fmtPct, C } from "./helpers";

export function MRRTab({ clientesReceita, titulos }: any) {
  const mrrData = useMemo(() => {
    const ativos = clientesReceita.filter((c: any) => c.mensalidadeAtiva && c.statusCliente === "ativo");
    const mrr = ativos.reduce((s: number, c: any) => s + c.valorMensalidade, 0);
    const arr = mrr * 12;
    const ticket = ativos.length > 0 ? mrr / ativos.length : 0;
    
    // Churn Rate (considerando cancelados nos últimos 12 meses)
    const umAnoAtras = new Date();
    umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
    const canceladosRecentes = clientesReceita.filter((c: any) => 
      c.statusCliente === "cancelado" && c.dataCancelamento && new Date(c.dataCancelamento) >= umAnoAtras
    ).length;
    
    const churn = ativos.length > 0 ? (canceladosRecentes / (ativos.length + canceladosRecentes)) * 100 : 0;
    const ltv = churn > 0 ? ticket / (churn / 100) : ticket * 120; // 10 anos default se churn for 0

    const ativosAtraso = clientesReceita.filter((c: any) => c.statusCliente === "atraso" && c.mensalidadeAtiva);
    const mrrAtraso = ativosAtraso.reduce((s: number, c: any) => s + c.valorMensalidade, 0);
    
    const sys: Record<string, number> = {};
    ativos.forEach((c: any) => { sys[c.sistemaPrincipal] = (sys[c.sistemaPrincipal] || 0) + c.valorMensalidade; });
    const porSistema = Object.entries(sys).map(([name, value]) => ({ name, value }));

    return { mrr, arr, ticket, churn, ltv, porSistema, ativosCount: ativos.length, ativosAtrasoCount: ativosAtraso.length, mrrAtraso };
  }, [clientesReceita]);

  const pieCols = [C.receita, C.conciliacao, C.atraso, C.lucro, C.despesa];

  const handleExportMRR = () => {
    exportMRRPDF({
      mrr: mrrData.mrr, arr: mrrData.arr, ticket: mrrData.ticket, churn: mrrData.churn, ltv: mrrData.ltv,
      porSistema: mrrData.porSistema,
      ativosEmDia: mrrData.ativosCount,
      ativosAtraso: mrrData.ativosAtrasoCount,
      mrrEmDia: mrrData.mrr, mrrAtraso: mrrData.mrrAtraso,
    });
    toast.success("Relatório MRR exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportMRR}>
          <Download className="h-4 w-4 mr-1" /> Exportar MRR (PDF)
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "MRR Total", value: fmt(mrrData.mrr), color: "text-info" },
          { label: "ARR (Anual)", value: fmt(mrrData.arr), color: "text-primary" },
          { label: "Ticket Médio", value: fmt(mrrData.ticket), color: "text-foreground" },
          { label: "Churn Rate", value: fmtPct(mrrData.churn), color: "text-destructive" },
          { label: "LTV Projetado", value: fmt(mrrData.ltv), color: "text-success" },
        ].map(k => (
          <Card key={k.label} className="p-5 border-none shadow-sm hover:shadow-md transition-all">
            <p className="text-[11px] text-muted-foreground uppercase font-bold mb-1.5 tracking-wider">{k.label}</p>
            <p className={cn("text-2xl font-bold tracking-tight", k.color)}>{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Participação no MRR por Sistema</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={mrrData.porSistema} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60}
                  outerRadius={100} 
                  paddingAngle={5}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {mrrData.porSistema.map((_, i) => <Cell key={i} fill={pieCols[i % pieCols.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Status da Base MRR</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { status: "Em dia", valor: mrrData.mrr, fill: C.lucro },
                { status: "Em atraso", valor: mrrData.mrrAtraso, fill: C.atraso },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="status" className="fill-muted-foreground" />
                <YAxis className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                   <Cell fill={C.lucro} />
                   <Cell fill={C.atraso} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
