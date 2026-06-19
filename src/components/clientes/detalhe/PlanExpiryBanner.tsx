import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  clienteId: string;
  planEndDate: string;
  daysToExpiry: number;
}

export function PlanExpiryBanner({ clienteId, planEndDate, daysToExpiry }: Props) {
  const handleRenewal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-renewal-proposal", {
        body: { client_id: clienteId, renewal_for_end_date: planEndDate },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: data.already_exists ? "Proposta já existente" : "Proposta de renovação gerada!" });
      if (data.proposal_public_token) window.open(`/proposta/${data.proposal_public_token}`, "_blank");
      if (data.whatsapp_url) window.open(data.whatsapp_url, "_blank");
    } catch (e: any) {
      toast({ title: "Erro ao gerar renovação", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Alert className="border-warning bg-warning/10">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertDescription className="text-sm font-medium flex items-center justify-between">
        <span>Plano vence em {daysToExpiry} dia{daysToExpiry !== 1 ? "s" : ""} ({new Date(planEndDate + "T00:00:00").toLocaleDateString("pt-BR")})</span>
        <Button size="sm" variant="outline" className="gap-1.5 ml-4" onClick={handleRenewal}>
          <RefreshCw className="h-3.5 w-3.5" />
          Gerar Renovação
        </Button>
      </AlertDescription>
    </Alert>
  );
}
