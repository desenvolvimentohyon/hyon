import { useState } from "react";
import { Plus, Trash2, GripVertical, Pencil, Code2, ListChecks, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/data-skeleton";
import { useDevTemplates, DevTemplate, TemplateStage, TemplateCheckItem } from "@/hooks/useDevTemplates";

export default function TabDesenvolvimento() {
  const { templates, loading, saveTemplate, deleteTemplate } = useDevTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DevTemplate | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState<TemplateStage[]>([]);
  const [checklist, setChecklist] = useState<TemplateCheckItem[]>([]);
  const [newStage, setNewStage] = useState("");
  const [newCheckTitle, setNewCheckTitle] = useState("");
  const [newCheckStageIdx, setNewCheckStageIdx] = useState<number | null>(null);

  const openNew = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setStages([]);
    setChecklist([]);
    setDialogOpen(true);
  };

  const openEdit = (t: DevTemplate) => {
    setEditing(t);
    setName(t.name);
    setDescription(t.description);
    setStages([...t.stages]);
    setChecklist([...t.checklist]);
    setDialogOpen(true);
  };

  const addStage = () => {
    if (!newStage.trim()) return;
    setStages(s => [...s, { title: newStage.trim(), sort_order: s.length }]);
    setNewStage("");
  };

  const removeStage = (idx: number) => {
    setStages(s => s.filter((_, i) => i !== idx).map((st, i) => ({ ...st, sort_order: i })));
    setChecklist(c => c.filter(ci => ci.stage_index !== idx).map(ci => ({
      ...ci,
      stage_index: ci.stage_index !== null && ci.stage_index > idx ? ci.stage_index - 1 : ci.stage_index,
    })));
  };

  const addCheckItem = () => {
    if (!newCheckTitle.trim()) return;
    setChecklist(c => [...c, { title: newCheckTitle.trim(), stage_index: newCheckStageIdx, sort_order: c.length }]);
    setNewCheckTitle("");
  };

  const removeCheckItem = (idx: number) => {
    setChecklist(c => c.filter((_, i) => i !== idx).map((ci, i) => ({ ...ci, sort_order: i })));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const ok = await saveTemplate({
      ...(editing ? { id: editing.id } : {}),
      name: name.trim(),
      description,
      stages,
      checklist,
    });
    if (ok) setDialogOpen(false);
  };

  if (loading) return <TableSkeleton rows={3} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates de Projeto</h3>
          <p className="text-sm text-muted-foreground">Defina etapas e checklist padrão para novos projetos</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Template</Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState icon={Code2} title="Nenhum template" description="Crie um template para padronizar seus projetos" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map(t => (
            <Card key={t.id} className="group">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{t.name}</h4>
                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTemplate(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {t.stages.length} etapas</span>
                  <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" /> {t.checklist.length} itens</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Sistema Web Completo" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição opcional" />
            </div>

            <Separator />

            {/* Etapas */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Layers className="h-4 w-4" /> Etapas</Label>
              {stages.map((s, i) => (
                <div key={i} className="flex items-center gap-2 pl-2 py-1 rounded bg-muted/50">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm flex-1">{s.title}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeStage(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={newStage} onChange={e => setNewStage(e.target.value)} placeholder="Nome da etapa" className="text-sm"
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addStage())} />
                <Button variant="outline" size="sm" onClick={addStage} disabled={!newStage.trim()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Checklist */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><ListChecks className="h-4 w-4" /> Checklist</Label>
              {checklist.map((c, i) => (
                <div key={i} className="flex items-center gap-2 pl-2 py-1 rounded bg-muted/50">
                  <span className="text-sm flex-1">{c.title}</span>
                  {c.stage_index !== null && stages[c.stage_index] && (
                    <Badge variant="secondary" className="text-[10px] h-5">{stages[c.stage_index].title}</Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeCheckItem(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Input value={newCheckTitle} onChange={e => setNewCheckTitle(e.target.value)} placeholder="Título do item" className="text-sm"
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCheckItem())} />
                </div>
                {stages.length > 0 && (
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    value={newCheckStageIdx ?? ""}
                    onChange={e => setNewCheckStageIdx(e.target.value === "" ? null : Number(e.target.value))}
                  >
                    <option value="">Sem etapa</option>
                    {stages.map((s, i) => <option key={i} value={i}>{s.title}</option>)}
                  </select>
                )}
                <Button variant="outline" size="sm" onClick={addCheckItem} disabled={!newCheckTitle.trim()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
