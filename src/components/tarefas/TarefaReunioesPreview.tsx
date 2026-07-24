import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface MiniMeeting {
  id: string;
  title: string;
  starts_at: string;
  status: "agendada" | "realizada" | "cancelada";
}

const STATUS_STYLE: Record<MiniMeeting["status"], string> = {
  agendada: "bg-primary/10 text-primary border-primary/30",
  realizada: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  cancelada: "bg-destructive/10 text-destructive border-destructive/30",
};

const STATUS_LABEL: Record<MiniMeeting["status"], string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

// simple in-memory cache to avoid refetching per hover
const cache = new Map<string, MiniMeeting[]>();

export function TarefaReunioesPreview({ taskId }: { taskId: string }) {
  const [meetings, setMeetings] = useState<MiniMeeting[] | null>(cache.get(taskId) ?? null);
  const [loading, setLoading] = useState(!cache.has(taskId));

  useEffect(() => {
    if (cache.has(taskId)) {
      setMeetings(cache.get(taskId)!);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("meetings")
        .select("id, title, starts_at, status")
        .eq("task_id", taskId)
        .order("starts_at", { ascending: false })
        .limit(5);
      if (cancelled) return;
      const list = (data || []) as MiniMeeting[];
      cache.set(taskId, list);
      setMeetings(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  return (
    <div className="w-72 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <CalendarDays className="h-3.5 w-3.5 text-primary" />
        Reuniões vinculadas
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : !meetings || meetings.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma reunião vinculada.</p>
      ) : (
        <ul className="space-y-1.5">
          {meetings.map((m) => (
            <li key={m.id} className="text-xs flex items-start gap-2">
              <Badge variant="outline" className={`text-[9px] shrink-0 mt-0.5 ${STATUS_STYLE[m.status]}`}>
                {STATUS_LABEL[m.status]}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{m.title}</p>
                <p className="text-muted-foreground text-[10px]">
                  {format(new Date(m.starts_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
