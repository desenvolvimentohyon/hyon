import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from "recharts";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { exportDREPDF } from "@/lib/pdfRelatorioFinanceiro";
import { toast } from "sonner";
import { fmt, fmtPct, C } from "./helpers";

export function DRETab({ titulos, planoContas }: any) {
  const dreData = useMemo(() => {
    const months: { mes: string; receitas: number; repasses: number; despesas: number; impostos: number; lucro: number; margem: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const mesTitulos = titulos.filter((t: any) => t.competenciaMes === key && t.status === "pago");
      
      const receitas = mesTitulos.filter((t: any) => t.tipo === "receber").reduce((s: number, t: any) => s + t.valorOriginal, 0);
      const repasses = mesTitulos.filter((t: any) => t.origem === "repasse" || t.origem === "comissao_parceiro").reduce((s: number, t: any) => s + t.valorOriginal, 0);
      const despesas = mesTitulos.filter((t: any) => t.origem === "despesa_operacional").reduce((s: number, t: any) => s + t.valorOriginal, 0);
      const impostos = mesTitulos.filter((t: any) => t.origem === "imposto").reduce((s: number, t: any) => s + t.valorOriginal, 0);
      
      const lucro = receitas - repasses - despesas - impostos;
      const margem = receitas > 0 ? (lucro / receitas) * 100 : 0;
      
      months.push({ mes: label, receitas, repasses, despesas, impostos, lucro, margem });
    }
    return months;
  }, [titulos]);

  const handleExportDRE = () => {
    exportDREPDF(dreData);
    toast.success("Relatório DRE exportado com sucesso!");
  };

  const kpis = useMemo(() => {
    const ultimo = dreData[dreData.length - 1];
    const penultimo = dreData[dreData.length - 2];
    const crescLucro = penultimo?.lucro !== 0 ? ((ultimo.lucro - penultimo.lucro) / Math.abs(penultimo.lucro)) * 100 : 0;
    return { ultimo, crescLucro };
  }, [dreData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Receita Líquida (Mês)", value: fmt(kpis.ultimo.receitas), color: "text-info", bg: "bg-info/5" },
          { label: "Total Despesas (Mês)", value: fmt(kpis.ultimo.despesas + kpis.ultimo.repasses + kpis.ultimo.impostos), color: "text-destructive", bg: "bg-destructive/5" },
          { label: "Lucro Líquido (Mês)", value: fmt(kpis.ultimo.lucro), color: "text-success", bg: "bg-success/5" },
          { label: "Margem Líquida", value: fmtPct(kpis.ultimo.margem), color: "text-primary", bg: "bg-primary/5" },
        ].map(k => (
          <Card key={k.label} className={cn("p-5 border-none shadow-sm transition-all hover:shadow-md", k.bg)}>
            <p className="text-[11px] text-muted-foreground uppercase font-bold mb-1.5 tracking-wider">{k.label}</p>
            <p className={cn("text-2xl font-bold tracking-tight", k.color)}>{k.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Histórico de Performance (12 meses)</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportDRE} className="h-8 gap-1">
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={dreData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="receitas" name="Receitas" fill={C.receita} radius={[2, 2, 0, 0]} />
              <Bar dataKey="repasses" name="Repasses" fill={C.despesa} radius={[2, 2, 0, 0]} />
              <Bar dataKey="despesas" name="Op. Expen." fill={C.atraso} radius={[2, 2, 0, 0]} />
              <Bar dataKey="impostos" name="Impostos" fill={C.imposto} radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="lucro" name="Lucro Líquido" stroke={C.lucro} strokeWidth={3} dot={{ r: 4, fill: C.lucro }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="table-scroll">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[100px]">Mês</TableHead>
                  <TableHead className="text-right">Receitas</TableHead>
                  <TableHead className="text-right">Custo/Repasse</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead className="text-right">Impostos</TableHead>
                  <TableHead className="text-right font-bold">Lucro</TableHead>
                  <TableHead className="text-center">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...dreData].reverse().map(d => (
                  <TableRow key={d.mes} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="font-semibold text-xs uppercase">{d.mes}</TableCell>
                    <TableCell className="text-right text-sm text-info font-medium">{fmt(d.receitas)}</TableCell>
                    <TableCell className="text-right text-sm text-destructive/80">{fmt(d.repasses)}</TableCell>
                    <TableCell className="text-right text-sm text-warning/80">{fmt(d.despesas)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{fmt(d.impostos)}</TableCell>
                    <TableCell className={`text-right text-sm font-bold ${d.lucro >= 0 ? "text-success" : "text-destructive"}`}>{fmt(d.lucro)}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant={d.margem > 30 ? "success" : d.margem > 10 ? "secondary" : "destructive"} className="text-[10px] font-bold">
                         {fmtPct(d.margem)}
                       </Badge>
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

