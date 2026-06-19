import { useState } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { TituloFinanceiro } from "@/types/financeiro";

export function EditarDespesaModal({ titulo, onClose, onSave }: { titulo: TituloFinanceiro; onClose: () => void; onSave: (changes: Partial<TituloFinanceiro>) => void }) {
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
