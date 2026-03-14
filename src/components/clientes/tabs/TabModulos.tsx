import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  clienteId: string;
}

interface LinkedModule {
  id: string;
  module_id: string;
  module_name: string;
  module_description: string | null;
  sale_value: number;
  cost_value: number;
  active: boolean;
}

export default function TabModulos({ clienteId }: Props) {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<LinkedModule[]>([]);

  useEffect(() => {
    const fetchLinked = async () => {
      setLoading(true);
      // Get module IDs linked to this client
      const { data: links } = await supabase
        .from("client_modules")
        .select("module_id")
        .eq("client_id", clienteId);

      if (!links || links.length === 0) {
        setModules([]);
        setLoading(false);
        return;
      }

      const moduleIds = links.map((l: any) => l.module_id);
      const { data: mods } = await supabase
        .from("system_modules")
        .select("id, name, description, sale_value, cost_value, active")
        .in("id", moduleIds)
        .order("name");

      if (mods) {
        setModules(mods.map((m: any) => ({
          id: m.id,
          module_id: m.id,
          module_name: m.name,
          module_description: m.description,
          sale_value: m.sale_value,
          cost_value: m.cost_value,
          active: m.active,
        })));
      }
      setLoading(false);
    };
    fetchLinked();
  }, [clienteId]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const totalSale = modules.reduce((s, m) => s + m.sale_value, 0);
  const totalCost = modules.reduce((s, m) => s + m.cost_value, 0);

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Módulos Contratados ({modules.length})</h3>
      
      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum módulo vinculado. Vincule módulos na aba Dados ao selecionar o sistema.</p>
      ) : (
        <>
          <div className="space-y-2">
            {modules.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Badge variant={m.active ? "default" : "secondary"} className="text-[10px]">
                  {m.active ? "Ativo" : "Inativo"}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.module_name}</p>
                  {m.module_description && <p className="text-[10px] text-muted-foreground truncate">{m.module_description}</p>}
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
              <div><span className="text-muted-foreground">Total venda:</span> <span className="font-semibold">R$ {totalSale.toFixed(2)}</span></div>
              <div><span className="text-muted-foreground">Total custo:</span> <span className="font-semibold">R$ {totalCost.toFixed(2)}</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
