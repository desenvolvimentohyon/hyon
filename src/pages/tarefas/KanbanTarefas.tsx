import React, { useState } from "react";
import { Tarefa, StatusTarefa, STATUS_ORDER } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIPO_OPERACIONAL_CONFIG } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { statusRowColor } from "./helpers";
import { LiveTimer } from "./LiveTimer";
import { TarefaReunioesPreview } from "@/components/tarefas/TarefaReunioesPreview";

export function KanbanTarefas({ filteredTarefas, isAtrasada, statusColor, prioridadeColor, getStatusLabel, getPrioridadeLabel, getCliente, getTecnico, updateTarefa, navigate, mostrarFinalizadas = true }: any) {
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
    <div className="flex gap-4 overflow-x-auto pb-6 h-full min-h-[500px] scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
      {STATUS_ORDER.map(status => {
        const columnTasks = filteredTarefas.filter((t: Tarefa) => t.status === status);
        const finalizada = status === "concluida" || status === "cancelada";
        const ocultaFinalizada = finalizada && !mostrarFinalizadas && columnTasks.length === 0;
        
        if (ocultaFinalizada) return null;

        return (
          <div
            key={status}
            className={`flex-shrink-0 w-[300px] flex flex-col rounded-xl bg-accent/20 border-border/50 border transition-all duration-200 ${dragOver === status ? "bg-accent/40 ring-2 ring-primary/40 shadow-lg" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(status); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between p-3 border-b border-border/40 bg-accent/10 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColor(status).replace('text-', 'bg-').split(' ')[0]}`} />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{getStatusLabel(status)}</h3>
              </div>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded-full">{columnTasks.length}</Badge>
            </div>
            
            <div className="flex-1 p-2 space-y-3 overflow-y-auto scrollbar-none">
              {columnTasks.map((t: Tarefa) => {
                const tipoConfig = TIPO_OPERACIONAL_CONFIG[t.tipoOperacional] || { label: t.tipoOperacional, bgClass: "bg-muted text-muted-foreground" };
                const atrasada = isAtrasada(t);
                
                return (
                  <HoverCard key={t.id} openDelay={300} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <Card
                        draggable
                        onDragStart={e => handleDragStart(e, t.id)}
                        onDragEnd={() => { setDragId(null); setDragOver(null); }}
                        className={`group relative border-none shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${statusRowColor(t.status)} ${dragId === t.id ? "opacity-40 scale-95" : "hover:-translate-y-1"}`}
                      >
                        <CardContent className="p-3 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold leading-snug text-foreground/90 group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/tarefas/${t.id}`)}>
                              {t.titulo}
                            </h4>
                            {atrasada && (
                              <div className="flex items-center gap-1 text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5" /> ATRASADA
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className={`text-[9px] font-medium border-primary/20 ${tipoConfig.bgClass.replace('bg-', 'bg-primary/5 text-')}`}>
                              {tipoConfig.label}
                            </Badge>
                            <Badge className={`text-[9px] font-bold ${prioridadeColor(t.prioridade)} shadow-sm`}>
                              {getPrioridadeLabel(t.prioridade)}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/20">
                            <div className="flex -space-x-2">
                              <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold uppercase" title={`Técnico: ${getTecnico(t.responsavelId)?.nome}`}>
                                {getTecnico(t.responsavelId)?.nome?.substring(0, 2)}
                              </div>
                              {t.clienteId && (
                                <div className="w-6 h-6 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary" title={`Cliente: ${getCliente(t.clienteId)?.nome}`}>
                                  {getCliente(t.clienteId)?.nome?.substring(0, 1)}
                                </div>
                              )}
                            </div>
                            <LiveTimer tempoTotalSegundos={t.tempoTotalSegundos} timerRodando={t.timerRodando} timerInicioTimestamp={t.timerInicioTimestamp} />
                          </div>
                        </CardContent>
                      </Card>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" align="start" className="w-80 p-0 shadow-2xl border-primary/10 overflow-hidden">
                       <div className="bg-primary/5 p-3 border-b border-primary/10">
                         <h5 className="text-xs font-bold text-primary uppercase flex items-center gap-2">
                           <Sparkles className="w-3 h-3" /> Resumo da Tarefa
                         </h5>
                       </div>
                       <div className="p-3">
                         <TarefaReunioesPreview taskId={t.id} />
                       </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
              
              {columnTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground/30 border-2 border-dashed border-border/30 rounded-lg">
                  <ClipboardList className="w-6 h-6 mb-1 opacity-20" />
                  <span className="text-[10px] font-medium uppercase tracking-widest">Vazio</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
