import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";

interface Props {
  cliente: ClienteFull;
  formData: Partial<ClienteFull>;
  onChange: (changes: Partial<ClienteFull>) => void;
}

export default function TabControle({ cliente, formData, onChange }: Props) {
  const v = (key: keyof ClienteFull) => (formData[key] ?? cliente[key] ?? "") as string;
  const set = (key: keyof ClienteFull, val: any) => onChange({ [key]: val });

  const tags = (formData.tags ?? cliente.tags ?? []) as string[];
  const tagsStr = tags.join(", ");

  return (
    <div className="space-y-8">
      {/* Tags */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Tags do Cliente</h3>
        <div>
          <Label>Tags (separar por vírgula)</Label>
          <Input
            value={tagsStr}
            onChange={e => set("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
            placeholder="alto suporte, bom pagador, prioritário, risco churn"
          />
        </div>
        <div>
          <Label>Motivo do Risco</Label>
          <Input value={v("risk_reason")} onChange={e => set("risk_reason", e.target.value)} placeholder="Descreva o motivo do risco, se houver" />
        </div>
      </section>

      {/* Preferências de atendimento */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Preferências de Atendimento</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Tipo de Suporte</Label>
            <Select value={v("support_type") || "diurno"} onValueChange={val => set("support_type", val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="diurno">Diurno</SelectItem>
                <SelectItem value="noturno">Noturno</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Canal Preferido</Label>
            <Select value={v("preferred_channel") || "whatsapp"} onValueChange={val => set("preferred_channel", val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="telefone">Telefone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Inventário técnico */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Inventário Técnico</h3>
        <div>
          <Label>Observações do Ambiente</Label>
          <Textarea value={v("environment_notes")} onChange={e => set("environment_notes", e.target.value)} rows={3} placeholder='Ex: "usa TEF", "usa balança X", "2 caixas"' />
        </div>
        <div>
          <Label>Inventário Técnico</Label>
          <Textarea value={v("technical_notes")} onChange={e => set("technical_notes", e.target.value)} rows={3} placeholder="Equipamentos, integrações ativas..." />
        </div>
      </section>
    </div>
  );
}
