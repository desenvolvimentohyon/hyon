import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";

interface Props {
  cliente: ClienteFull;
  onSave: (changes: Partial<ClienteFull>) => Promise<boolean>;
}

export default function TabMensalidade({ cliente, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const meta = (cliente.metadata || {}) as any;
  const [form, setForm] = useState({
    monthly_value_base: String(cliente.monthly_value_base || 0),
    monthly_value_final: String(cliente.monthly_value_final || 0),
    default_due_day: String(cliente.default_due_day || 10),
    recurrence_active: cliente.recurrence_active,
    statusFinanceiro: meta.statusFinanceiro || "em_dia",
  });

  const base = Number(form.monthly_value_base) || 0;
  const final_ = Number(form.monthly_value_final) || 0;
  const desconto = base > 0 ? Math.round((1 - final_ / base) * 100) : 0;

  const handleSave = async () => {
    const ok = await onSave({
      monthly_value_base: Number(form.monthly_value_base) || 0,
      monthly_value_final: Number(form.monthly_value_final) || 0,
      default_due_day: Number(form.default_due_day) || 10,
      recurrence_active: form.recurrence_active,
      metadata: { ...meta, statusFinanceiro: form.statusFinanceiro },
    } as any);
    if (ok) setEditing(false);
  };

  if (!editing) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mensalidade</p>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 text-sm">
            <div><span className="text-muted-foreground">Valor base:</span> R$ {cliente.monthly_value_base || 0}</div>
            <div><span className="text-muted-foreground">Valor final:</span> R$ {cliente.monthly_value_final || 0}</div>
            <div><span className="text-muted-foreground">Desconto:</span> {base > 0 ? `${desconto}%` : "—"}</div>
            <div><span className="text-muted-foreground">Vencimento:</span> Dia {cliente.default_due_day || 10}</div>
            <div><span className="text-muted-foreground">Recorrência:</span> {cliente.recurrence_active ? "Ativa" : "Inativa"}</div>
            <div><span className="text-muted-foreground">Status:</span> {meta.statusFinanceiro === "em_dia" ? "Em dia" : meta.statusFinanceiro === "1_atraso" ? "1 atraso" : "2+ atrasos"}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editar Mensalidade</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Valor Base (R$)</Label><CurrencyInput value={Number(form.monthly_value_base) || 0} onValueChange={v => setForm(p => ({ ...p, monthly_value_base: String(v) }))} /></div>
          <div><Label>Valor Final (R$)</Label><CurrencyInput value={Number(form.monthly_value_final) || 0} onValueChange={v => setForm(p => ({ ...p, monthly_value_final: String(v) }))} /></div>
          <div><Label>Dia Vencimento</Label><Input type="number" min="1" max="31" value={form.default_due_day} onChange={e => setForm(p => ({ ...p, default_due_day: e.target.value }))} /></div>
          <div>
            <Label>Status Financeiro</Label>
            <Select value={form.statusFinanceiro} onValueChange={v => setForm(p => ({ ...p, statusFinanceiro: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="em_dia">Em dia</SelectItem>
                <SelectItem value="1_atraso">1 atraso</SelectItem>
                <SelectItem value="2_mais_atrasos">2+ atrasos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Desconto calculado: {base > 0 ? `${Math.round((1 - (Number(form.monthly_value_final) || 0) / base) * 100)}%` : "—"}</p>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" />Salvar</Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
