import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { ClienteAttachment } from "@/hooks/useClienteDetalhe";

const FILE_TYPES = [
  { value: "contrato", label: "Contrato" },
  { value: "certificado", label: "Certificado" },
  { value: "docs_fiscais", label: "Docs Fiscais" },
  { value: "print_erro", label: "Print Erro" },
  { value: "outros", label: "Outros" },
];

interface Props {
  clienteId: string;
  orgId: string;
  attachments: ClienteAttachment[];
  onAdd: (att: { file_path: string; file_type: string; description?: string }) => Promise<void>;
  onDelete: (id: string, filePath: string) => Promise<void>;
}

export default function TabAnexos({ clienteId, orgId, attachments, onAdd, onDelete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState("outros");
  const [description, setDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; path: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast({ title: "Selecione um arquivo", variant: "destructive" }); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${orgId}/${clienteId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("client-attachments").upload(path, file);
      if (error) throw error;
      await onAdd({ file_path: path, file_type: fileType, description: description || undefined });
      toast({ title: "Arquivo enviado!" });
      setDescription("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filePath: string) => {
    const { data, error } = await supabase.storage.from("client-attachments").createSignedUrl(filePath, 60);
    if (error || !data?.signedUrl) { toast({ title: "Erro ao gerar link", variant: "destructive" }); return; }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Anexos ({attachments.length})</p>

        <div className="border rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium">Enviar novo arquivo</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Arquivo</Label>
              <Input type="file" ref={fileRef} className="text-xs" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FILE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <Button size="sm" onClick={handleUpload} disabled={uploading} className="gap-1.5">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Enviar
          </Button>
        </div>

        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum anexo.</p>
        ) : (
          <div className="space-y-2">
            {attachments.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{a.file_path.split("/").pop()}</span>
                    <Badge variant="secondary" className="text-[9px]">{FILE_TYPES.find(t => t.value === a.file_type)?.label || a.file_type}</Badge>
                  </div>
                  {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                  <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(a.file_path)}><Download className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ id: a.id, path: a.file_path })}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover anexo?</AlertDialogTitle>
              <AlertDialogDescription>O arquivo será excluído permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (deleteTarget) onDelete(deleteTarget.id, deleteTarget.path); setDeleteTarget(null); }}>Remover</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
