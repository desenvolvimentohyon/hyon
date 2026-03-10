import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";

interface Props {
  cliente: ClienteFull;
  formData: Partial<ClienteFull>;
  onChange: (changes: Partial<ClienteFull>) => void;
}

export default function TabCusto({ cliente, formData, onChange }: Props) {
  const meta = { ...(cliente.metadata || {}), ...(formData.metadata || {}) } as any;
  const setMeta = (key: string, val: any) => onChange({ metadata: { ...meta, [key]: val } } as any);

  const costActive = formData.cost_active ?? cliente.cost_active;
  const costValue = Number(formData.monthly_cost_value ?? cliente.monthly_cost_value ?? 0);
  const custoModulos = Number(meta.custoModulos || 0);
  const custoCloud = Number(meta.custoCloud || 0);
  const outrosCustos = Number(meta.outrosCustos || 0);
  const totalCusto = costValue + custoModulos + custoCloud + outrosCustos;
  const mensalidadeFinal = Number(formData.monthly_value_final ?? cliente.monthly_value_final ?? 0);
  const margem = mensalidadeFinal - totalCusto;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Custos Operacionais</h3>
        <div className="flex items-center gap-3">
          <Switch checked={costActive} onCheckedChange={val => onChange({ cost_active: val } as any)} />
          <Label>Custo ativo</Label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Sistema de custo</Label>
            <Input value={(formData.cost_system_name ?? cliente.cost_system_name ?? "") as string} onChange={e => onChange({ cost_system_name: e.target.value } as any)} placeholder="Ex: PDV+, Hyon" />
          </div>
          <div><Label>Custo repasse/franquia (R$)</Label><Input type="number" value={String(formData.monthly_cost_value ?? cliente.monthly_cost_value ?? 0)} onChange={e => onChange({ monthly_cost_value: Number(e.target.value) || 0 } as any)} placeholder="0,00" /></div>
          <div><Label>Custo módulos (R$)</Label><Input type="number" value={String(custoModulos)} onChange={e => setMeta("custoModulos", Number(e.target.value) || 0)} placeholder="0,00" /></div>
          <div><Label>Custo cloud/infra (R$)</Label><Input type="number" value={String(custoCloud)} onChange={e => setMeta("custoCloud", Number(e.target.value) || 0)} placeholder="0,00" /></div>
          <div><Label>Outros custos (R$)</Label><Input type="number" value={String(outrosCustos)} onChange={e => setMeta("outrosCustos", Number(e.target.value) || 0)} placeholder="0,00" /></div>
        </div>
      </section>

      <section className="rounded-lg border border-border p-4 bg-muted/30 space-y-2">
        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs">Total custo mensal</span>
            <span className="font-semibold text-lg">R$ {totalCusto.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Mensalidade final</span>
            <span className="font-semibold text-lg">R$ {mensalidadeFinal.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Margem estimada</span>
            <span className={`font-semibold text-lg ${margem >= 0 ? "text-green-500" : "text-destructive"}`}>
              R$ {margem.toFixed(2)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
