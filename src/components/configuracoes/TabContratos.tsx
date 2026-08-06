import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { FileSignature, Pencil, Plus, Star, Trash2, Variable } from "lucide-react";
import {
  CONTRACT_VARIABLES,
  contractTemplatesService,
  type ContractTemplate,
  type ContractTemplateCategory,
} from "@/services/contractTemplatesService";

const CATEGORIAS: { value: ContractTemplateCategory; label: string }[] = [
  { value: "saas", label: "SaaS / Mensalidade" },
  { value: "implantacao", label: "Implantação" },
  { value: "desenvolvimento", label: "Desenvolvimento" },
  { value: "cartoes", label: "Cartões" },
  { value: "outro", label: "Outro" },
];

type FormState = {
  id?: string;
  name: string;
  description: string;
  category: ContractTemplateCategory;
  body: string;
  ai_instructions: string;
  is_default: boolean;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  category: "saas",
  body:
    "CONTRATO DE LICENÇA DE USO DE SOFTWARE\n\n" +
    "CONTRATADA: {{empresa_nome}}, inscrita no CNPJ {{empresa_cnpj}}.\n" +
    "CONTRATANTE: {{cliente_razao_social}}, CNPJ/CPF {{cliente_cnpj}}, com endereço em {{cliente_endereco}}.\n\n" +
    "CLÁUSULA 1 — OBJETO\nLicenciamento do sistema {{sistema_nome}} ({{plano_nome}}), incluindo: {{modulos_lista}}.\n\n" +
    "CLÁUSULA 2 — VALORES\nMensalidade de {{valor_mensalidade}}, com vencimento no dia {{dia_vencimento}}.\n" +
    "Implantação de {{valor_implantacao}} ({{fluxo_implantacao}}).\n\n" +
    "CLÁUSULA 3 — VIGÊNCIA E REAJUSTE\nInício em {{data_inicio_contrato}}, com reajuste anual por {{indice_reajuste}} {{percentual_reajuste}}.\n\n" +
    "Local e data: {{data_hoje}}.",
  ai_instructions:
    "Mantenha linguagem jurídica objetiva. Inclua cláusulas de LGPD, suporte técnico, rescisão com aviso prévio de 30 dias e foro da comarca da contratada.",
  is_default: false,
  active: true,
};

export function TabContratos() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<ContractTemplate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await contractTemplatesService.list());
    } catch {
      toast.error("Não foi possível carregar os templates de contrato.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const variaveis = useMemo(
    () => [
      ...CONTRACT_VARIABLES,
      { key: "plano_nome", label: "Plano da proposta", source: "proposals.plan_name", required: false },
      { key: "valor_implantacao", label: "Valor da implantação", source: "proposals.implementation_value", required: false },
      { key: "fluxo_implantacao", label: "Fluxo de pagamento", source: "proposals.implementation_flow", required: false },
      { key: "numero_proposta", label: "Número da proposta", source: "proposals.proposal_number", required: false },
      { key: "empresa_nome", label: "Razão social da contratada", source: "company_profile", required: false },
      { key: "empresa_cnpj", label: "CNPJ da contratada", source: "company_profile", required: false },
      { key: "data_hoje", label: "Data de hoje", source: "calculado", required: false },
    ],
    [],
  );

  const handleSave = async () => {
    if (!form) return;
    if (!form.name.trim() || !form.body.trim()) {
      toast.error("Informe o nome e o corpo do contrato.");
      return;
    }
    setSaving(true);
    const ok = await contractTemplatesService.save({
      id: form.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      body: form.body,
      ai_instructions: form.ai_instructions.trim() || null,
      is_default: form.is_default,
      active: form.active,
    });
    setSaving(false);
    if (!ok) {
      toast.error("Erro ao salvar o template.");
      return;
    }
    toast.success("Template salvo!");
    setForm(null);
    void load();
  };

  const handleRemove = async () => {
    if (!removing) return;
    const ok = await contractTemplatesService.remove(removing.id);
    setRemoving(null);
    if (!ok) {
      toast.error("Erro ao excluir o template.");
      return;
    }
    toast.success("Template excluído.");
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Templates usados pela IA na geração automática dos contratos das propostas.
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => setForm({ ...EMPTY_FORM })}>
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSignature className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum template cadastrado. Crie o primeiro para habilitar a geração de contratos por IA.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {t.is_default && (
                      <Badge className="gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-300">
                        <Star className="h-3 w-3" />
                        Padrão
                      </Badge>
                    )}
                    {!t.active && <Badge variant="secondary">Inativo</Badge>}
                    <Badge variant="outline">{CATEGORIAS.find((c) => c.value === t.category)?.label ?? t.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {t.description || "Sem descrição."}
                </p>
                <pre className="max-h-24 overflow-hidden whitespace-pre-wrap rounded-md bg-muted/50 p-2 text-[11px] text-muted-foreground">
                  {t.body.slice(0, 240)}
                </pre>
                <div className="mt-auto flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={`Editar ${t.name}`}
                    onClick={() =>
                      setForm({
                        id: t.id,
                        name: t.name,
                        description: t.description ?? "",
                        category: t.category,
                        body: t.body,
                        ai_instructions: t.ai_instructions ?? "",
                        is_default: t.is_default,
                        active: t.active,
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    aria-label={`Excluir ${t.name}`}
                    onClick={() => setRemoving(t)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>

          {form && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v as ContractTemplateCategory })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Corpo do contrato (use {"{{variavel}}"})</Label>
                <Textarea
                  rows={12}
                  className="font-mono text-xs"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Diretrizes para a IA</Label>
                <Textarea
                  rows={4}
                  value={form.ai_instructions}
                  onChange={(e) => setForm({ ...form, ai_instructions: e.target.value })}
                />
              </div>

              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                  <Variable className="h-3.5 w-3.5" />
                  Variáveis disponíveis
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {variaveis.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      title={`${v.label} — ${v.source}`}
                      className="rounded-md border bg-muted/40 px-2 py-0.5 font-mono text-[11px] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setForm({ ...form, body: `${form.body}{{${v.key}}}` })}
                    >
                      {`{{${v.key}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="tpl-default"
                    checked={form.is_default}
                    onCheckedChange={(v) => setForm({ ...form, is_default: v })}
                  />
                  <Label htmlFor="tpl-default" className="text-xs">Template padrão</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="tpl-active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                  <Label htmlFor="tpl-active" className="text-xs">Ativo</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              O template "{removing?.name}" deixará de estar disponível para novas gerações de contrato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
