import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarPlus, Video, MapPin, Link as LinkIcon, Users, Trash2, Edit3, ChevronLeft, ChevronRight, CalendarDays, List, Bell, ExternalLink, Download, RefreshCw, CheckCircle2, Plus, ListTodo } from "lucide-react";
import { downloadIcs, googleCalendarUrl } from "@/lib/icsExport";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { useUsers } from "@/contexts/UsersContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MeetingStatus = "agendada" | "realizada" | "cancelada";

interface ExternalGuest {
  name: string;
  email?: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  meeting_link: string | null;
  client_id: string | null;
  task_id: string | null;
  status: MeetingStatus;
  internal_user_ids: string[];
  external_guests: ExternalGuest[];
  notes: string | null;
  google_event_id: string | null;
  created_by: string;
}

const STATUS_STYLE: Record<MeetingStatus, { label: string; className: string }> = {
  agendada: { label: "Agendada", className: "bg-primary/10 text-primary border-primary/30" },
  realizada: { label: "Realizada", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  cancelada: { label: "Cancelada", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

function toLocalInput(date: string): string {
  const d = new Date(date);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

function emptyForm() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    description: "",
    starts_at: toLocalInput(now.toISOString()),
    ends_at: toLocalInput(end.toISOString()),
    location: "",
    meeting_link: "",
    client_id: "none" as string,
    task_id: "none" as string,
    status: "agendada" as MeetingStatus,
    internal_user_ids: [] as string[],
    external_guests: [] as ExternalGuest[],
    notes: "",
  };
}

export default function Reunioes() {
  const { user } = useAuth();
  const { clientes, tarefas, addCliente } = useApp();
  const { users } = useUsers();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newGuest, setNewGuest] = useState({ name: "", email: "" });
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ nome: "", telefone: "", email: "" });
  const [savingClient, setSavingClient] = useState(false);
  const gCal = useGoogleCalendar();

  const handleCreateClient = async () => {
    if (!newClient.nome.trim()) return toast.error("Informe o nome do cliente");
    setSavingClient(true);
    try {
      const created = await addCliente({
        nome: newClient.nome.trim(),
        telefone: newClient.telefone.trim(),
        email: newClient.email.trim(),
        documento: "",
        observacoes: "",
      } as any);
      if (created?.id) {
        setForm((f) => ({ ...f, client_id: created.id }));
        toast.success("Cliente cadastrado e vinculado");
        setNewClient({ nome: "", telefone: "", email: "" });
        setNewClientOpen(false);
      }
    } finally {
      setSavingClient(false);
    }
  };

  const handleSyncGoogle = async (meetingId: string) => {
    if (!gCal.connected) {
      toast.error("Conecte sua conta do Google Calendar nas Configurações primeiro.");
      return;
    }
    setSyncingId(meetingId);
    try {
      const r = await gCal.syncMeeting(meetingId);
      toast.success("Reunião sincronizada com Google Calendar! Convites enviados.");
      await loadMeetings();
      if (r?.html_link) window.open(r.html_link, "_blank");
    } catch (e) {
      toast.error("Falha ao sincronizar: " + (e as Error).message);
    }
    setSyncingId(null);
  };

  const loadMeetings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .order("starts_at", { ascending: true });
    if (error) {
      toast.error("Erro ao carregar reuniões");
    } else {
      setMeetings((data || []) as unknown as Meeting[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const handledParamsRef = useRef(false);
  useEffect(() => {
    if (loading || handledParamsRef.current) return;
    const openId = searchParams.get("open");
    const isNew = searchParams.get("new");
    const taskParam = searchParams.get("task");
    if (openId) {
      const m = meetings.find((x) => x.id === openId);
      if (m) {
        openEdit(m);
        handledParamsRef.current = true;
        searchParams.delete("open");
        setSearchParams(searchParams, { replace: true });
      }
    } else if (isNew) {
      setEditingId(null);
      setForm({ ...emptyForm(), task_id: taskParam || "none" });
      setOpenForm(true);
      handledParamsRef.current = true;
      searchParams.delete("new");
      searchParams.delete("task");
      setSearchParams(searchParams, { replace: true });
    }
  }, [loading, meetings, searchParams, setSearchParams]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpenForm(true);
  };

  const openEdit = (m: Meeting) => {
    setEditingId(m.id);
    setForm({
      title: m.title,
      description: m.description || "",
      starts_at: toLocalInput(m.starts_at),
      ends_at: toLocalInput(m.ends_at),
      location: m.location || "",
      meeting_link: m.meeting_link || "",
      client_id: m.client_id || "none",
      task_id: m.task_id || "none",
      status: m.status,
      internal_user_ids: m.internal_user_ids || [],
      external_guests: m.external_guests || [],
      notes: m.notes || "",
    });
    setOpenForm(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.title.trim()) return toast.error("Informe um título");
    if (!form.starts_at || !form.ends_at) return toast.error("Informe início e fim");
    if (new Date(form.ends_at) <= new Date(form.starts_at)) return toast.error("O fim deve ser após o início");

    // Get org_id from profile
    const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).maybeSingle();
    if (!profile?.org_id) return toast.error("Perfil não encontrado");

    const payload = {
      org_id: profile.org_id,
      created_by: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      location: form.location.trim() || null,
      meeting_link: form.meeting_link.trim() || null,
      client_id: form.client_id === "none" ? null : form.client_id,
      task_id: form.task_id === "none" ? null : form.task_id,
      status: form.status,
      internal_user_ids: form.internal_user_ids,
      external_guests: form.external_guests as unknown as never,
      notes: form.notes.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase.from("meetings").update(payload).eq("id", editingId);
      if (error) return toast.error("Erro ao atualizar");
      toast.success("Reunião atualizada");
    } else {
      const { error } = await supabase.from("meetings").insert(payload);
      if (error) return toast.error("Erro ao criar reunião");
      toast.success("Reunião agendada — lembretes push serão enviados");
    }

    setOpenForm(false);
    loadMeetings();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("meetings").delete().eq("id", deleteId);
    if (error) toast.error("Erro ao excluir");
    else toast.success("Reunião excluída");
    setDeleteId(null);
    loadMeetings();
  };

  const toggleParticipant = (userId: string) => {
    setForm((f) => ({
      ...f,
      internal_user_ids: f.internal_user_ids.includes(userId)
        ? f.internal_user_ids.filter((id) => id !== userId)
        : [...f.internal_user_ids, userId],
    }));
  };

  const addGuest = () => {
    if (!newGuest.name.trim()) return;
    setForm((f) => ({ ...f, external_guests: [...f.external_guests, { name: newGuest.name.trim(), email: newGuest.email.trim() || undefined }] }));
    setNewGuest({ name: "", email: "" });
  };

  const removeGuest = (idx: number) => {
    setForm((f) => ({ ...f, external_guests: f.external_guests.filter((_, i) => i !== idx) }));
  };

  // Calendar grid
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { locale: ptBR });
    const end = endOfWeek(endOfMonth(monthCursor), { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const m of meetings) {
      const key = format(new Date(m.starts_at), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return map;
  }, [meetings]);

  const upcoming = useMemo(
    () => meetings.filter((m) => new Date(m.ends_at) >= new Date() && m.status === "agendada"),
    [meetings],
  );
  const past = useMemo(
    () => meetings.filter((m) => new Date(m.ends_at) < new Date() || m.status !== "agendada"),
    [meetings],
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Reuniões</h1>
          <p className="text-sm text-muted-foreground">Agenda, participantes e lembretes push automáticos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-md">
            <Bell className="h-3.5 w-3.5" />
            Lembretes: 1d • 1h • 15min
          </div>
          <Button onClick={openNew} className="gap-2">
            <CalendarPlus className="h-4 w-4" />
            Nova reunião
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")}>
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="h-4 w-4" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" /> Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base capitalize">
                {format(monthCursor, "MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setMonthCursor(subMonths(monthCursor, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMonthCursor(new Date())}>Hoje</Button>
                <Button variant="ghost" size="icon" onClick={() => setMonthCursor(addMonths(monthCursor, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground mb-2">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <div key={d} className="text-center py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayMeetings = meetingsByDay.get(key) || [];
                  const isCurrentMonth = isSameMonth(day, monthCursor);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={key}
                      className={cn(
                        "min-h-[90px] p-1.5 border rounded-md text-xs space-y-1",
                        !isCurrentMonth && "opacity-40",
                        isToday && "border-primary/60 bg-primary/5",
                      )}
                    >
                      <div className={cn("font-medium", isToday && "text-primary")}>{format(day, "d")}</div>
                      {dayMeetings.slice(0, 3).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => openEdit(m)}
                          className={cn(
                            "w-full text-left truncate px-1.5 py-0.5 rounded border text-[10px] hover:opacity-80 transition",
                            STATUS_STYLE[m.status].className,
                          )}
                          title={m.title}
                        >
                          {format(new Date(m.starts_at), "HH:mm")} {m.title}
                        </button>
                      ))}
                      {dayMeetings.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">+ {dayMeetings.length - 3}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <MeetingList title="Próximas reuniões" items={upcoming} onEdit={openEdit} onDelete={(id) => setDeleteId(id)} onSync={handleSyncGoogle} googleConnected={gCal.connected} syncingId={syncingId} loading={loading} clientes={clientes} users={users} />
          <MeetingList title="Histórico" items={past} onEdit={openEdit} onDelete={(id) => setDeleteId(id)} onSync={handleSyncGoogle} googleConnected={gCal.connected} syncingId={syncingId} loading={false} clientes={clientes} users={users} />
        </TabsContent>
      </Tabs>

      {/* Form dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar reunião" : "Nova reunião"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Alinhamento comercial" />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Início *</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div>
                <Label>Fim *</Label>
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Local</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Escritório, endereço..." />
              </div>
              <div>
                <Label>Link (Meet, Zoom, Teams...)</Label>
                <Input value={form.meeting_link} onChange={(e) => setForm({ ...form, meeting_link: e.target.value })} placeholder="https://..." />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Cliente vinculado</Label>
                  <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => setNewClientOpen(true)}>
                    <Plus className="h-3 w-3" /> Novo
                  </Button>
                </div>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as MeetingStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="realizada">Realizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-1"><ListTodo className="h-4 w-4" /> Tarefa vinculada</Label>
              <Select value={form.task_id} onValueChange={(v) => setForm({ ...form, task_id: v })}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {tarefas
                    .filter((t) => !form.client_id || form.client_id === "none" || t.clienteId === form.client_id)
                    .slice(0, 200)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.titulo}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {form.client_id !== "none" && (
                <p className="text-[11px] text-muted-foreground mt-1">Mostrando apenas tarefas do cliente selecionado.</p>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2"><Users className="h-4 w-4" /> Participantes internos</Label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                {users.length === 0 && <span className="text-xs text-muted-foreground">Nenhum usuário</span>}
                {users.map((u) => {
                  const active = form.internal_user_ids.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleParticipant(u.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs border transition",
                        active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted",
                      )}
                    >
                      {u.nome || u.email}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Convidados externos</Label>
              <div className="flex gap-2 mb-2">
                <Input placeholder="Nome" value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} />
                <Input placeholder="Email (opcional)" value={newGuest.email} onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })} />
                <Button type="button" variant="outline" onClick={addGuest}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.external_guests.map((g, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {g.name}{g.email ? ` (${g.email})` : ""}
                    <button onClick={() => removeGuest(i)} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Notas / Ata</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Pauta, decisões, próximos passos..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar alterações" : "Agendar reunião"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Nome *</Label>
              <Input value={newClient.nome} onChange={(e) => setNewClient({ ...newClient, nome: e.target.value })} placeholder="Nome do cliente" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Telefone</Label>
                <Input value={newClient.telefone} onChange={(e) => setNewClient({ ...newClient, telefone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="email@..." />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Você poderá completar os demais dados na aba Clientes.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewClientOpen(false)} disabled={savingClient}>Cancelar</Button>
            <Button onClick={handleCreateClient} disabled={savingClient}>{savingClient ? "Salvando..." : "Cadastrar e vincular"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir reunião?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface MeetingListProps {
  title: string;
  items: Meeting[];
  onEdit: (m: Meeting) => void;
  onDelete: (id: string) => void;
  onSync: (id: string) => void;
  googleConnected: boolean;
  syncingId: string | null;
  loading: boolean;
  clientes: Array<{ id: string; nome: string }>;
  users: Array<{ id: string; nome?: string; email?: string }>;
}

function MeetingList({ title, items, onEdit, onDelete, onSync, googleConnected, syncingId, loading, clientes, users }: MeetingListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title} <span className="text-muted-foreground font-normal">({items.length})</span></CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma reunião</div>
        ) : (
          items.map((m) => {
            const client = clientes.find((c) => c.id === m.client_id);
            const participantNames = (m.internal_user_ids || [])
              .map((id) => users.find((u) => u.id === id))
              .filter(Boolean)
              .map((u) => u!.nome || u!.email);
            return (
              <div key={m.id} className="flex items-start justify-between gap-3 p-3 border rounded-md hover:bg-muted/30 transition">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{m.title}</span>
                    <Badge variant="outline" className={cn("text-xs", STATUS_STYLE[m.status].className)}>{STATUS_STYLE[m.status].label}</Badge>
                    {client && <Badge variant="secondary" className="text-xs">{client.nome}</Badge>}
                    {m.google_event_id && (
                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Google Calendar
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(m.starts_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {m.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</span>}
                    {m.meeting_link && (
                      <a href={m.meeting_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <LinkIcon className="h-3 w-3" /> Entrar
                      </a>
                    )}
                    {participantNames.length > 0 && (
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{participantNames.length}</span>
                    )}
                  </div>
                  {m.description && <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Adicionar ao Google Calendar"
                    onClick={() => window.open(googleCalendarUrl({
                      uid: m.id,
                      title: m.title,
                      description: m.description,
                      location: m.location,
                      meetingLink: m.meeting_link,
                      startsAt: m.starts_at,
                      endsAt: m.ends_at,
                      attendees: (m.external_guests || []).filter(g => g.email).map(g => ({ name: g.name, email: g.email! })),
                    }), "_blank")}
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Baixar arquivo .ics"
                    onClick={() => downloadIcs({
                      uid: m.id,
                      title: m.title,
                      description: m.description,
                      location: m.location,
                      meetingLink: m.meeting_link,
                      startsAt: m.starts_at,
                      endsAt: m.ends_at,
                      attendees: (m.external_guests || []).filter(g => g.email).map(g => ({ name: g.name, email: g.email! })),
                    })}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {googleConnected && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary"
                      title={m.google_event_id ? "Atualizar no Google Calendar" : "Sincronizar com Google Calendar (envia convites)"}
                      disabled={syncingId === m.id}
                      onClick={() => onSync(m.id)}
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", syncingId === m.id && "animate-spin")} />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(m)}>
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
