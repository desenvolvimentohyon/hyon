import React, { useEffect, useState } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TituloFinanceiro } from "@/types/financeiro";

export function EditarTituloModal({ titulo, onClose }: { titulo: TituloFinanceiro | null; onClose: () => void }) {
  const { updateTitulo } = useFinanceiro();
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

  return (
    <Dialog open={!!titulo} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Título</DialogTitle></DialogHeader>
        {titulo && (
          <div className="space-y-3">
            <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <div><Label>Valor *</Label><CurrencyInput value={valor} onValueChange={setValor} /></div>
            <div><Label>Vencimento</Label><Input type="date" value={venc} onChange={e => setVenc(e.target.value)} /></div>
            <div><Label>Competência</Label><Input type="month" value={comp} onChange={e => setComp(e.target.value)} /></div>
            {cli && (
              <div><Label>Cliente</Label><Input value={cli.nome} disabled className="bg-muted" /></div>
            )}
            <div><Label>Observações</Label><Textarea value={obs} onChange={e => setObs(e.target.value)} rows={3} /></div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
