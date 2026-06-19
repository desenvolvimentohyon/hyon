import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmt } from "./helpers";

export function ComissoesTab({ titulos }: any) {
  const comissoes = titulos.filter((t: any) => t.origem === "comissao");
  const total = comissoes.reduce((s: number, t: any) => s + t.valorOriginal, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total de comissões pagas</p>
          <p className="text-2xl font-bold text-foreground">{fmt(total)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Beneficiário</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comissoes.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{t.descricao}</TableCell>
                  <TableCell className="text-sm">{t.fornecedorNome || "—"}</TableCell>
                  <TableCell className="text-sm">{t.competenciaMes}</TableCell>
                  <TableCell className="text-right font-semibold text-sm">{fmt(t.valorOriginal)}</TableCell>
                  <TableCell className="text-sm">{t.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
