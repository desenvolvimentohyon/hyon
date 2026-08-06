import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Download, FileSignature, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/core/logger/logger";
import { contractTemplatesService, type ContractTemplate } from "@/services/contractTemplatesService";

interface ContratoIACardProps {
  proposalId: string;
  proposalNumber: string;
  clienteNome?: string;
}

/**
 * Geração do contrato da proposta via Lovable AI (Edge Function `generate-contract`).
 * O contrato é persistido em `proposals.contract_body` e exibido no link de aceite.
 */
export function ContratoIACard({ proposalId, proposalNumber, clienteNome }: ContratoIACardProps) {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [contrato, setContrato] = useState<string>("");
  const [geradoEm, setGeradoEm] = useState<string | null>(null);
  const [assinadoEm, setAssinadoEm] = useState<string | null>(null);
  const [signer, setSigner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data, error }, tpls] = await Promise.all([
        supabase
          .from("proposals")
          .select("contract_body, contract_generated_at, contract_template_id, contract_signed_at, contract_signer_name")
          .eq("id", proposalId)
          .maybeSingle(),
        contractTemplatesService.list().catch(() => [] as ContractTemplate[]),
      ]);
      if (error) throw error;
      setTemplates(tpls.filter((t) => t.active));
      setContrato((data as any)?.contract_body ?? "");
      setGeradoEm((data as any)?.contract_generated_at ?? null);
      setAssinadoEm((data as any)?.contract_signed_at ?? null);
      setSigner((data as any)?.contract_signer_name ?? null);
      const current = (data as any)?.contract_template_id as string | null;
      setTemplateId(current ?? tpls.find((t) => t.is_default && t.active)?.id ?? tpls[0]?.id ?? "");
    } catch (err) {
      logger.error("Falha ao carregar contrato da proposta", err);
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleGenerate = async () => {
    if (templates.length === 0) {
      toast.error("Cadastre um template em Configurações › Contratos antes de gerar.");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-contract", {
        body: { proposalId, templateId: templateId || null },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setContrato(String((data as any)?.contract ?? ""));
      setGeradoEm(new Date().toISOString());
      setPreviewOpen(true);
      toast.success("Contrato gerado pela IA!");
    } catch (err) {
      logger.error("Erro ao gerar contrato via IA", err);
      toast.error(err instanceof Error ? err.message : "Não foi possível gerar o contrato.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    const { error } = await supabase
      .from("proposals")
      .update({ contract_body: contrato } as never)
      .eq("id", proposalId);
    if (error) {
      toast.error("Erro ao salvar o contrato.");
      return;
    }
    toast.success("Contrato atualizado.");
    setPreviewOpen(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(contrato);
    toast.success("Contrato copiado.");
  };

  const handleDownload = () => {
    const blob = new Blob([contrato], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contrato-${proposalNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileSignature className="h-4 w-4" />
            Contrato (IA)
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {assinadoEm ? (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                Assinado {signer ? `por ${signer}` : ""}
              </Badge>
            ) : geradoEm ? (
              <Badge variant="outline">Gerado em {new Date(geradoEm).toLocaleString("pt-BR")}</Badge>
            ) : (
              <Badge variant="secondary">Não gerado</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Template</Label>
                <Select value={templateId} onValueChange={setTemplateId} disabled={templates.length === 0}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Nenhum template ativo" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                        {t.is_default ? " (padrão)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="gap-1.5">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {contrato ? "Regerar" : "Gerar Contrato"}
              </Button>
            </div>

            {contrato ? (
              <>
                <pre className="max-h-40 overflow-hidden whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  {contrato.slice(0, 600)}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                    Ver / Editar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
                    <Download className="h-3.5 w-3.5" />
                    Baixar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O contrato aparece no link de aceite para {clienteNome || "o cliente"} confirmar a assinatura.
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Gere o contrato para que ele fique disponível no link de aceite da proposta.
              </p>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contrato — {proposalNumber}</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={22}
            className="font-mono text-xs"
            value={contrato}
            onChange={(e) => setContrato(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Fechar</Button>
            <Button onClick={handleSaveEdits}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
