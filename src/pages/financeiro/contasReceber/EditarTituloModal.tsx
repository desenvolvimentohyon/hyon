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
                  <div key={m.id} className="flex justify-between items-center text-xs p-2 bg-background border rounded shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-success">{fmt(Math.abs(m.valor))}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(m.data).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded">Conciliado</span>
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
