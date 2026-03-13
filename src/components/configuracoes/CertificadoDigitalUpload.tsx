import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, FileKey, Loader2, RefreshCw, Shield, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { differenceInDays, parseISO, format } from "date-fns";
import { formatCNPJ } from "@/lib/cnpjUtils";

interface CertInfo {
  cert_cn: string | null;
  cert_cnpj: string | null;
  cert_issuer: string | null;
  cert_valid_from: string | null;
  cert_valid_to: string | null;
  cert_file_path: string | null;
}

interface Props {
  certInfo: CertInfo;
  onCertUpdated: () => void;
}

export default function CertificadoDigitalUpload({ certInfo, onCertUpdated }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasCert = !!certInfo.cert_valid_to;
  const daysLeft = certInfo.cert_valid_to
    ? differenceInDays(parseISO(certInfo.cert_valid_to), new Date())
    : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (ext !== "pfx" && ext !== "p12") {
        toast({ title: "Formato inválido", description: "Selecione um arquivo .pfx ou .p12", variant: "destructive" });
        return;
      }
      setFile(f);
    }
  };

  const handleImport = async () => {
    if (!file || !password.trim()) {
      toast({ title: "Preencha a senha do certificado", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const binary = Array.from(new Uint8Array(buffer))
        .map((b) => String.fromCharCode(b))
        .join("");
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("parse-certificate", {
        body: { fileBase64: base64, password: password.trim() },
      });

      if (error) {
        let msg = "Erro ao processar certificado.";
        try {
          const ctx = error.context ? await error.context.json() : null;
          if (ctx?.error) msg = ctx.error;
        } catch {}
        toast({ title: "Erro", description: msg, variant: "destructive" });
      } else if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Certificado importado com sucesso!" });
        setFile(null);
        setPassword("");
        setShowUpload(false);
        onCertUpdated();
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const getAlertVariant = () => {
    if (daysLeft === null) return null;
    if (daysLeft <= 0) return "vencido";
    if (daysLeft <= 7) return "critico";
    if (daysLeft <= 15) return "alerta";
    if (daysLeft <= 30) return "aviso";
    return null;
  };

  const alertVariant = getAlertVariant();

  return (
    <div className="space-y-4">
      {/* Alert banner */}
      {alertVariant && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            alertVariant === "vencido"
              ? "bg-destructive/10 text-destructive"
              : alertVariant === "critico"
              ? "bg-destructive/10 text-destructive"
              : alertVariant === "alerta"
              ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
              : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
          }`}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {daysLeft! <= 0
            ? "O certificado digital da empresa está VENCIDO!"
            : `O certificado digital da empresa vence em ${daysLeft} dia(s).`}
        </div>
      )}

      {/* Current cert info */}
      {hasCert && !showUpload && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Certificado carregado com sucesso
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {certInfo.cert_cn && (
                <div>
                  <span className="text-muted-foreground text-xs">Empresa</span>
                  <p className="font-medium truncate">{certInfo.cert_cn}</p>
                </div>
              )}
              {certInfo.cert_cnpj && (
                <div>
                  <span className="text-muted-foreground text-xs">CNPJ</span>
                  <p className="font-medium">{formatCNPJ(certInfo.cert_cnpj)}</p>
                </div>
              )}
              {certInfo.cert_issuer && (
                <div>
                  <span className="text-muted-foreground text-xs">Autoridade Certificadora</span>
                  <p className="font-medium truncate">{certInfo.cert_issuer}</p>
                </div>
              )}
              {certInfo.cert_valid_to && (
                <div>
                  <span className="text-muted-foreground text-xs">Vencimento</span>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{format(parseISO(certInfo.cert_valid_to), "dd/MM/yyyy")}</p>
                    {daysLeft !== null && (
                      <Badge
                        variant={daysLeft <= 0 ? "destructive" : daysLeft <= 30 ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {daysLeft <= 0 ? "Vencido" : `${daysLeft}d restantes`}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 mt-2"
              onClick={() => setShowUpload(true)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Substituir certificado
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload form */}
      {(!hasCert || showUpload) && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileKey className="h-4 w-4 text-muted-foreground" />
              Importar Certificado Digital A1
            </div>

            <div>
              <Label className="text-xs">Arquivo do Certificado (.pfx ou .p12)</Label>
              <div
                className="mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pfx,.p12"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar o certificado
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Formatos aceitos: .pfx, .p12
                    </p>
                  </div>
                )}
              </div>
            </div>

            {file && (
              <div>
                <Label className="text-xs">Senha do Certificado</Label>
                <Input
                  className="h-9"
                  type="password"
                  placeholder="Digite a senha do certificado"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!file || !password.trim() || loading}
                onClick={handleImport}
                className="gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Importar
              </Button>
              {showUpload && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowUpload(false);
                    setFile(null);
                    setPassword("");
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
