import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, Users, Clock, CheckCircle2 } from "lucide-react";
import { fmt } from "./helpers";

export function ComissoesTab({ titulos }: any) {
  const comissoes = useMemo(() => {
    return titulos
      .filter((t: any) => t.origem === "comissao_parceiro" || t.origem === "comissao")
      .sort((a: any, b: any) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());
  }, [titulos]);

  const kpis = useMemo(() => {
    const totalPagas = comissoes.filter((t: any) => t.status === "pago").reduce((s: number, t: any) => s + t.valorOriginal, 0);
    const totalAberto = comissoes.filter((t: any) => t.status === "aberto" || t.status === "vencido").reduce((s: number, t: any) => s + t.valorOriginal, 0);
    const countAberto = comissoes.filter((t: any) => t.status === "aberto" || t.status === "vencido").length;
    
    return { totalPagas, totalAberto, countAberto };
  }, [comissoes]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Pago</p>
              <p className="text-xl font-bold text-foreground">{fmt(kpis.totalPagas)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Aguardando Pagamento</p>
              <p className="text-xl font-bold text-foreground">{fmt(kpis.totalAberto)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-info/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-info/10">
              <Users className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Qtd. Pendentes</p>
              <p className="text-xl font-bold text-foreground">{kpis.countAberto} lançamentos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Histórico de Comissões
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comissoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhuma comissão registrada até o momento.
                    </TableCell>
                  </TableRow>
                ) : comissoes.map((t: any) => (
                  <TableRow key={t.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(t.vencimento).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{t.descricao}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.fornecedorNome || t.metadata?.partner_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {t.commission_type || "Implantação"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">{fmt(t.valorOriginal)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${
                          t.status === "pago" ? "bg-success/15 text-success border-success/20" : 
                          t.status === "vencido" ? "bg-destructive/15 text-destructive border-destructive/20" :
                          "bg-warning/15 text-warning border-warning/20"
                        }`}
                      >
                        {t.status.toUpperCase()}
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

