import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";

interface Props {
  cliente: ClienteFull;
  onSave: (changes: Partial<ClienteFull>) => Promise<boolean>;
}

export default function TabResponsavel({ cliente, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    primary_contact_name: cliente.primary_contact_name || "",
    primary_contact_role: cliente.primary_contact_role || "",
    primary_contact_phone: cliente.primary_contact_phone || "",
    primary_contact_email: cliente.primary_contact_email || "",
    primary_contact_best_time: cliente.primary_contact_best_time || "",
  });

  const handleSave = async () => {
    const ok = await onSave({
      primary_contact_name: form.primary_contact_name || null,
      primary_contact_role: form.primary_contact_role || null,
      primary_contact_phone: form.primary_contact_phone || null,
      primary_contact_email: form.primary_contact_email || null,
      primary_contact_best_time: form.primary_contact_best_time || null,
    } as any);
    if (ok) setEditing(false);
  };

  if (!editing) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsável Principal</p>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 text-sm">
            <div><span className="text-muted-foreground">Nome:</span> {cliente.primary_contact_name || "—"}</div>
            <div><span className="text-muted-foreground">Cargo:</span> {cliente.primary_contact_role || "—"}</div>
            <div><span className="text-muted-foreground">Telefone/WhatsApp:</span> {cliente.primary_contact_phone || "—"}</div>
            <div><span className="text-muted-foreground">Email:</span> {cliente.primary_contact_email || "—"}</div>
            <div><span className="text-muted-foreground">Melhor horário:</span> {cliente.primary_contact_best_time || "—"}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editar Responsável</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Nome</Label><Input value={form.primary_contact_name} onChange={e => setForm(p => ({ ...p, primary_contact_name: e.target.value }))} /></div>
          <div><Label>Cargo/Função</Label><Input value={form.primary_contact_role} onChange={e => setForm(p => ({ ...p, primary_contact_role: e.target.value }))} placeholder="Ex: Gerente, Financeiro" /></div>
          <div><Label>Telefone/WhatsApp</Label><Input value={form.primary_contact_phone} onChange={e => setForm(p => ({ ...p, primary_contact_phone: e.target.value }))} /></div>
          <div><Label>Email</Label><Input value={form.primary_contact_email} onChange={e => setForm(p => ({ ...p, primary_contact_email: e.target.value }))} /></div>
          <div><Label>Melhor horário para contato</Label><Input value={form.primary_contact_best_time} onChange={e => setForm(p => ({ ...p, primary_contact_best_time: e.target.value }))} placeholder="Ex: 9h-12h" /></div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" />Salvar</Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
