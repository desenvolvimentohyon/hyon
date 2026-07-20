import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  KeyRound, Plus, Pencil, Trash2, Copy, ExternalLink, Eye, EyeOff, Search, Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Credential = {
  id: string;
  org_id: string;
  sistema: string;
  login: string | null;
  senha: string | null;
  url: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

type FormState = {
  sistema: string;
  login: string;
  senha: string;
  url: string;
  observacoes: string;
};

const empty: FormState = { sistema: "", login: "", senha: "", url: "", observacoes: "" };

export function AcessosTab() {
  const [items, setItems] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("access_credentials")
      .select("*")
      .order("sistema", { ascending: true });
    if (error) {
      toast.error("Erro ao carregar acessos");
    } else {
      setItems((data as Credential[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i =>
      [i.sistema, i.login, i.url, i.observacoes]
        .filter(Boolean)
        .some(v => (v as string).toLowerCase().includes(q))
    );
  }, [items, search]);

  const openNew = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (c: Credential) => {
    setEditing(c);
    setForm({
      sistema: c.sistema,
      login: c.login ?? "",
      senha: c.senha ?? "",
      url: c.url ?? "",
      observacoes: c.observacoes ?? "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.sistema.trim()) {
      toast.error("Informe o nome do sistema");
      return;
    }
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    const { data: profile } = await supabase
      .from("profiles").select("org_id").eq("id", uid!).maybeSingle();
    const orgId = (profile as { org_id?: string } | null)?.org_id;
    if (!orgId) {
      toast.error("Organização não identificada");
      setSaving(false);
      return;
    }

    const payload = {
      sistema: form.sistema.trim(),
      login: form.login.trim() || null,
      senha: form.senha || null,
      url: form.url.trim() || null,
      observacoes: form.observacoes.trim() || null,
    };

    const { error } = editing
      ? await supabase.from("access_credentials").update(payload).eq("id", editing.id)
      : await supabase.from("access_credentials").insert({ ...payload, org_id: orgId, created_by: uid });

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success(editing ? "Acesso atualizado" : "Acesso adicionado");
    setModalOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("access_credentials").delete().eq("id", deleteId);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Removido"); load(); }
    setDeleteId(null);
  };

  const copy = async (label: string, value?: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch { toast.error("Falha ao copiar"); }
  };

  const openLink = (url?: string | null) => {
    if (!url) return;
    const full = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    window.open(full, "_blank", "noopener,noreferrer");
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-500" />
            Bloco de Acessos
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Anote credenciais de sistemas usados no dia a dia. Visível para toda a sua organização.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar sistema, login..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 w-full sm:w-64"
            />
          </div>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Acesso
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <KeyRound className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {items.length === 0 ? "Nenhum acesso cadastrado ainda." : "Nenhum resultado para a busca."}
            </p>
            {items.length === 0 && (
              <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={openNew}>
                <Plus className="h-4 w-4" /> Cadastrar primeiro acesso
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => {
              const shown = !!reveal[c.id];
              return (
                <Card key={c.id} className="border-l-4 border-l-amber-500/70">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{c.sistema}</CardTitle>
                        {c.url && (
                          <button
                            onClick={() => openLink(c.url)}
                            className="mt-0.5 text-xs text-muted-foreground hover:text-primary truncate flex items-center gap-1 max-w-full"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{c.url}</span>
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 text-sm">
                    {c.login && (
                      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Login</p>
                          <p className="font-mono text-xs truncate">{c.login}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copy("Login", c.login)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    {c.senha && (
                      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Senha</p>
                          <p className="font-mono text-xs truncate">{shown ? c.senha : "••••••••••"}</p>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReveal((r) => ({ ...r, [c.id]: !r[c.id] }))}>
                            {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy("Senha", c.senha)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {c.observacoes && (
                      <div className="rounded-md border bg-muted/20 px-2.5 py-1.5">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Observações</p>
                        <p className="text-xs whitespace-pre-wrap">{c.observacoes}</p>
                      </div>
                    )}
                    {!c.login && !c.senha && !c.observacoes && (
                      <Badge variant="secondary" className="text-[10px]">Sem detalhes cadastrados</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Acesso" : "Novo Acesso"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Sistema *</Label>
              <Input value={form.sistema} onChange={(e) => setForm((f) => ({ ...f, sistema: e.target.value }))} placeholder="Ex.: Portal do Cliente" />
            </div>
            <div>
              <Label>Link do site</Label>
              <Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Login</Label>
                <Input value={form.login} onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))} placeholder="usuario@empresa.com" />
              </div>
              <div>
                <Label>Senha</Label>
                <Input value={form.senha} onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))} placeholder="••••••••" />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={3} value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} placeholder="Anotações, 2FA, contato de suporte..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
