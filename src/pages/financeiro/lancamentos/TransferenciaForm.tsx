import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export function TransferenciaForm({ contasBancarias, addMovimento }: any) {
  const [origem, setOrigem] = useState("cb1");
  const [destino, setDestino] = useState("cb2");
  const [valor, setValor] = useState("");
  const [desc] = useState("Transferência entre contas");

  const handleTransferir = () => {
    if (!valor || origem === destino) { toast.error("Verifique os dados"); return; }
    const v = parseFloat(valor);
    addMovimento({ contaBancariaId: origem, data: new Date().toISOString().split("T")[0], descricao: desc, valor: -v, tipo: "debito" as const, conciliado: true, tituloVinculadoId: null, categoriaSugestao: null });
    addMovimento({ contaBancariaId: destino, data: new Date().toISOString().split("T")[0], descricao: desc, valor: v, tipo: "credito" as const, conciliado: true, tituloVinculadoId: null, categoriaSugestao: null });
    toast.success("Transferência realizada!");
    setValor("");
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Transferência entre Contas</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Conta origem</Label>
            <Select value={origem} onValueChange={setOrigem}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{contasBancarias.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Conta destino</Label>
            <Select value={destino} onValueChange={setDestino}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{contasBancarias.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Valor</Label><CurrencyInput value={Number(valor) || 0} onValueChange={v => setValor(String(v))} /></div>
        </div>
        <Button onClick={handleTransferir}><RefreshCw className="h-4 w-4 mr-1" /> Transferir</Button>
      </CardContent>
    </Card>
  );
}
