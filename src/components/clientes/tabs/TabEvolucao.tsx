import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  clienteId: string;
}

interface AdjustmentRecord {
  id: string;
  applied_at: string;
  old_value: number;
  new_value: number;
  percent_applied: number;
}

interface MonthlyAdjRecord {
  id: string;
  adjustment_date: string;
  previous_value: number;
  new_value: number;
  reason: string;
}

export default function TabEvolucao({ clienteId }: Props) {
  const [loading, setLoading] = useState(true);
  const [contractAdj, setContractAdj] = useState<AdjustmentRecord[]>([]);
  const [monthlyAdj, setMonthlyAdj] = useState<MonthlyAdjRecord[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [caRes, maRes] = await Promise.all([
        supabase.from("contract_adjustments").select("*").eq("client_id", clienteId).order("applied_at", { ascending: false }),
        supabase.from("monthly_adjustments").select("*").eq("client_id", clienteId).order("adjustment_date", { ascending: false }),
      ]);
      if (caRes.data) setContractAdj(caRes.data as any);
      if (maRes.data) setMonthlyAdj(maRes.data as any);
      setLoading(false);
    };
    fetch();
  }, [clienteId]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const events = [
    ...contractAdj.map(a => ({
      date: a.applied_at,
      type: "reajuste" as const,
      label: `Reajuste contratual: R$ ${a.old_value} → R$ ${a.new_value} (${a.percent_applied}%)`,
    })),
    ...monthlyAdj.map(a => ({
      date: a.adjustment_date,
      type: "mensalidade" as const,
      label: `Alteração de mensalidade: R$ ${a.previous_value} → R$ ${a.new_value}${a.reason ? ` — ${a.reason}` : ""}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Timeline de Alterações</h3>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma alteração registrada para este cliente.</p>
      ) : (
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
          {events.map((ev, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[18px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {ev.type === "reajuste" ? "Reajuste" : "Mensalidade"}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm">{ev.label}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(ev.date).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
