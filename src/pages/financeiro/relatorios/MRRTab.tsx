import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Download } from "lucide-react";
import { exportMRRPDF } from "@/lib/pdfRelatorioFinanceiro";
import { toast } from "sonner";
import { fmt, fmtPct, C } from "./helpers";

export function MRRTab({ clientesReceita, titulos }: any) {
  const ativos = clientesReceita.filter((c: any) => c.mensalidadeAtiva);
  const mrr = ativos.reduce((s: number, c: any) => s + c.valorMensalidade, 0);
  const arr = mrr * 12;
  const ticket = ativos.length > 0 ? mrr / ativos.length : 0;
  const cancelados = clientesReceita.filter((c: any) => c.statusCliente === "cancelado").length;
  const churn = clientesReceita.length > 0 ? (cancelados / clientesReceita.length) * 100 : 0;
  const ltv = churn > 0 ? ticket / (churn / 100) : ticket * 100;

  const mrrPorSistema = useMemo(() => {
    const sys: Record<string, number> = {};
    ativos.forEach((c: any) => { sys[c.sistemaPrincipal] = (sys[c.sistemaPrincipal] || 0) + c.valorMensalidade; });
    return Object.entries(sys).map(([name, value]) => ({ name, value }));
  }, [ativos]);

  const pieCols = [C.receita, C.conciliacao, C.atraso, C.lucro, C.despesa];

  const ativosEmDia = clientesReceita.filter((c: any) => c.statusCliente === "ativo" && c.mensalidadeAtiva);
  const ativosAtraso = clientesReceita.filter((c: any) => c.statusCliente === "atraso" && c.mensalidadeAtiva);
  const mrrEmDia = ativosEmDia.reduce((s: number, c: any) => s + c.valorMensalidade, 0);
  const mrrAtraso = ativosAtraso.reduce((s: number, c: any) => s + c.valorMensalidade, 0);

  const handleExportMRR = () => {
    exportMRRPDF({
      mrr, arr, ticket, churn, ltv,
      porSistema: mrrPorSistema,
      ativosEmDia: ativosEmDia.length,
      ativosAtraso: ativosAtraso.length,
      mrrEmDia, mrrAtraso,
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "MRR", value: fmt(mrr) },
          { label: "ARR", value: fmt(arr) },
          { label: "Ticket Médio", value: fmt(ticket) },
          { label: "Churn Rate", value: fmtPct(churn) },
          { label: "LTV", value: fmt(ltv) },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{k.label}</p><p className="text-lg font-bold text-foreground">{k.value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">MRR por Sistema</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={mrrPorSistema} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {mrrPorSistema.map((_, i) => <Cell key={i} fill={pieCols[i % pieCols.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">MRR por Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { status: "Em dia", valor: mrrEmDia },
                { status: "Atraso", valor: mrrAtraso },
              ]}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
