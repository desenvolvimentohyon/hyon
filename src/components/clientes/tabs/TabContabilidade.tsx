import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, AlertTriangle } from "lucide-react";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";
import { toast } from "@/hooks/use-toast";

interface Props {
  cliente: ClienteFull;
  formData: Partial<ClienteFull>;
  onChange: (changes: Partial<ClienteFull>) => void;
}

function diasParaVencer(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function TabContabilidade({ cliente, formData, onChange }: Props) {
  const v = (key: keyof ClienteFull) => (formData[key] ?? cliente[key] ?? "") as string;
  const set = (key: keyof ClienteFull, val: any) => onChange({ [key]: val });

  const meta = { ...(cliente.metadata || {}), ...(formData.metadata || {}) } as any;
  const setMeta = (key: string, val: any) => onChange({ metadata: { ...meta, [key]: val } } as any);

  const certExpires = (formData.cert_expires_at ?? cliente.cert_expires_at) as string | null;
  const dias = diasParaVencer(certExpires);

  const copyCsc = () => {
    const csc = meta.csc_code || "";
    if (!csc) { toast({ title: "Nenhum código CSC para copiar" }); return; }
    navigator.clipboard.writeText(csc);
    toast({ title: "CSC copiado!" });
  };

  return (
    <div className="space-y-8">
      {/* Contador */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Dados do Contador</h3>
        <div>
          <Label>Nome do Contador / Escritório</Label>
          <div className="grid gap-4 md:grid-cols-2 mt-1.5">
            <Input value={v("accountant_name")} onChange={e => set("accountant_name", e.target.value)} placeholder="Nome do contador" />
            <Input value={v("accountant_office")} onChange={e => set("accountant_office", e.target.value)} placeholder="Nome do escritório" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Email</Label><Input value={v("accountant_email")} onChange={e => set("accountant_email", e.target.value)} placeholder="contador@escritorio.com" /></div>
          <div><Label>Telefone</Label><Input value={v("accountant_phone")} onChange={e => set("accountant_phone", e.target.value)} placeholder="(00) 00000-0000" /></div>
        </div>
      </section>

      {/* Certificado & Regime */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Certificado e Regime</h3>
          {dias !== null && dias <= 30 && (
            <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />{dias} dias para vencer</Badge>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Vencimento do Certificado Digital</Label>
            <Input type="date" value={v("cert_expires_at")} onChange={e => set("cert_expires_at", e.target.value)} />
          </div>
          <div>
            <Label>Regime da Empresa</Label>
            <Select value={v("tax_regime")} onValueChange={val => set("tax_regime", val)}>
              <SelectTrigger><SelectValue placeholder="Selecione o regime" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                <SelectItem value="lucro_real">Lucro Real</SelectItem>
                <SelectItem value="mei">MEI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* CSC */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Código CSC</h3>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label>Código CSC</Label>
            <Input value={meta.csc_code || ""} onChange={e => setMeta("csc_code", e.target.value)} placeholder="Código de Segurança do Contribuinte" />
          </div>
          <Button size="icon" variant="outline" onClick={copyCsc} className="shrink-0" title="Copiar CSC">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Observações Fiscais */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Observações Fiscais</h3>
        <Textarea value={v("fiscal_notes")} onChange={e => set("fiscal_notes", e.target.value)} rows={3} placeholder="Observações fiscais do cliente..." />
      </section>
    </div>
  );
}
