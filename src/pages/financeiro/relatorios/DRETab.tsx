import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from "recharts";
import { Download } from "lucide-react";
import { exportDREPDF } from "@/lib/pdfRelatorioFinanceiro";
import { toast } from "sonner";
import { fmt, C } from "./helpers";

export function DRETab({ titulos, planoContas }: any) {
  const dreData = useMemo(() => {
    const months: { mes: string; receitas: number; repasses: number; despesas: number; impostos: number; lucro: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const mesTitulos = titulos.filter((t: any) => t.competenciaMes === key && t.status === "pago");
      const receitas = mesTitulos.filter((t: any) => t.tipo === "receber").reduce((s: number, t: any) => s + t.valorOriginal, 0);
      const repasses = mesTitulos.filter((t: any) => t.origem === "repasse").reduce((s: number, t: any) => s + t.valorOriginal, 0);
      const despesas = mesTitulos.filter((t: any) => t.origem === "despesa_operacional").reduce((s: number, t: any) => s + t.valorOriginal, 0);
      const impostos = mesTitulos.filter((t: any) => t.origem === "imposto").reduce((s: number, t: any) => s + t.valorOriginal, 0);
      months.push({ mes: label, receitas, repasses, despesas, impostos, lucro: receitas - repasses - despesas - impostos });
    }
    return months;
  }, [titulos]);

  const handleExportDRE = () => {
    exportDREPDF(dreData);
    toast.success("Relatório DRE exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportDRE}>
          <Download className="h-4 w-4 mr-1" /> Exportar DRE (PDF)
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">DRE - Demonstrativo de Resultado (12 meses)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={dreData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill={C.receita} />
              <Bar dataKey="repasses" name="Repasses" fill={C.despesa} />
              <Bar dataKey="despesas" name="Despesas" fill={C.atraso} />
              <Bar dataKey="impostos" name="Impostos" fill={C.imposto} />
              <Line type="monotone" dataKey="lucro" name="Lucro" stroke={C.lucro} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Receitas</TableHead>
                <TableHead className="text-right">(-) Repasses</TableHead>
                <TableHead className="text-right">(-) Despesas</TableHead>
                <TableHead className="text-right">(-) Impostos</TableHead>
                <TableHead className="text-right font-bold">Lucro Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dreData.map(d => (
                <TableRow key={d.mes}>
                  <TableCell className="font-medium">{d.mes}</TableCell>
                  <TableCell className="text-right text-info">{fmt(d.receitas)}</TableCell>
                  <TableCell className="text-right text-destructive">{fmt(d.repasses)}</TableCell>
                  <TableCell className="text-right text-warning">{fmt(d.despesas)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmt(d.impostos)}</TableCell>
                  <TableCell className={`text-right font-bold ${d.lucro >= 0 ? "text-success" : "text-destructive"}`}>{fmt(d.lucro)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
