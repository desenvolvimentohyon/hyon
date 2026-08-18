import { useState } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { TituloFinanceiro } from "@/types/financeiro";
import { fmt } from "./helpers";
import { ReciboIndividual } from "@/components/financeiro/ReciboIndividual";
import { Calendar, CreditCard, DollarSign } from "lucide-react";

export function EditarDespesaModal({ titulo, onClose, onSave }: { titulo: TituloFinanceiro; onClose: () => void; onSave: (changes: Partial<TituloFinanceiro>) => void }) {
  const { planoContas, movimentos } = useFinanceiro();
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

  const historico = movimentos.filter(m => m.tituloVinculadoId === titulo.id && m.conciliado);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Editar Despesa</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <div><Label>Valor *</Label><CurrencyInput value={Number(valor) || 0} onValueChange={v => setValor(String(v))} /></div>
            <div><Label>Vencimento</Label><Input type="date" value={venc} onChange={e => setVenc(e.target.value)} /></div>
            <div><Label>Fornecedor</Label><Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} /></div>
            <div><Label>Categoria</Label>
              <Select value={catId} onValueChange={setCatId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{planoContas.filter(p => p.paiId && (p.ativo !== false || p.id === catId) && (p.tipo === "despesa" || p.tipo === "custo" || p.tipo === "repasse" || p.tipo === "imposto")).map(p => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nome}</SelectItem>)}</SelectContent>
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

          <div className="space-y-3">
            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Histórico de Pagamentos</Label>
            <div className="border rounded-md bg-muted/30 min-h-[200px] p-3 space-y-2 overflow-y-auto max-h-[400px]">
              {historico.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center pt-8">Nenhum pagamento registrado.</p>
              ) : (
                historico.map(m => (
                  <div key={m.id} className="flex justify-between items-center text-xs p-2.5 bg-background border rounded-lg shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-destructive text-[13px]">{fmt(Math.abs(m.valor))}</span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(m.data).toLocaleDateString("pt-BR")}</span>
                          <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> {titulo.formaPagamento ? titulo.formaPagamento.toUpperCase() : "PIX"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <ReciboIndividual movimento={m} titulo={titulo} fornecedorNome={titulo.fornecedorNome || ""} />
                      <span className="text-[9px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Baixado</span>
                    </div>
                  </div>
                ))
              )}
              {historico.length > 0 && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-xs font-bold px-2">
                    <span>Total Pago:</span>
                    <span className="text-destructive">{fmt(historico.reduce((s, m) => s + Math.abs(m.valor), 0))}</span>
                  </div>
                </>
              )}
            </div>
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
