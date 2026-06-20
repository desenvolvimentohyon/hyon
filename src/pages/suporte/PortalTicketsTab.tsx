import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Headphones, Plus, Link2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PortalTicket {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  client_id: string | null;
  linked_task_id: string | null;
  protocol_number: string | null;
  tracking_token: string | null;
}

export function PortalTicketsTab() {
  const queryClient = useQueryClient();
  const { getCliente, tarefas } = useApp();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkingTicketId, setLinkingTicketId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ["portal_tickets_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portal_tickets")
        .select("id, title, description, status, created_at, updated_at, client_id, linked_task_id, protocol_number, tracking_token")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["portal_ticket_messages_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portal_ticket_messages")
        .select("id, ticket_id, sender_type, sender_name, message, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const selected = tickets?.find(t => t.id === selectedId);
  const ticketMsgs = messages?.filter(m => m.ticket_id === selectedId) || [];

  const unlinkedSupportTasks = useMemo(() =>
    tarefas.filter(t => t.tipoOperacional === "suporte" && !t.linkedTicketId),
    [tarefas]
  );

  const generateProtocol = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
    return `SUP-${dateStr}-${seq}`;
  };

  const getTrackingUrl = (trackingToken: string) =>
    `${window.location.origin}/acompanhamento?token=${trackingToken}`;

  const copyTrackingLink = (trackingToken: string) => {
    navigator.clipboard.writeText(getTrackingUrl(trackingToken));
    toast.success("Link de acompanhamento copiado!");
  };

  const handleCreateTaskFromTicket = async (ticket: PortalTicket) => {
    if (!profile?.org_id) return;
    setSaving(true);
    try {
      const protocol = ticket.protocol_number || generateProtocol();
      if (!ticket.protocol_number) {
        await supabase.from("portal_tickets").update({ protocol_number: protocol }).eq("id", ticket.id);
      }
      const dbData = {
        org_id: profile.org_id,
        title: `[${protocol}] ${ticket.title}`,
        description: ticket.description || "",
        client_id: ticket.client_id || null,
        priority: "media",
        status: "a_fazer",
        tipo_operacional: "suporte",
        linked_ticket_id: ticket.id,
        tags: ["ticket-portal"],
        metadata: {},
      };
      const { data: newTask, error } = await supabase.from("tasks").insert(dbData).select("id").single();
      if (error) throw error;
      await supabase.from("portal_tickets").update({ linked_task_id: newTask.id }).eq("id", ticket.id);
      await supabase.from("task_history").insert({
        org_id: profile.org_id, task_id: newTask.id,
        action: "Criação", details: `Tarefa criada a partir de ticket do portal — Protocolo: ${protocol}`,
      });
      if (ticket.tracking_token) copyTrackingLink(ticket.tracking_token);
      toast.success("Tarefa criada! Link de acompanhamento copiado.");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["portal_tickets_admin"] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Erro ao criar tarefa: " + message);
    } finally {
      setSaving(false);
    }
  };

  const handleLinkTask = async (ticketId: string, taskId: string) => {
    if (!taskId) return;
    setSaving(true);
    try {
      await supabase.from("tasks").update({ linked_ticket_id: ticketId }).eq("id", taskId);
      await supabase.from("portal_tickets").update({ linked_task_id: taskId }).eq("id", ticketId);
      toast.success("Tarefa vinculada ao ticket!");
      setLinkingTicketId(null);
      setSelectedTaskId("");
      refetch();
    } catch {
      toast.error("Erro ao vincular tarefa");
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSaving(true);
    try {
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", (await supabase.auth.getUser()).data.user?.id || "").single();
      await supabase.from("portal_ticket_messages").insert({
        ticket_id: selected.id,
        org_id: (await supabase.from("portal_tickets").select("org_id").eq("id", selected.id).single()).data?.org_id || "",
        sender_type: "staff",
        sender_name: prof?.full_name || "Equipe",
        message: reply.trim(),
      });
      setReply("");
      refetch();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    await supabase.from("portal_tickets").update({ status }).eq("id", ticketId);
    refetch();
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground text-sm">Carregando tickets...</div>;

  if (selected) {
    const linkedTask = selected.linked_task_id ? tarefas.find(t => t.id === selected.linked_task_id) : null;
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>← Voltar</Button>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{selected.title}</CardTitle>
              <Select value={selected.status} onValueChange={v => handleStatusChange(selected.id, v)}>
                <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="respondido">Respondido</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>Cliente: {getCliente(selected.client_id)?.nome || selected.client_id} · {new Date(selected.created_at).toLocaleDateString("pt-BR")}</CardDescription>
            {selected.protocol_number && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs font-mono">{selected.protocol_number}</Badge>
                {selected.tracking_token && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => copyTrackingLink(selected.tracking_token)}>
                    <ExternalLink className="h-3 w-3 mr-1" /> Copiar Link
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {linkedTask ? (
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                <Link2 className="h-4 w-4 text-primary" />
                <span className="text-sm flex-1">Vinculado à tarefa: <strong>{linkedTask.titulo}</strong></span>
                <Button variant="outline" size="sm" onClick={() => navigate(`/tarefas/${linkedTask.id}`)}>
                  <ExternalLink className="h-3 w-3 mr-1" /> Ver Tarefa
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleCreateTaskFromTicket(selected)} disabled={saving}>
                  <Plus className="h-3 w-3 mr-1" /> Criar Tarefa
                </Button>
                <Button size="sm" variant="outline" onClick={() => setLinkingTicketId(selected.id)} disabled={saving}>
                  <Link2 className="h-3 w-3 mr-1" /> Vincular Tarefa Existente
                </Button>
              </div>
            )}

            {linkingTicketId === selected.id && (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/20">
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                  <SelectTrigger className="flex-1 h-8"><SelectValue placeholder="Selecione uma tarefa..." /></SelectTrigger>
                  <SelectContent>
                    {unlinkedSupportTasks.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => handleLinkTask(selected.id, selectedTaskId)} disabled={!selectedTaskId || saving}>Vincular</Button>
                <Button size="sm" variant="ghost" onClick={() => { setLinkingTicketId(null); setSelectedTaskId(""); }}>Cancelar</Button>
              </div>
            )}

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {ticketMsgs.map(m => (
                <div key={m.id} className={`p-3 rounded-lg text-sm ${m.sender_type === "client" ? "bg-muted mr-4" : "bg-primary/5 ml-4"}`}>
                  <p className="font-medium text-xs mb-1">{m.sender_name} <span className="text-muted-foreground">· {new Date(m.created_at).toLocaleDateString("pt-BR")}</span></p>
                  <p className="whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Responder..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <Button size="sm" onClick={handleReply} disabled={saving || !reply.trim()}>Enviar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!tickets || tickets.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhum ticket do portal encontrado.</CardContent></Card>
      ) : tickets.map(t => (
        <Card key={t.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedId(t.id)}>
          <CardContent className="py-3 flex items-center gap-3">
            <Headphones className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.title}</p>
              <p className="text-xs text-muted-foreground">
                {t.protocol_number && <span className="font-mono mr-1">{t.protocol_number} ·</span>}
                {getCliente(t.client_id)?.nome || "Cliente"} · {new Date(t.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {t.linked_task_id && (
              <Badge variant="secondary" className="text-[9px] gap-1 shrink-0">
                <Link2 className="h-3 w-3" /> Tarefa
              </Badge>
            )}
            <Badge variant={t.status === "aberto" ? "outline" : t.status === "finalizado" ? "secondary" : "default"}>{t.status}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
