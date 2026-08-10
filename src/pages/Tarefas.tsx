import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tarefa, Prioridade, STATUS_ORDER, TipoOperacional, StatusTarefa } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List, Plus, Search, ClipboardList, AlertTriangle, Sparkles, Filter } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { TIPO_OPERACIONAL_CONFIG } from "@/lib/constants";
import { useParametros } from "@/contexts/ParametrosContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { statusRowColor, prioridadeColor, statusColor, isAtrasada } from "./tarefas/helpers";
import { LiveTimer } from "./tarefas/LiveTimer";
import { KanbanTarefas } from "./tarefas/KanbanTarefas";
import { NovaTarefaDialog } from "./tarefas/NovaTarefaDialog";

/** Chave de preferência local para exibir tarefas finalizadas */
const PREF_MOSTRAR_FINALIZADAS = "tarefas:mostrarFinalizadas";

function IAInsightsTarefas({ tarefas }: { tarefas: Tarefa[] }) {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["ia_tarefas_insights", tarefas.length, tarefas.map(t => t.status).join(',')],
    queryFn: async () => {
      if (tarefas.length === 0) return [];
      
      const prompt = `Analise estas ${tarefas.length} tarefas e sugira os 3 próximos passos mais importantes para priorizar, baseando-se em prazos e status. Seja curto e direto.`;
      
      const { data, error } = await supabase.functions.invoke("ia-assistant", {
        body: { 
          question: prompt,
          context: { 
            module: "tarefas",
            data: tarefas.slice(0, 10).map(t => ({
              titulo: t.titulo,
              status: t.status,
              prioridade: t.prioridade,
              prazo: t.prazoDataHora
            }))
          }
        },
      });
      if (error) throw error;
      return data?.answer?.split('\n').filter((l: string) => l.trim().length > 10).slice(0, 3) || [];
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  if (isLoading) return <Skeleton className="h-24 w-full rounded-lg" />;
  if (!insights || insights.length === 0) return null;

  return (
    <Card className="neon-border border-primary/20 bg-primary/5 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold flex items-center gap-2 text-primary uppercase tracking-wider">
          <Sparkles className="h-3 w-3 animate-pulse" /> Sugestões de Priorização (Hyon IA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        {insights.map((insight: string, i: number) => (
          <div key={i} className="flex gap-2 items-start group">
            <div className="mt-1.5 w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
            <p className="text-[11px] leading-relaxed text-foreground/80">{insight.replace(/^[0-9*.\-\s]+/, '')}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

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
  // Por padrão, tarefas finalizadas (concluídas/canceladas) ficam ocultas.
  // A preferência é persistida em localStorage para sobreviver a recarregamentos.
  const [mostrarFinalizadas, setMostrarFinalizadas] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PREF_MOSTRAR_FINALIZADAS) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PREF_MOSTRAR_FINALIZADAS, String(mostrarFinalizadas));
    } catch {
      // Storage indisponível (modo privado/quota) — preferência apenas em memória
    }
  }, [mostrarFinalizadas]);

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
      const finalizada = t.status === "concluida" || t.status === "cancelada";
      // Oculta finalizadas salvo se o toggle estiver ativo ou o filtro apontar para elas
      if (finalizada && !mostrarFinalizadas && filtroStatus !== t.status) return false;
      if (filtroStatus === "atrasadas") { if (!tarefaAtrasada(t)) return false; }
      else if (filtroStatus !== "todos" && t.status !== filtroStatus) return false;
      if (filtroPrioridade !== "todos" && t.prioridade !== filtroPrioridade) return false;
      if (filtroTecnico !== "todos" && t.responsavelId !== filtroTecnico) return false;
      if (filtroCliente === "avulsas" && t.clienteId !== null) return false;
      else if (filtroCliente !== "todos" && filtroCliente !== "avulsas" && t.clienteId !== filtroCliente) return false;
      if (filtroTipo !== "todos" && t.tipoOperacional !== filtroTipo) return false;
      if (filtroSistema !== "todos" && t.sistemaRelacionado !== filtroSistema) return false;
      return true;
    }).sort((a, b) => {
      // Ordena por status (ordem do fluxo); concluídas/canceladas sempre no final
      const rank = (t: Tarefa) => {
        const idx = STATUS_ORDER.indexOf(t.status);
        if (t.status === "concluida") return 100;
        if (t.status === "cancelada") return 101;
        return idx === -1 ? 99 : idx;
      };
      const diff = rank(a) - rank(b);
      if (diff !== 0) return diff;
      return new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime();
    });
  }, [tarefas, busca, filtroStatus, filtroPrioridade, filtroTecnico, filtroCliente, filtroTipo, filtroSistema, mostrarFinalizadas]);

  // Opções do seletor de status em destaque (chips)
  const STATUS_FILTERS = useMemo(
    () => [
      { value: "todos", label: "Todos" },
      ...STATUS_ORDER.map(s => ({ value: s as string, label: getStatusLabel(s) })),
      { value: "atrasadas", label: "Atrasadas" },
    ],
    [getStatusLabel]
  );


  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4 p-1">
      <PageHeader
        icon={ClipboardList}
        iconClassName="text-primary"
        title="Central de Tarefas 2.0"
        actions={
          <div className="flex items-center gap-2">
            <Button variant={viewMode === "table" ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setViewMode("table")}><List className="h-4 w-4" /></Button>
            <Button variant={viewMode === "kanban" ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setViewMode("kanban")}><LayoutGrid className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => setShowNova(true)} className="gap-1.5"><Plus className="h-4 w-4" />Nova</Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 items-center bg-card p-3 rounded-xl border shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por título ou tag..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 h-9" />
        </div>

        <div className="flex gap-2 flex-wrap ml-auto">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Prioridade</SelectItem>
              {(["urgente", "alta", "media", "baixa"] as Prioridade[]).map(p => <SelectItem key={p} value={p}>{getPrioridadeLabel(p)}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2 px-3 border rounded-md">
            <Label htmlFor="mostrar-finalizadas" className="text-xs text-muted-foreground cursor-pointer">Finalizadas</Label>
            <Switch id="mostrar-finalizadas" checked={mostrarFinalizadas} onCheckedChange={setMostrarFinalizadas} className="scale-75" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {viewMode === "table" ? (
          <div className="rounded-xl border overflow-hidden shadow-sm bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prazo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTarefas.map(t => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-accent/40" onClick={() => navigate(`/tarefas/${t.id}`)}>
                    <TableCell className="font-medium">{t.titulo}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(t.status)}>{getStatusLabel(t.status)}</Badge>
                    </TableCell>
                    <TableCell><Badge className={prioridadeColor(t.prioridade)}>{getPrioridadeLabel(t.prioridade)}</Badge></TableCell>
                    <TableCell>{getTecnico(t.responsavelId)?.nome || "—"}</TableCell>
                    <TableCell>{t.prazoDataHora ? new Date(t.prazoDataHora).toLocaleDateString() : "—"}</TableCell>
                  </TableRow>
                ))}
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
            mostrarFinalizadas={mostrarFinalizadas}
          />
        )}
      </div>

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
