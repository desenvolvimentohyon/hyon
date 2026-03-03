import { useParams } from "react-router-dom";
import { usePropostas } from "@/contexts/PropostasContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, FileText } from "lucide-react";

export default function AceiteProposta() {
  const { numero } = useParams<{ numero: string }>();
  const { propostas, loading, updateProposta } = usePropostas();

  const proposta = propostas.find(p => p.linkAceite === `/aceite/${numero}` || p.numeroProposta === numero);

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

  const handleAceitar = () => {
    updateProposta(proposta.id, { statusAceite: "aceitou", statusCRM: "Aceita" }, "Cliente aceitou a proposta");
    toast({ title: "Proposta aceita! Obrigado!" });
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
          <Separator />
          {jaRespondeu ? (
            <div className="text-center py-4">
              <Badge className={`text-sm px-4 py-1 ${proposta.statusAceite === "aceitou" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                {proposta.statusAceite === "aceitou" ? "✓ Proposta Aceita" : "✗ Proposta Recusada"}
              </Badge>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={handleAceitar}>
                <CheckCircle2 className="h-4 w-4" />Aceitar Proposta
              </Button>
              <Button variant="outline" className="flex-1 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleRecusar}>
                <XCircle className="h-4 w-4" />Recusar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
