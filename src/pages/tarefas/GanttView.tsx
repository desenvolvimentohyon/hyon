import { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import { Tarefa } from '@/types';
import { Card } from '@/components/ui/card';

interface GanttViewProps {
  tasks: Tarefa[];
}

export function GanttView({ tasks }: GanttViewProps) {
  const ganttRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ganttRef.current || tasks.length === 0) return;

    const formattedTasks = tasks.map(t => ({
      id: t.id,
      name: t.titulo,
      start: t.criadoEm,
      end: t.prazoDataHora || new Date(new Date(t.criadoEm).getTime() + 86400000).toISOString(),
      progress: t.status === 'concluida' ? 100 : t.status === 'em_andamento' ? 50 : 0,
      dependencies: '',
      custom_class: t.prioridade === 'urgente' ? 'bar-urgente' : ''
    }));

    try {
      new Gantt(ganttRef.current, formattedTasks, {
        header_height: 50,
        column_width: 30,
        step: 24,
        view_modes: ['Day', 'Week', 'Month'],
        bar_height: 20,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        view_mode: 'Day',
        date_format: 'YYYY-MM-DD',
        language: 'pt-br',
        on_click: (task: any) => {
          // Implementar clique se necessário
        }
      });
    } catch (e) {
      console.error("Gantt error:", e);
    }
  }, [tasks]);

  return (
    <Card className="p-4 overflow-x-auto bg-card border shadow-sm rounded-xl">
      <style>{`
        .gantt .bar-urgente .bar { fill: #ef4444; }
        .gantt .bar-label { font-size: 10px; fill: #94a3b8; }
        .gantt .grid-header { fill: transparent; stroke: #1e293b; }
        .gantt .grid-row { fill: transparent; stroke: #1e293b; }
        .gantt .lower-header text { fill: #94a3b8; }
        .gantt .upper-header text { fill: #f8fafc; font-weight: bold; }
        .gantt .bar { fill: #3b82f6; }
        .gantt .bar-progress { fill: #2563eb; }
      `}</style>
      <svg ref={ganttRef} className="w-full min-h-[400px]" />
      {tasks.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          Nenhuma tarefa para exibir na linha do tempo.
        </div>
      )}
    </Card>
  );
}
