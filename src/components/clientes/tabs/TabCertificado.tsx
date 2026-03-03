import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, AlertTriangle } from "lucide-react";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";

interface Props {
  cliente: ClienteFull;
  onSave: (changes: Partial<ClienteFull>) => Promise<boolean>;
}

function diasParaVencer(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function TabCertificado({ cliente, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    cert_serial: cliente.cert_serial || "",
    cert_issuer: cliente.cert_issuer || "",
    cert_recognition_date: cliente.cert_recognition_date || "",
    cert_expires_at: cliente.cert_expires_at || "",
  });

  const dias = diasParaVencer(cliente.cert_expires_at);

  const handleSave = async () => {
    const ok = await onSave({
      cert_serial: form.cert_serial || null,
      cert_issuer: form.cert_issuer || null,
      cert_recognition_date: form.cert_recognition_date || null,
      cert_expires_at: form.cert_expires_at || null,
    } as any);
    if (ok) setEditing(false);
  };

  if (!editing) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Certificado Digital</p>
              {dias !== null && dias <= 30 && (
                <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />{dias} dias para vencer</Badge>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 text-sm">
            <div><span className="text-muted-foreground">Nº Série:</span> {cliente.cert_serial || "—"}</div>
            <div><span className="text-muted-foreground">Emissor:</span> {cliente.cert_issuer || "—"}</div>
            <div><span className="text-muted-foreground">Reconhecimento:</span> {cliente.cert_recognition_date ? new Date(cliente.cert_recognition_date).toLocaleDateString("pt-BR") : "—"}</div>
            <div><span className="text-muted-foreground">Vencimento:</span> {cliente.cert_expires_at ? new Date(cliente.cert_expires_at).toLocaleDateString("pt-BR") : "—"}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editar Certificado</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Nº Série</Label><Input value={form.cert_serial} onChange={e => setForm(p => ({ ...p, cert_serial: e.target.value }))} /></div>
          <div><Label>Emissor</Label><Input value={form.cert_issuer} onChange={e => setForm(p => ({ ...p, cert_issuer: e.target.value }))} /></div>
          <div><Label>Data Reconhecimento</Label><Input type="date" value={form.cert_recognition_date} onChange={e => setForm(p => ({ ...p, cert_recognition_date: e.target.value }))} /></div>
          <div><Label>Data Vencimento</Label><Input type="date" value={form.cert_expires_at} onChange={e => setForm(p => ({ ...p, cert_expires_at: e.target.value }))} /></div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" className="gap-1.5"><Save className="h-3.5 w-3.5" />Salvar</Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
