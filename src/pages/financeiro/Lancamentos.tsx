import { useFinanceiro } from "@/contexts/FinanceiroContext";
import { useReceita } from "@/contexts/ReceitaContext";
import { useParametros } from "@/contexts/ParametrosContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { LancamentoForm } from "./lancamentos/LancamentoForm";
import { TransferenciaForm } from "./lancamentos/TransferenciaForm";

export default function Lancamentos() {
  const { addTitulo, addMovimento, planoContas, contasBancarias, loading } = useFinanceiro();
  const { clientesReceita } = useReceita();
  const { formasPagamento } = useParametros();

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lançamentos</h1>
        <p className="text-muted-foreground text-sm">Registros rápidos de receitas, despesas e transferências</p>
      </div>
      <ModuleNavGrid moduleId="financeiro" />

      <Tabs defaultValue="receita" className="space-y-4">
        <TabsList>
          <TabsTrigger value="receita" className="gap-1"><ArrowDownLeft className="h-3 w-3" /> Receita Avulsa</TabsTrigger>
          <TabsTrigger value="despesa" className="gap-1"><ArrowUpRight className="h-3 w-3" /> Despesa</TabsTrigger>
          <TabsTrigger value="transferencia" className="gap-1"><RefreshCw className="h-3 w-3" /> Transferência</TabsTrigger>
        </TabsList>

        <TabsContent value="receita">
          <LancamentoForm tipo="receber" planoContas={planoContas} contasBancarias={contasBancarias} clientesReceita={clientesReceita} addTitulo={addTitulo} formasPagamento={formasPagamento} />
        </TabsContent>
        <TabsContent value="despesa">
          <LancamentoForm tipo="pagar" planoContas={planoContas} contasBancarias={contasBancarias} clientesReceita={clientesReceita} addTitulo={addTitulo} formasPagamento={formasPagamento} />
        </TabsContent>
        <TabsContent value="transferencia">
          <TransferenciaForm contasBancarias={contasBancarias} addMovimento={addMovimento} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
