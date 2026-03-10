import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";
import { useParametros } from "@/contexts/ParametrosContext";

interface Props {
  cliente: ClienteFull;
  onSave: (changes: Partial<ClienteFull>) => Promise<boolean>;
}

export default function TabCustos({ cliente, onSave }: Props) {
  const { sistemas } = useParametros();
  const sistemasAtivos = sistemas.filter(s => s.ativo);
  const [editing, setEditing] = useState(false);
  const meta = (cliente.metadata || {}) as any;
  const [form, setForm] = useState({
    cost_active: cliente.cost_active,
    cost_system_name: cliente.cost_system_name || "",
    monthly_cost_value: String(cliente.monthly_cost_value || 0),
    custoModulos: String(meta.custoModulos || 0),
    custoCloud: String(meta.custoCloud || 0),
    outrosCustos: String(meta.outrosCustos || 0),
  });

  const totalCusto = (Number(form.monthly_cost_value) || 0) + (Number(form.custoModulos) || 0) + (Number(form.custoCloud) || 0) + (Number(form.outrosCustos) || 0);
  const margem = (cliente.monthly_value_final || 0) - totalCusto;

  const handleSave = async () => {
    const ok = await onSave({
      cost_active: form.cost_active,
      cost_system_name: form.cost_system_name || null,
      monthly_cost_value: Number(form.monthly_cost_value) || 0,
      metadata: {
        ...meta,
        custoModulos: Number(form.custoModulos) || 0,
        custoCloud: Number(form.custoCloud) || 0,
        outrosCustos: Number(form.outrosCustos) || 0,
      },
    } as any);
    if (ok) setEditing(false);
  };

  if (!editing) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custos</p>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 text-sm">
            <div><span className="text-muted-foreground">Custo ativo:</span> {cliente.cost_active ? "Sim" : "Não"}</div>
            <div><span className="text-muted-foreground">Sistema custo:</span> {cliente.cost_system_name || "—"}</div>
            <div><span className="text-muted-foreground">Custo repasse/franquia:</span> R$ {cliente.monthly_cost_value || 0}</div>
            <div><span className="text-muted-foreground">Custo módulos:</span> R$ {meta.custoModulos || 0}</div>
            <div><span className="text-muted-foreground">Custo cloud/infra:</span> R$ {meta.custoCloud || 0}</div>
            <div><span className="text-muted-foreground">Outros custos:</span> R$ {meta.outrosCustos || 0}</div>
          </div>
          <div className="pt-2 border-t text-sm space-y-1">
            <div className="font-medium">Total custo mensal: R$ {totalCusto.toFixed(2)}</div>
            <div className={`font-medium ${margem >= 0 ? "text-green-600" : "text-destructive"}`}>
              Margem estimada: R$ {margem.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editar Custos</p>
        <div className="flex items-center gap-2">
          <Switch checked={form.cost_active} onCheckedChange={v => setForm(p => ({ ...p, cost_active: v }))} />
          <Label>Custo ativo</Label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Sistema de custo</Label>
            <Select value={form.cost_system_name} onValueChange={v => {
              const sys = sistemas.find(s => s.nome === v);
              setForm(p => ({ ...p, cost_system_name: v, ...(sys && sys.valorCusto > 0 ? { monthly_cost_value: String(sys.valorCusto) } : {}) }));
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione o sistema" /></SelectTrigger>
              <SelectContent>
                {sistemasAtivos.map(s => (
                  <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Custo repasse/franquia (R$)</Label><CurrencyInput value={Number(form.monthly_cost_value) || 0} onValueChange={v => setForm(p => ({ ...p, monthly_cost_value: String(v) }))} /></div>
          <div><Label>Custo módulos (R$)</Label><CurrencyInput value={Number(form.custoModulos) || 0} onValueChange={v => setForm(p => ({ ...p, custoModulos: String(v) }))} /></div>
          <div><Label>Custo cloud/infra (R$)</Label><CurrencyInput value={Number(form.custoCloud) || 0} onValueChange={v => setForm(p => ({ ...p, custoCloud: String(v) }))} /></div>
          <div><Label>Outros custos (R$)</Label><CurrencyInput value={Number(form.outrosCustos) || 0} onValueChange={v => setForm(p => ({ ...p, outrosCustos: String(v) }))} /></div>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: R$ {((Number(form.monthly_cost_value)||0)+(Number(form.custoModulos)||0)+(Number(form.custoCloud)||0)+(Number(form.outrosCustos)||0)).toFixed(2)} | 
          Margem: R$ {((cliente.monthly_value_final||0)-((Number(form.monthly_cost_value)||0)+(Number(form.custoModulos)||0)+(Number(form.custoCloud)||0)+(Number(form.outrosCustos)||0))).toFixed(2)}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" />Salvar</Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
