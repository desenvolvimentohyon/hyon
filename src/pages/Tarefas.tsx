import { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tarefa, StatusTarefa, Prioridade, STATUS_ORDER, TipoOperacional } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List, Plus, Search, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TIPO_OPERACIONAL_CONFIG } from "@/lib/constants";
import { useParametros } from "@/contexts/ParametrosContext";

function KanbanTarefas({ filteredTarefas, isAtrasada, statusColor, prioridadeColor, getStatusLabel, getPrioridadeLabel, getCliente, getTecnico, updateTarefa, navigate }: any) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDrop = (e: React.DragEvent, status: StatusTarefa) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (id) {
      const tarefa = filteredTarefas.find((t: Tarefa) => t.id === id);
      if (tarefa && tarefa.status !== status) {
        updateTarefa(id, { status }, `Status: ${getStatusLabel(status)}`);
        toast({ title: `Movido para ${getStatusLabel(status)}` });
      }
    }
    setDragId(null);
    setDragOver(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_ORDER.map(status => {
        const columnTasks = filteredTarefas.filter((t: Tarefa) => t.status === status);
        return (
          <div
            key={status}
            className={`flex-shrink-0 w-[280px] rounded-lg p-2 transition-colors ${dragOver === status ? "bg-accent/50 ring-2 ring-primary/30" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(status); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, status)}
          >
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`text-xs ${statusColor(status)}`}>{getStatusLabel(status)}</Badge>
              <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
            </div>
            <div className="space-y-2 min-h-[100px]">
              {columnTasks.map((t: Tarefa) => {
                const tipoConfig = TIPO_OPERACIONAL_CONFIG[t.tipoOperacional] || { label: t.tipoOperacional, bgClass: "bg-muted text-muted-foreground" };
                return (
                  <Card
                    key={t.id}
                    draggable
                    onDragStart={e => handleDragStart(e, t.id)}
                    onDragEnd={() => { setDragId(null); setDragOver(null); }}
                    className={`cursor-grab active:cursor-grabbing transition-all duration-150 hover:shadow-card-hover ${dragId === t.id ? "opacity-50 scale-95" : ""}`}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight cursor-pointer hover:underline" onClick={() => navigate(`/tarefas/${t.id}`)}>{t.titulo}</p>
                        {isAtrasada(t) && <Badge variant="destructive" className="text-[9px] shrink-0">Atrasada</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className={`text-[9px] ${tipoConfig.bgClass}`}>{tipoConfig.label}</Badge>
                        <Badge className={`text-[9px] ${prioridadeColor(t.prioridade)}`}>{getPrioridadeLabel(t.prioridade)}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t.clienteId ? getCliente(t.clienteId)?.nome?.split(" ")[0] : "Avulsa"}</span>
                        <span>{getTecnico(t.responsavelId)?.nome?.split(" ")[0]}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Tarefas() {
  const { tarefas, clientes, tecnicos, addTarefa, updateTarefa, getCliente, getTecnico, getStatusLabel, getPrioridadeLabel, tecnicoAtualId } = useApp();
  const { sistemas } = useParametros();
  const sistemasAtivos = sistemas.filter(s => s.ativo);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [busca, setBusca] = useState(searchParams.get("busca") || "");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("todos");
  const [filtroTecnico, setFiltroTecnico] = useState<string>("todos");
  const [filtroCliente, setFiltroCliente] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroSistema, setFiltroSistema] = useState<string>("todos");
  const [showNova, setShowNova] = useState(false);

  // Form state
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoDesc, setNovoDesc] = useState("");
  const [novoCliente, setNovoCliente] = useState<string>("null");
  const [novoResponsavel, setNovoResponsavel] = useState(tecnicoAtualId);
  const [novoPrioridade, setNovoPrioridade] = useState<Prioridade>("media");
  const [novoPrazo, setNovoPrazo] = useState("");
  const [novoTags, setNovoTags] = useState("");
  const [novoTipo, setNovoTipo] = useState<TipoOperacional>("interno");

  useEffect(() => {
    if (searchParams.get("nova") === "1") {
      setShowNova(true);
      searchParams.delete("nova");
      setSearchParams(searchParams, { replace: true });
    }
    const filtro = searchParams.get("filtro");
    if (filtro === "atrasadas") {
      setFiltroStatus("atrasadas");
      searchParams.delete("filtro");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const now = new Date();
  const isAtrasada = (t: Tarefa) => {
    if (!t.prazoDataHora || t.status === "concluida" || t.status === "cancelada") return false;
    return new Date(t.prazoDataHora) < now;
  };

  const filteredTarefas = useMemo(() => {
    return tarefas.filter(t => {
      if (busca) {
        const q = busca.toLowerCase();
        if (!t.titulo.toLowerCase().includes(q) && !t.descricao.toLowerCase().includes(q) && !t.tags.some(tag => tag.toLowerCase().includes(q))) return false;
      }
      if (filtroStatus === "atrasadas") { if (!isAtrasada(t)) return false; }
      else if (filtroStatus !== "todos" && t.status !== filtroStatus) return false;
      if (filtroPrioridade !== "todos" && t.prioridade !== filtroPrioridade) return false;
      if (filtroTecnico !== "todos" && t.responsavelId !== filtroTecnico) return false;
      if (filtroCliente === "avulsas" && t.clienteId !== null) return false;
      else if (filtroCliente !== "todos" && filtroCliente !== "avulsas" && t.clienteId !== filtroCliente) return false;
      if (filtroTipo !== "todos" && t.tipoOperacional !== filtroTipo) return false;
      if (filtroSistema !== "todos" && t.sistemaRelacionado !== filtroSistema) return false;
      return true;
    }).sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime());
  }, [tarefas, busca, filtroStatus, filtroPrioridade, filtroTecnico, filtroCliente, filtroTipo, filtroSistema]);

  const handleCriar = () => {
    if (!novoTitulo.trim()) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    addTarefa({
      titulo: novoTitulo.trim(), descricao: novoDesc,
      clienteId: novoCliente === "null" ? null : novoCliente,
      responsavelId: novoResponsavel, prioridade: novoPrioridade, status: "a_fazer",
      prazoDataHora: novoPrazo || undefined,
      tags: novoTags.split(",").map(t => t.trim()).filter(Boolean),
      checklist: [], anexosFake: [], comentarios: [],
      tipoOperacional: novoTipo,
    });
    toast({ title: "Tarefa criada com sucesso!" });
    setShowNova(false);
    setNovoTitulo(""); setNovoDesc(""); setNovoCliente("null"); setNovoPrazo(""); setNovoTags("");
  };

  const prioridadeColor = (p: string) => {
    switch (p) {
      case "urgente": return "bg-destructive text-destructive-foreground";
      case "alta": return "bg-warning text-warning-foreground";
      case "media": return "bg-info text-info-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "concluida": return "bg-success text-success-foreground";
      case "em_andamento": return "bg-info text-info-foreground";
      case "cancelada": return "bg-muted text-muted-foreground";
      case "aguardando_cliente": return "bg-warning text-warning-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "table" ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setViewMode("table")}><List className="h-4 w-4" /></Button>
          <Button variant={viewMode === "kanban" ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setViewMode("kanban")}><LayoutGrid className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => setShowNova(true)} className="gap-1.5"><Plus className="h-4 w-4" />Nova Tarefa</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            <SelectItem value="atrasadas">Atrasadas</SelectItem>
            {STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Tipo</SelectItem>
            {(Object.keys(TIPO_OPERACIONAL_CONFIG) as TipoOperacional[]).map(t => (
              <SelectItem key={t} value={t}>{TIPO_OPERACIONAL_CONFIG[t].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroSistema} onValueChange={setFiltroSistema}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Sistema</SelectItem>
            {sistemasAtivos.map(s => (
              <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Prioridade</SelectItem>
            {(["urgente", "alta", "media", "baixa"] as Prioridade[]).map(p => <SelectItem key={p} value={p}>{getPrioridadeLabel(p)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroTecnico} onValueChange={setFiltroTecnico}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Técnico</SelectItem>
            {tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Cliente</SelectItem>
            <SelectItem value="avulsas">Avulsas</SelectItem>
            {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filteredTarefas.length} tarefa(s) encontrada(s)</p>

      {viewMode === "table" ? (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                <TableHead className="hidden lg:table-cell">Prazo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTarefas.map(t => {
                const tipoConfig = TIPO_OPERACIONAL_CONFIG[t.tipoOperacional] || { label: t.tipoOperacional || "N/A", bgClass: "bg-muted text-muted-foreground" };
                return (
                  <TableRow key={t.id} className="group cursor-pointer hover:bg-accent/40 transition-colors duration-150" onClick={() => navigate(`/tarefas/${t.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{t.titulo}</span>
                        {isAtrasada(t) && <Badge variant="destructive" className="text-[10px]">Atrasada</Badge>}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={`text-[10px] ${tipoConfig.bgClass}`}>{tipoConfig.label}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{t.clienteId ? getCliente(t.clienteId)?.nome : "Avulsa"}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColor(t.status)}`}>{getStatusLabel(t.status)}</Badge></TableCell>
                    <TableCell><Badge className={`text-[10px] ${prioridadeColor(t.prioridade)}`}>{getPrioridadeLabel(t.prioridade)}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{getTecnico(t.responsavelId)?.nome}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {t.prazoDataHora ? new Date(t.prazoDataHora).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTarefas.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Nenhuma tarefa encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <KanbanTarefas
          filteredTarefas={filteredTarefas}
          isAtrasada={isAtrasada}
          statusColor={statusColor}
          prioridadeColor={prioridadeColor}
          getStatusLabel={getStatusLabel}
          getPrioridadeLabel={getPrioridadeLabel}
          getCliente={getCliente}
          getTecnico={getTecnico}
          updateTarefa={updateTarefa}
          navigate={navigate}
        />
      )}

      {/* Modal Nova Tarefa */}
      <Dialog open={showNova} onOpenChange={setShowNova}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Ex: Configurar servidor" /></div>
            <div><Label>Descrição</Label><Textarea value={novoDesc} onChange={e => setNovoDesc(e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo Operacional</Label>
                <Select value={novoTipo} onValueChange={v => setNovoTipo(v as TipoOperacional)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIPO_OPERACIONAL_CONFIG) as TipoOperacional[]).map(t => (
                      <SelectItem key={t} value={t}>{TIPO_OPERACIONAL_CONFIG[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente</Label>
                <Select value={novoCliente} onValueChange={setNovoCliente}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Avulsa</SelectItem>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsável</Label>
                <Select value={novoResponsavel} onValueChange={setNovoResponsavel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{tecnicos.filter(t => t.ativo).map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={novoPrioridade} onValueChange={v => setNovoPrioridade(v as Prioridade)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["baixa", "media", "alta", "urgente"] as Prioridade[]).map(p => <SelectItem key={p} value={p}>{getPrioridadeLabel(p)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Prazo</Label><Input type="datetime-local" value={novoPrazo} onChange={e => setNovoPrazo(e.target.value)} /></div>
              <div><Label>Tags (vírgula)</Label><Input value={novoTags} onChange={e => setNovoTags(e.target.value)} placeholder="rede, hardware" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNova(false)}>Cancelar</Button>
            <Button onClick={handleCriar}>Criar Tarefa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
