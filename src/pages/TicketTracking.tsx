import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, Headphones, MessageSquare, Shield } from "lucide-react";

interface TrackingData {
  protocol: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  task: {
    status: string;
    checklist: { texto: string; concluido: boolean }[];
    checklistTotal: number;
    checklistDone: number;
    progressPercent: number;
    totalTimeSeconds: number;
  } | null;
  messages: { senderType: string; senderName: string; message: string; createdAt: string }[];
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  aberto: { label: "Aberto", variant: "outline" },
  em_analise: { label: "Em Análise", variant: "default" },
  respondido: { label: "Respondido", variant: "secondary" },
  finalizado: { label: "Finalizado", variant: "secondary" },
};

export default function TicketTracking() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Link inválido. Verifique o link recebido.");
      setLoading(false);
      return;
    }

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    fetch(`https://${projectId}.supabase.co/functions/v1/ticket-tracking?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Erro ao carregar dados do chamado."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground">{error || "Chamado não encontrado."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[data.status] || { label: data.status, variant: "outline" as const };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-2 pt-4 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase">
            <Headphones className="h-3.5 w-3.5" />
            Acompanhamento de Chamado
          </div>
          {data.protocol && (
            <p className="text-2xl font-bold tracking-tight text-foreground">{data.protocol}</p>
          )}
        </div>

        {/* Status Card */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-semibold text-sm leading-tight">{data.title}</h2>
                <p className="text-xs text-muted-foreground mt-1">{data.clientName} · {new Date(data.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <Badge variant={statusInfo.variant} className="shrink-0">{statusInfo.label}</Badge>
            </div>
            {data.description && (
              <p className="text-xs text-muted-foreground border-t pt-2">{data.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        {data.task && data.task.checklistTotal > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Progresso: {data.task.checklistDone}/{data.task.checklistTotal} itens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={data.task.progressPercent} className="h-2.5" />
              <p className="text-center text-lg font-bold text-primary">{data.task.progressPercent}%</p>
              <div className="space-y-1.5">
                {data.task.checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {item.concluido ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                    )}
                    <span className={item.concluido ? "line-through text-muted-foreground" : ""}>{item.texto}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        {data.messages.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                Mensagens ({data.messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.messages.map((m, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm ${m.senderType === "client" ? "bg-muted mr-4" : "bg-primary/5 ml-4"}`}>
                  <p className="font-medium text-xs mb-1">
                    {m.senderName}
                    <span className="text-muted-foreground ml-1">· {new Date(m.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  </p>
                  <p className="whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground/60 pb-6">
          Esta página é atualizada automaticamente. Recarregue para ver atualizações.
        </p>
      </div>
    </div>
  );
}
