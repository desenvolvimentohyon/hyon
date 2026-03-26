import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";

interface Props {
  cliente: ClienteFull;
  onSave: (changes: Partial<ClienteFull>) => Promise<boolean>;
}

function statusContrato(signedAt: string | null): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (!signedAt) return { label: "Sem contrato", variant: "outline" };
  return { label: "Ativo", variant: "default" };
}

export default function TabContrato({ cliente, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    contract_signed_at: cliente.contract_signed_at || "",
    adjustment_base_date: cliente.adjustment_base_date || "",
    adjustment_type: cliente.adjustment_type || "",
    adjustment_percent: String(cliente.adjustment_percent || 0),
  });

  const st = statusContrato(cliente.contract_signed_at);

  const handleSave = async () => {
    const ok = await onSave({
      contract_signed_at: form.contract_signed_at || null,
      contract_start_at: form.contract_signed_at || null,
      adjustment_base_date: form.adjustment_base_date || null,
      adjustment_type: form.adjustment_type || null,
      adjustment_percent: Number(form.adjustment_percent) || 0,
    } as any);
    if (ok) setEditing(false);
  };

  if (!editing) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contrato</p>
              <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 text-sm">
            <div><span className="text-muted-foreground">Data assinatura:</span> {cliente.contract_signed_at ? new Date(cliente.contract_signed_at).toLocaleDateString("pt-BR") : "—"}</div>
            <div><span className="text-muted-foreground">Data base reajuste:</span> {cliente.adjustment_base_date ? new Date(cliente.adjustment_base_date).toLocaleDateString("pt-BR") : "—"}</div>
            <div><span className="text-muted-foreground">Tipo reajuste:</span> {cliente.adjustment_type || "—"}</div>
            <div><span className="text-muted-foreground">% Reajuste:</span> {cliente.adjustment_percent || 0}%</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editar Contrato</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Data Assinatura</Label><Input type="date" value={form.contract_signed_at} onChange={e => setForm(p => ({ ...p, contract_signed_at: e.target.value }))} /></div>
          <div><Label>Data Base Reajuste</Label><Input type="date" value={form.adjustment_base_date} onChange={e => setForm(p => ({ ...p, adjustment_base_date: e.target.value }))} /></div>
          <div>
            <Label>Tipo Reajuste</Label>
            <Select value={form.adjustment_type} onValueChange={v => setForm(p => ({ ...p, adjustment_type: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ipca">IPCA</SelectItem>
                <SelectItem value="igpm">IGPM</SelectItem>
                <SelectItem value="fixo">Fixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>% Reajuste</Label><Input type="number" value={form.adjustment_percent} onChange={e => setForm(p => ({ ...p, adjustment_percent: e.target.value }))} /></div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" />Salvar</Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
