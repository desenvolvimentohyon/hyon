import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin, Video, Users, CheckCircle2, ChevronRight, Share2, UserCheck, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ReuniaoPublica() {
  const { token } = useParams<{ token: string }>();
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!guestName.trim()) {
      toast.error("Por favor, informe seu nome para confirmar.");
      return;
    }
    setConfirming(true);
    try {
      const { data, error } = await supabase.rpc("confirm_meeting_attendance" as any, {
        p_token: token,
        p_guest_name: guestName.trim()
      });
      
      if (error) throw error;
      
      if (data) {
        toast.success("Presença confirmada com sucesso!");
        setConfirmed(true);
        // Recarrega os dados da reunião para mostrar o status atualizado
        const { data: updatedMeeting } = await supabase
          .from("meetings")
          .select("*, profiles:created_by(nome, email)")
          .filter("public_token" as any, "eq", token)
          .maybeSingle();
        if (updatedMeeting) setMeeting(updatedMeeting);
      } else {
        toast.error("Nome não encontrado na lista de convidados.");
      }
    } catch (e) {
      toast.error("Erro ao confirmar presença.");
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    async function load() {
      if (!token) return;
      
      const { data, error } = await supabase
        .from("meetings")
        .select("*, profiles:created_by(nome, email)")
        .eq("public_token", token)
        .maybeSingle();

      if (error || !data) {
        toast.error("Reunião não encontrada ou link expirado");
        setLoading(false);
        return;
      }

      setMeeting(data);
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-12">
          <CardContent>
            <h1 className="text-2xl font-bold mb-4">Reunião não encontrada</h1>
            <p className="text-muted-foreground mb-6">O link pode estar incorreto ou a reunião foi cancelada.</p>
            <Button asChild>
              <Link to="/">Ir para o Início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPast = new Date(meeting.ends_at) < new Date();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <img src="/logo-hyon.png" alt="Hyon" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight">{meeting.title}</h1>
          <div className="flex items-center justify-center gap-2">
            <Badge variant={isPast ? "secondary" : "default"} className="uppercase">
              {isPast ? "Encerrada" : meeting.status}
            </Badge>
          </div>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="h-2 bg-primary" />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Detalhes do Agendamento
            </CardTitle>
            <CardDescription>Confira abaixo as informações para participar da reunião.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Data e Horário</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(meeting.starts_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground opacity-70">
                    Duração prevista: {Math.round((new Date(meeting.ends_at).getTime() - new Date(meeting.starts_at).getTime()) / 60000)} minutos
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                <Video className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Local da Reunião</p>
                  {meeting.meeting_link ? (
                    <a 
                      href={meeting.meeting_link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      Entrar na Reunião <ChevronRight className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">{meeting.location || "Link não informado"}</p>
                  )}
                </div>
              </div>
            </div>

            {meeting.description && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium">Descrição / Pauta</p>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-4 rounded-md">
                  {meeting.description}
                </div>
              </div>
            )}

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Participantes Confirmados
                </p>
                <Badge variant="outline" className="font-normal">
                  {meeting.external_guests?.length + (meeting.internal_user_ids?.length || 0)} total
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {meeting.profiles && (
                  <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
                    Organizador: {meeting.profiles.nome}
                  </Badge>
                )}
                {meeting.external_guests?.map((guest: any, i: number) => (
                  <Badge key={i} variant={guest.confirmed ? "default" : "outline"} className="px-3 py-1 gap-1">
                    {guest.name} {guest.confirmed && <CheckCircle2 className="h-3 w-3" />}
                  </Badge>
                ))}
              </div>
            </div>

            {!isPast && (
              <div className="space-y-4 border-t pt-4">
                <p className="text-sm font-medium flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" /> Confirmar sua presença
                </p>
                {!confirmed ? (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Seu nome completo" 
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="bg-muted/30"
                    />
                    <Button 
                      onClick={handleConfirm} 
                      disabled={confirming}
                      className="shrink-0"
                    >
                      {confirming ? "Confirmando..." : "Confirmar"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Sua presença foi confirmada!</span>
                  </div>
                )}
              </div>
            )}
            {!isPast && (
              <div className="flex flex-col gap-3 pt-6 border-t mt-4">
                <Button className="w-full h-12 text-lg font-semibold gap-2 shadow-lg shadow-primary/20" asChild disabled={!meeting.meeting_link}>
                  {meeting.meeting_link ? (
                    <a 
                      href={meeting.meeting_link} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      <Video className="h-5 w-5" /> Entrar Agora
                    </a>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Video className="h-5 w-5" /> Link indisponível
                    </span>
                  )}
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={() => {
                  const url = window.location.href;
                  navigator.clipboard.writeText(url);
                  toast.success("Link copiado!");
                }}>
                  <Share2 className="h-4 w-4" /> Compartilhar Link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Hyon. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
