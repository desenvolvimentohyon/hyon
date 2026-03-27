import { useState, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Loader2, Eye, ClipboardPlus, Trash2, Users, ListChecks } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { calcularScoreSaude, scoreSaudeLabel } from "@/lib/constants";
import { PerfilCliente, SistemaRelacionado, StatusFinanceiro } from "@/types";
import { validateCNPJ, cleanCNPJ, maskDocument, CnpjLookupResult } from "@/lib/cnpjUtils";
import { useParametros } from "@/contexts/ParametrosContext";
import { supabase } from "@/integrations/supabase/client";
import ClienteDetalhe from "@/components/clientes/ClienteDetalhe";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { EmptyState } from "@/components/ui/empty-state";
import { RowActions } from "@/components/ui/row-actions";

export default function Clientes() {
  const { clientes, addCliente, deleteCliente, tarefas } = useApp();
  const { sistemas } = useParametros();
  const sistemasAtivos = sistemas.filter(s => s.ativo);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [showNovo, setShowNovo] = useState(searchParams.get("novo") === "1");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteJustificativa, setDeleteJustificativa] = useState("");

  // Batch edit state
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchDueDay, setBatchDueDay] = useState("");
  const [batchAdjType, setBatchAdjType] = useState("");
  const [batchAdjPercent, setBatchAdjPercent] = useState("");
  const [batchTaxRegime, setBatchTaxRegime] = useState("");
  const [batchBillingPlan, setBatchBillingPlan] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  // form
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [obs, setObs] = useState("");
  const [sistemaUsado, setSistemaUsado] = useState<SistemaRelacionado>("");
  const [tipoNegocio, setTipoNegocio] = useState("");
  const [perfilCliente, setPerfilCliente] = useState<PerfilCliente>("estrategico");
  const [mensalidade, setMensalidade] = useState("");
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState("");
  const [cnpjLookupData, setCnpjLookupData] = useState<CnpjLookupResult | null>(null);
  const [showCnpjConfirm, setShowCnpjConfirm] = useState(false);

  const filtered = clientes.filter(c => {
    const term = busca.toLowerCase();
    return c.nome.toLowerCase().includes(term) || (c.nomeFantasia || "").toLowerCase().includes(term) || (c.razaoSocial || "").toLowerCase().includes(term);
  });
  

  const applyCnpjData = useCallback((data: CnpjLookupResult) => {
    if (data.fantasia) setNomeFantasia(data.fantasia);
    if (data.nome) setRazaoSocial(data.nome);
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
    if (cleaned.length === 14 && !validateCNPJ(cleaned)) {
      setCnpjError("CNPJ inválido");
      return;
    }
    setCnpjError("");
    if (cleaned.length !== 14) return;

    setCnpjLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cnpj-lookup", { body: { cnpj: cleaned } });
      if (error || !data || data.error) {
        const msg = data?.error || "Erro ao consultar CNPJ";
        toast({ title: msg, variant: "destructive" });
        return;
      }
      const hasExisting = !!(nomeFantasia || razaoSocial || email || telefone);
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
  }, [nomeFantasia, razaoSocial, email, telefone, applyCnpjData]);

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
    if (!nomeFantasia.trim()) { toast({ title: "Nome Fantasia obrigatório", variant: "destructive" }); return; }
    const cleanDoc = cleanCNPJ(documento);
    if (cleanDoc.length >= 14 && !validateCNPJ(cleanDoc)) { toast({ title: "CNPJ inválido. Corrija antes de salvar.", variant: "destructive" }); return; }
    addCliente({
      nome: nomeFantasia.trim(), nomeFantasia: nomeFantasia.trim(), razaoSocial: razaoSocial.trim() || undefined,
      telefone: telefone || undefined, email: email || undefined,
      documento: documento || undefined, observacoes: obs || undefined,
      sistemaUsado, tipoNegocio: tipoNegocio || undefined, perfilCliente,
      mensalidadeAtual: Number(mensalidade) || 0, statusFinanceiro: "em_dia",
    });
    toast({ title: "Cliente cadastrado!" });
    setShowNovo(false);
    setNomeFantasia(""); setRazaoSocial(""); setTelefone(""); setEmail(""); setDocumento(""); setObs(""); setTipoNegocio(""); setMensalidade("");
  };

  if (selectedId) {
    return <ClienteDetalhe clienteId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        actions={<Button size="sm" onClick={() => setShowNovo(true)} className="gap-1.5"><Plus className="h-4 w-4" />Novo Cliente</Button>}
      />
      <ModuleNavGrid moduleId="clientes" />
      
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
              <TableHead className="hidden md:table-cell">Custo</TableHead>
              <TableHead className="hidden md:table-cell">Margem</TableHead>
              <TableHead>Saúde</TableHead>
              <TableHead>Tarefas</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    icon={Users}
                    title="Nenhum cliente encontrado"
                    description={busca ? "Tente outro termo de busca" : "Cadastre seu primeiro cliente para começar"}
                    actionLabel={!busca ? "Cadastrar primeiro cliente" : undefined}
                    onAction={!busca ? () => setShowNovo(true) : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : filtered.map(c => {
              const { score, saude } = getScore(c.id);
              return (
                <TableRow key={c.id} className="group cursor-pointer hover:bg-accent/40 transition-colors duration-150" onClick={() => setSelectedId(c.id)}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{c.nome}</span>
                      {c.riscoCancelamento && <Badge variant="destructive" className="text-[9px] ml-2">Risco</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{c.sistemaUsado?.toUpperCase() || "—"}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">R$ {(c.mensalidadeAtual || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">R$ {(c.custoMensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className={`hidden md:table-cell font-medium ${((c.mensalidadeAtual || 0) - (c.custoMensal || 0)) >= 0 ? "text-green-500" : "text-destructive"}`}>R$ {((c.mensalidadeAtual || 0) - (c.custoMensal || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${saude.className}`}>{score}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{tarefas.filter(t => t.clienteId === c.id).length}</Badge></TableCell>
                  <TableCell>
                     <RowActions actions={[
                      { label: "Ver detalhes", icon: Eye, onClick: () => setSelectedId(c.id) },
                      { label: "Nova tarefa", icon: ClipboardPlus, onClick: () => navigate(`/tarefas?nova=1`) },
                      { label: "Excluir", icon: Trash2, onClick: () => setDeleteTarget(c.id), variant: "destructive" },
                    ]} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showNovo} onOpenChange={setShowNovo}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome Fantasia *</Label><Input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} /></div>
              <div><Label>Razão Social</Label><Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Label>Documento (CNPJ)</Label>
                <div className="relative">
                  <Input value={documento} onChange={e => handleDocumentoChange(e.target.value)} placeholder="00.000.000/0000-00" className={cnpjError ? "border-destructive focus-visible:ring-destructive" : ""} />
                  {cnpjLoading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                {cnpjError && <p className="text-xs text-destructive mt-1">{cnpjError}</p>}
              </div>
              <div>
                <Label>Sistema</Label>
                <Select value={sistemaUsado} onValueChange={v => {
                  setSistemaUsado(v);
                  const sys = sistemas.find(s => s.nome === v);
                  if (sys && sys.valorVenda > 0) setMensalidade(String(sys.valorVenda));
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o sistema" /></SelectTrigger>
                  <SelectContent>
                    {sistemasAtivos.map(s => (
                      <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                    ))}
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
              <div><Label>Mensalidade (R$)</Label><CurrencyInput value={Number(mensalidade) || 0} onValueChange={v => setMensalidade(String(v))} /></div>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteJustificativa(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marcará o cliente como excluído. Informe a justificativa abaixo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label>Justificativa *</Label>
            <Textarea
              value={deleteJustificativa}
              onChange={e => setDeleteJustificativa(e.target.value)}
              placeholder="Informe o motivo da exclusão..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleteJustificativa.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget && deleteJustificativa.trim()) {
                  deleteCliente(deleteTarget, deleteJustificativa.trim());
                  toast({ title: "Cliente excluído com sucesso" });
                  setDeleteTarget(null);
                  setDeleteJustificativa("");
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
