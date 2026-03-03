import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";

interface Props {
  cliente: ClienteFull;
  onSave: (changes: Partial<ClienteFull>) => Promise<boolean>;
}

export default function TabContador({ cliente, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    accountant_name: cliente.accountant_name || "",
    accountant_office: cliente.accountant_office || "",
    accountant_phone: cliente.accountant_phone || "",
    accountant_email: cliente.accountant_email || "",
    tax_regime: cliente.tax_regime || "",
    cnae_principal: cliente.cnae_principal || "",
    fiscal_notes: cliente.fiscal_notes || "",
  });

  const handleSave = async () => {
    const ok = await onSave({
      accountant_name: form.accountant_name || null,
      accountant_office: form.accountant_office || null,
      accountant_phone: form.accountant_phone || null,
      accountant_email: form.accountant_email || null,
      tax_regime: form.tax_regime || null,
      cnae_principal: form.cnae_principal || null,
      fiscal_notes: form.fiscal_notes || null,
    } as any);
    if (ok) setEditing(false);
  };

  if (!editing) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contador & Fiscal</p>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 text-sm">
            <div><span className="text-muted-foreground">Contador:</span> {cliente.accountant_name || "—"}</div>
            <div><span className="text-muted-foreground">Escritório:</span> {cliente.accountant_office || "—"}</div>
            <div><span className="text-muted-foreground">Telefone:</span> {cliente.accountant_phone || "—"}</div>
            <div><span className="text-muted-foreground">Email:</span> {cliente.accountant_email || "—"}</div>
            <div><span className="text-muted-foreground">Regime tributário:</span> {cliente.tax_regime || "—"}</div>
            <div><span className="text-muted-foreground">CNAE:</span> {cliente.cnae_principal || "—"}</div>
          </div>
          {cliente.fiscal_notes && <div className="text-sm"><span className="text-muted-foreground">Observações fiscais:</span> {cliente.fiscal_notes}</div>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editar Contador & Fiscal</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Nome do Contador</Label><Input value={form.accountant_name} onChange={e => setForm(p => ({ ...p, accountant_name: e.target.value }))} /></div>
          <div><Label>Escritório</Label><Input value={form.accountant_office} onChange={e => setForm(p => ({ ...p, accountant_office: e.target.value }))} /></div>
          <div><Label>Telefone/WhatsApp</Label><Input value={form.accountant_phone} onChange={e => setForm(p => ({ ...p, accountant_phone: e.target.value }))} /></div>
          <div><Label>Email</Label><Input value={form.accountant_email} onChange={e => setForm(p => ({ ...p, accountant_email: e.target.value }))} /></div>
          <div>
            <Label>Regime Tributário</Label>
            <Select value={form.tax_regime} onValueChange={v => setForm(p => ({ ...p, tax_regime: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                <SelectItem value="lucro_real">Lucro Real</SelectItem>
                <SelectItem value="mei">MEI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>CNAE Principal</Label><Input value={form.cnae_principal} onChange={e => setForm(p => ({ ...p, cnae_principal: e.target.value }))} /></div>
        </div>
        <div><Label>Observações Fiscais</Label><Textarea value={form.fiscal_notes} onChange={e => setForm(p => ({ ...p, fiscal_notes: e.target.value }))} rows={2} /></div>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" />Salvar</Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
