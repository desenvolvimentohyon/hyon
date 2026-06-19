import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fmt, fmtPct, C } from "./helpers";

export function LucratividadeTab({ clientesReceita, titulos }: any) {
  const ranking = useMemo(() => {
    return clientesReceita
      .filter((c: any) => c.mensalidadeAtiva)
      .map((c: any) => ({
        nome: c.nome,
        sistema: c.sistemaPrincipal,
        receita: c.valorMensalidade,
        custo: c.valorCustoMensal,
        margem: c.valorMensalidade - c.valorCustoMensal,
        margemPct: c.valorMensalidade > 0 ? ((c.valorMensalidade - c.valorCustoMensal) / c.valorMensalidade) * 100 : 0,
      }))
      .sort((a: any, b: any) => b.margem - a.margem);
  }, [clientesReceita]);

  const porSistema = useMemo(() => {
    const sys: Record<string, { receita: number; custo: number }> = {};
    clientesReceita.filter((c: any) => c.mensalidadeAtiva).forEach((c: any) => {
      if (!sys[c.sistemaPrincipal]) sys[c.sistemaPrincipal] = { receita: 0, custo: 0 };
      sys[c.sistemaPrincipal].receita += c.valorMensalidade;
      sys[c.sistemaPrincipal].custo += c.valorCustoMensal;
    });
    return Object.entries(sys).map(([name, v]) => ({ name, ...v, margem: v.receita - v.custo }));
  }, [clientesReceita]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-sm">Margem por Sistema</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porSistema}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="receita" name="Receita" fill={C.receita} />
              <Bar dataKey="custo" name="Custo" fill={C.despesa} />
              <Bar dataKey="margem" name="Margem" fill={C.lucro} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Ranking de Clientes por Margem</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.slice(0, 20).map((r: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                  <TableCell className="font-medium text-sm">{r.nome}</TableCell>
                  <TableCell className="text-sm">{r.sistema}</TableCell>
                  <TableCell className="text-right text-sm text-info">{fmt(r.receita)}</TableCell>
                  <TableCell className="text-right text-sm text-destructive">{fmt(r.custo)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold text-success">{fmt(r.margem)}</TableCell>
                  <TableCell className="text-right text-sm">{fmtPct(r.margemPct)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
