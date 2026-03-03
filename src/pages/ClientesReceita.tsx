import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useReceita } from "@/contexts/ReceitaContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, ArrowLeft, X, TrendingUp, Globe, Copy, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ClienteReceita, SistemaPrincipal, StatusCliente, RECEITA_COLORS } from "@/types/receita";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { validateCNPJ, cleanCNPJ, formatCNPJ, maskDocument, type CnpjLookupResult } from "@/lib/cnpjUtils";

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

const SISTEMAS: SistemaPrincipal[] = ["PDV+", "LinkPro", "Torge", "Emissor Fiscal", "Hyon Hospede"];
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
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroSistema, setFiltroSistema] = useState<string>("todos");
  const [filtroMensalidade, setFiltroMensalidade] = useState<string>("todos");
  const [showNovo, setShowNovo] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ajusteValor, setAjusteValor] = useState("");
  const [ajusteMotivo, setAjusteMotivo] = useState("");

  // Form state
  const [form, setForm] = useState({
    nome: "", documento: "", telefone: "", email: "", cidade: "",
    sistemaPrincipal: "PDV+" as SistemaPrincipal,
    valorMensalidade: "", valorCustoMensal: "", observacoes: "",
  });

  // CNPJ lookup state
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjLookupData, setCnpjLookupData] = useState<CnpjLookupResult | null>(null);
  const [showCnpjConfirm, setShowCnpjConfirm] = useState(false);
  const cnpjLookupRef = useRef<string>("");

  const resetForm = () => {
    setForm({ nome: "", documento: "", telefone: "", email: "", cidade: "", sistemaPrincipal: "PDV+", valorMensalidade: "", valorCustoMensal: "", observacoes: "" });
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
      sistemaPrincipal: form.sistemaPrincipal,
      statusCliente: "ativo",
      mensalidadeAtiva: true,
      valorMensalidade: Number(form.valorMensalidade) || 0,
      dataInicio: new Date().toISOString(),
      dataCancelamento: null,
      motivoCancelamento: null,
      observacoes: form.observacoes || undefined,
      custoAtivo: true,
      valorCustoMensal: Number(form.valorCustoMensal) || 0,
      sistemaCusto: form.sistemaPrincipal,
    });
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
  if (selected) {
    const margem = selected.valorMensalidade - selected.valorCustoMensal;
    const suporteByMonth = (() => {
      const months: { name: string; ocorrencias: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const label = d.toLocaleDateString("pt-BR", { month: "short" });
        const count = selectedEventos.filter(e => {
          const ed = new Date(e.criadoEm);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
        }).length;
        months.push({ name: label, ocorrencias: count });
      }
      return months;
    })();

    return (
      <div className="space-y-4 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" />Voltar
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{selected.nome}</h1>
          <Badge className={STATUS_COLORS[selected.statusCliente]}>{STATUS_LABELS[selected.statusCliente]}</Badge>
          <Badge variant="outline">{selected.sistemaPrincipal}</Badge>
        </div>

        <Tabs defaultValue="geral">
          <TabsList>
            <TabsTrigger value="geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="historico">Histórico Mensalidade</TabsTrigger>
            <TabsTrigger value="suporte">Suporte ({selectedEventos.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">Dados Cadastrais</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {selected.documento && <p><span className="text-muted-foreground">Documento:</span> {selected.documento}</p>}
                  {selected.telefone && <p><span className="text-muted-foreground">Telefone:</span> {selected.telefone}</p>}
                  {selected.email && <p><span className="text-muted-foreground">Email:</span> {selected.email}</p>}
                  {selected.cidade && <p><span className="text-muted-foreground">Cidade:</span> {selected.cidade}</p>}
                  <p><span className="text-muted-foreground">Início:</span> {new Date(selected.dataInicio).toLocaleDateString("pt-BR")}</p>
                  {selected.observacoes && <p><span className="text-muted-foreground">Obs:</span> {selected.observacoes}</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Resumo Financeiro</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Mensalidade:</span> <span className="font-semibold" style={{ color: RECEITA_COLORS.receita }}>{fmt(selected.valorMensalidade)}</span></p>
                  <p><span className="text-muted-foreground">Custo Mensal:</span> <span className="font-semibold" style={{ color: RECEITA_COLORS.custos }}>{fmt(selected.valorCustoMensal)}</span></p>
                  <p><span className="text-muted-foreground">Margem:</span> <span className="font-semibold" style={{ color: RECEITA_COLORS.margem }}>{fmt(margem)}</span></p>
                  <p><span className="text-muted-foreground">Mensalidade Ativa:</span> {selected.mensalidadeAtiva ? "Sim" : "Não"}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2 flex-wrap">
              {selected.statusCliente !== "ativo" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(selected.id, "ativo")}>Reativar</Button>}
              {selected.statusCliente !== "atraso" && selected.statusCliente !== "cancelado" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(selected.id, "atraso")}>Marcar Atraso</Button>}
              {selected.statusCliente !== "suspenso" && selected.statusCliente !== "cancelado" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(selected.id, "suspenso")}>Suspender</Button>}
              {selected.statusCliente !== "cancelado" && <Button size="sm" variant="destructive" onClick={() => handleStatusChange(selected.id, "cancelado")}>Cancelar</Button>}
              <PortalLinkButton clientId={selected.id} />
            </div>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-4 mt-4">
            <div className="grid gap-4 grid-cols-3">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-xs text-muted-foreground">Mensalidade</p>
                  <p className="text-2xl font-bold" style={{ color: RECEITA_COLORS.receita }}>{fmt(selected.valorMensalidade)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-xs text-muted-foreground">Custo</p>
                  <p className="text-2xl font-bold" style={{ color: RECEITA_COLORS.custos }}>{fmt(selected.valorCustoMensal)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-xs text-muted-foreground">Margem</p>
                  <p className="text-2xl font-bold" style={{ color: RECEITA_COLORS.margem }}>{fmt(margem)}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="historico" className="space-y-4 mt-4">
            {(() => {
              const ajustes = getAjustesCliente(selected.id);
              const chartData = ajustes.map(a => ({
                data: new Date(a.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
                valor: a.valorNovo,
              }));
              // Add current value as last point if different from last adjustment
              if (chartData.length === 0 || chartData[chartData.length - 1].valor !== selected.valorMensalidade) {
                chartData.push({ data: "Atual", valor: selected.valorMensalidade });
              }
              return (
                <>
                  <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" style={{ color: RECEITA_COLORS.receita }} />Evolução da Mensalidade</CardTitle></CardHeader>
                    <CardContent>
                      {chartData.length > 1 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="data" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Line type="monotone" dataKey="valor" stroke={RECEITA_COLORS.receita} strokeWidth={2} dot={{ r: 4, fill: RECEITA_COLORS.receita }} name="Mensalidade" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">Sem ajustes registrados ainda</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-sm">Registrar Novo Ajuste</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[120px]">
                          <Label className="text-xs">Novo Valor (R$)</Label>
                          <Input type="number" placeholder="0.00" value={ajusteValor} onChange={e => setAjusteValor(e.target.value)} className="h-9" />
                        </div>
                        <div className="flex-[2] min-w-[180px]">
                          <Label className="text-xs">Motivo</Label>
                          <Input placeholder="Ex: Reajuste anual, Upgrade de plano..." value={ajusteMotivo} onChange={e => setAjusteMotivo(e.target.value)} className="h-9" />
                        </div>
                        <Button size="sm" onClick={() => {
                          const val = Number(ajusteValor);
                          if (!val || val <= 0) { toast({ title: "Valor inválido", variant: "destructive" }); return; }
                          if (!ajusteMotivo.trim()) { toast({ title: "Informe o motivo", variant: "destructive" }); return; }
                          addMensalidadeAjuste(selected.id, val, ajusteMotivo.trim());
                          setAjusteValor("");
                          setAjusteMotivo("");
                          toast({ title: "Ajuste registrado!", description: `Mensalidade alterada para ${fmt(val)}` });
                        }}>Registrar</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {ajustes.length > 0 && (
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Anterior</TableHead>
                            <TableHead className="text-right">Novo</TableHead>
                            <TableHead className="text-right">Variação</TableHead>
                            <TableHead>Motivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...ajustes].reverse().map(a => {
                            const diff = a.valorNovo - a.valorAnterior;
                            const diffPct = a.valorAnterior > 0 ? (diff / a.valorAnterior) * 100 : 0;
                            return (
                              <TableRow key={a.id}>
                                <TableCell className="text-sm">{new Date(a.data).toLocaleDateString("pt-BR")}</TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">{fmt(a.valorAnterior)}</TableCell>
                                <TableCell className="text-right text-sm font-medium">{fmt(a.valorNovo)}</TableCell>
                                <TableCell className="text-right text-sm">
                                  <span style={{ color: diff >= 0 ? RECEITA_COLORS.margem : RECEITA_COLORS.custos }}>
                                    {diff >= 0 ? "+" : ""}{fmt(diff)} ({diffPct >= 0 ? "+" : ""}{diffPct.toFixed(1)}%)
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm">{a.motivo}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              );
            })()}
          </TabsContent>

          <TabsContent value="suporte" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Ocorrências por Mês</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={suporteByMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="ocorrencias" fill={RECEITA_COLORS.suporte} radius={[4, 4, 0, 0]} name="Ocorrências" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {selectedEventos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma ocorrência registrada</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Resolvido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEventos.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()).map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm">{new Date(e.criadoEm).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{e.tipo}</Badge></TableCell>
                        <TableCell className="text-sm">{e.duracaoMinutos} min</TableCell>
                        <TableCell>{e.resolvido ? <Badge className="text-[10px] bg-success/10 text-success">Sim</Badge> : <Badge variant="outline" className="text-[10px]">Não</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clientes & Receita</h1>
        <Button size="sm" onClick={() => setShowNovo(true)} className="gap-1.5"><Plus className="h-4 w-4" />Novo Cliente</Button>
      </div>

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
            {SISTEMAS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Sistema</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Mensalidade</TableHead>
              <TableHead className="text-right hidden md:table-cell">Custo</TableHead>
              <TableHead className="text-right hidden md:table-cell">Margem</TableHead>
              <TableHead className="hidden lg:table-cell">Início</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => {
              const margem = c.valorMensalidade - c.valorCustoMensal;
              return (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(c.id)}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]" style={{ borderColor: RECEITA_COLORS.sistemas[c.sistemaPrincipal], color: RECEITA_COLORS.sistemas[c.sistemaPrincipal] }}>
                      {c.sistemaPrincipal}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge className={`text-[10px] ${STATUS_COLORS[c.statusCliente]}`}>{STATUS_LABELS[c.statusCliente]}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{fmt(c.valorMensalidade)}</TableCell>
                  <TableCell className="text-right hidden md:table-cell text-muted-foreground">{fmt(c.valorCustoMensal)}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    <span style={{ color: margem >= 0 ? RECEITA_COLORS.margem : RECEITA_COLORS.custos }}>{fmt(margem)}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{new Date(c.dataInicio).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setSelectedId(c.id); }}>Abrir</Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Nenhum cliente encontrado</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
                <Select value={form.sistemaPrincipal} onValueChange={v => setForm(f => ({ ...f, sistemaPrincipal: v as SistemaPrincipal }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SISTEMAS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Mensalidade (R$)</Label><Input type="number" value={form.valorMensalidade} onChange={e => setForm(f => ({ ...f, valorMensalidade: e.target.value }))} /></div>
            </div>
            <div><Label>Custo Mensal (R$)</Label><Input type="number" value={form.valorCustoMensal} onChange={e => setForm(f => ({ ...f, valorCustoMensal: e.target.value }))} /></div>
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
    </div>
  );
}
