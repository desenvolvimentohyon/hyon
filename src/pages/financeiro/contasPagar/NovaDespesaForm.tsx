import { useState } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { fmt } from "./helpers";

export function NovaDespesaForm({ onSave }: { onSave: () => void }) {
  const { addTitulo, planoContas } = useFinanceiro();
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [venc, setVenc] = useState(new Date().toISOString().split("T")[0]);
  const [fornecedor, setFornecedor] = useState("");
  const [catId, setCatId] = useState("pc301");
  const [parcelas, setParcelas] = useState("1");
  const [recorrente, setRecorrente] = useState(false);
  const [obs, setObs] = useState("");
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
        contaBancariaId: null, anexosFake: [], observacoes: obs, commissionType: null,
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
      <div><Label>Observações</Label><Textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Observações opcionais..." rows={2} /></div>
      <DialogFooter>
        <Button onClick={handleSave}>Salvar</Button>
      </DialogFooter>
    </div>
  );
}
