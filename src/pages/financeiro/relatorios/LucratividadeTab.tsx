import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { fmt, fmtPct, C } from "./helpers";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function LucratividadeTab({ clientesReceita }: any) {
  const ranking = useMemo(() => {
    return clientesReceita
      .filter((c: any) => c.mensalidadeAtiva && c.statusCliente === "ativo")
      .map((c: any) => ({
        id: c.id,
        nome: c.nome,
        sistema: c.sistemaPrincipal,
        receita: c.valorMensalidade,
        custo: c.valorCustoMensal || 0,
        margem: c.valorMensalidade - (c.valorCustoMensal || 0),
        margemPct: c.valorMensalidade > 0 ? ((c.valorMensalidade - (c.valorCustoMensal || 0)) / c.valorMensalidade) * 100 : 0,
      }))
      .sort((a: any, b: any) => b.margem - a.margem);
  }, [clientesReceita]);

  const porSistema = useMemo(() => {
    const sys: Record<string, { receita: number; custo: number }> = {};
    ranking.forEach((r: any) => {
      if (!sys[r.sistema]) sys[r.sistema] = { receita: 0, custo: 0 };
      sys[r.sistema].receita += r.receita;
      sys[r.sistema].custo += r.custo;
    });
    return Object.entries(sys).map(([name, v]) => ({ name, ...v, margem: v.receita - v.custo }));
  }, [ranking]);

  const kpis = useMemo(() => {
    const totalReceita = ranking.reduce((s, r) => s + r.receita, 0);
    const totalCusto = ranking.reduce((s, r) => s + r.custo, 0);
    const totalMargem = totalReceita - totalCusto;
    const avgMargemPct = totalReceita > 0 ? (totalMargem / totalReceita) * 100 : 0;
    
    return { totalReceita, totalCusto, totalMargem, avgMargemPct };
  }, [ranking]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Receita Total Bruta", value: fmt(kpis.totalReceita), color: "text-foreground", bg: "bg-primary/5" },
          { label: "Custo Direto Total", value: fmt(kpis.totalCusto), color: "text-destructive", bg: "bg-destructive/5" },
          { label: "Margem de Contribuição", value: fmt(kpis.totalMargem), color: "text-success", bg: "bg-success/5" },
          { label: "Margem Média %", value: fmtPct(kpis.avgMargemPct), color: "text-info", bg: "bg-info/5" },
        ].map(k => (
          <Card key={k.label} className={cn("p-5 border-none shadow-sm hover:shadow-md transition-all", k.bg)}>
            <p className="text-[11px] text-muted-foreground uppercase font-bold mb-1.5 tracking-wider">{k.label}</p>
            <p className={cn("text-2xl font-bold tracking-tight", k.color)}>{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Distribuição de Margem por Sistema</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={porSistema} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="receita" name="Receita" fill={C.receita} radius={[4, 4, 0, 0]} />
                <Bar dataKey="custo" name="Custo" fill={C.despesa} radius={[4, 4, 0, 0]} />
                <Bar dataKey="margem" name="Margem" fill={C.lucro} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Top 5 Sistemas (Margem %)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {porSistema
              .sort((a, b) => (b.margem / b.receita) - (a.margem / a.receita))
              .slice(0, 5)
              .map((s: any) => {
                const pct = (s.margem / s.receita) * 100;
                return (
                  <div key={s.name} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold">{s.name}</span>
                      <span className="text-xs font-bold text-success">{fmtPct(pct)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="bg-success h-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            }
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Análise de Lucratividade por Cliente (Top 50)</CardTitle>
          <Badge variant="outline">{ranking.length} clientes ativos</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Margem Líquida</TableHead>
                  <TableHead className="text-center">% Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.slice(0, 50).map((r: any, i: number) => (
                  <TableRow key={r.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium text-sm">{r.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter">{r.sistema}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmt(r.receita)}</TableCell>
                    <TableCell className="text-right text-sm text-destructive/80 font-medium">{fmt(r.custo)}</TableCell>
                    <TableCell className={`text-right text-sm font-bold ${r.margem > 0 ? "text-success" : "text-destructive"}`}>
                      {fmt(r.margem)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {r.margemPct > 70 ? <TrendingUp className="h-3 w-3 text-success" /> : r.margemPct < 30 ? <TrendingDown className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3 text-muted-foreground" />}
                        <span className={`text-xs font-semibold ${r.margemPct > 50 ? "text-success" : "text-foreground"}`}>
                          {fmtPct(r.margemPct)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
