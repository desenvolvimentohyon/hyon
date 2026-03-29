import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Code2, Plus, Calendar, DollarSign, CheckCircle2, Clock, Pause, XCircle, Rocket } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataSkeleton } from "@/components/ui/data-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useDevProjects, DevProject } from "@/hooks/useDevProjects";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  planejamento: { label: "Planejamento", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  em_andamento: { label: "Em Andamento", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Rocket },
  pausado: { label: "Pausado", color: "bg-muted text-muted-foreground", icon: Pause },
  concluido: { label: "Concluído", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const PLAN_LABELS: Record<string, string> = { mensal: "Mensal", anual: "Anual", unico: "Único" };

export default function Desenvolvimento() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, loading, createProject } = useDevProjects();
  const [filter, setFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", client_id: "", plan_type: "unico",
    project_value: "", monthly_value: "", setup_value: "", deadline_at: "",
  });

  useEffect(() => {
    (async () => {
      const { data: profile } = await supabase.from("profiles" as any).select("org_id").eq("id", user!.id).single();
      if (!profile) return;
      const { data } = await supabase.from("clients").select("id, name").eq("org_id", (profile as any).org_id).eq("status", "ativo").order("name");
      if (data) setClients(data);
    })();
  }, [user]);

  const filtered = projects.filter(p => filter === "todos" ? p.status !== "cancelado" : p.status === filter);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const ok = await createProject({
      title: form.title,
      description: form.description,
      client_id: form.client_id || null,
      plan_type: form.plan_type,
      project_value: Number(form.project_value) || 0,
      monthly_value: Number(form.monthly_value) || 0,
      setup_value: Number(form.setup_value) || 0,
      deadline_at: form.deadline_at || null,
    });
    if (ok) {
      setDialogOpen(false);
      setForm({ title: "", description: "", client_id: "", plan_type: "unico", project_value: "", monthly_value: "", setup_value: "", deadline_at: "" });
    }
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Code2}
        iconColor="text-indigo-600"
        title="Desenvolvimento"
        description="Gerencie projetos de criação de sistemas"
        actions={<Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo Projeto</Button>}
      />

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <TabsTrigger key={k} value={k}>{v.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <DataSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Code2} title="Nenhum projeto encontrado" description="Crie seu primeiro projeto de desenvolvimento" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(p => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.planejamento;
            const Icon = cfg.icon;
            const stagesPct = p.stages_total ? Math.round((p.stages_done! / p.stages_total) * 100) : 0;
            return (
              <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/desenvolvimento/${p.id}`)}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{p.client_name}</p>
                    </div>
                    <Badge className={`shrink-0 ${cfg.color}`}><Icon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{fmt(p.project_value)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{PLAN_LABELS[p.plan_type]}</span>
                  </div>

                  {p.stages_total! > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Etapas</span>
                        <span>{p.stages_done}/{p.stages_total}</span>
                      </div>
                      <Progress value={stagesPct} className="h-1.5" />
                    </div>
                  )}

                  {p.checklist_total! > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Checklist: {p.checklist_done}/{p.checklist_total} itens
                    </p>
                  )}

                  {p.deadline_at && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Prazo: {new Date(p.deadline_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Novo Projeto */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nome do sistema" />
            </div>
            <div>
              <Label>Cliente</Label>
              <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plano</Label>
                <Select value={form.plan_type} onValueChange={v => setForm(f => ({ ...f, plan_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unico">Único</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prazo de Entrega</Label>
                <Input type="date" value={form.deadline_at} onChange={e => setForm(f => ({ ...f, deadline_at: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Valor do Projeto</Label>
                <Input type="number" min={0} step="0.01" value={form.project_value} onChange={e => setForm(f => ({ ...f, project_value: e.target.value }))} placeholder="0,00" />
              </div>
              <div>
                <Label>Valor Mensal</Label>
                <Input type="number" min={0} step="0.01" value={form.monthly_value} onChange={e => setForm(f => ({ ...f, monthly_value: e.target.value }))} placeholder="0,00" />
              </div>
              <div>
                <Label>Setup / Implantação</Label>
                <Input type="number" min={0} step="0.01" value={form.setup_value} onChange={e => setForm(f => ({ ...f, setup_value: e.target.value }))} placeholder="0,00" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim()}>Criar Projeto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
