import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { DRETab } from "./relatorios/DRETab";
import { MRRTab } from "./relatorios/MRRTab";
import { LucratividadeTab } from "./relatorios/LucratividadeTab";
import { ProjecoesTab } from "./relatorios/ProjecoesTab";
import { ComissoesTab } from "./relatorios/ComissoesTab";

export default function Relatorios() {
  const { titulos, planoContas, loading } = useFinanceiro();
  const { clientesReceita } = useReceita();

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h1>
        <p className="text-muted-foreground text-sm">DRE, MRR, lucratividade e projeções</p>
      </div>
      <ModuleNavGrid moduleId="financeiro" />

      <Tabs defaultValue="dre" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="mrr">MRR</TabsTrigger>
          <TabsTrigger value="lucratividade">Lucratividade</TabsTrigger>
          <TabsTrigger value="projecoes">Projeções</TabsTrigger>
          <TabsTrigger value="comissoes">Comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="dre"><DRETab titulos={titulos} planoContas={planoContas} /></TabsContent>
        <TabsContent value="mrr"><MRRTab clientesReceita={clientesReceita} titulos={titulos} /></TabsContent>
        <TabsContent value="lucratividade"><LucratividadeTab clientesReceita={clientesReceita} titulos={titulos} /></TabsContent>
        <TabsContent value="projecoes"><ProjecoesTab clientesReceita={clientesReceita} /></TabsContent>
        <TabsContent value="comissoes"><ComissoesTab titulos={titulos} /></TabsContent>
      </Tabs>
    </div>
  );
}
