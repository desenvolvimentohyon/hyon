import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Package, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useParametros } from "@/contexts/ParametrosContext";

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
  system_id: string | null;
  is_global: boolean;
}

interface SystemGroup {
  systemId: string | null;
  systemName: string;
  isGlobal: boolean;
  modules: LinkedModule[];
  totalSale: number;
  totalCost: number;
}

export default function TabModulos({ clienteId }: Props) {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<LinkedModule[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const { sistemas } = useParametros();

  useEffect(() => {
    const fetchLinked = async () => {
      setLoading(true);
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
        .select("id, name, description, sale_value, cost_value, active, system_id, is_global")
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
          system_id: m.system_id,
          is_global: m.is_global,
        })));
      }
      setLoading(false);
    };
    fetchLinked();
  }, [clienteId]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  // Group modules by system
  const groups: SystemGroup[] = [];
  const globalModules = modules.filter(m => m.is_global);
  const systemModules = modules.filter(m => !m.is_global);

  // Group by system_id
  const systemMap = new Map<string, LinkedModule[]>();
  for (const m of systemModules) {
    const key = m.system_id || "sem-sistema";
    if (!systemMap.has(key)) systemMap.set(key, []);
    systemMap.get(key)!.push(m);
  }

  for (const [sysId, mods] of systemMap) {
    const sys = sistemas.find(s => s.id === sysId);
    groups.push({
      systemId: sysId,
      systemName: sys?.nome || "Sem sistema",
      isGlobal: false,
      modules: mods,
      totalSale: mods.reduce((s, m) => s + m.sale_value, 0),
      totalCost: mods.reduce((s, m) => s + m.cost_value, 0),
    });
  }

  if (globalModules.length > 0) {
    groups.push({
      systemId: "__global__",
      systemName: "Módulos Globais",
      isGlobal: true,
      modules: globalModules,
      totalSale: globalModules.reduce((s, m) => s + m.sale_value, 0),
      totalCost: globalModules.reduce((s, m) => s + m.cost_value, 0),
    });
  }

  const totalSale = modules.reduce((s, m) => s + m.sale_value, 0);
  const totalCost = modules.reduce((s, m) => s + m.cost_value, 0);

  // Detail view for a selected system
  if (selectedSystem) {
    const group = groups.find(g => g.systemId === selectedSystem);
    if (!group) { setSelectedSystem(null); return null; }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSystem(null)} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {group.isGlobal && <Globe className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />}
            {group.systemName} — {group.modules.length} módulo{group.modules.length > 1 ? "s" : ""}
          </h3>
        </div>

        <div className="space-y-2">
          {group.modules.map(m => (
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
            <div><span className="text-muted-foreground">Total venda:</span> <span className="font-semibold">R$ {group.totalSale.toFixed(2)}</span></div>
            <div><span className="text-muted-foreground">Total custo:</span> <span className="font-semibold">R$ {group.totalCost.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    );
  }

  // Systems grid view
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
        Módulos Contratados ({modules.length})
      </h3>

      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum módulo vinculado. Vincule módulos na aba Dados ao selecionar o sistema.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map(g => (
              <button
                key={g.systemId}
                onClick={() => setSelectedSystem(g.systemId)}
                className="group relative rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {g.isGlobal ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/60">
                        <Globe className="h-4.5 w-4.5 text-accent-foreground" />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Package className="h-4.5 w-4.5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">{g.systemName}</p>
                      <p className="text-[11px] text-muted-foreground">{g.modules.length} módulo{g.modules.length > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Venda</span>
                    <span className="font-medium">R$ {g.totalSale.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Custo</span>
                    <span className="font-medium">R$ {g.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">Total venda geral:</span> <span className="font-semibold">R$ {totalSale.toFixed(2)}</span></div>
              <div><span className="text-muted-foreground">Total custo geral:</span> <span className="font-semibold">R$ {totalCost.toFixed(2)}</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
