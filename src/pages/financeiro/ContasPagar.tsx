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
import { Plus, CheckCircle, AlertTriangle, ArrowDownRight, Pencil, Trash2, Repeat } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { RowActions } from "@/components/ui/row-actions";
import { STATUS_TITULO_LABELS, TituloFinanceiro } from "@/types/financeiro";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ContasPagar() {
  const { titulos, contasBancarias, addTitulo, baixarTitulo, updateTitulo, deleteTitulo, planoContas, loading } = useFinanceiro();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [modalBaixa, setModalBaixa] = useState<TituloFinanceiro | null>(null);
  const [contaBaixaId, setContaBaixaId] = useState("");
  const [modalEditar, setModalEditar] = useState<TituloFinanceiro | null>(null);
  const [excluirId, setExcluirId] = useState<string | null>(null);

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
    return list.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());
  }, [titulos, filtroStatus, filtroFornecedor, filtroOrigem]);

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

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      aberto: "bg-info/10 text-info border-info/20",
      pago: "bg-success/10 text-success border-success/20",
      parcial: "bg-warning/10 text-warning border-warning/20",
      vencido: "bg-destructive/10 text-destructive border-destructive/20",
      cancelado: "bg-muted text-muted-foreground",
    };
    return <Badge variant="outline" className={variants[status] || ""}>{STATUS_TITULO_LABELS[status as keyof typeof STATUS_TITULO_LABELS]}</Badge>;
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
                          { label: "Excluir", icon: Trash2, onClick: () => setExcluirId(t.id), variant: "destructive", separator: true },
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
    </div>
  );
}

/* ========== Modal Editar ========== */
function EditarDespesaModal({ titulo, onClose, onSave }: { titulo: TituloFinanceiro; onClose: () => void; onSave: (changes: Partial<TituloFinanceiro>) => void }) {
  const { planoContas } = useFinanceiro();
  const [desc, setDesc] = useState(titulo.descricao);
  const [valor, setValor] = useState(String(titulo.valorOriginal));
  const [venc, setVenc] = useState(titulo.vencimento);
  const [fornecedor, setFornecedor] = useState(titulo.fornecedorNome || "");
  const [catId, setCatId] = useState(titulo.categoriaPlanoContasId);
  const [status, setStatus] = useState(titulo.status);

  const handleSave = () => {
    if (!desc || !valor) { toast.error("Preencha os campos obrigatórios"); return; }
    onSave({
      descricao: desc,
      valorOriginal: parseFloat(valor),
      vencimento: venc,
      fornecedorNome: fornecedor || null,
      categoriaPlanoContasId: catId,
      status,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Despesa</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
          <div><Label>Valor *</Label><CurrencyInput value={Number(valor) || 0} onValueChange={v => setValor(String(v))} /></div>
          <div><Label>Vencimento</Label><Input type="date" value={venc} onChange={e => setVenc(e.target.value)} /></div>
          <div><Label>Fornecedor</Label><Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} /></div>
          <div><Label>Categoria</Label>
            <Select value={catId} onValueChange={setCatId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{planoContas.filter(p => p.paiId && (p.tipo === "despesa" || p.tipo === "custo" || p.tipo === "repasse" || p.tipo === "imposto")).map(p => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ========== Form Nova Despesa ========== */
function NovaDespesaForm({ onSave }: { onSave: () => void }) {
  const { addTitulo, planoContas } = useFinanceiro();
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [venc, setVenc] = useState(new Date().toISOString().split("T")[0]);
  const [fornecedor, setFornecedor] = useState("");
  const [catId, setCatId] = useState("pc301");
  const [parcelas, setParcelas] = useState("1");
  const [recorrente, setRecorrente] = useState(false);
  const [mesesRecorrencia, setMesesRecorrencia] = useState("12");

  const numParcelas = parseInt(parcelas) || 1;
  const numMeses = parseInt(mesesRecorrencia) || 1;
  const valorTotal = parseFloat(valor) || 0;
  const valorParcela = numParcelas > 0 ? valorTotal / numParcelas : 0;

  const handleSave = () => {
    if (!desc || !valor) { toast.error("Preencha os campos"); return; }
    const now = new Date();
    const qty = recorrente ? numMeses : numParcelas;
    for (let i = 0; i < qty; i++) {
      const vencDate = new Date(venc);
      vencDate.setMonth(vencDate.getMonth() + i);
      const comp = new Date(now); comp.setMonth(comp.getMonth() + i);
      const suffix = recorrente
        ? ` (recorrente ${i + 1}/${qty})`
        : qty > 1 ? ` (${i + 1}/${qty})` : "";
      addTitulo({
        tipo: "pagar", origem: "despesa_operacional",
        descricao: `${desc}${suffix}`,
        clienteId: null, fornecedorNome: fornecedor || null,
        categoriaPlanoContasId: catId,
        competenciaMes: `${comp.getFullYear()}-${String(comp.getMonth() + 1).padStart(2, "0")}`,
        dataEmissao: now.toISOString().split("T")[0],
        vencimento: vencDate.toISOString().split("T")[0],
        valorOriginal: recorrente ? Math.round(valorTotal * 100) / 100 : Math.round(valorParcela * 100) / 100,
        desconto: 0, juros: 0, multa: 0,
        status: "aberto", formaPagamento: "boleto",
        contaBancariaId: null, anexosFake: [], observacoes: "", commissionType: null,
        isCourtesy: false, courtesyReason: null,
      });
    }
    onSave();
  };

  return (
    <div className="space-y-2">
      <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Valor {recorrente ? "mensal" : "total"} *</Label><CurrencyInput value={Number(valor) || 0} onValueChange={v => setValor(String(v))} /></div>
        {recorrente ? (
          <div><Label>Meses</Label><Input type="number" min={1} value={mesesRecorrencia} onChange={e => setMesesRecorrencia(e.target.value)} /></div>
        ) : (
          <div><Label>Parcelas</Label><Input type="number" min={1} value={parcelas} onChange={e => setParcelas(e.target.value)} /></div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="recorrente" checked={recorrente} onCheckedChange={(v) => { setRecorrente(!!v); if (v) setParcelas("1"); }} />
        <Label htmlFor="recorrente" className="cursor-pointer text-sm">Despesa recorrente (mensal)</Label>
      </div>

      {(() => {
        const qty = recorrente ? numMeses : numParcelas;
        const valUnit = recorrente ? valorTotal : valorParcela;
        if (qty <= 1 || valorTotal <= 0) return null;
        const primeiraData = new Date(venc);
        const ultimaData = new Date(venc);
        ultimaData.setMonth(ultimaData.getMonth() + qty - 1);
        const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR");
        return (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-0.5">
            <p className="text-base font-bold text-foreground">
              {qty}x de {fmt(Math.round(valUnit * 100) / 100)}
            </p>
            <p className="text-xs text-muted-foreground">
              De {fmtDate(primeiraData)} até {fmtDate(ultimaData)}
            </p>
            {!recorrente && (
              <p className="text-xs text-muted-foreground">Valor total: {fmt(valorTotal)}</p>
            )}
            {recorrente && (
              <p className="text-xs text-muted-foreground">Total acumulado: {fmt(valorTotal * qty)}</p>
            )}
          </div>
        );
      })()}
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Vencimento {recorrente ? "1º mês" : numParcelas > 1 ? "1ª parcela" : ""}</Label><Input type="date" value={venc} onChange={e => setVenc(e.target.value)} /></div>
        <div><Label>Fornecedor</Label><Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} /></div>
      </div>
      <div><Label>Categoria</Label>
        <Select value={catId} onValueChange={setCatId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{planoContas.filter(p => p.paiId && (p.tipo === "despesa" || p.tipo === "custo" || p.tipo === "repasse" || p.tipo === "imposto")).map(p => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button onClick={handleSave}>Salvar</Button>
      </DialogFooter>
    </div>
  );
}
