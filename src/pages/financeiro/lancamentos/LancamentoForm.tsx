import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OrigemTitulo, CentroCusto } from "@/types/financeiro";
import { FormaPagamentoCatalogo } from "@/types/parametros";

export function LancamentoForm({ tipo, planoContas, contasBancarias, clientesReceita, addTitulo, formasPagamento }: any) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [venc, setVenc] = useState(new Date().toISOString().split("T")[0]);
  const [catId, setCatId] = useState(tipo === "receber" ? "pc104" : "pc301");
  const [clienteId, setClienteId] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [centro, setCentro] = useState<CentroCusto>("administrativo");
  const [obs, setObs] = useState("");
  const [contaBancariaId, setContaBancariaId] = useState(
    contasBancarias.length > 0 ? contasBancarias[0].id : ""
  );
  const [formaPagamentoId, setFormaPagamentoId] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [juros, setJuros] = useState(0);
  const [multa, setMulta] = useState(0);

  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoCidade, setNovoCidade] = useState("");
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  const valorNum = Number(valor) || 0;
  const valorFinal = Math.max(0, valorNum - desconto + juros + multa);
  const formasAtivas = (formasPagamento || []).filter((f: FormaPagamentoCatalogo) => f.ativo);

  const handleSave = async () => {
    if (!desc || !valor) { toast.error("Preencha os campos obrigatórios"); return; }

    let actualClientId: string | null = clienteId || null;

    if (tipo === "receber" && clienteId === "novo") {
      if (!novoNome.trim()) { toast.error("Informe o nome do cliente"); return; }
      setSalvandoCliente(true);
      const { data, error } = await supabase.from("clients").insert({
        name: novoNome.trim(),
        phone: novoTelefone || null,
        email: novoEmail || null,
        city: novoCidade || null,
        org_id: profile?.org_id,
      }).select("id").single();
      setSalvandoCliente(false);
      if (error || !data) {
        toast.error("Erro ao cadastrar cliente: " + (error?.message || ""));
        return;
      }
      actualClientId = data.id;
      toast.success(`Cliente "${novoNome}" cadastrado!`);
    }

    if (actualClientId === "novo") actualClientId = null;

    const now = new Date();
    const localDate = new Date(venc + "T12:00:00");
    const competency = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}`;

    const success = await addTitulo({
      tipo, origem: "outro" as OrigemTitulo, descricao: desc,
      clienteId: actualClientId,
      fornecedorNome: fornecedor || null,
      categoriaPlanoContasId: catId,
      competenciaMes: competency,
      dataEmissao: now.toISOString().split("T")[0], vencimento: venc,
      valorOriginal: valorNum, desconto, juros, multa,
      status: "aberto" as const,
      formaPagamento: (formaPagamentoId as any) || "pix",
      contaBancariaId: contaBancariaId || null, anexosFake: [], observacoes: obs,
    });
    if (success) {
      toast.success(`${tipo === "receber" ? "Receita" : "Despesa"} registrada!`);
      setDesc(""); setValor(""); setObs(""); setDesconto(0); setJuros(0); setMulta(0);
      setClienteId(""); setNovoNome(""); setNovoTelefone(""); setNovoEmail(""); setNovoCidade("");
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{tipo === "receber" ? "Nova Receita Avulsa" : "Nova Despesa"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Descrição *</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
          <div><Label>Valor *</Label><CurrencyInput value={Number(valor) || 0} onValueChange={v => setValor(String(v))} /></div>
          <div><Label>Data de Lançamento</Label><Input type="date" value={venc} onChange={e => setVenc(e.target.value)} /></div>
          <div><Label>Categoria</Label>
            <div className="flex gap-2">
              <Select value={catId} onValueChange={setCatId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{planoContas.filter((p: any) => p.paiId).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nome}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="shrink-0" onClick={() => navigate("/financeiro/plano-de-contas")} title="Criar nova conta no Plano de Contas">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {tipo === "receber" ? (
            <div><Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent className="max-h-[180px]">
                  <SelectItem value="novo" className="text-primary font-medium">
                    <span className="flex items-center gap-1"><UserPlus className="h-3 w-3" /> Cadastrar novo cliente</span>
                  </SelectItem>
                  {clientesReceita.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div><Label>Fornecedor</Label><Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} /></div>
          )}
          <div><Label>Forma de Pagamento</Label>
            <Select value={formaPagamentoId} onValueChange={setFormaPagamentoId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {formasAtivas.map((f: FormaPagamentoCatalogo) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Conta Bancária</Label>
            <Select value={contaBancariaId} onValueChange={setContaBancariaId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{contasBancarias.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
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

        {tipo === "receber" && clienteId === "novo" && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm font-medium text-primary flex items-center gap-1"><UserPlus className="h-4 w-4" /> Cadastro rápido de cliente</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Nome *</Label><Input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome do cliente" /></div>
                <div><Label>Telefone</Label><Input value={novoTelefone} onChange={e => setNovoTelefone(e.target.value)} placeholder="(00) 00000-0000" /></div>
                <div><Label>Email</Label><Input value={novoEmail} onChange={e => setNovoEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
                <div><Label>Cidade</Label><Input value={novoCidade} onChange={e => setNovoCidade(e.target.value)} placeholder="Cidade" /></div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Desconto</Label><CurrencyInput value={desconto} onValueChange={setDesconto} /></div>
          <div><Label>Juros</Label><CurrencyInput value={juros} onValueChange={setJuros} /></div>
          <div><Label>Multa</Label><CurrencyInput value={multa} onValueChange={setMulta} /></div>
        </div>

        {(desconto > 0 || juros > 0 || multa > 0) && (
          <div className="text-sm text-muted-foreground">
            Valor final: <span className="font-semibold text-foreground">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorFinal)}
            </span>
          </div>
        )}

        <div><Label>Observações</Label><Input value={obs} onChange={e => setObs(e.target.value)} /></div>
        <Button onClick={handleSave} disabled={salvandoCliente}>
          <Plus className="h-4 w-4 mr-1" /> Registrar
        </Button>
      </CardContent>
    </Card>
  );
}
