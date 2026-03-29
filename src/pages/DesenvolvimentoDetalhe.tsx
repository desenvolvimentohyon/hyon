import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Code2, ArrowLeft, Plus, Trash2, Calendar, Save, DollarSign, CheckCircle2, Clock, Pause, XCircle, Rocket } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { DataSkeleton } from "@/components/ui/data-skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDevStages, useDevChecklist, DevStage, DevCheckItem } from "@/hooks/useDevProjects";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "planejamento", label: "Planejamento" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "pausado", label: "Pausado" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const STAGE_STATUS = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluida", label: "Concluída" },
];

export default function DesenvolvimentoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stages, loading: stagesLoading, addStage, updateStage, deleteStage } = useDevStages(id);
  const { items: checkItems, loading: checkLoading, addItem, toggleItem, deleteItem } = useDevChecklist(id);

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<any>({});

  // Stage dialog
  const [stageDialog, setStageDialog] = useState(false);
  const [stageForm, setStageForm] = useState({ title: "", deadline_at: "", notes: "" });

  // Check dialog
  const [checkDialog, setCheckDialog] = useState(false);
  const [checkForm, setCheckForm] = useState({ title: "", stage_id: "" });

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from("dev_projects" as any).select("*").eq("id", id).single();
    if (error || !data) { toast.error("Projeto não encontrado"); navigate("/desenvolvimento"); return; }
    setProject(data);
    setForm(data);
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  useEffect(() => {
    (async () => {
      const { data: profile } = await supabase.from("profiles" as any).select("org_id").eq("id", user!.id).single();
      if (!profile) return;
      const { data } = await supabase.from("clients").select("id, name").eq("org_id", (profile as any).org_id).eq("status", "ativo").order("name");
      if (data) setClients(data);
    })();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("dev_projects" as any).update({
      title: form.title,
      description: form.description,
      client_id: form.client_id || null,
      status: form.status,
      plan_type: form.plan_type,
      project_value: Number(form.project_value) || 0,
      monthly_value: Number(form.monthly_value) || 0,
      setup_value: Number(form.setup_value) || 0,
      started_at: form.started_at || null,
      deadline_at: form.deadline_at || null,
      completed_at: form.completed_at || null,
      notes: form.notes || null,
    } as any).eq("id", id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Projeto salvo!");
    fetchProject();
  };

  const handleAddStage = async () => {
    if (!stageForm.title.trim()) return;
    const ok = await addStage({
      title: stageForm.title,
      deadline_at: stageForm.deadline_at || null,
      notes: stageForm.notes || null,
      sort_order: stages.length,
    });
    if (ok) { setStageDialog(false); setStageForm({ title: "", deadline_at: "", notes: "" }); }
  };

  const handleAddCheck = async () => {
    if (!checkForm.title.trim()) return;
    const ok = await addItem({
      title: checkForm.title,
      stage_id: checkForm.stage_id || null,
      sort_order: checkItems.length,
    });
    if (ok) { setCheckDialog(false); setCheckForm({ title: "", stage_id: "" }); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "stage") await deleteStage(deleteTarget.id);
    else await deleteItem(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleGenerateFinancials = async () => {
    if (!project) return;
    const { data: profile } = await supabase.from("profiles" as any).select("org_id").eq("id", user!.id).single();
    const orgId = (profile as any).org_id;
    const titles: any[] = [];

    if (Number(form.setup_value) > 0) {
      titles.push({
        org_id: orgId,
        client_id: form.client_id || null,
        type: "receita",
        origin: "desenvolvimento",
        description: `Setup - ${form.title}`,
        value_original: Number(form.setup_value),
        value_final: Number(form.setup_value),
        status: "aberto",
        due_at: form.started_at || new Date().toISOString().split("T")[0],
        metadata: { dev_project_id: id },
      });
    }

    if (form.plan_type === "mensal" && Number(form.monthly_value) > 0) {
      for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() + i);
        titles.push({
          org_id: orgId,
          client_id: form.client_id || null,
          type: "receita",
          origin: "desenvolvimento",
          description: `Mensalidade ${i + 1}/12 - ${form.title}`,
          value_original: Number(form.monthly_value),
          value_final: Number(form.monthly_value),
          status: "aberto",
          due_at: d.toISOString().split("T")[0],
          competency: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
          metadata: { dev_project_id: id },
        });
      }
    } else if (form.plan_type === "anual" && Number(form.project_value) > 0) {
      titles.push({
        org_id: orgId,
        client_id: form.client_id || null,
        type: "receita",
        origin: "desenvolvimento",
        description: `Anuidade - ${form.title}`,
        value_original: Number(form.project_value),
        value_final: Number(form.project_value),
        status: "aberto",
        due_at: form.started_at || new Date().toISOString().split("T")[0],
        metadata: { dev_project_id: id },
      });
    } else if (form.plan_type === "unico" && Number(form.project_value) > 0) {
      titles.push({
        org_id: orgId,
        client_id: form.client_id || null,
        type: "receita",
        origin: "desenvolvimento",
        description: `Projeto - ${form.title}`,
        value_original: Number(form.project_value),
        value_final: Number(form.project_value),
        status: "aberto",
        due_at: form.deadline_at || new Date().toISOString().split("T")[0],
        metadata: { dev_project_id: id },
      });
    }

    if (titles.length === 0) { toast.info("Nenhum título a gerar"); return; }

    const { error } = await supabase.from("financial_titles").insert(titles);
    if (error) { toast.error("Erro ao gerar títulos financeiros"); return; }
    toast.success(`${titles.length} título(s) financeiro(s) gerado(s)!`);
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <DataSkeleton rows={6} />;
  if (!project) return null;

  const stagesPct = stages.length ? Math.round((stages.filter(s => s.status === "concluida").length / stages.length) * 100) : 0;
  const checkPct = checkItems.length ? Math.round((checkItems.filter(c => c.completed).length / checkItems.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Code2}
        iconColor="text-indigo-600"
        title={project.title}
        description="Detalhes do projeto de desenvolvimento"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/desenvolvimento")}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
            <Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
          </div>
        }
      />

      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
          <TabsTrigger value="etapas">Etapas ({stages.length})</TabsTrigger>
          <TabsTrigger value="checklist">Checklist ({checkItems.length})</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card>
            <CardContent className="p-6 grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Título</Label>
                  <Input value={form.title || ""} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Select value={form.client_id || ""} onValueChange={v => setForm((f: any) => ({ ...f, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.description || ""} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plano</Label>
                  <Select value={form.plan_type} onValueChange={v => setForm((f: any) => ({ ...f, plan_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unico">Único</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prazo Final</Label>
                  <Input type="date" value={form.deadline_at || ""} onChange={e => setForm((f: any) => ({ ...f, deadline_at: e.target.value }))} />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Valor do Projeto</Label>
                  <Input type="number" min={0} step="0.01" value={form.project_value ?? ""} onChange={e => setForm((f: any) => ({ ...f, project_value: e.target.value }))} />
                </div>
                <div>
                  <Label>Valor Mensal</Label>
                  <Input type="number" min={0} step="0.01" value={form.monthly_value ?? ""} onChange={e => setForm((f: any) => ({ ...f, monthly_value: e.target.value }))} />
                </div>
                <div>
                  <Label>Setup / Implantação</Label>
                  <Input type="number" min={0} step="0.01" value={form.setup_value ?? ""} onChange={e => setForm((f: any) => ({ ...f, setup_value: e.target.value }))} />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Data Início</Label>
                  <Input type="date" value={form.started_at || ""} onChange={e => setForm((f: any) => ({ ...f, started_at: e.target.value }))} />
                </div>
                <div>
                  <Label>Data Conclusão</Label>
                  <Input type="date" value={form.completed_at || ""} onChange={e => setForm((f: any) => ({ ...f, completed_at: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={form.notes || ""} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="etapas">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Etapas do Projeto</CardTitle>
              <Button size="sm" onClick={() => setStageDialog(true)}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {stages.length > 0 && (
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso geral</span><span>{stagesPct}%</span>
                  </div>
                  <Progress value={stagesPct} className="h-2" />
                </div>
              )}
              {stagesLoading ? <DataSkeleton rows={3} /> : stages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma etapa adicionada</p>
              ) : stages.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.title}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      {s.deadline_at && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(s.deadline_at).toLocaleDateString("pt-BR")}</span>}
                      {s.notes && <span className="truncate max-w-[200px]">{s.notes}</span>}
                    </div>
                  </div>
                  <Select value={s.status} onValueChange={v => updateStage(s.id, { status: v, completed_at: v === "concluida" ? new Date().toISOString().split("T")[0] : null })}>
                    <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGE_STATUS.map(ss => <SelectItem key={ss.value} value={ss.value}>{ss.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ type: "stage", id: s.id })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Checklist de Funcionalidades</CardTitle>
              <Button size="sm" onClick={() => setCheckDialog(true)}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {checkItems.length > 0 && (
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso</span><span>{checkPct}%</span>
                  </div>
                  <Progress value={checkPct} className="h-2" />
                </div>
              )}
              {checkLoading ? <DataSkeleton rows={3} /> : checkItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum item no checklist</p>
              ) : checkItems.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Checkbox checked={c.completed} onCheckedChange={v => toggleItem(c.id, v as boolean)} />
                  <span className={`flex-1 text-sm ${c.completed ? "line-through text-muted-foreground" : ""}`}>{c.title}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: "check", id: c.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <Card>
            <CardHeader><CardTitle className="text-base">Resumo Financeiro</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Valor do Projeto</p>
                  <p className="text-lg font-bold">{fmt(Number(form.project_value) || 0)}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Valor Mensal</p>
                  <p className="text-lg font-bold">{fmt(Number(form.monthly_value) || 0)}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Setup</p>
                  <p className="text-lg font-bold">{fmt(Number(form.setup_value) || 0)}</p>
                </div>
              </div>
              <Button onClick={handleGenerateFinancials} className="w-full">
                <DollarSign className="h-4 w-4 mr-1" /> Gerar Títulos Financeiros
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Os títulos serão criados no módulo financeiro (Contas a Receber) com origem "desenvolvimento"
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stage Dialog */}
      <Dialog open={stageDialog} onOpenChange={setStageDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Etapa</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>Título *</Label><Input value={stageForm.title} onChange={e => setStageForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Prazo</Label><Input type="date" value={stageForm.deadline_at} onChange={e => setStageForm(f => ({ ...f, deadline_at: e.target.value }))} /></div>
            <div><Label>Observações</Label><Textarea value={stageForm.notes} onChange={e => setStageForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddStage} disabled={!stageForm.title.trim()}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check Dialog */}
      <Dialog open={checkDialog} onOpenChange={setCheckDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Item do Checklist</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>Funcionalidade *</Label><Input value={checkForm.title} onChange={e => setCheckForm(f => ({ ...f, title: e.target.value }))} placeholder="Nome da funcionalidade" /></div>
            {stages.length > 0 && (
              <div>
                <Label>Vincular a Etapa (opcional)</Label>
                <Select value={checkForm.stage_id} onValueChange={v => setCheckForm(f => ({ ...f, stage_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddCheck} disabled={!checkForm.title.trim()}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Deseja realmente excluir este item? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
