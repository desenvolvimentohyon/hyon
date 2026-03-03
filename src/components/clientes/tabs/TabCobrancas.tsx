import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  clienteId: string;
}

interface Title {
  id: string;
  description: string;
  value_original: number;
  value_final: number;
  status: string;
  due_at: string | null;
  competency: string | null;
  asaas_bank_slip_url: string | null;
  asaas_invoice_url: string | null;
  asaas_pix_payload: string | null;
  issued_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  aberto: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  pago: "bg-green-500/10 text-green-500 border-green-500/30",
  vencido: "bg-destructive/10 text-destructive border-destructive/30",
  cancelado: "bg-muted text-muted-foreground border-border",
};

export default function TabCobrancas({ clienteId }: Props) {
  const [loading, setLoading] = useState(true);
  const [titles, setTitles] = useState<Title[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("financial_titles")
        .select("id, description, value_original, value_final, status, due_at, competency, asaas_bank_slip_url, asaas_invoice_url, asaas_pix_payload, issued_at")
        .eq("client_id", clienteId)
        .eq("type", "receita")
        .order("due_at", { ascending: false })
        .limit(50);
      if (data) setTitles(data as any);
      setLoading(false);
    };
    fetch();
  }, [clienteId]);

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Cobranças ({titles.length})</h3>
      {titles.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma cobrança encontrada para este cliente.</p>
      ) : (
        <div className="space-y-2">
          {titles.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Badge className={`text-[10px] ${STATUS_COLORS[t.status] || ""}`}>{t.status}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.description}</p>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  {t.competency && <span>Comp: {t.competency}</span>}
                  {t.due_at && <span>Venc: {new Date(t.due_at).toLocaleDateString("pt-BR")}</span>}
                </div>
              </div>
              <span className="text-sm font-semibold whitespace-nowrap">R$ {t.value_final.toFixed(2)}</span>
              <div className="flex gap-1">
                {t.asaas_invoice_url && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(t.asaas_invoice_url!, "_blank")} title="Abrir fatura">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                )}
                {t.asaas_bank_slip_url && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(t.asaas_bank_slip_url!)} title="Copiar link boleto">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
