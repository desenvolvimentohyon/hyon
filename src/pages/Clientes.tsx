import { useState, useMemo, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, ArrowLeft, Cloud, CreditCard, Monitor, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { calcularScoreSaude, scoreSaudeLabel } from "@/lib/constants";
import { PerfilCliente, SistemaRelacionado, StatusFinanceiro } from "@/types";
import { validateCNPJ, cleanCNPJ, maskDocument, CnpjLookupResult } from "@/lib/cnpjUtils";
import { supabase } from "@/integrations/supabase/client";

export default function Clientes() {
  const { clientes, addCliente, updateCliente, tarefas, getStatusLabel, getPrioridadeLabel } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [showNovo, setShowNovo] = useState(searchParams.get("novo") === "1");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // form
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [obs, setObs] = useState("");
  const [sistemaUsado, setSistemaUsado] = useState<SistemaRelacionado>("hyon");
  const [tipoNegocio, setTipoNegocio] = useState("");
  const [perfilCliente, setPerfilCliente] = useState<PerfilCliente>("estrategico");
  const [mensalidade, setMensalidade] = useState("");
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjLookupData, setCnpjLookupData] = useState<CnpjLookupResult | null>(null);
  const [showCnpjConfirm, setShowCnpjConfirm] = useState(false);

  const filtered = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));
  const selected = clientes.find(c => c.id === selectedId);
  const clienteTarefas = selectedId ? tarefas.filter(t => t.clienteId === selectedId) : [];

  const applyCnpjData = useCallback((data: CnpjLookupResult) => {
    if (data.nome) setNome(data.nome);
    if (data.email) setEmail(data.email);
    if (data.telefone) setTelefone(data.telefone);
    if (data.municipio) {
      const cidade = data.uf ? `${data.municipio}/${data.uf}` : data.municipio;
      setObs(prev => {
        const lines: string[] = [];
        if (data.logradouro) lines.push(`End: ${data.logradouro}${data.numero ? `, ${data.numero}` : ""}${data.complemento ? ` - ${data.complemento}` : ""}`);
        if (data.bairro) lines.push(`Bairro: ${data.bairro}`);
        lines.push(`Cidade: ${cidade}`);
        if (data.cep) lines.push(`CEP: ${data.cep}`);
        if (data.situacao) lines.push(`Situação: ${data.situacao}`);
        if (data.fantasia) lines.push(`Fantasia: ${data.fantasia}`);
        const extra = lines.join("\n");
        return prev ? `${prev}\n---\n${extra}` : extra;
      });
    }
    toast({ title: "Dados do CNPJ preenchidos!" });
  }, []);

  const handleDocumentoChange = useCallback(async (value: string) => {
    const masked = maskDocument(value);
    setDocumento(masked);
    const cleaned = cleanCNPJ(masked);
    if (cleaned.length !== 14 || !validateCNPJ(cleaned)) return;

    setCnpjLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cnpj-lookup", { body: { cnpj: cleaned } });
      if (error || !data || data.error) {
        const msg = data?.error || "Erro ao consultar CNPJ";
        toast({ title: msg, variant: "destructive" });
        return;
      }
      const hasExisting = !!(nome || email || telefone);
      if (hasExisting) {
        setCnpjLookupData(data);
        setShowCnpjConfirm(true);
      } else {
        applyCnpjData(data);
      }
    } catch {
      toast({ title: "Erro ao consultar CNPJ. Tente novamente.", variant: "destructive" });
    } finally {
      setCnpjLoading(false);
    }
  }, [nome, email, telefone, applyCnpjData]);

  const getScore = (clienteId: string) => {
    const c = clientes.find(cl => cl.id === clienteId);
    if (!c) return { score: 0, saude: scoreSaudeLabel(0) };
    const chamados = tarefas.filter(t => t.tipoOperacional === "suporte" && t.clienteId === clienteId);
    const concluidos = chamados.filter(t => t.status === "concluida");
    const tempoMedio = concluidos.length > 0 ? concluidos.reduce((a, t) => a + t.tempoTotalSegundos, 0) / concluidos.length / 3600 : 0;
    const score = calcularScoreSaude(chamados.length, c.statusFinanceiro, tempoMedio);
    return { score, saude: scoreSaudeLabel(score) };
  };

  const handleCriar = () => {
    if (!nome.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    addCliente({
      nome: nome.trim(), telefone: telefone || undefined, email: email || undefined,
      documento: documento || undefined, observacoes: obs || undefined,
      sistemaUsado, tipoNegocio: tipoNegocio || undefined, perfilCliente,
      mensalidadeAtual: Number(mensalidade) || 0, statusFinanceiro: "em_dia",
    });
    toast({ title: "Cliente cadastrado!" });
    setShowNovo(false);
    setNome(""); setTelefone(""); setEmail(""); setDocumento(""); setObs(""); setTipoNegocio(""); setMensalidade("");
  };

  if (selected) {
    const { score, saude } = getScore(selected.id);
    return (
      <div className="space-y-4 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1.5 -ml-2"><ArrowLeft className="h-4 w-4" />Voltar</Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{selected.nome}</h1>
          <Badge className={`${saude.className}`}>{saude.label} ({score})</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6 space-y-2 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dados Cadastrais</p>
              {selected.telefone && <p><span className="text-muted-foreground">Telefone:</span> {selected.telefone}</p>}
              {selected.email && <p><span className="text-muted-foreground">Email:</span> {selected.email}</p>}
              {selected.documento && <p><span className="text-muted-foreground">Documento:</span> {selected.documento}</p>}
              {selected.observacoes && <p><span className="text-muted-foreground">Obs:</span> {selected.observacoes}</p>}
              <p><span className="text-muted-foreground">Cadastrado em:</span> {new Date(selected.criadoEm).toLocaleDateString("pt-BR")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Perfil Técnico</p>
              <p><span className="text-muted-foreground">Sistema:</span> {selected.sistemaUsado?.toUpperCase() || "—"}</p>
              <p><span className="text-muted-foreground">Tipo Negócio:</span> {selected.tipoNegocio || "—"}</p>
              <p><span className="text-muted-foreground">Perfil:</span> {selected.perfilCliente || "—"}</p>
              <div className="flex gap-2 pt-1">
                {selected.usaCloud && <Badge variant="outline" className="text-[10px] gap-1"><Cloud className="h-3 w-3" />Cloud</Badge>}
                {selected.usaTEF && <Badge variant="outline" className="text-[10px] gap-1"><CreditCard className="h-3 w-3" />TEF</Badge>}
                {selected.usaPagamentoIntegrado && <Badge variant="outline" className="text-[10px] gap-1"><Monitor className="h-3 w-3" />Pag. Integrado</Badge>}
              </div>
              <p><span className="text-muted-foreground">Mensalidade:</span> R$ {selected.mensalidadeAtual || 0}/mês</p>
              <p><span className="text-muted-foreground">Status Financeiro:</span> {
                selected.statusFinanceiro === "em_dia" ? "Em dia" :
                selected.statusFinanceiro === "1_atraso" ? "1 atraso" : "2+ atrasos"
              }</p>
              {selected.riscoCancelamento && <Badge variant="destructive" className="text-[10px]">Risco de Cancelamento</Badge>}
            </CardContent>
          </Card>
        </div>

        <h2 className="text-lg font-semibold">Tarefas ({clienteTarefas.length})</h2>
        {clienteTarefas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tarefa vinculada</p>
        ) : (
          <div className="space-y-2">
            {clienteTarefas.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/tarefas/${t.id}`)}>
                <Badge variant="outline" className="text-[10px]">{getStatusLabel(t.status)}</Badge>
                <span className="text-sm font-medium flex-1">{t.titulo}</span>
                <Badge variant="outline" className="text-[10px]">{getPrioridadeLabel(t.prioridade)}</Badge>
              </div>
            ))}
          </div>
        )}
        <Button size="sm" onClick={() => navigate(`/tarefas?nova=1`)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Nova Tarefa</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <Button size="sm" onClick={() => setShowNovo(true)} className="gap-1.5"><Plus className="h-4 w-4" />Novo Cliente</Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 h-9" />
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Sistema</TableHead>
              <TableHead className="hidden md:table-cell">Mensalidade</TableHead>
              <TableHead>Saúde</TableHead>
              <TableHead>Tarefas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => {
              const { score, saude } = getScore(c.id);
              return (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(c.id)}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{c.nome}</span>
                      {c.riscoCancelamento && <Badge variant="destructive" className="text-[9px] ml-2">Risco</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{c.sistemaUsado?.toUpperCase() || "—"}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">R$ {c.mensalidadeAtual || 0}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${saude.className}`}>{score}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{tarefas.filter(t => t.clienteId === c.id).length}</Badge></TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showNovo} onOpenChange={setShowNovo}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Label>Documento (CNPJ)</Label>
                <div className="relative">
                  <Input value={documento} onChange={e => handleDocumentoChange(e.target.value)} placeholder="00.000.000/0000-00" />
                  {cnpjLoading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
              <div>
                <Label>Sistema</Label>
                <Select value={sistemaUsado} onValueChange={v => setSistemaUsado(v as SistemaRelacionado)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hyon">Hyon</SelectItem>
                    <SelectItem value="linkpro">LinkPro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo Negócio</Label><Input value={tipoNegocio} onChange={e => setTipoNegocio(e.target.value)} placeholder="Ex: Supermercado" /></div>
              <div>
                <Label>Perfil</Label>
                <Select value={perfilCliente} onValueChange={v => setPerfilCliente(v as PerfilCliente)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estrategico">Estratégico</SelectItem>
                    <SelectItem value="conservador">Conservador</SelectItem>
                    <SelectItem value="resistente">Resistente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Mensalidade (R$)</Label><Input type="number" value={mensalidade} onChange={e => setMensalidade(e.target.value)} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovo(false)}>Cancelar</Button>
            <Button onClick={handleCriar}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCnpjConfirm} onOpenChange={setShowCnpjConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir dados?</AlertDialogTitle>
            <AlertDialogDescription>Deseja substituir os dados atuais pelos dados da Receita Federal?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (cnpjLookupData) applyCnpjData(cnpjLookupData); setShowCnpjConfirm(false); }}>Substituir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
