import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";

interface Props {
  cliente: ClienteFull;
  formData: Partial<ClienteFull>;
  onChange: (changes: Partial<ClienteFull>) => void;
}

export default function TabMensalidadeNew({ cliente, formData, onChange }: Props) {
  const meta = { ...(cliente.metadata || {}), ...(formData.metadata || {}) } as any;
  const setMeta = (key: string, val: any) => onChange({ metadata: { ...meta, [key]: val } } as any);

  const base = Number(formData.monthly_value_base ?? cliente.monthly_value_base ?? 0);
  const final_ = Number(formData.monthly_value_final ?? cliente.monthly_value_final ?? 0);
  const desconto = base > 0 ? Math.round((1 - final_ / base) * 100) : 0;
  const recurrence = formData.recurrence_active ?? cliente.recurrence_active;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Valores e Plano</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Plano</Label>
            <Select value={meta.plano_tipo || "mensal"} onValueChange={val => setMeta("plano_tipo", val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Valor Base (R$)</Label><Input type="number" value={String(formData.monthly_value_base ?? cliente.monthly_value_base ?? 0)} onChange={e => onChange({ monthly_value_base: Number(e.target.value) || 0 } as any)} placeholder="0,00" /></div>
          <div><Label>Valor Final (R$)</Label><Input type="number" value={String(formData.monthly_value_final ?? cliente.monthly_value_final ?? 0)} onChange={e => onChange({ monthly_value_final: Number(e.target.value) || 0 } as any)} placeholder="0,00" /></div>
          <div><Label>Dia de Vencimento</Label><Input type="number" min="1" max="31" value={String(formData.default_due_day ?? cliente.default_due_day ?? 10)} onChange={e => onChange({ default_due_day: Number(e.target.value) || 10 } as any)} /></div>
          <div>
            <Label>Status Financeiro</Label>
            <Select value={meta.statusFinanceiro || "em_dia"} onValueChange={val => setMeta("statusFinanceiro", val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="em_dia">Em dia</SelectItem>
                <SelectItem value="atraso">Atraso</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={recurrence} onCheckedChange={val => onChange({ recurrence_active: val } as any)} />
            <Label>Recorrência ativa</Label>
          </div>
        </div>
        <div className="rounded-lg border border-border p-4 bg-muted/30">
          <div className="grid gap-2 md:grid-cols-3 text-sm">
            <div><span className="text-muted-foreground">Desconto calculado:</span> <span className="font-medium">{desconto}%</span></div>
            <div><span className="text-muted-foreground">Valor base:</span> <span className="font-medium">R$ {base.toFixed(2)}</span></div>
            <div><span className="text-muted-foreground">Valor final:</span> <span className="font-semibold text-primary">R$ {final_.toFixed(2)}</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}
