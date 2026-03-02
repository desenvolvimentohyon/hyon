import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tarefa, StatusTarefa, Prioridade, STATUS_ORDER } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Tarefas() {
  const { tarefas, clientes, tecnicos, addTarefa, updateTarefa, getCliente, getTecnico, getStatusLabel, getPrioridadeLabel, tecnicoAtualId } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [busca, setBusca] = useState(searchParams.get("busca") || "");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("todos");
  const [filtroTecnico, setFiltroTecnico] = useState<string>("todos");
  const [filtroCliente, setFiltroCliente] = useState<string>("todos");
  const [showNova, setShowNova] = useState(false);

  // Form state for new task
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoDesc, setNovoDesc] = useState("");
  const [novoCliente, setNovoCliente] = useState<string>("null");
  const [novoResponsavel, setNovoResponsavel] = useState(tecnicoAtualId);
  const [novoPrioridade, setNovoPrioridade] = useState<Prioridade>("media");
  const [novoPrazo, setNovoPrazo] = useState("");
  const [novoTags, setNovoTags] = useState("");

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
      return true;
    }).sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime());
  }, [tarefas, busca, filtroStatus, filtroPrioridade, filtroTecnico, filtroCliente]);

  const handleCriar = () => {
    if (!novoTitulo.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    addTarefa({
      titulo: novoTitulo.trim(),
      descricao: novoDesc,
      clienteId: novoCliente === "null" ? null : novoCliente,
      responsavelId: novoResponsavel,
      prioridade: novoPrioridade,
      status: "a_fazer",
      prazoDataHora: novoPrazo || undefined,
      tags: novoTags.split(",").map(t => t.trim()).filter(Boolean),
      checklist: [],
      anexosFake: [],
      comentarios: [],
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

  const handleStatusChange = (tarefaId: string, novoStatus: StatusTarefa) => {
    updateTarefa(tarefaId, { status: novoStatus }, `Status alterado para ${getStatusLabel(novoStatus)}`);
    toast({ title: `Status atualizado: ${getStatusLabel(novoStatus)}` });
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
                <TableHead className="hidden md:table-cell">Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                <TableHead className="hidden lg:table-cell">Prazo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTarefas.map(t => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/tarefas/${t.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{t.titulo}</span>
                      {isAtrasada(t) && <Badge variant="destructive" className="text-[10px]">Atrasada</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{t.clienteId ? getCliente(t.clienteId)?.nome : "Avulsa"}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusColor(t.status)}`}>{getStatusLabel(t.status)}</Badge></TableCell>
                  <TableCell><Badge className={`text-[10px] ${prioridadeColor(t.prioridade)}`}>{getPrioridadeLabel(t.prioridade)}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{getTecnico(t.responsavelId)?.nome}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {t.prazoDataHora ? new Date(t.prazoDataHora).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {filteredTarefas.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Nenhuma tarefa encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Kanban */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map(status => {
            const columnTasks = filteredTarefas.filter(t => t.status === status);
            return (
              <div key={status} className="flex-shrink-0 w-[280px]">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`text-xs ${statusColor(status)}`}>{getStatusLabel(status)}</Badge>
                  <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {columnTasks.map(t => (
                    <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/tarefas/${t.id}`)}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight">{t.titulo}</p>
                          {isAtrasada(t) && <Badge variant="destructive" className="text-[9px] shrink-0">Atrasada</Badge>}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className={`text-[9px] ${prioridadeColor(t.prioridade)}`}>{getPrioridadeLabel(t.prioridade)}</Badge>
                          {t.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-[9px]">{tag}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{t.clienteId ? getCliente(t.clienteId)?.nome?.split(" ")[0] : "Avulsa"}</span>
                          <span>{getTecnico(t.responsavelId)?.nome?.split(" ")[0]}</span>
                        </div>
                        {t.checklist.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-success rounded-full transition-all" style={{ width: `${(t.checklist.filter(c => c.concluido).length / t.checklist.length) * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{t.checklist.filter(c => c.concluido).length}/{t.checklist.length}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
                <Label>Cliente</Label>
                <Select value={novoCliente} onValueChange={setNovoCliente}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Avulsa</SelectItem>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsável</Label>
                <Select value={novoResponsavel} onValueChange={setNovoResponsavel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tecnicos.filter(t => t.ativo).map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prioridade</Label>
                <Select value={novoPrioridade} onValueChange={v => setNovoPrioridade(v as Prioridade)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["baixa", "media", "alta", "urgente"] as Prioridade[]).map(p => <SelectItem key={p} value={p}>{getPrioridadeLabel(p)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Prazo</Label><Input type="datetime-local" value={novoPrazo} onChange={e => setNovoPrazo(e.target.value)} /></div>
            </div>
            <div><Label>Tags (separadas por vírgula)</Label><Input value={novoTags} onChange={e => setNovoTags(e.target.value)} placeholder="rede, hardware" /></div>
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
