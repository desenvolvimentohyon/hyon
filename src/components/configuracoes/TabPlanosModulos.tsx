import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useParametros } from "@/contexts/ParametrosContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Loader2, Package, AlertTriangle, Gift } from "lucide-react";
import { toast } from "sonner";

interface PlanItem {
  id?: string;
  module_id: string;
  min_value: number;
  max_value: number;
  suggested_value: number;
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  min_total_value: number;
  allow_bonus: boolean;
  active: boolean;
  items: PlanItem[];
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function TabPlanosModulos() {
  const { profile } = useAuth();
  const orgId = profile?.org_id;
  const { modulos, sistemas } = useParametros();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modal, setModal] = useState<{ editing: string | null } | null>(null);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    min_total_value: number;
    allow_bonus: boolean;
    active: boolean;
    items: PlanItem[];
  }>({ name: "", description: "", min_total_value: 0, allow_bonus: true, active: true, items: [] });
  const [addModuleId, setAddModuleId] = useState<string>("");

  const moduleMap = useMemo(() => new Map(modulos.map(m => [m.id, m])), [modulos]);
  const sistemaMap = useMemo(() => new Map(sistemas.map(s => [s.id, s])), [sistemas]);

  const fetchAll = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data: planData, error: pErr } = await supabase
      .from("module_plans").select("*").order("created_at", { ascending: false });
    if (pErr) { toast.error("Erro ao carregar planos"); setLoading(false); return; }
    const planIds = (planData || []).map(p => p.id);
    let itemsData: any[] = [];
    if (planIds.length > 0) {
      const { data } = await supabase.from("module_plan_items").select("*").in("plan_id", planIds);
      itemsData = data || [];
    }
    setPlans((planData || []).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      min_total_value: Number(p.min_total_value) || 0,
      allow_bonus: p.allow_bonus,
      active: p.active,
      items: itemsData.filter(i => i.plan_id === p.id).map(i => ({
        id: i.id, module_id: i.module_id,
        min_value: Number(i.min_value) || 0,
        max_value: Number(i.max_value) || 0,
        suggested_value: Number(i.suggested_value) || 0,
      })),
    })));
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openNew = () => {
    setForm({ name: "", description: "", min_total_value: 0, allow_bonus: true, active: true, items: [] });
    setAddModuleId("");
    setModal({ editing: null });
  };

  const openEdit = (p: Plan) => {
    setForm({
      name: p.name,
      description: p.description || "",
      min_total_value: p.min_total_value,
      allow_bonus: p.allow_bonus,
      active: p.active,
      items: p.items.map(i => ({ ...i })),
    });
    setAddModuleId("");
    setModal({ editing: p.id });
  };

  const addItem = () => {
    if (!addModuleId) return;
    if (form.items.some(i => i.module_id === addModuleId)) { toast.error("Módulo já adicionado"); return; }
    const mod = moduleMap.get(addModuleId);
    const sale = mod?.valorVenda || 0;
    setForm(f => ({ ...f, items: [...f.items, {
      module_id: addModuleId,
      min_value: sale, max_value: sale, suggested_value: sale,
    }]}));
    setAddModuleId("");
  };

  const updateItem = (idx: number, patch: Partial<PlanItem>) => {
    setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, ...patch } : it) }));
  };

  const removeItem = (idx: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const invalidRanges = form.items.filter(i => i.max_value > 0 && i.min_value > i.max_value);

  const save = async () => {
    if (!orgId) return;
    if (!form.name.trim()) { toast.error("Nome do plano é obrigatório"); return; }
    if (invalidRanges.length > 0) { toast.error("Existem módulos com valor mínimo maior que o máximo"); return; }

    if (modal?.editing) {
      const { error } = await supabase.from("module_plans").update({
        name: form.name, description: form.description || null,
        min_total_value: form.min_total_value, allow_bonus: form.allow_bonus, active: form.active,
      }).eq("id", modal.editing);
      if (error) { toast.error("Erro ao salvar plano"); return; }
      await supabase.from("module_plan_items").delete().eq("plan_id", modal.editing);
      if (form.items.length > 0) {
        const rows = form.items.map(i => ({
          plan_id: modal.editing!, module_id: i.module_id,
          min_value: i.min_value, max_value: i.max_value, suggested_value: i.suggested_value,
        }));
        const { error: iErr } = await supabase.from("module_plan_items").insert(rows);
        if (iErr) { toast.error("Erro ao salvar módulos do plano"); return; }
      }
    } else {
      const { data, error } = await supabase.from("module_plans").insert({
        org_id: orgId, name: form.name, description: form.description || null,
        min_total_value: form.min_total_value, allow_bonus: form.allow_bonus, active: form.active,
      }).select("id").single();
      if (error || !data) { toast.error("Erro ao criar plano"); return; }
      if (form.items.length > 0) {
        const rows = form.items.map(i => ({
          plan_id: data.id, module_id: i.module_id,
          min_value: i.min_value, max_value: i.max_value, suggested_value: i.suggested_value,
        }));
        const { error: iErr } = await supabase.from("module_plan_items").insert(rows);
        if (iErr) { toast.error("Erro ao adicionar módulos"); return; }
      }
    }
    toast.success("Plano salvo!");
    setModal(null);
    fetchAll();
  };

  const removePlan = async (id: string) => {
    const { error } = await supabase.from("module_plans").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Plano removido");
    fetchAll();
  };

  const availableModules = modulos.filter(m => m.ativo && !form.items.some(i => i.module_id === m.id));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Planos de Módulos</h3>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Monte pacotes de módulos com <strong>valor mínimo total</strong> (piso da negociação) e defina o <strong>valor mínimo/máximo</strong>{" "}
            de cada módulo. Habilite a bonificação para dar autonomia ao vendedor marcar módulos como brinde.
          </p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="h-4 w-4" />Novo Plano</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : plans.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          Nenhum plano cadastrado. Clique em "Novo Plano" para montar seu primeiro pacote.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {plans.map(p => {
            const totalSugerido = p.items.reduce((s, i) => s + i.suggested_value, 0);
            return (
              <Card key={p.id} className="group hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        {p.name}
                        {!p.active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                        {p.allow_bonus && <Badge className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"><Gift className="h-2.5 w-2.5 mr-0.5" />Bonificação</Badge>}
                      </CardTitle>
                      {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePlan(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-border p-2">
                      <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Piso do plano</div>
                      <div className="font-semibold text-sm">{fmt(p.min_total_value)}</div>
                    </div>
                    <div className="rounded-md border border-border p-2">
                      <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Sugerido</div>
                      <div className="font-semibold text-sm">{fmt(totalSugerido)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{p.items.length} módulo(s)</div>
                    <div className="flex flex-wrap gap-1">
                      {p.items.slice(0, 6).map(i => {
                        const m = moduleMap.get(i.module_id);
                        return <Badge key={i.module_id} variant="outline" className="text-[10px]">{m?.nome || "?"}</Badge>;
                      })}
                      {p.items.length > 6 && <Badge variant="outline" className="text-[10px]">+{p.items.length - 6}</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modal?.editing ? "Editar plano" : "Novo plano de módulos"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Nome do plano *</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex.: Plano Essencial" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Descrição</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Para quem é este plano?" />
              </div>
              <div className="space-y-1.5">
                <Label>Valor mínimo total (piso)</Label>
                <CurrencyInput value={form.min_total_value} onChange={(v) => setForm(f => ({ ...f, min_total_value: v }))} />
                <p className="text-[10px] text-muted-foreground">Nenhuma venda pode fechar abaixo deste valor.</p>
              </div>
              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center justify-between rounded-md border border-border p-2.5">
                  <div>
                    <Label className="text-xs cursor-pointer">Permitir bonificação</Label>
                    <p className="text-[10px] text-muted-foreground">Vendedor pode marcar módulos como brinde.</p>
                  </div>
                  <Switch checked={form.allow_bonus} onCheckedChange={(v) => setForm(f => ({ ...f, allow_bonus: v }))} />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-2.5">
                  <Label className="text-xs cursor-pointer">Plano ativo</Label>
                  <Switch checked={form.active} onCheckedChange={(v) => setForm(f => ({ ...f, active: v }))} />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Módulos incluídos ({form.items.length})</Label>
              </div>
              <div className="flex gap-2">
                <Select value={addModuleId} onValueChange={setAddModuleId}>
                  <SelectTrigger className="flex-1 h-9"><SelectValue placeholder="Selecione um módulo para adicionar" /></SelectTrigger>
                  <SelectContent>
                    {availableModules.length === 0 && <SelectItem value="__none" disabled>Todos os módulos já adicionados</SelectItem>}
                    {availableModules.map(m => {
                      const sys = m.sistemaId ? sistemaMap.get(m.sistemaId)?.nome : (m.isGlobal ? "Global" : "—");
                      return <SelectItem key={m.id} value={m.id}>{m.nome} <span className="text-muted-foreground text-xs">— {sys}</span></SelectItem>;
                    })}
                  </SelectContent>
                </Select>
                <Button type="button" size="sm" onClick={addItem} disabled={!addModuleId}><Plus className="h-4 w-4" /></Button>
              </div>

              {form.items.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Módulo</TableHead>
                        <TableHead className="w-32">Mín. venda</TableHead>
                        <TableHead className="w-32">Máx. venda</TableHead>
                        <TableHead className="w-32">Sugerido</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.items.map((it, idx) => {
                        const mod = moduleMap.get(it.module_id);
                        const invalid = it.max_value > 0 && it.min_value > it.max_value;
                        return (
                          <TableRow key={it.module_id} className={invalid ? "bg-destructive/5" : ""}>
                            <TableCell className="text-sm">
                              <div className="font-medium">{mod?.nome || "?"}</div>
                              {invalid && <div className="text-[10px] text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Mín. maior que máx.</div>}
                            </TableCell>
                            <TableCell><CurrencyInput value={it.min_value} onChange={(v) => updateItem(idx, { min_value: v })} className="h-8 text-xs" /></TableCell>
                            <TableCell><CurrencyInput value={it.max_value} onChange={(v) => updateItem(idx, { max_value: v })} className="h-8 text-xs" /></TableCell>
                            <TableCell><CurrencyInput value={it.suggested_value} onChange={(v) => updateItem(idx, { suggested_value: v })} className="h-8 text-xs" /></TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={save} disabled={invalidRanges.length > 0}>Salvar plano</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
