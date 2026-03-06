import { useState, useMemo } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Link2, Unlink, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { FINANCEIRO_COLORS, MovimentoBancario } from "@/types/financeiro";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ConciliacaoBancaria() {
  const { movimentos, titulos, contasBancarias, conciliarMovimento, desconciliarMovimento, importarExtrato, getSaldoConta, loading } = useFinanceiro();
  const [contaId, setContaId] = useState("cb1");
  const [selectedMov, setSelectedMov] = useState<string | null>(null);
  const [selectedTitulo, setSelectedTitulo] = useState<string | null>(null);

  const movsFiltered = useMemo(() =>
    movimentos.filter(m => m.contaBancariaId === contaId).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [movimentos, contaId]
  );

  const pendentes = movsFiltered.filter(m => !m.conciliado);
  const conciliados = movsFiltered.filter(m => m.conciliado);
  const pctConciliado = movsFiltered.length > 0 ? (conciliados.length / movsFiltered.length) * 100 : 100;

  const titulosAbertos = useMemo(() =>
    titulos.filter(t => (t.status === "aberto" || t.status === "vencido") && (!t.contaBancariaId || t.contaBancariaId === contaId)),
    [titulos, contaId]
  );

  const handleConciliar = () => {
    if (!selectedMov || !selectedTitulo) { toast.error("Selecione um movimento e um título"); return; }
    conciliarMovimento(selectedMov, selectedTitulo);
    toast.success("Conciliado com sucesso!");
    setSelectedMov(null);
    setSelectedTitulo(null);
  };

  const handleAutoConciliar = () => {
    let count = 0;
    pendentes.forEach(mov => {
      const match = titulosAbertos.find(t => {
        const valorMatch = Math.abs(Math.abs(mov.valor) - t.valorOriginal) < 0.5;
        const dateMatch = Math.abs(new Date(mov.data).getTime() - new Date(t.vencimento).getTime()) < 5 * 86400000;
        return valorMatch && dateMatch;
      });
      if (match) { conciliarMovimento(mov.id, match.id); count++; }
    });
    toast.success(`${count} movimentos conciliados automaticamente`);
  };

  const handleImportar = () => {
    importarExtrato();
  };

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conciliação Bancária</h1>
          <p className="text-muted-foreground text-sm">Vincule movimentos bancários a títulos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportar}><Upload className="h-4 w-4 mr-1" /> Importar Extrato</Button>
          <Button variant="outline" onClick={handleAutoConciliar}><CheckCircle2 className="h-4 w-4 mr-1" /> Auto-conciliar</Button>
          <Button disabled={!selectedMov || !selectedTitulo} onClick={handleConciliar}><Link2 className="h-4 w-4 mr-1" /> Conciliar</Button>
        </div>
      </div>

      {/* Conta e progresso */}
      <div className="flex gap-4 items-center">
        <Select value={contaId} onValueChange={setContaId}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{contasBancarias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{pctConciliado.toFixed(0)}% conciliado</span>
            <span>{pendentes.length} pendentes</span>
          </div>
          <Progress value={pctConciliado} className="h-2" />
        </div>
        <p className="text-sm font-semibold">Saldo: {fmt(getSaldoConta(contaId))}</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimentos bancários */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Movimentos Bancários (pendentes)</CardTitle></CardHeader>
          <CardContent className="p-0 max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendentes.map(m => (
                  <TableRow key={m.id} className={`cursor-pointer ${selectedMov === m.id ? "bg-accent" : ""}`} onClick={() => setSelectedMov(m.id)}>
                    <TableCell>{selectedMov === m.id && <CheckCircle2 className="h-4 w-4 text-info" />}</TableCell>
                    <TableCell className="text-xs">{new Date(m.data).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-xs">{m.descricao}</TableCell>
                    <TableCell className={`text-xs font-semibold ${m.valor >= 0 ? "text-success" : "text-destructive"}`}>{fmt(m.valor)}</TableCell>
                  </TableRow>
                ))}
                {pendentes.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-8">Todos conciliados ✓</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Títulos em aberto */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Títulos em Aberto</CardTitle></CardHeader>
          <CardContent className="p-0 max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Venc.</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {titulosAbertos.slice(0, 40).map(t => (
                  <TableRow key={t.id} className={`cursor-pointer ${selectedTitulo === t.id ? "bg-accent" : ""}`} onClick={() => setSelectedTitulo(t.id)}>
                    <TableCell>{selectedTitulo === t.id && <CheckCircle2 className="h-4 w-4 text-info" />}</TableCell>
                    <TableCell className="text-xs">{new Date(t.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-xs">{t.descricao}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${t.tipo === "receber" ? "text-info" : "text-destructive"}`}>{t.tipo}</Badge></TableCell>
                    <TableCell className="text-xs font-semibold">{fmt(t.valorOriginal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
