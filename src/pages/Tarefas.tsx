import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tarefa, Prioridade, STATUS_ORDER, TipoOperacional } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List, Plus, Search, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { TIPO_OPERACIONAL_CONFIG } from "@/lib/constants";
import { useParametros } from "@/contexts/ParametrosContext";

import { statusRowColor, prioridadeColor, statusColor, isAtrasada } from "./tarefas/helpers";
import { LiveTimer } from "./tarefas/LiveTimer";
import { KanbanTarefas } from "./tarefas/KanbanTarefas";
import { NovaTarefaDialog } from "./tarefas/NovaTarefaDialog";

export default function Tarefas() {
  const { tarefas, clientes, tecnicos, addTarefa, updateTarefa, addCliente, getCliente, getTecnico, getStatusLabel, getPrioridadeLabel, tecnicoAtualId } = useApp();
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
  const tarefaAtrasada = (t: Tarefa) => isAtrasada(t, now);

  const filteredTarefas = useMemo(() => {
    return tarefas.filter(t => {
      if (busca) {
        const q = busca.toLowerCase();
        if (!t.titulo.toLowerCase().includes(q) && !t.descricao.toLowerCase().includes(q) && !t.tags.some(tag => tag.toLowerCase().includes(q))) return false;
      }
      if (filtroStatus === "atrasadas") { if (!tarefaAtrasada(t)) return false; }
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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardList}
        iconClassName="text-primary"
        title="Tarefas"
        actions={
          <div className="flex items-center gap-2">
            <Button variant={viewMode === "table" ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setViewMode("table")}><List className="h-4 w-4" /></Button>
            <Button variant={viewMode === "kanban" ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setViewMode("kanban")}><LayoutGrid className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => setShowNova(true)} className="gap-1.5"><Plus className="h-4 w-4" />Nova Tarefa</Button>
          </div>
        }
      />
      <ModuleNavGrid moduleId="operacional" />

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
                <TableHead>Tempo</TableHead>
                <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                <TableHead className="hidden md:table-cell">Prazo</TableHead>
                <TableHead className="hidden md:table-cell">Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTarefas.map(t => {
                const tipoConfig = TIPO_OPERACIONAL_CONFIG[t.tipoOperacional] || { label: t.tipoOperacional || "N/A", bgClass: "bg-muted text-muted-foreground" };
                return (
                  <TableRow key={t.id} className={`group cursor-pointer hover:bg-accent/40 transition-colors duration-150 ${statusRowColor(t.status)}`} onClick={() => navigate(`/tarefas/${t.id}`)}>
                    <TableCell><span className="font-medium text-sm">{t.titulo}</span></TableCell>
                    <TableCell><Badge className={`text-[10px] ${tipoConfig.bgClass}`}>{tipoConfig.label}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{t.clienteId ? getCliente(t.clienteId)?.nome : (t.nomeClienteAvulso || "Avulsa")}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColor(t.status)}`}>{getStatusLabel(t.status)}</Badge></TableCell>
                    <TableCell><Badge className={`text-[10px] ${prioridadeColor(t.prioridade)}`}>{getPrioridadeLabel(t.prioridade)}</Badge></TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <LiveTimer tempoTotalSegundos={t.tempoTotalSegundos} timerRodando={t.timerRodando} timerInicioTimestamp={t.timerInicioTimestamp} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{getTecnico(t.responsavelId)?.nome}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {t.prazoDataHora ? new Date(t.prazoDataHora).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {tarefaAtrasada(t) ? <Badge variant="destructive" className="text-[10px]">Atrasada</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTarefas.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">Nenhuma tarefa encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <KanbanTarefas
          filteredTarefas={filteredTarefas}
          isAtrasada={tarefaAtrasada}
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

      <NovaTarefaDialog
        open={showNova}
        onOpenChange={setShowNova}
        clientes={clientes}
        tecnicos={tecnicos}
        tecnicoAtualId={tecnicoAtualId}
        addCliente={addCliente}
        addTarefa={addTarefa}
        getPrioridadeLabel={getPrioridadeLabel}
      />
    </div>
  );
}
