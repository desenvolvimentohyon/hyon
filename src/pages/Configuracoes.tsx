import { useState, useMemo, lazy, Suspense } from "react";
import { useApp } from "@/contexts/AppContext";
import { usePropostas } from "@/contexts/PropostasContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useParametros } from "@/contexts/ParametrosContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { STATUS_ORDER } from "@/types";
import { FormaEnvio } from "@/types/propostas";
import { MetricasConfig } from "@/types/receita";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { SubtabGrid, type SubtabItem } from "@/components/configuracoes/SubtabGrid";
import {
  Download, Upload, Plus, Trash2, GripVertical, Loader2, Building2, Settings,
  Monitor, Puzzle, CreditCard, Tag, Pencil, Percent, AlertTriangle,
  FileText, BarChart3, Palette, Database, Rocket, Bell, Filter, Users, Code2
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";

const MinhaEmpresa = lazy(() => import("@/components/configuracoes/MinhaEmpresa"));
const TabImplantacao = lazy(() => import("@/components/configuracoes/TabImplantacao"));
const PushNotificationsSettings = lazy(() => import("@/components/configuracoes/PushNotificationsSettings"));
const UsuariosConfig = lazy(() => import("@/pages/UsuariosConfig"));
const TabDesenvolvimento = lazy(() => import("@/components/configuracoes/TabDesenvolvimento"));


const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Configuracoes() {
  const { configuracoes, updateConfiguracoes, resetDados, exportJSON, importJSON } = useApp();
  const { crmConfig, updateCRMConfig, resetCRMConfig, resetPropostas } = usePropostas();
  const { metricasConfig, updateMetricasConfig, resetReceita } = useReceita();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const {
    sistemas, modulos, formasPagamento, planos, alertaCertificadoDias,
    addSistema, updateSistema, deleteSistema,
    addModulo, updateModulo, deleteModulo,
    addFormaPagamento, updateFormaPagamento, deleteFormaPagamento,
    addPlano, updatePlano, deletePlano,
    setAlertaCertificadoDias,
  } = useParametros();

  const [labels, setLabels] = useState({ ...configuracoes.labelsStatus });
  const [prioridadeLabels, setPrioridadeLabels] = useState({ ...configuracoes.labelsPrioridade });
  const [importText, setImportText] = useState("");

  // CRM config local state
  const [crmStatusList, setCrmStatusList] = useState([...crmConfig.statusKanban]);
  const [novoStatus, setNovoStatus] = useState("");
  const [crmForma, setCrmForma] = useState(crmConfig.formaEnvioPadrao);
  const [crmMensagem, setCrmMensagem] = useState(crmConfig.mensagemPadraoEnvio);
  const [crmValidade, setCrmValidade] = useState(crmConfig.validadePadraoDias);
  const [crmEmpresa, setCrmEmpresa] = useState(crmConfig.nomeEmpresa);
  const [crmRodape, setCrmRodape] = useState(crmConfig.rodapePDF);
  const [crmInfoPadrao, setCrmInfoPadrao] = useState(crmConfig.informacoesAdicionaisPadrao);
  const [crmAssinatura, setCrmAssinatura] = useState(crmConfig.exibirAssinaturaDigitalFake);

  // Metricas config
  const [metPeriodo, setMetPeriodo] = useState<string>(metricasConfig.periodoPadrao);
  const [metChurnWindow, setMetChurnWindow] = useState(metricasConfig.churnWindowMeses);
  const [metMoeda, setMetMoeda] = useState(metricasConfig.moeda);

  // Parametros modal state
  const [modal, setModal] = useState<{ type: string; editing: string | null } | null>(null);
  const [fSistema, setFSistema] = useState({ nome: "", descricao: "", valorCusto: 0, valorVenda: 0, ativo: true });
  const [fModulo, setFModulo] = useState({ nome: "", descricao: "", valorCusto: 0, valorVenda: 0, ativo: true, sistemaId: "none", isGlobal: false });
  const [fForma, setFForma] = useState({ nome: "", ativo: true, observacao: "" });
  const [filtroSistemaModulo, setFiltroSistemaModulo] = useState("todos");

  const modulosFiltrados = useMemo(() => {
    if (filtroSistemaModulo === "todos") return modulos;
    if (filtroSistemaModulo === "global") return modulos.filter(m => m.isGlobal);
    return modulos.filter(m => !m.isGlobal && m.sistemaId === filtroSistemaModulo);
  }, [modulos, filtroSistemaModulo]);
  const [fPlano, setFPlano] = useState({ nomePlano: "", descontoPercentual: 0, validadeMeses: 1, ativo: true });
  const [alertaDias, setAlertaDias] = useState(alertaCertificadoDias);

  // Subtab grid items
  const subtabItems: SubtabItem[] = [
    { value: "sistemas", label: "Sistemas", description: "Cadastro de sistemas", icon: Monitor, colorClass: "text-primary", bgClass: "bg-primary/10", borderClass: "border-primary/30" },
    { value: "modulos", label: "Módulos", description: "Módulos vinculados", icon: Puzzle, colorClass: "text-purple-500", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/30" },
    { value: "pagamento", label: "Formas de Pagamento", description: "Meios de cobrança", icon: CreditCard, colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10", borderClass: "border-emerald-500/30" },
    { value: "planos", label: "Planos e Descontos", description: "Vigência e desconto", icon: Tag, colorClass: "text-amber-500", bgClass: "bg-amber-500/10", borderClass: "border-amber-500/30" },
    { value: "implantacao", label: "Implantação", description: "Custos de deploy", icon: Rocket, colorClass: "text-violet-500", bgClass: "bg-violet-500/10", borderClass: "border-violet-500/30" },
    { value: "propostas", label: "Propostas / CRM", description: "Pipeline e envio", icon: FileText, colorClass: "text-indigo-500", bgClass: "bg-indigo-500/10", borderClass: "border-indigo-500/30" },
    { value: "metricas", label: "Métricas", description: "Dashboard e receita", icon: BarChart3, colorClass: "text-teal-500", bgClass: "bg-teal-500/10", borderClass: "border-teal-500/30" },
    { value: "labels", label: "Labels", description: "Nomenclaturas", icon: Palette, colorClass: "text-slate-500", bgClass: "bg-slate-500/10", borderClass: "border-slate-500/30" },
    { value: "alertas", label: "Alertas", description: "Notificações", icon: AlertTriangle, colorClass: "text-red-500", bgClass: "bg-red-500/10", borderClass: "border-red-500/30" },
    { value: "push", label: "Push", description: "Notificações push", icon: Bell, colorClass: "text-orange-500", bgClass: "bg-orange-500/10", borderClass: "border-orange-500/30" },
    { value: "dados", label: "Dados", description: "Importar / Exportar", icon: Database, colorClass: "text-sky-500", bgClass: "bg-sky-500/10", borderClass: "border-sky-500/30" },
    { value: "usuarios", label: "Usuários", description: "Acessos e perfis", icon: Users, colorClass: "text-pink-500", bgClass: "bg-pink-500/10", borderClass: "border-pink-500/30" },
    { value: "desenvolvimento", label: "Desenvolvimento", description: "Templates de projeto", icon: Code2, colorClass: "text-indigo-500", bgClass: "bg-indigo-500/10", borderClass: "border-indigo-500/30" },
  ];

  // Subtab state for "Configurações Gerais"
  const [geralSubtab, setGeralSubtab] = useState("sistemas");

  // Parametros CRUD helpers
  const openNewSistema = () => { setFSistema({ nome: "", descricao: "", valorCusto: 0, valorVenda: 0, ativo: true }); setModal({ type: "sistema", editing: null }); };
  const openEditSistema = (id: string) => { const s = sistemas.find(x => x.id === id); if (s) { setFSistema(s); setModal({ type: "sistema", editing: id }); } };
  const saveSistema = () => { if (!fSistema.nome.trim()) { sonnerToast.error("Nome obrigatório"); return; } modal?.editing ? updateSistema(modal.editing, fSistema) : addSistema(fSistema); setModal(null); sonnerToast.success("Sistema salvo!"); };

  const openNewModulo = () => { setFModulo({ nome: "", descricao: "", valorCusto: 0, valorVenda: 0, ativo: true, sistemaId: "none", isGlobal: false }); setModal({ type: "modulo", editing: null }); };
  const openEditModulo = (id: string) => { const m = modulos.find(x => x.id === id); if (m) { setFModulo({ ...m, sistemaId: m.sistemaId || "none", isGlobal: m.isGlobal || false }); setModal({ type: "modulo", editing: id }); } };
  const saveModulo = () => { if (!fModulo.nome.trim()) { sonnerToast.error("Nome obrigatório"); return; } const data = { ...fModulo, sistemaId: fModulo.isGlobal ? "" : (fModulo.sistemaId === "none" ? "" : fModulo.sistemaId) }; modal?.editing ? updateModulo(modal.editing, data) : addModulo(data); setModal(null); sonnerToast.success("Módulo salvo!"); };

  const openNewForma = () => { setFForma({ nome: "", ativo: true, observacao: "" }); setModal({ type: "forma", editing: null }); };
  const openEditForma = (id: string) => { const f = formasPagamento.find(x => x.id === id); if (f) { setFForma({ nome: f.nome, ativo: f.ativo, observacao: f.observacao || "" }); setModal({ type: "forma", editing: id }); } };
  const saveForma = () => { if (!fForma.nome.trim()) { sonnerToast.error("Nome obrigatório"); return; } modal?.editing ? updateFormaPagamento(modal.editing, fForma) : addFormaPagamento(fForma); setModal(null); sonnerToast.success("Forma de pagamento salva!"); };

  const openNewPlano = () => { setFPlano({ nomePlano: "", descontoPercentual: 0, validadeMeses: 1, ativo: true }); setModal({ type: "plano", editing: null }); };
  const openEditPlano = (id: string) => { const p = planos.find(x => x.id === id); if (p) { setFPlano(p); setModal({ type: "plano", editing: id }); } };
  const savePlano = () => { if (!fPlano.nomePlano.trim()) { sonnerToast.error("Nome obrigatório"); return; } modal?.editing ? updatePlano(modal.editing, fPlano) : addPlano(fPlano); setModal(null); sonnerToast.success("Plano salvo!"); };

  const saveLabels = () => {
    updateConfiguracoes({ labelsStatus: labels, labelsPrioridade: prioridadeLabels });
    toast({ title: "Labels atualizados!" });
  };

  const saveCRM = () => {
    updateCRMConfig({
      statusKanban: crmStatusList,
      formaEnvioPadrao: crmForma,
      mensagemPadraoEnvio: crmMensagem,
      validadePadraoDias: crmValidade,
      nomeEmpresa: crmEmpresa,
      rodapePDF: crmRodape,
      informacoesAdicionaisPadrao: crmInfoPadrao,
      exibirAssinaturaDigitalFake: crmAssinatura,
    });
    toast({ title: "Configurações de propostas salvas!" });
  };

  const addCrmStatus = () => {
    const s = novoStatus.trim();
    if (s && !crmStatusList.includes(s)) {
      setCrmStatusList(prev => [...prev, s]);
      setNovoStatus("");
    }
  };

  const removeCrmStatus = (s: string) => setCrmStatusList(prev => prev.filter(x => x !== s));

  const handleExport = () => {
    const data = exportJSON();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "gestao-tarefas-backup.json"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Dados exportados!" });
  };

  const handleImport = () => {
    if (importJSON(importText)) {
      toast({ title: "Dados importados com sucesso!" });
      setImportText("");
    } else {
      toast({ title: "Erro ao importar JSON", variant: "destructive" });
    }
  };

  const handleReset = () => {
    resetDados();
    resetPropostas();
    resetReceita();
    setLabels({ ...configuracoes.labelsStatus });
    setPrioridadeLabels({ ...configuracoes.labelsPrioridade });
    toast({ title: "Dados resetados para o padrão!" });
  };

  const saveMetricas = () => {
    updateMetricasConfig({ periodoPadrao: metPeriodo as MetricasConfig["periodoPadrao"], churnWindowMeses: metChurnWindow, moeda: metMoeda });
    toast({ title: "Configurações de métricas salvas!" });
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Settings} iconClassName="text-muted-foreground" title="Configurações" />
      <ModuleNavGrid moduleId="configuracoes" />

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="mb-4">
          {isAdmin && <TabsTrigger value="empresa" className="gap-1.5"><Building2 className="h-4 w-4" />Minha Empresa</TabsTrigger>}
          <TabsTrigger value="geral" className="gap-1.5"><Settings className="h-4 w-4" />Configurações Gerais</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <SubtabGrid items={subtabItems} value={geralSubtab} onChange={setGeralSubtab} />

          <Tabs value={geralSubtab} onValueChange={setGeralSubtab} className="w-full">
            <TabsList className="hidden" />

            {/* ── Sistemas ── */}
            <TabsContent value="sistemas" className="space-y-4">
              <div className="flex justify-end"><Button size="sm" onClick={openNewSistema} className="gap-1.5"><Plus className="h-4 w-4" />Novo Sistema</Button></div>
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Descrição</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {sistemas.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.descricao}</TableCell>
                        <TableCell>{s.ativo ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                        <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSistema(s.id)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteSistema(s.id); sonnerToast.success("Removido"); }}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
                      </TableRow>
                    ))}
                    {sistemas.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum sistema cadastrado</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>

            {/* ── Módulos ── */}
            <TabsContent value="modulos" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filtroSistemaModulo} onValueChange={setFiltroSistemaModulo}>
                    <SelectTrigger className="w-[200px] h-9 text-sm">
                      <SelectValue placeholder="Filtrar por sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os sistemas</SelectItem>
                      <SelectItem value="global">Módulos Globais</SelectItem>
                      {sistemas.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" onClick={openNewModulo} className="gap-1.5"><Plus className="h-4 w-4" />Novo Módulo</Button>
              </div>
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Sistema</TableHead><TableHead className="text-right">Custo</TableHead><TableHead className="text-right">Venda</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {modulosFiltrados.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum módulo encontrado para este filtro.</TableCell></TableRow>
                    ) : modulosFiltrados.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.isGlobal ? <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Global</Badge> : (sistemas.find(s => s.id === m.sistemaId)?.nome || "—")}</TableCell>
                        <TableCell className="text-right text-sm">{fmt(m.valorCusto)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{fmt(m.valorVenda)}</TableCell>
                        <TableCell>{m.ativo ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                        <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModulo(m.id)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteModulo(m.id); sonnerToast.success("Removido"); }}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>

            {/* ── Formas de Pagamento ── */}
            <TabsContent value="pagamento" className="space-y-4">
              <div className="flex justify-end"><Button size="sm" onClick={openNewForma} className="gap-1.5"><Plus className="h-4 w-4" />Nova Forma</Button></div>
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Observação</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {formasPagamento.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{f.observacao || "—"}</TableCell>
                        <TableCell>{f.ativo ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                        <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForma(f.id)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteFormaPagamento(f.id); sonnerToast.success("Removido"); }}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>

            {/* ── Planos e Descontos ── */}
            <TabsContent value="planos" className="space-y-4">
              <div className="flex justify-end"><Button size="sm" onClick={openNewPlano} className="gap-1.5"><Plus className="h-4 w-4" />Novo Plano</Button></div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {planos.map(p => (
                  <Card key={p.id} className={!p.ativo ? "opacity-50" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{p.nomePlano}</CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditPlano(p.id)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deletePlano(p.id); sonnerToast.success("Removido"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-primary" />
                          <span className="text-2xl font-bold">{p.descontoPercentual}%</span>
                          <span className="text-sm text-muted-foreground">de desconto</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{p.validadeMeses} {p.validadeMeses === 1 ? "mês" : "meses"} de vigência</div>
                        {p.ativo ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                        {p.descontoPercentual > 0 && (
                          <div className="text-xs text-muted-foreground mt-2 p-2 rounded border bg-muted/30">
                            Ex: R$ 200,00 → <span className="line-through">R$ 200,00</span> <span className="font-bold text-foreground">{fmt(200 * (1 - p.descontoPercentual / 100))}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ── Implantação ── */}
            <TabsContent value="implantacao" className="space-y-4">
              <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
                <TabImplantacao />
              </Suspense>
            </TabsContent>

            {/* ── Propostas / CRM ── */}
            <TabsContent value="propostas" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Propostas — CRM Pipeline</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium">Status do Pipeline (colunas Kanban)</Label>
                    <div className="space-y-1 mt-2">
                      {crmStatusList.map((s) => (
                        <div key={s} className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1">
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm flex-1">{s}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCrmStatus(s)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input className="h-8" placeholder="Novo status..." value={novoStatus} onChange={e => setNovoStatus(e.target.value)} onKeyDown={e => e.key === "Enter" && addCrmStatus()} />
                      <Button size="sm" variant="outline" onClick={addCrmStatus} className="gap-1"><Plus className="h-3 w-3" />Adicionar</Button>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs">Forma de Envio Padrão</Label>
                    <Select value={crmForma} onValueChange={v => setCrmForma(v as FormaEnvio)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="manual_link">Link Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Mensagem Padrão de Envio</Label>
                    <Textarea rows={3} value={crmMensagem} onChange={e => setCrmMensagem(e.target.value)} />
                    <p className="text-[10px] text-muted-foreground mt-1">Variáveis: {"{cliente}"}, {"{numeroProposta}"}, {"{sistema}"}, {"{mensalidade}"}, {"{implantacao}"}, {"{linkAceite}"}, {"{validade}"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Validade Padrão (dias)</Label>
                      <Input type="number" className="h-8" value={crmValidade} onChange={e => setCrmValidade(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label className="text-xs">Nome da Empresa</Label>
                      <Input className="h-8" value={crmEmpresa} onChange={e => setCrmEmpresa(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Rodapé PDF</Label>
                    <Input className="h-8" value={crmRodape} onChange={e => setCrmRodape(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Informações Adicionais Padrão</Label>
                    <Textarea rows={2} value={crmInfoPadrao} onChange={e => setCrmInfoPadrao(e.target.value)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Assinatura Digital Fake no PDF</Label>
                    <Switch checked={crmAssinatura} onCheckedChange={setCrmAssinatura} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveCRM}>Salvar Configurações</Button>
                    <Button size="sm" variant="outline" onClick={() => { resetCRMConfig(); toast({ title: "Config CRM restaurada!" }); }}>Restaurar Padrão</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Métricas ── */}
            <TabsContent value="metricas" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Métricas & Receita</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Período Padrão do Dashboard</Label>
                      <Select value={metPeriodo} onValueChange={setMetPeriodo}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30d">30 dias</SelectItem>
                          <SelectItem value="90d">90 dias</SelectItem>
                          <SelectItem value="12m">12 meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Churn Window (meses)</Label>
                      <Input type="number" className="h-8" value={metChurnWindow} onChange={e => setMetChurnWindow(Number(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Moeda / Formatação</Label>
                    <Select value={metMoeda} onValueChange={setMetMoeda}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">R$ (BRL - pt-BR)</SelectItem>
                        <SelectItem value="USD">$ (USD - en-US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveMetricas}>Salvar Métricas</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Labels ── */}
            <TabsContent value="labels" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Labels de Status</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {STATUS_ORDER.map(s => (
                    <div key={s} className="flex items-center gap-3">
                      <Label className="w-40 text-xs text-muted-foreground">{s}</Label>
                      <Input value={labels[s]} onChange={e => setLabels(prev => ({ ...prev, [s]: e.target.value }))} className="h-8" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Labels de Prioridade</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {(["baixa", "media", "alta", "urgente"] as const).map(p => (
                    <div key={p} className="flex items-center gap-3">
                      <Label className="w-40 text-xs text-muted-foreground">{p}</Label>
                      <Input value={prioridadeLabels[p]} onChange={e => setPrioridadeLabels(prev => ({ ...prev, [p]: e.target.value }))} className="h-8" />
                    </div>
                  ))}
                  <Button size="sm" onClick={saveLabels}>Salvar Labels</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Aparência</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label>Modo Compacto</Label>
                    <Switch checked={configuracoes.modoCompacto} onCheckedChange={v => updateConfiguracoes({ modoCompacto: v })} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Alertas ── */}
            <TabsContent value="alertas" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Configuração de Alertas</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-w-sm">
                    <Label>Dias de antecedência para alerta de certificado digital</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="number" value={alertaDias} onChange={e => setAlertaDias(Number(e.target.value))} className="h-9" />
                      <Button size="sm" onClick={() => { setAlertaCertificadoDias(alertaDias); sonnerToast.success("Alerta configurado!"); }}>Salvar</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Certificados que vencem dentro deste período serão exibidos no dashboard.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Notificações Push ── */}
            <TabsContent value="push" className="space-y-4">
              <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
                <PushNotificationsSettings />
              </Suspense>
            </TabsContent>

            {/* ── Dados ── */}
            <TabsContent value="dados" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Dados</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5"><Download className="h-3.5 w-3.5" />Exportar JSON</Button>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Importar JSON</Label>
                    <Textarea value={importText} onChange={e => setImportText(e.target.value)} rows={4} placeholder='Cole o JSON exportado aqui...' />
                    <Button size="sm" onClick={handleImport} disabled={!importText.trim()} className="gap-1.5"><Upload className="h-3.5 w-3.5" />Importar</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Usuários ── */}
            <TabsContent value="usuarios">
              <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
                <UsuariosConfig />
              </Suspense>
            </TabsContent>

            {/* ── Desenvolvimento ── */}
            <TabsContent value="desenvolvimento">
              <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
                <TabDesenvolvimento />
              </Suspense>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="empresa">
            <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
              <MinhaEmpresa />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>

      {/* ── Modais de Parâmetros ── */}
      <Dialog open={modal?.type === "sistema"} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{modal?.editing ? "Editar Sistema" : "Novo Sistema"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={fSistema.nome} onChange={e => setFSistema(p => ({ ...p, nome: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Input value={fSistema.descricao} onChange={e => setFSistema(p => ({ ...p, descricao: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={fSistema.ativo} onCheckedChange={v => setFSistema(p => ({ ...p, ativo: v }))} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={saveSistema}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal?.type === "modulo"} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{modal?.editing ? "Editar Módulo" : "Novo Módulo"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={fModulo.nome} onChange={e => setFModulo(p => ({ ...p, nome: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Input value={fModulo.descricao} onChange={e => setFModulo(p => ({ ...p, descricao: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={fModulo.isGlobal} onCheckedChange={v => setFModulo(p => ({ ...p, isGlobal: v, sistemaId: v ? "none" : p.sistemaId }))} /><Label>Módulo Global</Label></div>
            {!fModulo.isGlobal && (
              <div><Label>Sistema vinculado</Label>
                <Select value={fModulo.sistemaId} onValueChange={v => setFModulo(p => ({ ...p, sistemaId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {sistemas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor Custo</Label><CurrencyInput value={fModulo.valorCusto} onValueChange={v => setFModulo(p => ({ ...p, valorCusto: v }))} /></div>
              <div><Label>Valor Venda</Label><CurrencyInput value={fModulo.valorVenda} onValueChange={v => setFModulo(p => ({ ...p, valorVenda: v }))} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={fModulo.ativo} onCheckedChange={v => setFModulo(p => ({ ...p, ativo: v }))} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={saveModulo}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal?.type === "forma"} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{modal?.editing ? "Editar Forma" : "Nova Forma de Pagamento"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={fForma.nome} onChange={e => setFForma(p => ({ ...p, nome: e.target.value }))} /></div>
            <div><Label>Observação</Label><Input value={fForma.observacao} onChange={e => setFForma(p => ({ ...p, observacao: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={fForma.ativo} onCheckedChange={v => setFForma(p => ({ ...p, ativo: v }))} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={saveForma}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal?.type === "plano"} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{modal?.editing ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do Plano *</Label><Input value={fPlano.nomePlano} onChange={e => setFPlano(p => ({ ...p, nomePlano: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Desconto (%)</Label><Input type="number" value={fPlano.descontoPercentual} onChange={e => setFPlano(p => ({ ...p, descontoPercentual: Number(e.target.value) }))} /></div>
              <div><Label>Validade (meses)</Label><Input type="number" value={fPlano.validadeMeses} onChange={e => setFPlano(p => ({ ...p, validadeMeses: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={fPlano.ativo} onCheckedChange={v => setFPlano(p => ({ ...p, ativo: v }))} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={savePlano}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
