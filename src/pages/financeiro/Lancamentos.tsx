import { useState } from "react";
import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { OrigemTitulo, CentroCusto, TipoTitulo } from "@/types/financeiro";

export default function Lancamentos() {
  const { addTitulo, addMovimento, planoContas, contasBancarias, loading } = useFinanceiro();
  const { clientesReceita } = useReceita();

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lançamentos</h1>
        <p className="text-muted-foreground text-sm">Registros rápidos de receitas, despesas e transferências</p>
      </div>

      <Tabs defaultValue="receita" className="space-y-4">
        <TabsList>
          <TabsTrigger value="receita" className="gap-1"><ArrowDownLeft className="h-3 w-3" /> Receita Avulsa</TabsTrigger>
          <TabsTrigger value="despesa" className="gap-1"><ArrowUpRight className="h-3 w-3" /> Despesa</TabsTrigger>
          <TabsTrigger value="transferencia" className="gap-1"><RefreshCw className="h-3 w-3" /> Transferência</TabsTrigger>
        </TabsList>

        <TabsContent value="receita">
          <LancamentoForm tipo="receber" planoContas={planoContas} contasBancarias={contasBancarias} clientesReceita={clientesReceita} addTitulo={addTitulo} />
        </TabsContent>
        <TabsContent value="despesa">
          <LancamentoForm tipo="pagar" planoContas={planoContas} contasBancarias={contasBancarias} clientesReceita={clientesReceita} addTitulo={addTitulo} />
        </TabsContent>
        <TabsContent value="transferencia">
          <TransferenciaForm contasBancarias={contasBancarias} addMovimento={addMovimento} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LancamentoForm({ tipo, planoContas, contasBancarias, clientesReceita, addTitulo }: any) {
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [venc, setVenc] = useState(new Date().toISOString().split("T")[0]);
  const [catId, setCatId] = useState(tipo === "receber" ? "pc104" : "pc301");
  const [clienteId, setClienteId] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [centro, setCentro] = useState<CentroCusto>("administrativo");
  const [obs, setObs] = useState("");

  const handleSave = () => {
    if (!desc || !valor) { toast.error("Preencha os campos obrigatórios"); return; }
    const now = new Date();
    addTitulo({
      tipo, origem: "outro" as OrigemTitulo, descricao: desc,
      clienteId: clienteId || null, fornecedorNome: fornecedor || null,
      categoriaPlanoContasId: catId,
      competenciaMes: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      dataEmissao: now.toISOString().split("T")[0], vencimento: venc,
      valorOriginal: parseFloat(valor), desconto: 0, juros: 0, multa: 0,
      status: "aberto" as const, formaPagamento: "pix" as const,
      contaBancariaId: "cb1", anexosFake: [], observacoes: obs,
    });
    toast.success(`${tipo === "receber" ? "Receita" : "Despesa"} registrada!`);
    setDesc(""); setValor(""); setObs("");
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{tipo === "receber" ? "Nova Receita Avulsa" : "Nova Despesa"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
          <div><Label>Valor *</Label><Input type="number" value={valor} onChange={e => setValor(e.target.value)} /></div>
          <div><Label>Vencimento</Label><Input type="date" value={venc} onChange={e => setVenc(e.target.value)} /></div>
          <div><Label>Categoria</Label>
            <Select value={catId} onValueChange={setCatId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{planoContas.filter((p: any) => p.paiId).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {tipo === "receber" ? (
            <div><Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>{clientesReceita.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : (
            <div><Label>Fornecedor</Label><Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} /></div>
          )}
          <div><Label>Centro de custo</Label>
            <Select value={centro} onValueChange={v => setCentro(v as CentroCusto)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="suporte">Suporte</SelectItem>
                <SelectItem value="implantacao">Implantação</SelectItem>
                <SelectItem value="administrativo">Administrativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Observações</Label><Input value={obs} onChange={e => setObs(e.target.value)} /></div>
        <Button onClick={handleSave}><Plus className="h-4 w-4 mr-1" /> Registrar</Button>
      </CardContent>
    </Card>
  );
}

function TransferenciaForm({ contasBancarias, addMovimento }: any) {
  const [origem, setOrigem] = useState("cb1");
  const [destino, setDestino] = useState("cb2");
  const [valor, setValor] = useState("");
  const [desc, setDesc] = useState("Transferência entre contas");

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
          <div><Label>Valor</Label><Input type="number" value={valor} onChange={e => setValor(e.target.value)} /></div>
        </div>
        <Button onClick={handleTransferir}><RefreshCw className="h-4 w-4 mr-1" /> Transferir</Button>
      </CardContent>
    </Card>
  );
}
