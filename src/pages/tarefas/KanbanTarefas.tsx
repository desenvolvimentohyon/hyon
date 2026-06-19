import React, { useState } from "react";
import { Tarefa, StatusTarefa, STATUS_ORDER } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIPO_OPERACIONAL_CONFIG } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { statusRowColor } from "./helpers";
import { LiveTimer } from "./LiveTimer";

export function KanbanTarefas({ filteredTarefas, isAtrasada, statusColor, prioridadeColor, getStatusLabel, getPrioridadeLabel, getCliente, getTecnico, updateTarefa, navigate }: any) {
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
                    className={`cursor-grab active:cursor-grabbing transition-all duration-150 hover:shadow-card-hover ${statusRowColor(t.status)} ${dragId === t.id ? "opacity-50 scale-95" : ""}`}
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
                        <span>{t.clienteId ? getCliente(t.clienteId)?.nome?.split(" ")[0] : (t.nomeClienteAvulso?.split(" ")[0] || "Avulsa")}</span>
                        <span>{getTecnico(t.responsavelId)?.nome?.split(" ")[0]}</span>
                      </div>
                      <div className="pt-1 border-t border-border/30">
                        <LiveTimer tempoTotalSegundos={t.tempoTotalSegundos} timerRodando={t.timerRodando} timerInicioTimestamp={t.timerInicioTimestamp} />
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
