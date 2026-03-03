import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Tarefa, StatusTarefa, Prioridade } from "@/types";

interface Props {
  clienteId: string;
  tarefas: Tarefa[];
  getStatusLabel: (s: StatusTarefa) => string;
  getPrioridadeLabel: (p: Prioridade) => string;
  navigate: (path: string) => void;
}

export default function TabHistorico({ clienteId, tarefas, getStatusLabel, getPrioridadeLabel, navigate }: Props) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-start">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tarefas & Histórico ({tarefas.length})</p>
          <Button size="sm" onClick={() => navigate("/tarefas?nova=1")} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Nova Tarefa</Button>
        </div>

        {tarefas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tarefa vinculada a este cliente.</p>
        ) : (
          <div className="space-y-2">
            {tarefas.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/tarefas/${t.id}`)}>
                <Badge variant="outline" className="text-[10px]">{getStatusLabel(t.status)}</Badge>
                <span className="text-sm font-medium flex-1">{t.titulo}</span>
                <Badge variant="outline" className="text-[10px]">{getPrioridadeLabel(t.prioridade)}</Badge>
                <span className="text-[10px] text-muted-foreground">{new Date(t.criadoEm).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
