import React, { useState } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function NovoTituloModal({ open, onClose, tipo }: { open: boolean; onClose: () => void; tipo: "receber" | "pagar" }) {
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
      status: "aberto", formaPagamento: "pix", contaBancariaId: contasBancarias[0]?.id || null,
      anexosFake: [], observacoes: "", commissionType: null,
      isCourtesy: false, courtesyReason: null,
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
          <div><Label>Valor *</Label><CurrencyInput value={Number(valor) || 0} onValueChange={v => setValor(String(v))} /></div>
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
