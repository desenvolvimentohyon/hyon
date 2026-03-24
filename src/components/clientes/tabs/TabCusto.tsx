import { useState, useEffect } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";
import { useParametros } from "@/contexts/ParametrosContext";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  cliente: ClienteFull;
  formData: Partial<ClienteFull>;
  onChange: (changes: Partial<ClienteFull>) => void;
}

export default function TabCusto({ cliente, formData, onChange }: Props) {
  const { sistemas } = useParametros();
  const sistemasAtivos = sistemas.filter(s => s.ativo);
  const meta = { ...(cliente.metadata || {}), ...(formData.metadata || {}) } as any;
  const setMeta = (key: string, val: any) => onChange({ metadata: { ...meta, [key]: val } } as any);

  const [custoModulos, setCustoModulos] = useState(0);
  const [qtdModulos, setQtdModulos] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data: links } = await supabase
        .from("client_modules")
        .select("module_id")
        .eq("client_id", cliente.id);
      if (!links || links.length === 0) { setCustoModulos(0); setQtdModulos(0); return; }
      const ids = links.map((l: any) => l.module_id);
      const { data: mods } = await supabase
        .from("system_modules")
        .select("cost_value")
        .in("id", ids);
      const sum = (mods || []).reduce((s: number, m: any) => s + (m.cost_value || 0), 0);
      setCustoModulos(sum);
      setQtdModulos(ids.length);
    };
    fetch();
  }, [cliente.id]);

  const costActive = formData.cost_active ?? cliente.cost_active;
  const outrosCustos = Number(meta.outrosCustos || 0);
  const totalCusto = custoModulos + outrosCustos;
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
            <Select value={(formData.cost_system_name ?? cliente.cost_system_name ?? "") as string} onValueChange={val => {
              const sys = sistemas.find(s => s.nome === val);
              onChange({ cost_system_name: val, ...(sys && sys.valorCusto > 0 ? { monthly_cost_value: sys.valorCusto } : {}) } as any);
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione o sistema" /></SelectTrigger>
              <SelectContent>
                {sistemasAtivos.map(s => (
                  <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Custo repasse/franquia (R$)</Label><CurrencyInput value={Number(formData.monthly_cost_value ?? cliente.monthly_cost_value ?? 0)} onValueChange={v => onChange({ monthly_cost_value: v } as any)} /></div>
          <div>
            <Label className="flex items-center gap-2">
              Custo módulos (R$)
              {qtdModulos > 0 && <Badge variant="secondary" className="text-[10px]">{qtdModulos} módulo{qtdModulos > 1 ? "s" : ""}</Badge>}
            </Label>
            <div className="flex h-10 w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm items-center text-muted-foreground cursor-default">
              R$ {custoModulos.toFixed(2)}
            </div>
          </div>
          <div><Label>Custo cloud/infra (R$)</Label><CurrencyInput value={custoCloud} onValueChange={v => setMeta("custoCloud", v)} /></div>
          <div><Label>Outros custos (R$)</Label><CurrencyInput value={outrosCustos} onValueChange={v => setMeta("outrosCustos", v)} /></div>
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
