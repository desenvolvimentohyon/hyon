import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";

export default function RenovarPlano() {
  const { token } = useParams<{ token: string }>();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    proposal_url: string;
    whatsapp_url: string | null;
    already_exists: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: clientData, isLoading } = useQuery({
    queryKey: ["portal-renewal", token],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("portal-data", {
        body: { token, section: "dashboard" },
      });
      if (error) throw error;
      return data?.client || null;
    },
    enabled: !!token,
  });

  const handleRenewal = async () => {
    if (!clientData) return;
    setGenerating(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("generate-renewal-proposal", {
        body: {
          portal_token: token,
          renewal_for_end_date: clientData.plan_end_date,
        },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      setResult({
        proposal_url: data.proposal_url || `/proposta/${data.proposal_public_token}`,
        whatsapp_url: data.whatsapp_url,
        already_exists: data.already_exists,
      });
    } catch (e: any) {
      setError(e.message || "Erro ao gerar renovação");
    }
    setGenerating(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Link de renovação inválido ou expirado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planLabels: Record<string, string> = {
    mensal: "Mensal",
    trimestral: "Trimestral",
    semestral: "Semestral",
    anual: "Anual",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Renovação de Plano</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{clientData.trade_name || clientData.name}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!result ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Plano Atual</p>
                  <Badge variant="outline" className="text-sm">
                    {planLabels[clientData.billing_plan] || clientData.billing_plan || "Mensal"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Valor Mensal</p>
                  <p className="text-lg font-bold">
                    {(clientData.monthly_value_final || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                {clientData.plan_end_date && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs text-muted-foreground">Vencimento</p>
                    <p className="text-sm font-medium">
                      {new Date(clientData.plan_end_date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
                {clientData.system_name && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs text-muted-foreground">Sistema</p>
                    <p className="text-sm">{clientData.system_name}</p>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button className="w-full gap-2" size="lg" onClick={handleRenewal} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Renovar Agora
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <div>
                <p className="font-semibold text-lg">
                  {result.already_exists ? "Proposta já existente!" : "Proposta de renovação gerada!"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesse o link abaixo para visualizar e aceitar a proposta.
                </p>
              </div>

              <Button asChild className="w-full gap-2" size="lg">
                <a href={result.proposal_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Abrir Proposta de Renovação
                </a>
              </Button>

              {result.whatsapp_url && (
                <Button variant="outline" asChild className="w-full gap-2">
                  <a href={result.whatsapp_url} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
