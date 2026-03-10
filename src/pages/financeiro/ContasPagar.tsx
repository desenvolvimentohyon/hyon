import { useState, useMemo, useEffect } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { STATUS_TITULO_LABELS, TituloFinanceiro } from "@/types/financeiro";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ContasPagar() {
  const { titulos, contasBancarias, addTitulo, baixarTitulo, planoContas, loading } = useFinanceiro();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState<string>("todos");
  const [modalBaixa, setModalBaixa] = useState<TituloFinanceiro | null>(null);
  const [contaBaixaId, setContaBaixaId] = useState("");

  useEffect(() => {
    if (contasBancarias.length > 0 && !contaBaixaId) {
      setContaBaixaId(contasBancarias[0].id);
    }
  }, [contasBancarias]);
  const [valorBaixa, setValorBaixa] = useState("");
  const [modalNovo, setModalNovo] = useState(false);

  const pagar = useMemo(() => {
    let list = titulos.filter(t => t.tipo === "pagar");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-muted-foreground text-sm">Gestão de despesas e repasses</p>
        </div>
        <Button onClick={() => setModalNovo(true)}><Plus className="h-4 w-4 mr-1" /> Lançar Despesa</Button>
      </div>

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
                  <TableCell className="font-medium text-sm">{t.descricao}</TableCell>
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
                    {(t.status === "aberto" || t.status === "parcial") && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setModalBaixa(t); setValorBaixa(""); }}>
                        <CheckCircle className="h-4 w-4 text-success" />
                      </Button>
                    )}
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
              <div><Label>Valor pago (vazio = total)</Label><Input type="number" value={valorBaixa} onChange={e => setValorBaixa(e.target.value)} /></div>
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

      {/* Modal Novo */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lançar Despesa</DialogTitle></DialogHeader>
          <NovaDespesaForm onSave={() => { setModalNovo(false); toast.success("Despesa lançada!"); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NovaDespesaForm({ onSave }: { onSave: () => void }) {
  const { addTitulo, planoContas } = useFinanceiro();
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [venc, setVenc] = useState(new Date().toISOString().split("T")[0]);
  const [fornecedor, setFornecedor] = useState("");
  const [catId, setCatId] = useState("pc301");
  const [parcelas, setParcelas] = useState("1");

  const handleSave = () => {
    if (!desc || !valor) { toast.error("Preencha os campos"); return; }
    const numParcelas = parseInt(parcelas) || 1;
    const valorParcela = parseFloat(valor) / numParcelas;
    const now = new Date();
    for (let i = 0; i < numParcelas; i++) {
      const vencDate = new Date(venc);
      vencDate.setMonth(vencDate.getMonth() + i);
      const comp = new Date(now); comp.setMonth(comp.getMonth() + i);
      addTitulo({
        tipo: "pagar", origem: "despesa_operacional",
        descricao: numParcelas > 1 ? `${desc} (${i + 1}/${numParcelas})` : desc,
        clienteId: null, fornecedorNome: fornecedor || null,
        categoriaPlanoContasId: catId,
        competenciaMes: `${comp.getFullYear()}-${String(comp.getMonth() + 1).padStart(2, "0")}`,
        dataEmissao: now.toISOString().split("T")[0],
        vencimento: vencDate.toISOString().split("T")[0],
        valorOriginal: Math.round(valorParcela * 100) / 100,
        desconto: 0, juros: 0, multa: 0,
        status: "aberto", formaPagamento: "boleto",
        contaBancariaId: null, anexosFake: [], observacoes: "", commissionType: null,
      });
    }
    onSave();
  };

  return (
    <div className="space-y-3">
      <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
      <div><Label>Valor total *</Label><Input type="number" value={valor} onChange={e => setValor(e.target.value)} /></div>
      <div><Label>Parcelas</Label><Input type="number" min={1} value={parcelas} onChange={e => setParcelas(e.target.value)} /></div>
      <div><Label>Vencimento 1ª parcela</Label><Input type="date" value={venc} onChange={e => setVenc(e.target.value)} /></div>
      <div><Label>Fornecedor</Label><Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} /></div>
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
