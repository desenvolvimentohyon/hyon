import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, AlertTriangle, Upload, Loader2, ShieldCheck, FileKey } from "lucide-react";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  cliente: ClienteFull;
  formData: Partial<ClienteFull>;
  onChange: (changes: Partial<ClienteFull>) => void;
  clienteId?: string;
  orgId?: string;
}

function diasParaVencer(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function TabContabilidade({ cliente, formData, onChange, clienteId }: Props) {
  const v = (key: keyof ClienteFull) => (formData[key] ?? cliente[key] ?? "") as string;
  const set = (key: keyof ClienteFull, val: any) => onChange({ [key]: val });

  const meta = { ...(cliente.metadata || {}), ...(formData.metadata || {}) } as any;
  const setMeta = (key: string, val: any) => onChange({ metadata: { ...meta, [key]: val } } as any);

  const certExpires = (formData.cert_expires_at ?? cliente.cert_expires_at) as string | null;
  const dias = diasParaVencer(certExpires);

  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState("");
  const [certLoading, setCertLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyCsc = () => {
    const csc = meta.csc_code || "";
    if (!csc) { toast({ title: "Nenhum código CSC para copiar" }); return; }
    navigator.clipboard.writeText(csc);
    toast({ title: "CSC copiado!" });
  };

  const handleCertUpload = async () => {
    if (!certFile || !certPassword || !clienteId) {
      toast({ title: "Selecione o arquivo e informe a senha", variant: "destructive" });
      return;
    }

    setCertLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(certFile);
      });

      const { data, error } = await supabase.functions.invoke("parse-client-certificate", {
        body: { fileBase64: base64, password: certPassword, clientId: clienteId },
      });

      if (error || !data?.success) {
        toast({ title: data?.error || "Erro ao processar certificado", variant: "destructive" });
        return;
      }

      onChange({
        cert_expires_at: data.cert_valid_to,
        cert_file_path: `${clienteId}/certificado.pfx`,
        cert_recognition_date: new Date().toISOString().split("T")[0],
      } as any);

      // Store CN in metadata
      if (data.cert_cn) {
        setMeta("cert_cn", data.cert_cn);
        setMeta("cert_valid_from", data.cert_valid_from);
      }

      toast({ title: "Certificado processado com sucesso!" });
      setCertFile(null);
      setCertPassword("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      toast({ title: "Erro ao enviar certificado", variant: "destructive" });
    } finally {
      setCertLoading(false);
    }
  };

  const hasCert = !!v("cert_file_path") || !!v("cert_expires_at");

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

      {/* Certificado Digital - Upload + Regime */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Certificado Digital e Regime</h3>
          {dias !== null && dias <= 30 && (
            <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />{dias} dias para vencer</Badge>
          )}
        </div>

        {/* Current cert info */}
        {hasCert && (meta.cert_cn || certExpires) && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm space-y-0.5">
              {meta.cert_cn && <p className="font-medium">{meta.cert_cn}</p>}
              {meta.cert_valid_from && certExpires && (
                <p className="text-muted-foreground">Válido de {meta.cert_valid_from} até {certExpires}</p>
              )}
              {!meta.cert_valid_from && certExpires && (
                <p className="text-muted-foreground">Vencimento: {certExpires}</p>
              )}
            </div>
          </div>
        )}

        {/* Upload section */}
        <div className="p-4 rounded-lg border border-dashed border-border space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileKey className="h-4 w-4" />
            {hasCert ? "Substituir Certificado Digital" : "Enviar Certificado Digital"}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Arquivo (.pfx / .p12)</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pfx,.p12"
                onChange={e => setCertFile(e.target.files?.[0] || null)}
                disabled={certLoading}
              />
            </div>
            <div>
              <Label>Senha do Certificado</Label>
              <Input
                type="password"
                value={certPassword}
                onChange={e => setCertPassword(e.target.value)}
                placeholder="Senha do certificado"
                disabled={certLoading}
              />
            </div>
          </div>
          <Button
            onClick={handleCertUpload}
            disabled={!certFile || !certPassword || certLoading}
            size="sm"
          >
            {certLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            {certLoading ? "Processando..." : "Enviar Certificado"}
          </Button>
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
