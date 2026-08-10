import React, { useEffect, useState } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { TituloFinanceiro } from "@/types/financeiro";
import { fmt } from "../contasReceber/helpers";
import { ReciboIndividual } from "@/components/financeiro/ReciboIndividual";
import { Calendar, CreditCard, DollarSign } from "lucide-react";

export function EditarTituloModal({ titulo, onClose }: { titulo: TituloFinanceiro | null; onClose: () => void }) {
  const { updateTitulo, movimentos } = useFinanceiro();
  const { clientesReceita } = useReceita();
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState(0);
  const [venc, setVenc] = useState("");
  const [comp, setComp] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (titulo) {
      setDesc(titulo.descricao);
      setValor(titulo.valorOriginal);
      setVenc(titulo.vencimento);
      setComp(titulo.competenciaMes);
      setObs(titulo.observacoes || "");
    }
  }, [titulo]);

  const handleSave = () => {
    if (!titulo || !desc) { toast.error("Preencha a descrição"); return; }
    updateTitulo(titulo.id, {
      descricao: desc,
      valorOriginal: valor,
      vencimento: venc,
      competenciaMes: comp,
      observacoes: obs,
    });
    toast.success("Título atualizado!");
    onClose();
  };

  const cli = titulo ? clientesReceita.find(c => c.id === titulo.clienteId) : null;

  const historico = titulo ? movimentos.filter(m => m.tituloVinculadoId === titulo.id && m.conciliado) : [];

  return (
    <Dialog open={!!titulo} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Editar Título</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <div><Label>Valor *</Label><CurrencyInput value={valor} onValueChange={setValor} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Vencimento</Label><Input type="date" value={venc} onChange={e => setVenc(e.target.value)} /></div>
              <div><Label>Competência</Label><Input type="month" value={comp} onChange={e => setComp(e.target.value)} /></div>
            </div>
            {cli && (
              <div><Label>Cliente</Label><Input value={cli.nome} disabled className="bg-muted" /></div>
            )}
            <div><Label>Observações</Label><Textarea value={obs} onChange={e => setObs(e.target.value)} rows={3} /></div>
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
                      <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-success text-[13px]">{fmt(Math.abs(m.valor))}</span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(m.data).toLocaleDateString("pt-BR")}</span>
                          <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> {titulo.formaPagamento ? titulo.formaPagamento.toUpperCase() : "PIX"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <ReciboIndividual movimento={m} titulo={titulo} clienteNome={cli?.nome} />
                      <span className="text-[9px] font-bold bg-success/10 text-success px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Liquidado</span>
                    </div>
                  </div>
                ))
              )}
              {historico.length > 0 && titulo && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-xs font-bold px-2">
                    <span>Total Pago:</span>
                    <span className="text-success">{fmt(historico.reduce((s, m) => s + Math.abs(m.valor), 0))}</span>
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
