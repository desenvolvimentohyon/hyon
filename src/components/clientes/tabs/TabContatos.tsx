import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import type { ClienteContact } from "@/hooks/useClienteDetalhe";
import { toast } from "@/hooks/use-toast";

const ROLE_OPTIONS = [
  { value: "financeiro", label: "Financeiro" },
  { value: "fiscal", label: "Fiscal" },
  { value: "compras", label: "Compras" },
  { value: "operacao_pdv", label: "Operação/PDV" },
  { value: "ti", label: "TI" },
  { value: "comercial", label: "Comercial" },
  { value: "contador", label: "Contador" },
  { value: "outro", label: "Outro" },
];

interface Props {
  contacts: ClienteContact[];
  onAdd: (c: Omit<ClienteContact, "id" | "org_id" | "client_id" | "created_at" | "updated_at">) => Promise<void>;
  onUpdate: (id: string, changes: Partial<ClienteContact>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TabContatos({ contacts, onAdd, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", roles: [] as string[], is_billing_preferred: false, is_support_preferred: false });

  const openNew = () => {
    setForm({ name: "", phone: "", email: "", roles: [], is_billing_preferred: false, is_support_preferred: false });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (c: ClienteContact) => {
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "", roles: c.roles || [], is_billing_preferred: c.is_billing_preferred, is_support_preferred: c.is_support_preferred });
    setEditingId(c.id);
    setShowForm(true);
  };

  const toggleRole = (role: string) => {
    setForm(p => ({ ...p, roles: p.roles.includes(role) ? p.roles.filter(r => r !== role) : [...p.roles, role] }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    if (editingId) {
      await onUpdate(editingId, { name: form.name, phone: form.phone || null, email: form.email || null, roles: form.roles, is_billing_preferred: form.is_billing_preferred, is_support_preferred: form.is_support_preferred } as any);
    } else {
      await onAdd({ name: form.name, phone: form.phone || null, email: form.email || null, roles: form.roles, is_billing_preferred: form.is_billing_preferred, is_support_preferred: form.is_support_preferred });
    }
    setShowForm(false);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-start">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contatos Adicionais ({contacts.length})</p>
          <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Adicionar</Button>
        </div>

        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum contato adicional cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {contacts.map(c => (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{c.name}</span>
                    {c.is_billing_preferred && <Badge variant="outline" className="text-[9px] gap-1"><Star className="h-2.5 w-2.5" />Cobrança</Badge>}
                    {c.is_support_preferred && <Badge variant="outline" className="text-[9px] gap-1"><Star className="h-2.5 w-2.5" />Suporte</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.phone && <span className="mr-3">📱 {c.phone}</span>}
                    {c.email && <span>✉️ {c.email}</span>}
                  </div>
                  {(c.roles || []).length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {c.roles.map(r => <Badge key={r} variant="secondary" className="text-[9px]">{ROLE_OPTIONS.find(o => o.value === r)?.label || r}</Badge>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar Contato" : "Novo Contato"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Telefone/WhatsApp</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div>
                <Label className="mb-2 block">Funções</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map(r => (
                    <label key={r.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={form.roles.includes(r.value)} onCheckedChange={() => toggleRole(r.value)} />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={form.is_billing_preferred} onCheckedChange={v => setForm(p => ({ ...p, is_billing_preferred: !!v }))} />
                  Preferencial para cobrança
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={form.is_support_preferred} onCheckedChange={v => setForm(p => ({ ...p, is_support_preferred: !!v }))} />
                  Preferencial para suporte
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editingId ? "Salvar" : "Adicionar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover contato?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (deleteId) onDelete(deleteId); setDeleteId(null); }}>Remover</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
