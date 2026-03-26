import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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

  const billingPlan = (formData as any).billing_plan ?? cliente.billing_plan ?? "mensal";
  const planStartDate = (formData as any).plan_start_date ?? cliente.plan_start_date ?? "";
  const planEndDate = (formData as any).plan_end_date ?? cliente.plan_end_date ?? "";

  const calcEndDate = (start: string, plan: string) => {
    if (!start) return "";
    const d = new Date(start + "T00:00:00");
    const months: Record<string, number> = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 };
    d.setMonth(d.getMonth() + (months[plan] || 1));
    return d.toISOString().slice(0, 10);
  };

  const handlePlanChange = (plan: string) => {
    const end = calcEndDate(planStartDate, plan);
    onChange({ billing_plan: plan, plan_end_date: end || null } as any);
  };

  const handleStartChange = (date: string) => {
    const end = calcEndDate(date, billingPlan);
    onChange({ plan_start_date: date || null, plan_end_date: end || null } as any);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Valores e Plano</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Plano de Cobrança</Label>
            <Select value={billingPlan} onValueChange={handlePlanChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Início da Vigência</Label><Input type="date" value={planStartDate} onChange={e => handleStartChange(e.target.value)} /></div>
          <div><Label>Fim da Vigência (calculado)</Label><Input type="date" value={planEndDate} readOnly className="bg-muted/50" /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Valor Base (R$) — calculado pelos módulos</Label><CurrencyInput value={Number(formData.monthly_value_base ?? cliente.monthly_value_base ?? 0)} onValueChange={() => {}} disabled className="bg-muted/50" /></div>
          <div><Label>Valor Final (R$)</Label><CurrencyInput value={Number(formData.monthly_value_final ?? cliente.monthly_value_final ?? 0)} onValueChange={v => onChange({ monthly_value_final: v } as any)} /></div>
          <div>
            <Label>Dia de Vencimento</Label>
            <Select value={String(formData.default_due_day ?? cliente.default_due_day ?? 5)} onValueChange={v => onChange({ default_due_day: Number(v) } as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Dia 3</SelectItem>
                <SelectItem value="5">Dia 5</SelectItem>
                <SelectItem value="7">Dia 7</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
