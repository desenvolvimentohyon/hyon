import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useClienteDetalhe } from "@/hooks/useClienteDetalhe";
import { useApp } from "@/contexts/AppContext";
import { scoreSaudeLabel } from "@/lib/constants";
import TabGeral from "./tabs/TabGeral";
import TabEndereco from "./tabs/TabEndereco";
import TabResponsavel from "./tabs/TabResponsavel";
import TabContatos from "./tabs/TabContatos";
import TabMensalidade from "./tabs/TabMensalidade";
import TabCustos from "./tabs/TabCustos";
import TabContador from "./tabs/TabContador";
import TabContrato from "./tabs/TabContrato";
import TabCertificado from "./tabs/TabCertificado";
import TabAnexos from "./tabs/TabAnexos";
import TabHistorico from "./tabs/TabHistorico";

interface Props {
  clienteId: string;
  onBack: () => void;
}

export default function ClienteDetalhe({ clienteId, onBack }: Props) {
  const navigate = useNavigate();
  const { tarefas, getStatusLabel, getPrioridadeLabel } = useApp();
  const {
    cliente, contacts, attachments, loading,
    updateCliente, addContact, updateContact, deleteContact,
    addAttachment, deleteAttachment,
  } = useClienteDetalhe(clienteId);

  if (loading || !cliente) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const saude = scoreSaudeLabel(cliente.health_score || 0);
  const clienteTarefas = tarefas.filter(t => t.clienteId === clienteId);

  return (
    <div className="space-y-4 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">{cliente.name}</h1>
        {cliente.trade_name && (
          <span className="text-sm text-muted-foreground">({cliente.trade_name})</span>
        )}
        <Badge className={saude.className}>{saude.label} ({cliente.health_score || 0})</Badge>
        <Badge variant="outline" className="text-[10px]">{cliente.status?.toUpperCase()}</Badge>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {[
            { value: "geral", label: "Geral" },
            { value: "endereco", label: "Endereço" },
            { value: "responsavel", label: "Responsável" },
            { value: "contatos", label: "Contatos" },
            { value: "mensalidade", label: "Mensalidade" },
            { value: "custos", label: "Custos" },
            { value: "contador", label: "Contador & Fiscal" },
            { value: "contrato", label: "Contrato" },
            { value: "certificado", label: "Certificado" },
            { value: "anexos", label: "Anexos" },
            { value: "historico", label: "Histórico" },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3 py-1.5 rounded-md border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="geral">
          <TabGeral cliente={cliente} onSave={updateCliente} />
        </TabsContent>
        <TabsContent value="endereco">
          <TabEndereco cliente={cliente} onSave={updateCliente} />
        </TabsContent>
        <TabsContent value="responsavel">
          <TabResponsavel cliente={cliente} onSave={updateCliente} />
        </TabsContent>
        <TabsContent value="contatos">
          <TabContatos contacts={contacts} onAdd={addContact} onUpdate={updateContact} onDelete={deleteContact} />
        </TabsContent>
        <TabsContent value="mensalidade">
          <TabMensalidade cliente={cliente} onSave={updateCliente} />
        </TabsContent>
        <TabsContent value="custos">
          <TabCustos cliente={cliente} onSave={updateCliente} />
        </TabsContent>
        <TabsContent value="contador">
          <TabContador cliente={cliente} onSave={updateCliente} />
        </TabsContent>
        <TabsContent value="contrato">
          <TabContrato cliente={cliente} onSave={updateCliente} />
        </TabsContent>
        <TabsContent value="certificado">
          <TabCertificado cliente={cliente} onSave={updateCliente} />
        </TabsContent>
        <TabsContent value="anexos">
          <TabAnexos clienteId={clienteId} attachments={attachments} onAdd={addAttachment} onDelete={deleteAttachment} />
        </TabsContent>
        <TabsContent value="historico">
          <TabHistorico clienteId={clienteId} tarefas={clienteTarefas} getStatusLabel={getStatusLabel} getPrioridadeLabel={getPrioridadeLabel} navigate={navigate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
