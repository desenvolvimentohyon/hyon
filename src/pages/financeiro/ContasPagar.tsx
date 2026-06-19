import { useState, useMemo, useEffect } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, CheckCircle, AlertTriangle, ArrowDownRight, Pencil, Trash2, Repeat, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { RowActions } from "@/components/ui/row-actions";
import { TituloFinanceiro } from "@/types/financeiro";
import { fmt, statusBadge, getFuturosRecorrentes } from "./contasPagar/helpers";
import { EditarDespesaModal } from "./contasPagar/EditarDespesaModal";
import { NovaDespesaForm } from "./contasPagar/NovaDespesaForm";

export default function ContasPagar() {
  const { titulos, contasBancarias, baixarTitulo, updateTitulo, deleteTitulo, loading } = useFinanceiro();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [modalBaixa, setModalBaixa] = useState<TituloFinanceiro | null>(null);
  const [contaBaixaId, setContaBaixaId] = useState("");
  const [modalEditar, setModalEditar] = useState<TituloFinanceiro | null>(null);
  const [excluirId, setExcluirId] = useState<string | null>(null);
  const [cancelarFuturosId, setCancelarFuturosId] = useState<string | null>(null);

  useEffect(() => {
    if (contasBancarias.length > 0 && !contaBaixaId) {
      setContaBaixaId(contasBancarias[0].id);
    }
  }, [contasBancarias]);
  const [valorBaixa, setValorBaixa] = useState("");
  const [modalNovo, setModalNovo] = useState(false);

  const pagar = useMemo(() => {
    const now = new Date();
    const mesAtualInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const mesAtualFim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const hj = new Date().toISOString().split("T")[0];

    let list = titulos.filter(t => {
      if (t.tipo !== "pagar") return false;
      if (t.vencimento >= mesAtualInicio && t.vencimento <= mesAtualFim) return true;
      if (t.vencimento < mesAtualInicio && (t.status === "vencido" || (t.status === "aberto" && t.vencimento < hj))) return true;
      return false;
    });
    if (filtroStatus !== "todos") list = list.filter(t => t.status === filtroStatus);
    if (filtroFornecedor) list = list.filter(t => t.fornecedorNome?.toLowerCase().includes(filtroFornecedor.toLowerCase()) || t.descricao.toLowerCase().includes(filtroFornecedor.toLowerCase()));
    if (filtroOrigem !== "todos") list = list.filter(t => t.origem === filtroOrigem);
    if (filtroTipo === "recorrente") list = list.filter(t => t.descricao.includes("(recorrente"));
    if (filtroTipo === "parcelado") list = list.filter(t => /\(\d+\/\d+\)/.test(t.descricao) && !t.descricao.includes("(recorrente"));
    return list.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());
  }, [titulos, filtroStatus, filtroFornecedor, filtroOrigem, filtroTipo]);

  const hoje = new Date().toISOString().split("T")[0];
  const vencidos = pagar.filter(t => t.status === "aberto" && t.vencimento < hoje);

  const handleBaixa = () => {
    if (!modalBaixa) return;
    const val = valorBaixa ? parseFloat(valorBaixa) : undefined;
    baixarTitulo(modalBaixa.id, contaBaixaId, val);
    toast.success("Pagamento registrado!");
    setModalBaixa(null);
    setValorBaixa("");
  };

  const handleExcluir = () => {
    if (!excluirId) return;
    deleteTitulo(excluirId);
    toast.success("Despesa excluída!");
    setExcluirId(null);
  };

  const handleCancelarFuturos = () => {
    if (!cancelarFuturosId) return;
    const futuros = getFuturosRecorrentes(titulos, cancelarFuturosId);
    futuros.forEach(t => deleteTitulo(t.id));
    toast.success(`${futuros.length} lançamentos futuros excluídos!`);
    setCancelarFuturosId(null);
  };

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={ArrowDownRight}
        iconClassName="text-destructive"
        title="Contas a Pagar"
        subtitle="Gestão de despesas e repasses"
        actions={<Button onClick={() => setModalNovo(true)}><Plus className="h-4 w-4 mr-1" /> Lançar Despesa</Button>}
      />
      <ModuleNavGrid moduleId="financeiro" />

      {vencidos.length > 0 && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">{vencidos.length} despesas vencidas</p>
              <p className="text-xs text-muted-foreground">{fmt(vencidos.reduce((s, t) => s + t.valorOriginal, 0))}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Buscar fornecedor..." value={filtroFornecedor} onChange={e => setFiltroFornecedor(e.target.value)} className="w-56" />
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas origens</SelectItem>
            <SelectItem value="comissao_parceiro">Comissão Parceiro</SelectItem>
            <SelectItem value="despesa_operacional">Despesa Operacional</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="recorrente">Recorrente</SelectItem>
            <SelectItem value="parcelado">Parcelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagar.slice(0, 50).map(t => (
                <TableRow key={t.id} className="group hover:bg-accent/40 transition-colors duration-150">
                  <TableCell className="font-medium text-sm">
                    {t.descricao}
                    {/\(recorrente \d+\/\d+\)/.test(t.descricao) ? (
                      <Badge variant="secondary" className="ml-2 text-[10px]"><Repeat className="h-3 w-3 inline mr-0.5" />Recorrente</Badge>
                    ) : /\(\d+\/\d+\)/.test(t.descricao) && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">Parcelado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{t.fornecedorNome || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{t.origem}</Badge>
                    {String(t.origem) === "comissao_parceiro" && (
                      <Badge variant="secondary" className="text-[10px] ml-1">
                        {t.commissionType === "recorrente" ? "Recorrente" : "Implantação"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{t.competenciaMes}</TableCell>
                  <TableCell className="text-sm">{new Date(t.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-sm font-semibold">{fmt(t.valorOriginal)}</TableCell>
                  <TableCell>{statusBadge(t.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(t.status === "aberto" || t.status === "parcial") && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setModalBaixa(t); setValorBaixa(""); }}>
                          <CheckCircle className="h-4 w-4 text-success" />
                        </Button>
                      )}
                      <RowActions
                        actions={[
                          { label: "Editar", icon: Pencil, onClick: () => setModalEditar(t) },
                          ...(t.descricao.includes("(recorrente") && t.status === "aberto"
                            ? [{ label: "Cancelar futuros", icon: XCircle, onClick: () => setCancelarFuturosId(t.id), variant: "destructive" as const, separator: true }]
                            : []),
                          { label: "Excluir", icon: Trash2, onClick: () => setExcluirId(t.id), variant: "destructive" as const, separator: !t.descricao.includes("(recorrente") },
                        ]}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Baixa */}
      <Dialog open={!!modalBaixa} onOpenChange={() => setModalBaixa(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
          {modalBaixa && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{modalBaixa.descricao}</p>
              <p className="text-lg font-bold">{fmt(modalBaixa.valorOriginal)}</p>
              <div><Label>Valor pago (vazio = total)</Label><CurrencyInput value={Number(valorBaixa) || 0} onValueChange={v => setValorBaixa(String(v))} /></div>
              <div><Label>Conta bancária</Label>
                <Select value={contaBaixaId} onValueChange={setContaBaixaId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{contasBancarias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalBaixa(null)}>Cancelar</Button>
            <Button onClick={handleBaixa}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      {modalEditar && (
        <EditarDespesaModal
          titulo={modalEditar}
          onClose={() => setModalEditar(null)}
          onSave={(changes) => {
            updateTitulo(modalEditar.id, changes);
            toast.success("Despesa atualizada!");
            setModalEditar(null);
          }}
        />
      )}

      {/* Modal Novo */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Lançar Despesa</DialogTitle></DialogHeader>
          <NovaDespesaForm onSave={() => { setModalNovo(false); toast.success("Despesa lançada!"); }} />
        </DialogContent>
      </Dialog>

      {/* Confirmação Exclusão */}
      <AlertDialog open={!!excluirId} onOpenChange={() => setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa</AlertDialogTitle>
            <AlertDialogDescription>Deseja realmente excluir esta despesa? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação Cancelar Futuros */}
      <AlertDialog open={!!cancelarFuturosId} onOpenChange={() => setCancelarFuturosId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar lançamentos futuros</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelarFuturosId && (() => {
                const qty = getFuturosRecorrentes(titulos, cancelarFuturosId).length;
                return qty > 0
                  ? `Serão excluídos ${qty} lançamento(s) recorrente(s) com status "aberto" e vencimento posterior ao selecionado. Esta ação não pode ser desfeita.`
                  : "Não há lançamentos futuros abertos para cancelar.";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {cancelarFuturosId && getFuturosRecorrentes(titulos, cancelarFuturosId).length > 0 && (
              <AlertDialogAction onClick={handleCancelarFuturos} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Confirmar Exclusão
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
