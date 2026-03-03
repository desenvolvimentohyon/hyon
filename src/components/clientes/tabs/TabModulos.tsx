import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  clienteId: string;
}

interface SystemModule {
  id: string;
  name: string;
  description: string | null;
  sale_value: number;
  cost_value: number;
  active: boolean;
}

export default function TabModulos({ clienteId }: Props) {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<SystemModule[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("system_modules")
        .select("id, name, description, sale_value, cost_value, active")
        .order("name");
      if (data) setModules(data as any);
      setLoading(false);
    };
    fetch();
  }, [clienteId]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const totalSale = modules.filter(m => m.active).reduce((s, m) => s + m.sale_value, 0);
  const totalCost = modules.filter(m => m.active).reduce((s, m) => s + m.cost_value, 0);

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Módulos Disponíveis ({modules.length})</h3>
      
      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum módulo cadastrado. Configure os módulos em Parâmetros.</p>
      ) : (
        <>
          <div className="space-y-2">
            {modules.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Badge variant={m.active ? "default" : "secondary"} className="text-[10px]">
                  {m.active ? "Ativo" : "Inativo"}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.name}</p>
                  {m.description && <p className="text-[10px] text-muted-foreground truncate">{m.description}</p>}
                </div>
                <div className="text-right text-xs">
                  <div>Venda: <span className="font-medium">R$ {m.sale_value.toFixed(2)}</span></div>
                  <div className="text-muted-foreground">Custo: R$ {m.cost_value.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">Total venda (ativos):</span> <span className="font-semibold">R$ {totalSale.toFixed(2)}</span></div>
              <div><span className="text-muted-foreground">Total custo (ativos):</span> <span className="font-semibold">R$ {totalCost.toFixed(2)}</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
