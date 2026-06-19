import React, { useState, useMemo, useEffect } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, CheckCircle, AlertTriangle, Clock, Copy, Edit, RotateCcw, ArrowUpRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { TituloFinanceiro } from "@/types/financeiro";
import { fmt, statusBadge } from "./contasReceber/helpers";
import { NovoTituloModal } from "./contasReceber/NovoTituloModal";
import { EditarTituloModal } from "./contasReceber/EditarTituloModal";

export { NovoTituloModal };

export default function ContasReceber() {
  const { titulos, contasBancarias, addTitulo, updateTitulo, baixarTitulo, loading } = useFinanceiro();
  const { clientesReceita } = useReceita();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroCliente, setFiltroCliente] = useState<string>("");
  const [modalBaixa, setModalBaixa] = useState<TituloFinanceiro | null>(null);
  const [modalNovo, setModalNovo] = useState(false);
  const [editingTitulo, setEditingTitulo] = useState<TituloFinanceiro | null>(null);
  const [contaBaixaId, setContaBaixaId] = useState("");
  const [valorBaixa, setValorBaixa] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (contasBancarias.length > 0 && !contaBaixaId) {
      setContaBaixaId(contasBancarias[0].id);
    }
  }, [contasBancarias]);

  const receber = useMemo(() => {
    const now = new Date();
    const mesAtualInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const mesAtualFim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const hj = new Date().toISOString().split("T")[0];

    let list = titulos.filter(t => {
      if (t.tipo !== "receber") return false;
      if (t.vencimento >= mesAtualInicio && t.vencimento <= mesAtualFim) return true;
      if (t.vencimento < mesAtualInicio && (t.status === "vencido" || (t.status === "aberto" && t.vencimento < hj))) return true;
      return false;
    });
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

  const handleBaixa = async () => {
    if (!modalBaixa || isProcessing) return;
    setIsProcessing(true);
    try {
      const val = valorBaixa ? parseFloat(valorBaixa) : undefined;
      await baixarTitulo(modalBaixa.id, contaBaixaId, val);
      toast.success("Título baixado com sucesso!");
      setModalBaixa(null);
      setValorBaixa("");
    } catch (err) {
      toast.error("Erro ao realizar baixa");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCobranca = (t: TituloFinanceiro) => {
    const cli = clientesReceita.find(c => c.id === t.clienteId);
    const defaultBank = contasBancarias.find(c => c.nome === contasBancarias[0]?.nome);
    const pixInfo = defaultBank?.nome ? `Conta: ${defaultBank.nome}` : "";
    const msg = `Olá ${cli?.nome || "Cliente"}, seu título "${t.descricao}" no valor de ${fmt(t.valorOriginal)} venceu em ${new Date(t.vencimento).toLocaleDateString("pt-BR")}.${pixInfo ? ` ${pixInfo}` : ""}`;
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

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={ArrowUpRight}
        iconClassName="text-success"
        title="Contas a Receber"
        subtitle="Gestão de recebíveis"
        actions={<Button onClick={() => setModalNovo(true)}><Plus className="h-4 w-4 mr-1" /> Novo Título</Button>}
      />
      <ModuleNavGrid moduleId="financeiro" />

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
                        {t.status !== "cancelado" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTitulo(t)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
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

      <Dialog open={!!modalBaixa} onOpenChange={() => setModalBaixa(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Baixar Título</DialogTitle></DialogHeader>
          {modalBaixa && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{modalBaixa.descricao}</p>
              <p className="text-lg font-bold">{fmt(modalBaixa.valorOriginal)}</p>
              <div className="space-y-2">
                <Label>Valor recebido (deixe vazio para valor total)</Label>
                <CurrencyInput value={Number(valorBaixa) || 0} onValueChange={v => setValorBaixa(String(v))} />
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
            <Button variant="outline" onClick={() => setModalBaixa(null)} disabled={isProcessing}>Cancelar</Button>
            <Button onClick={handleBaixa} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmar Baixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditarTituloModal titulo={editingTitulo} onClose={() => setEditingTitulo(null)} />
      <NovoTituloModal open={modalNovo} onClose={() => setModalNovo(false)} tipo="receber" />
    </div>
  );
}
