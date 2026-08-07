import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePropostas } from "@/contexts/PropostasContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, FileText, FileSignature, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/core/logger/logger";

export default function AceiteProposta() {
  const { numero } = useParams<{ numero: string }>();
  const { propostas, loading, updateProposta } = usePropostas();

  const proposta = propostas.find(p => p.linkAceite === `/aceite/${numero}` || p.numeroProposta === numero);

  const [contrato, setContrato] = useState<string | null>(null);
  const [loadingContrato, setLoadingContrato] = useState(false);
  const [assinadoEm, setAssinadoEm] = useState<string | null>(null);
  const [contratoOpen, setContratoOpen] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [nomeAssinante, setNomeAssinante] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!proposta?.id) return;
    let ativo = true;
    const fetchContrato = async () => {
      setLoadingContrato(true);
      try {
        const { data, error } = await supabase
          .from("proposals")
          .select("contract_body, contract_signed_at, contract_signer_name")
          .eq("id", proposta.id)
          .maybeSingle();
        
        if (!ativo) return;
        if (error) {
          logger.error("Falha ao carregar contrato da proposta", error);
          setLoadingContrato(false);
          return;
        }
        setContrato(((data as any)?.contract_body as string) ?? "");
        setAssinadoEm(((data as any)?.contract_signed_at as string) ?? null);
        if ((data as any)?.contract_signer_name) setNomeAssinante(String((data as any).contract_signer_name));
      } catch (err) {
        logger.error("Erro no fetch do contrato", err);
      } finally {
        if (ativo) setLoadingContrato(false);
      }
    };
    fetchContrato();
    return () => {
      ativo = false;
    };
  }, [proposta?.id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Skeleton className="h-[400px] w-[500px]" /></div>;

  if (!proposta) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Proposta não encontrada</h2>
            <p className="text-muted-foreground text-sm">O link pode estar incorreto ou a proposta foi removida.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fluxo = proposta.fluxoPagamentoImplantacao === "a_vista"
    ? "À vista"
    : `${proposta.parcelasImplantacao}x de R$ ${(proposta.valorImplantacao / (proposta.parcelasImplantacao || 1)).toFixed(2)}`;

  const jaRespondeu = proposta.statusAceite !== "pendente";
  const temContrato = contrato !== null && contrato.trim().length > 0;
  const podeAceitar = contrato !== null && (!temContrato || (aceitouTermos && nomeAssinante.trim().length >= 3));

  const handleAceitar = async () => {
    if (!podeAceitar) {
      toast({ title: "Confirme a leitura do contrato e informe seu nome completo.", variant: "destructive" });
      return;
    }
    setEnviando(true);
    try {
      if (temContrato) {
        const { error } = await supabase
          .from("proposals")
          .update({
            contract_signed_at: new Date().toISOString(),
            contract_signer_name: nomeAssinante.trim(),
          } as never)
          .eq("id", proposta.id);
        if (error) throw error;
        setAssinadoEm(new Date().toISOString());
      }
      updateProposta(
        proposta.id,
        { statusAceite: "aceitou", statusCRM: "Aceita" },
        temContrato ? `Contrato assinado digitalmente por ${nomeAssinante.trim()}` : "Cliente aceitou a proposta",
      );
      toast({ title: temContrato ? "Contrato assinado! Obrigado!" : "Proposta aceita! Obrigado!" });
    } catch (err) {
      logger.error("Erro ao registrar assinatura do contrato", err);
      toast({ title: "Não foi possível registrar o aceite. Tente novamente.", variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  const handleRecusar = () => {
    updateProposta(proposta.id, { statusAceite: "recusou", statusCRM: "Recusada" }, "Cliente recusou a proposta");
    toast({ title: "Proposta recusada." });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Proposta Comercial</div>
          <CardTitle className="text-xl">{proposta.numeroProposta}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs block">Cliente</span><span className="font-medium">{proposta.clienteNomeSnapshot || "—"}</span></div>
            <div><span className="text-muted-foreground text-xs block">Sistema</span><span className="font-medium">{proposta.sistema} — {proposta.planoNome}</span></div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/5 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground">Mensalidade</div>
              <div className="text-2xl font-bold text-primary">R$ {proposta.valorMensalidade.toFixed(2)}</div>
              <div className="text-[10px] text-muted-foreground">/mês</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground">Implantação</div>
              <div className="text-xl font-bold">R$ {proposta.valorImplantacao.toFixed(2)}</div>
              <div className="text-[10px] text-muted-foreground">{fluxo}</div>
            </div>
          </div>
          {proposta.informacoesAdicionais && (
            <>
              <Separator />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Informações Adicionais</div>
                <p className="text-sm">{proposta.informacoesAdicionais}</p>
              </div>
            </>
          )}
          {proposta.dataValidade && (
            <div className="text-center text-xs text-muted-foreground">
              Válida até {new Date(proposta.dataValidade).toLocaleDateString("pt-BR")}
            </div>
          )}

          {temContrato && (
            <>
              <Separator />
              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <FileSignature className="h-4 w-4" />
                    Contrato
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setContratoOpen(true)}>
                    Ler contrato
                  </Button>
                </div>
                <pre className="max-h-32 overflow-hidden whitespace-pre-wrap text-[11px] text-muted-foreground">
                  {contrato.slice(0, 400)}…
                </pre>

                {!jaRespondeu && !assinadoEm && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="aceite-termos"
                        checked={aceitouTermos}
                        onCheckedChange={(v) => setAceitouTermos(v === true)}
                      />
                      <Label htmlFor="aceite-termos" className="text-xs leading-snug">
                        Li e concordo integralmente com os termos do contrato acima.
                      </Label>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nome completo do responsável (assinatura digital)</Label>
                      <Input
                        value={nomeAssinante}
                        onChange={(e) => setNomeAssinante(e.target.value)}
                        placeholder="Ex.: Maria Souza"
                      />
                    </div>
                  </div>
                )}

                {assinadoEm && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Assinado por {nomeAssinante} em {new Date(assinadoEm).toLocaleString("pt-BR")}.
                  </p>
                )}
              </div>
            </>
          )}

          <Separator />
          {jaRespondeu ? (
            <div className="text-center py-4">
              <Badge className={`text-sm px-4 py-1 ${proposta.statusAceite === "aceitou" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                {proposta.statusAceite === "aceitou" ? "✓ Proposta Aceita" : "✗ Proposta Recusada"}
              </Badge>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleAceitar}
                disabled={enviando || !podeAceitar || loadingContrato}
              >
                {loadingContrato ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {temContrato ? "Aceitar e assinar" : "Aceitar Proposta"}
              </Button>
              <Button variant="outline" className="flex-1 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleRecusar} disabled={enviando || loadingContrato}>
                <XCircle className="h-4 w-4" />Recusar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={contratoOpen} onOpenChange={setContratoOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contrato — {proposta.numeroProposta}</DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed">{contrato}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
