import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarPlus, Edit3, Video, MapPin, ExternalLink, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskMeeting {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: "agendada" | "realizada" | "cancelada";
  location: string | null;
  meeting_link: string | null;
  google_event_id: string | null;
  internal_user_ids: string[] | null;
}

const STATUS_STYLE: Record<TaskMeeting["status"], string> = {
  agendada: "bg-primary/10 text-primary border-primary/30",
  realizada: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  cancelada: "bg-destructive/10 text-destructive border-destructive/30",
};

const STATUS_LABEL: Record<TaskMeeting["status"], string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

export function TarefaReunioes({
  taskId,
  onPendingChange,
}: {
  taskId: string;
  onPendingChange?: (count: number) => void;
}) {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<TaskMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("meetings")
      .select("id, title, starts_at, ends_at, status, location, meeting_link, google_event_id, internal_user_ids")
      .eq("task_id", taskId)
      .order("starts_at", { ascending: false });
    if (error) toast.error("Erro ao carregar reuniões");
    else {
      const list = (data || []) as TaskMeeting[];
      setMeetings(list);
      onPendingChange?.(list.filter((m) => m.status === "agendada").length);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleNew = () => navigate(`/reunioes?new=1&task=${taskId}`);
  const handleEdit = (id: string) => navigate(`/reunioes?open=${id}`);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Reuniões vinculadas</h3>
          <p className="text-xs text-muted-foreground">
            {meetings.length === 0 ? "Nenhuma reunião" : `${meetings.length} reunião(ões)`}
          </p>
        </div>
        <Button size="sm" onClick={handleNew} className="gap-1.5">
          <CalendarPlus className="h-4 w-4" />
          Nova reunião
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma reunião vinculada a esta tarefa.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {meetings.map((m) => (
            <Card key={m.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{m.title}</span>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_STYLE[m.status]}`}>
                      {STATUS_LABEL[m.status]}
                    </Badge>
                    {m.google_event_id && (
                      <Badge variant="outline" className="text-[10px]">Google Calendar</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>
                      {format(new Date(m.starts_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      {" – "}
                      {format(new Date(m.ends_at), "HH:mm", { locale: ptBR })}
                    </span>
                    {m.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</span>
                    )}
                    {m.meeting_link && (
                      <span className="flex items-center gap-1"><Video className="h-3 w-3" />Link</span>
                    )}
                    {m.internal_user_ids && m.internal_user_ids.length > 0 && (
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{m.internal_user_ids.length}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {m.meeting_link && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => window.open(m.meeting_link!, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => handleEdit(m.id)}>
                    <Edit3 className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
