import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useReceita } from "@/contexts/ReceitaContext";
import { useParametros } from "@/contexts/ParametrosContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, X, TrendingUp, Globe, Copy, Loader2, Users, Eye, Trash2, RefreshCw, Download } from "lucide-react";
import { RowActions, RowAction } from "@/components/ui/row-actions";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/ui/page-header";
import ClienteDetalhe from "@/components/clientes/ClienteDetalhe";
import { toast } from "@/hooks/use-toast";
import { ClienteReceita, StatusCliente, RECEITA_COLORS, getSystemColor } from "@/types/receita";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { validateCNPJ, cleanCNPJ, formatCNPJ, maskDocument, type CnpjLookupResult } from "@/lib/cnpjUtils";
import { ClienteCard } from "@/components/clientes/ClienteCard";

function PortalLinkButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-portal-token", {
        body: { client_id: clientId },
      });
      if (error) throw error;
      const url = `${window.location.origin}/portal/${data.token}`;
      setPortalUrl(url);
      navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!", description: "O link do portal foi copiado para a área de transferência." });
    } catch (err: any) {
      toast({ title: "Erro ao gerar link", description: err?.message || "Tente novamente", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" onClick={generate} disabled={loading} className="gap-1">
        <Globe className="h-3 w-3" /> {loading ? "Gerando..." : "Gerar Link Portal"}
      </Button>
      {portalUrl && (
        <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(portalUrl); toast({ title: "Link copiado!" }); }}>
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// SISTEMAS now comes from useParametros (dynamic catalog)
const STATUSES: StatusCliente[] = ["ativo", "atraso", "suspenso", "cancelado"];
const STATUS_LABELS: Record<StatusCliente, string> = { ativo: "Ativo", atraso: "Em Atraso", suspenso: "Suspenso", cancelado: "Cancelado" };
const STATUS_COLORS: Record<StatusCliente, string> = {
  ativo: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  atraso: "bg-violet-200 text-violet-900 dark:bg-violet-800/40 dark:text-violet-200",
  suspenso: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  cancelado: "bg-violet-300 text-violet-950 dark:bg-violet-700/40 dark:text-violet-100",
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Clientes() {
  const { clientesReceita, suporteEventos, addClienteReceita, updateClienteReceita, deleteClienteReceita, addMensalidadeAjuste, getAjustesCliente, loading } = useReceita();
  const { sistemas, modulos } = useParametros();
  const sistemasAtivos = sistemas.filter(s => s.ativo);
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroSistema, setFiltroSistema] = useState<string>("todos");
  const [filtroMensalidade, setFiltroMensalidade] = useState<string>("todos");
  const [showNovo, setShowNovo] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ajusteValor, setAjusteValor] = useState("");
  const [ajusteMotivo, setAjusteMotivo] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ClienteReceita | null>(null);
  const [deleteJustificativa, setDeleteJustificativa] = useState("");

  // Form state
  const [form, setForm] = useState({
    nome: "", documento: "", telefone: "", email: "", cidade: "",
    sistemaPrincipal: "",
    valorMensalidade: "", valorCustoMensal: "", observacoes: "",
  });
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(new Set());

  // Filtered modules based on selected system
  const selectedSistema = sistemas.find(s => s.nome === form.sistemaPrincipal);
  const availableModules = useMemo(() => {
    if (!selectedSistema) return [];
    return modulos.filter(m => m.ativo && (m.sistemaId === selectedSistema.id || m.isGlobal));
  }, [modulos, selectedSistema]);

  // Recalculate values when modules change
  const recalcFromModules = useCallback((moduleIds: Set<string>) => {
    let totalVenda = 0;
    let totalCusto = 0;
    moduleIds.forEach(id => {
      const mod = modulos.find(m => m.id === id);
      if (mod) { totalVenda += mod.valorVenda; totalCusto += mod.valorCusto; }
    });
    setForm(f => ({ ...f, valorMensalidade: String(totalVenda), valorCustoMensal: String(totalCusto) }));
  }, [modulos]);

  const toggleModule = useCallback((moduleId: string) => {
    setSelectedModuleIds(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      recalcFromModules(next);
      return next;
    });
  }, [recalcFromModules]);

  // CNPJ lookup state
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjLookupData, setCnpjLookupData] = useState<CnpjLookupResult | null>(null);
  const [showCnpjConfirm, setShowCnpjConfirm] = useState(false);
  const cnpjLookupRef = useRef<string>("");

  const resetForm = () => {
    setForm({ nome: "", documento: "", telefone: "", email: "", cidade: "", sistemaPrincipal: "", valorMensalidade: "", valorCustoMensal: "", observacoes: "" });
    setSelectedModuleIds(new Set());
    setCnpjLookupData(null);
  };

  // Auto-lookup CNPJ when document field changes
  const handleDocumentoChange = useCallback(async (value: string) => {
    const masked = maskDocument(value);
    setForm(f => ({ ...f, documento: masked }));
    const cleaned = cleanCNPJ(masked);
    if (cleaned.length === 14 && validateCNPJ(cleaned) && cleaned !== cnpjLookupRef.current) {
      cnpjLookupRef.current = cleaned;
      setCnpjLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("cnpj-lookup", {
          body: { cnpj: cleaned },
        });
        if (error) throw new Error(error.message || "Erro na consulta");
        if (data?.error) throw new Error(data.error);

        const lookupResult = data as CnpjLookupResult;
        // Check if any field is already filled
        const hasExistingData = form.nome || form.email || form.telefone || form.cidade;
        if (hasExistingData) {
          setCnpjLookupData(lookupResult);
          setShowCnpjConfirm(true);
        } else {
          applyCnpjData(lookupResult);
          toast({ title: "Dados preenchidos!", description: `${lookupResult.nome}` });
        }
      } catch (err: any) {
        toast({ title: "Consulta CNPJ", description: err.message || "Erro ao consultar CNPJ", variant: "destructive" });
      } finally {
        setCnpjLoading(false);
      }
    }
  }, [form.nome, form.email, form.telefone, form.cidade]);

  const applyCnpjData = useCallback((data: CnpjLookupResult) => {
    setForm(f => ({
      ...f,
      nome: data.nome || f.nome,
      email: data.email || f.email,
      telefone: data.telefone || f.telefone,
      cidade: data.municipio ? `${data.municipio}/${data.uf}` : f.cidade,
    }));
  }, []);

  const filtered = useMemo(() => {
    return clientesReceita.filter(c => {
      if (filtroStatus === "todos" && c.statusCliente === "cancelado") return false;
      if (busca && !c.nome.toLowerCase().includes(busca.toLowerCase()) && !c.documento?.includes(busca) && !c.sistemaPrincipal.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtroStatus !== "todos" && c.statusCliente !== filtroStatus) return false;
      if (filtroSistema !== "todos" && c.sistemaPrincipal !== filtroSistema) return false;
      if (filtroMensalidade === "sim" && !c.mensalidadeAtiva) return false;
      if (filtroMensalidade === "nao" && c.mensalidadeAtiva) return false;
      return true;
    });
  }, [clientesReceita, busca, filtroStatus, filtroSistema, filtroMensalidade]);

  const selected = clientesReceita.find(c => c.id === selectedId);
  const selectedEventos = selectedId ? suporteEventos.filter(e => e.clienteId === selectedId) : [];

  const handleCriar = () => {
    if (!form.nome.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    addClienteReceita({
      nome: form.nome.trim(),
      documento: form.documento || undefined,
      telefone: form.telefone || undefined,
      email: form.email || undefined,
      cidade: form.cidade || undefined,
      sistemaPrincipal: form.sistemaPrincipal as any,
      statusCliente: "ativo",
      mensalidadeAtiva: true,
      valorMensalidade: Number(form.valorMensalidade) || 0,
      dataInicio: new Date().toISOString(),
      dataCancelamento: null,
      motivoCancelamento: null,
      observacoes: form.observacoes || undefined,
      custoAtivo: true,
      valorCustoMensal: Number(form.valorCustoMensal) || 0,
      sistemaCusto: form.sistemaPrincipal as any,
    }, Array.from(selectedModuleIds));
    toast({ title: "Cliente cadastrado!" });
    setShowNovo(false);
    resetForm();
  };

  const handleStatusChange = (id: string, newStatus: StatusCliente) => {
    const changes: Partial<ClienteReceita> = { statusCliente: newStatus };
    if (newStatus === "cancelado") {
      changes.dataCancelamento = new Date().toISOString();
      changes.mensalidadeAtiva = false;
      changes.custoAtivo = false;
    } else if (newStatus === "suspenso") {
      changes.mensalidadeAtiva = false;
    } else {
      changes.mensalidadeAtiva = true;
      changes.dataCancelamento = null;
    }
    updateClienteReceita(id, changes);
    toast({ title: `Status alterado para ${STATUS_LABELS[newStatus]}` });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Detail view
  if (selectedId) {
    return <ClienteDetalhe clienteId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  // List view
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        iconClassName="text-primary"
        title="Clientes e Receita"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5"><Download className="h-4 w-4" />Exportar ({filtered.length})</Button>
            <Button size="sm" onClick={() => setShowNovo(true)} className="gap-1.5"><Plus className="h-4 w-4" />Novo Cliente</Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar nome, documento, sistema..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroSistema} onValueChange={setFiltroSistema}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Sistema" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Sistemas</SelectItem>
            {sistemasAtivos.map(s => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroMensalidade} onValueChange={setFiltroMensalidade}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Mensalidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Mensalidade</SelectItem>
            <SelectItem value="sim">Ativa</SelectItem>
            <SelectItem value="nao">Inativa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum cliente encontrado</div>
        ) : filtered.map(c => {
          const margem = c.valorMensalidade - c.valorCustoMensal;
          return (
            <ClienteCard
              key={c.id}
              nome={c.nome}
              documento={c.documento}
              telefone={c.telefone}
              sistema={c.sistemaPrincipal}
              systemColor={getSystemColor(c.sistemaPrincipal)}
              statusBadge={<Badge className={`text-[10px] ${STATUS_COLORS[c.statusCliente]}`}>{STATUS_LABELS[c.statusCliente]}</Badge>}
              extraInfo={
                <>
                  <span className="text-xs font-medium">{fmt(c.valorMensalidade)}</span>
                  <span className={`text-xs ${margem >= 0 ? "text-green-500" : "text-destructive"}`}>
                    Margem: {fmt(margem)}
                  </span>
                </>
              }
              onClick={() => setSelectedId(c.id)}
              actions={
                <RowActions actions={[
                  { label: "Ver detalhes", icon: Eye, onClick: () => setSelectedId(c.id) },
                  { label: "Excluir", icon: Trash2, variant: "destructive", separator: true, onClick: () => { setDeleteTarget(c); setDeleteJustificativa(""); } },
                ]} />
              }
            />
          );
        })}
      </div>

      <Dialog open={showNovo} onOpenChange={v => { if (!v) resetForm(); setShowNovo(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  Documento (CPF/CNPJ)
                  {cnpjLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </Label>
                <Input
                  value={form.documento}
                  onChange={e => handleDocumentoChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sistema</Label>
                <Select value={form.sistemaPrincipal} onValueChange={v => {
                  setForm(f => ({ ...f, sistemaPrincipal: v, valorMensalidade: "0", valorCustoMensal: "0" }));
                  setSelectedModuleIds(new Set());
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o sistema" /></SelectTrigger>
                  <SelectContent>
                    {sistemasAtivos.map(s => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Mensalidade (R$)</Label><CurrencyInput value={Number(form.valorMensalidade) || 0} onValueChange={v => setForm(f => ({ ...f, valorMensalidade: String(v) }))} /></div>
            </div>
            {availableModules.length > 0 && (
              <div className="space-y-2">
                <Label>Módulos</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                  {availableModules.map(m => (
                    <label key={m.id} className="flex items-center gap-3 py-1 cursor-pointer hover:bg-muted/50 rounded px-1">
                      <Checkbox
                        checked={selectedModuleIds.has(m.id)}
                        onCheckedChange={() => toggleModule(m.id)}
                      />
                      <span className="flex-1 text-sm">{m.nome}</span>
                      <span className="text-xs text-muted-foreground">{fmt(m.valorVenda)}</span>
                      <span className="text-xs text-muted-foreground/60">custo {fmt(m.valorCusto)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div><Label>Custo Mensal (R$)</Label><CurrencyInput value={Number(form.valorCustoMensal) || 0} onValueChange={v => setForm(f => ({ ...f, valorCustoMensal: String(v) }))} /></div>
            <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNovo(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleCriar}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CNPJ confirmation modal */}
      <Dialog open={showCnpjConfirm} onOpenChange={setShowCnpjConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Substituir dados?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja substituir os dados atuais pelos dados da Receita Federal?
          </p>
          {cnpjLookupData && (
            <div className="text-sm space-y-1 p-3 rounded-lg bg-muted/50">
              <p><span className="text-muted-foreground">Razão Social:</span> {cnpjLookupData.nome}</p>
              {cnpjLookupData.fantasia && <p><span className="text-muted-foreground">Fantasia:</span> {cnpjLookupData.fantasia}</p>}
              <p><span className="text-muted-foreground">Cidade:</span> {cnpjLookupData.municipio}/{cnpjLookupData.uf}</p>
              <p><span className="text-muted-foreground">Situação:</span> {cnpjLookupData.situacao}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCnpjConfirm(false)}>Manter Atuais</Button>
            <Button size="sm" onClick={() => {
              if (cnpjLookupData) {
                applyCnpjData(cnpjLookupData);
                toast({ title: "Dados atualizados!", description: cnpjLookupData.nome });
              }
              setShowCnpjConfirm(false);
            }}>Substituir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong>? Informe a justificativa abaixo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo da exclusão (obrigatório)"
            value={deleteJustificativa}
            onChange={e => setDeleteJustificativa(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleteJustificativa.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget && deleteJustificativa.trim()) {
                  const nome = deleteTarget.nome;
                  const ok = await deleteClienteReceita(deleteTarget.id, deleteJustificativa.trim());
                  if (ok) {
                    toast({ title: "Cliente excluído", description: nome });
                  } else {
                    toast({ title: "Erro ao excluir cliente", description: "Verifique suas permissões ou tente novamente.", variant: "destructive" });
                  }
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
