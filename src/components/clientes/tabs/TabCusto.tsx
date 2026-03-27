import { useState, useEffect } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  cliente: ClienteFull;
  formData: Partial<ClienteFull>;
  onChange: (changes: Partial<ClienteFull>) => void;
}

export default function TabCusto({ cliente, formData, onChange }: Props) {
  const meta = { ...(cliente.metadata || {}), ...(formData.metadata || {}) } as any;
  const setMeta = (key: string, val: any) => onChange({ metadata: { ...meta, [key]: val } } as any);

  const [custoModulos, setCustoModulos] = useState(0);
  const [qtdModulos, setQtdModulos] = useState(0);

  useEffect(() => {
    const fetchModuleCosts = async () => {
      const { data: links } = await supabase
        .from("client_modules")
        .select("module_id, quantity")
        .eq("client_id", cliente.id);
      if (!links || links.length === 0) { setCustoModulos(0); setQtdModulos(0); return; }
      const ids = links.map((l: any) => l.module_id);
      const qtyMap = new Map<string, number>();
      links.forEach((l: any) => qtyMap.set(l.module_id, l.quantity ?? 1));
      const { data: mods } = await supabase
        .from("system_modules")
        .select("id, cost_value")
        .in("id", ids);
      const sum = (mods || []).reduce((s: number, m: any) => s + (m.cost_value || 0) * (qtyMap.get(m.id) || 1), 0);
      setCustoModulos(sum);
      setQtdModulos(links.reduce((s: number, l: any) => s + (l.quantity ?? 1), 0));
    };
    fetchModuleCosts();
  }, [cliente.id]);

  const costActive = formData.cost_active ?? cliente.cost_active;
  const outrosCustos = Number(meta.outrosCustos || 0);
  const totalCusto = custoModulos + outrosCustos;
  const mensalidadeFinal = Number(formData.monthly_value_final ?? cliente.monthly_value_final ?? 0);
  const margem = mensalidadeFinal - totalCusto;
  const systemName = cliente.system_name || "—";

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
            <Label>Sistema do cliente</Label>
            <div className="flex h-10 w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm items-center text-muted-foreground cursor-default">
              {systemName}
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-2">
              Custo módulos (R$)
              {qtdModulos > 0 && <Badge variant="secondary" className="text-[10px]">{qtdModulos} módulo{qtdModulos > 1 ? "s" : ""}</Badge>}
            </Label>
            <div className="flex h-10 w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm items-center text-muted-foreground cursor-default">
              R$ {custoModulos.toFixed(2)}
            </div>
          </div>
          <div><Label>Outros custos (R$)</Label><CurrencyInput value={outrosCustos} onValueChange={v => setMeta("outrosCustos", v)} /></div>
          <div className="md:col-span-2">
            <Label>Observação (outros custos)</Label>
            <Textarea
              value={meta.outrosCustosObs || ""}
              onChange={e => setMeta("outrosCustosObs", e.target.value)}
              placeholder="Descreva o que compõe os outros custos..."
              rows={3}
            />
          </div>
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
