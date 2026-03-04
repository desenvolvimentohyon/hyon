import { useState, useMemo, useEffect } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, CheckCircle, AlertTriangle, Clock, Copy, Edit, RotateCcw } from "lucide-react";
import { TituloFinanceiro, STATUS_TITULO_LABELS, FORMA_PAGAMENTO_LABELS, ORIGEM_TITULO_LABELS, FINANCEIRO_COLORS } from "@/types/financeiro";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ContasReceber() {
  const { titulos, contasBancarias, addTitulo, updateTitulo, baixarTitulo, loading, planoContas } = useFinanceiro();
  const { clientesReceita } = useReceita();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroCliente, setFiltroCliente] = useState<string>("");
  const [modalBaixa, setModalBaixa] = useState<TituloFinanceiro | null>(null);
  const [modalNovo, setModalNovo] = useState(false);
  const [contaBaixaId, setContaBaixaId] = useState("");
  const [valorBaixa, setValorBaixa] = useState("");

  useEffect(() => {
    if (contasBancarias.length > 0 && !contaBaixaId) {
      setContaBaixaId(contasBancarias[0].id);
    }
  }, [contasBancarias]);

  const receber = useMemo(() => {
    let list = titulos.filter(t => t.tipo === "receber");
    if (filtroStatus !== "todos") list = list.filter(t => t.status === filtroStatus);
    if (filtroCliente) list = list.filter(t => {
      const cli = clientesReceita.find(c => c.id === t.clienteId);
      return cli?.nome.toLowerCase().includes(filtroCliente.toLowerCase());
    });
    return list.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());
  }, [titulos, filtroStatus, filtroCliente, clientesReceita]);

  const hoje = new Date().toISOString().split("T")[0];
  const em7d = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const vencidos = receber.filter(t => t.status === "vencido" || (t.status === "aberto" && t.vencimento < hoje));
  const venceHoje = receber.filter(t => t.status === "aberto" && t.vencimento === hoje);
  const vence7d = receber.filter(t => t.status === "aberto" && t.vencimento > hoje && t.vencimento <= em7d);

  const handleBaixa = () => {
    if (!modalBaixa) return;
    const val = valorBaixa ? parseFloat(valorBaixa) : undefined;
    baixarTitulo(modalBaixa.id, contaBaixaId, val);
    toast.success("Título baixado com sucesso!");
    setModalBaixa(null);
    setValorBaixa("");
  };

  const handleCobranca = (t: TituloFinanceiro) => {
    const cli = clientesReceita.find(c => c.id === t.clienteId);
    const msg = `Olá ${cli?.nome || "Cliente"}, seu título "${t.descricao}" no valor de ${fmt(t.valorOriginal)} venceu em ${new Date(t.vencimento).toLocaleDateString("pt-BR")}. Chave PIX: financeiro@gestask.com`;
    navigator.clipboard.writeText(msg);
    toast.success("Mensagem de cobrança copiada!");
  };

  const handleRenegociar = (t: TituloFinanceiro) => {
    const novoVenc = new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];
    updateTitulo(t.id, { status: "cancelado" });
    addTitulo({
      ...t, vencimento: novoVenc, status: "aberto", juros: 0, multa: 0,
      observacoes: `Renegociado do título ${t.id}`,
      anexosFake: [], desconto: 0,
    });
    toast.success("Título renegociado com novo vencimento!");
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
          <h1 className="text-2xl font-bold text-foreground">Contas a Receber</h1>
          <p className="text-muted-foreground text-sm">Gestão de recebíveis</p>
        </div>
        <Button onClick={() => setModalNovo(true)}><Plus className="h-4 w-4 mr-1" /> Novo Título</Button>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {vencidos.length > 0 && (
          <Card className="border-destructive/50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-destructive">{vencidos.length} vencidos</p>
                <p className="text-xs text-muted-foreground">{fmt(vencidos.reduce((s, t) => s + t.valorOriginal, 0))}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {venceHoje.length > 0 && (
          <Card className="border-warning/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-semibold text-warning">{venceHoje.length} vencem hoje</p>
                <p className="text-xs text-muted-foreground">{fmt(venceHoje.reduce((s, t) => s + t.valorOriginal, 0))}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {vence7d.length > 0 && (
          <Card className="border-info/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-info" />
              <div>
                <p className="text-sm font-semibold text-info">{vence7d.length} vencem em 7 dias</p>
                <p className="text-xs text-muted-foreground">{fmt(vence7d.reduce((s, t) => s + t.valorOriginal, 0))}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Buscar cliente..." value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} className="w-56" />
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receber.slice(0, 50).map(t => {
                const cli = clientesReceita.find(c => c.id === t.clienteId);
                return (
                  <TableRow key={t.id} className="group hover:bg-accent/40 transition-colors duration-150">
                    <TableCell className="font-medium text-sm">{t.descricao}</TableCell>
                    <TableCell className="text-sm">{cli?.nome || "—"}</TableCell>
                    <TableCell className="text-sm">{t.competenciaMes}</TableCell>
                    <TableCell className="text-sm">{new Date(t.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-sm font-semibold">{fmt(t.valorOriginal)}</TableCell>
                    <TableCell>{statusBadge(t.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(t.status === "aberto" || t.status === "vencido" || t.status === "parcial") && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setModalBaixa(t); setValorBaixa(""); }}>
                              <CheckCircle className="h-4 w-4 text-success" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCobranca(t)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            {t.status === "vencido" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRenegociar(t)}>
                                <RotateCcw className="h-4 w-4 text-warning" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Baixa */}
      <Dialog open={!!modalBaixa} onOpenChange={() => setModalBaixa(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Baixar Título</DialogTitle></DialogHeader>
          {modalBaixa && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{modalBaixa.descricao}</p>
              <p className="text-lg font-bold">{fmt(modalBaixa.valorOriginal)}</p>
              <div className="space-y-2">
                <Label>Valor recebido (deixe vazio para valor total)</Label>
                <Input type="number" value={valorBaixa} onChange={e => setValorBaixa(e.target.value)} placeholder={String(modalBaixa.valorOriginal)} />
              </div>
              <div className="space-y-2">
                <Label>Conta bancária</Label>
                <Select value={contaBaixaId} onValueChange={setContaBaixaId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contasBancarias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalBaixa(null)}>Cancelar</Button>
            <Button onClick={handleBaixa}>Confirmar Baixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Novo (simplified) */}
      <NovoTituloModal open={modalNovo} onClose={() => setModalNovo(false)} tipo="receber" />
    </div>
  );
}

function NovoTituloModal({ open, onClose, tipo }: { open: boolean; onClose: () => void; tipo: "receber" | "pagar" }) {
  const { addTitulo, planoContas, contasBancarias } = useFinanceiro();
  const { clientesReceita } = useReceita();
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [venc, setVenc] = useState(new Date().toISOString().split("T")[0]);
  const [clienteId, setClienteId] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [catId, setCatId] = useState("pc101");

  const handleSave = () => {
    if (!desc || !valor) { toast.error("Preencha os campos obrigatórios"); return; }
    const now = new Date();
    addTitulo({
      tipo, origem: "outro", descricao: desc, clienteId: clienteId || null,
      fornecedorNome: fornecedor || null, categoriaPlanoContasId: catId,
      competenciaMes: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      dataEmissao: now.toISOString().split("T")[0], vencimento: venc,
      valorOriginal: parseFloat(valor), desconto: 0, juros: 0, multa: 0,
      status: "aberto", formaPagamento: "pix", contaBancariaId: "cb1",
      anexosFake: [], observacoes: "", commissionType: null,
    });
    toast.success("Título criado!");
    onClose();
    setDesc(""); setValor("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Título - {tipo === "receber" ? "A Receber" : "A Pagar"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
          <div><Label>Valor *</Label><Input type="number" value={valor} onChange={e => setValor(e.target.value)} /></div>
          <div><Label>Vencimento</Label><Input type="date" value={venc} onChange={e => setVenc(e.target.value)} /></div>
          {tipo === "receber" ? (
            <div><Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{clientesReceita.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : (
            <div><Label>Fornecedor</Label><Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} /></div>
          )}
          <div><Label>Categoria</Label>
            <Select value={catId} onValueChange={setCatId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{planoContas.filter(p => p.paiId).map(p => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nome}</SelectItem>)}</SelectContent>
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

export { NovoTituloModal };
