import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, FileText, Calculator, DollarSign, TrendingDown, History, Paperclip, Receipt, Settings2, Boxes, Save, Wallet, AlertTriangle, RefreshCw, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useClienteDetalhe } from "@/hooks/useClienteDetalhe";
import type { ClienteFull } from "@/hooks/useClienteDetalhe";
import { useApp } from "@/contexts/AppContext";
import { scoreSaudeLabel } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";

import TabDados from "./tabs/TabDados";
import TabContabilidade from "./tabs/TabContabilidade";
import TabMensalidadeNew from "./tabs/TabMensalidadeNew";
import TabCusto from "./tabs/TabCusto";
import TabEvolucao from "./tabs/TabEvolucao";
import TabAnexos from "./tabs/TabAnexos";
import TabCobrancas from "./tabs/TabCobrancas";
import TabControle from "./tabs/TabControle";
import TabModulos from "./tabs/TabModulos";
import TabPagamentos from "./tabs/TabPagamentos";

interface Props {
  clienteId: string;
  onBack: () => void;
}

const TABS = [
  { value: "dados", label: "Dados", icon: FileText, desc: "Informações cadastrais, endereço e contatos" },
  { value: "contabilidade", label: "Contabilidade", icon: Calculator, desc: "Dados do contador, certificado e regime tributário" },
  { value: "mensalidade", label: "Mensalidade", icon: DollarSign, desc: "Valores, plano e vencimento" },
  { value: "custo", label: "Custo", icon: TrendingDown, desc: "Custos operacionais e margem" },
  { value: "evolucao", label: "Evolução", icon: History, desc: "Histórico de alterações e timeline" },
  { value: "anexos", label: "Anexos", icon: Paperclip, desc: "Documentos e arquivos do cliente" },
  { value: "cobrancas", label: "Cobranças", icon: Receipt, desc: "Contas a receber e cobranças" },
  { value: "controle", label: "Controle", icon: Settings2, desc: "Tags, observações e preferências" },
  { value: "modulos", label: "Módulos", icon: Boxes, desc: "Módulos contratados e adicionais" },
  { value: "pagamentos", label: "Pagamentos", icon: Wallet, desc: "Pagamentos registrados e comprovantes" },
];

export default function ClienteDetalhe({ clienteId, onBack }: Props) {
  const navigate = useNavigate();
  const { tarefas } = useApp();
  const {
    cliente, contacts, attachments, loading,
    updateCliente, addContact, updateContact, deleteContact,
    addAttachment, deleteAttachment,
  } = useClienteDetalhe(clienteId);

  const [formData, setFormData] = useState<Partial<ClienteFull>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dados");

  const handleChange = useCallback((changes: Partial<ClienteFull>) => {
    setFormData(prev => {
      const next = { ...prev };
      for (const [key, val] of Object.entries(changes)) {
        if (key === "metadata") {
          next.metadata = { ...(prev.metadata || {}), ...(val as any) } as any;
        } else {
          (next as any)[key] = val;
        }
      }
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (Object.keys(formData).length === 0) {
      toast({ title: "Nenhuma alteração para salvar" });
      return;
    }
    setSaving(true);
    const changes = { ...formData };
    if (changes.metadata && cliente) {
      changes.metadata = { ...(cliente.metadata || {}), ...(changes.metadata as any) } as any;
    }
    // Convert empty strings to null for optional fields
    for (const [key, val] of Object.entries(changes)) {
      if (typeof val === "string" && val === "" && key !== "name") {
        (changes as any)[key] = null;
      }
    }
    const ok = await updateCliente(changes);
    if (ok) {
      setFormData({});
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setFormData({});
    toast({ title: "Alterações descartadas" });
  };

  const hasChanges = Object.keys(formData).length > 0;

  if (loading || !cliente) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const saude = scoreSaudeLabel(cliente.health_score || 0);
  const currentTabMeta = TABS.find(t => t.value === activeTab);

  // Plan expiry banner
  const daysToExpiry = (() => {
    if (!cliente.plan_end_date) return null;
    const end = new Date(cliente.plan_end_date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  })();
  const showExpiryBanner = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 7;

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex-1 space-y-4 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" />Voltar
        </Button>

        {showExpiryBanner && (
          <Alert className="border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm font-medium flex items-center justify-between">
              <span>Plano vence em {daysToExpiry} dia{daysToExpiry !== 1 ? "s" : ""} ({new Date(cliente.plan_end_date! + "T00:00:00").toLocaleDateString("pt-BR")})</span>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 ml-4"
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.functions.invoke("generate-renewal-proposal", {
                      body: { client_id: clienteId, renewal_for_end_date: cliente.plan_end_date },
                    });
                    if (error) throw error;
                    if (data?.error) throw new Error(data.error);
                    toast({ title: data.already_exists ? "Proposta já existente" : "Proposta de renovação gerada!" });
                    if (data.proposal_public_token) {
                      window.open(`/proposta/${data.proposal_public_token}`, "_blank");
                    }
                    if (data.whatsapp_url) {
                      window.open(data.whatsapp_url, "_blank");
                    }
                  } catch (e: any) {
                    toast({ title: "Erro ao gerar renovação", description: e.message, variant: "destructive" });
                  }
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Gerar Renovação
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{cliente.name}</h1>
          {cliente.trade_name && (
            <span className="text-sm text-muted-foreground">({cliente.trade_name})</span>
          )}
          <Badge className={saude.className}>{saude.label} ({cliente.health_score || 0})</Badge>
          <Badge variant="outline" className="text-[10px]">{cliente.status?.toUpperCase()}</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs px-3 py-2 rounded-md border gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {currentTabMeta && (
            <p className="text-xs text-muted-foreground mt-2 mb-4">{currentTabMeta.desc}</p>
          )}

          <div className="rounded-lg border border-border p-6 bg-card">
            <TabsContent value="dados" className="mt-0">
              <TabDados
                cliente={cliente}
                formData={formData}
                onChange={handleChange}
                contacts={contacts}
                onAddContact={addContact}
                onUpdateContact={updateContact}
                onDeleteContact={deleteContact}
              />
            </TabsContent>
            <TabsContent value="contabilidade" className="mt-0">
              <TabContabilidade cliente={cliente} formData={formData} onChange={handleChange} />
            </TabsContent>
            <TabsContent value="mensalidade" className="mt-0">
              <TabMensalidadeNew cliente={cliente} formData={formData} onChange={handleChange} />
            </TabsContent>
            <TabsContent value="custo" className="mt-0">
              <TabCusto cliente={cliente} formData={formData} onChange={handleChange} />
            </TabsContent>
            <TabsContent value="evolucao" className="mt-0">
              <TabEvolucao clienteId={clienteId} />
            </TabsContent>
            <TabsContent value="anexos" className="mt-0">
              <TabAnexos clienteId={clienteId} orgId={cliente?.org_id || ""} attachments={attachments} onAdd={addAttachment} onDelete={deleteAttachment} />
            </TabsContent>
            <TabsContent value="cobrancas" className="mt-0">
              <TabCobrancas clienteId={clienteId} />
            </TabsContent>
            <TabsContent value="controle" className="mt-0">
              <TabControle cliente={cliente} formData={formData} onChange={handleChange} />
            </TabsContent>
            <TabsContent value="modulos" className="mt-0">
              <TabModulos clienteId={clienteId} />
            </TabsContent>
            <TabsContent value="pagamentos" className="mt-0">
              <TabPagamentos clienteId={clienteId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Fixed Footer */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-6 py-3 z-30">
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={!hasChanges || saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
