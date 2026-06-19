import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Save, RefreshCw, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
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
import TabCobrancas from "./tabs/TabCobrancas";
import TabControle from "./tabs/TabControle";
import TabModulos from "./tabs/TabModulos";
import TabPagamentos from "./tabs/TabPagamentos";

import { TAB_COLORS, TABS } from "./detalhe/tabsConfig";
import { ClienteStatusDialogs } from "./detalhe/ClienteStatusDialogs";
import { PlanExpiryBanner } from "./detalhe/PlanExpiryBanner";

interface Props {
  clienteId: string;
  onBack: () => void;
}

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
  const [showInativarDialog, setShowInativarDialog] = useState(false);
  const [showReativarDialog, setShowReativarDialog] = useState(false);

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
    const metaKeys = ['billing_plan', 'plan_start_date', 'plan_end_date'];
    const metaChanges: Record<string, any> = {};
    for (const k of metaKeys) {
      if (k in changes) { metaChanges[k] = (changes as any)[k]; delete (changes as any)[k]; }
    }
    if (Object.keys(metaChanges).length > 0 || changes.metadata) {
      changes.metadata = { ...(cliente?.metadata || {}), ...(changes.metadata as any || {}), ...metaChanges } as any;
    }
    for (const [key, val] of Object.entries(changes)) {
      if (typeof val === "string" && val === "" && key !== "name") {
        (changes as any)[key] = null;
      }
    }
    const ok = await updateCliente(changes);
    if (ok) setFormData({});
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

  const daysToExpiry = (() => {
    if (!cliente.plan_end_date) return null;
    const end = new Date(cliente.plan_end_date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  })();
  const showExpiryBanner = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 7;

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex-1 space-y-4 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" />Voltar
        </Button>

        {showExpiryBanner && (
          <PlanExpiryBanner clienteId={clienteId} planEndDate={cliente.plan_end_date!} daysToExpiry={daysToExpiry!} />
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{cliente.name}</h1>
          {cliente.trade_name && <span className="text-sm text-muted-foreground">({cliente.trade_name})</span>}
          <Badge className={saude.className}>{saude.label} ({cliente.health_score || 0})</Badge>
          <Badge variant="outline" className="text-[10px]">{cliente.status?.toUpperCase()}</Badge>

          <div className="flex items-center gap-2 ml-auto">
            {(cliente.status === "inativo" || cliente.status === "cancelado") && (
              <Button variant="outline" size="sm" className="gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10" onClick={() => setShowReativarDialog(true)}>
                <RefreshCw className="h-3.5 w-3.5" />
                Reativar
              </Button>
            )}
            {cliente.status !== "inativo" && cliente.status !== "cancelado" && (
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setShowInativarDialog(true)}>
                <Ban className="h-3.5 w-3.5" />
                Inativar
              </Button>
            )}
          </div>
        </div>

        <ClienteStatusDialogs
          cliente={cliente}
          updateCliente={updateCliente}
          showInativar={showInativarDialog}
          setShowInativar={setShowInativarDialog}
          showReativar={showReativarDialog}
          setShowReativar={setShowReativarDialog}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex items-center justify-start gap-1 sm:gap-3 h-auto bg-transparent p-0 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const palette = TAB_COLORS[tab.value] || TAB_COLORS.dados;
              const isActive = activeTab === tab.value;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "group flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[72px] transition-all duration-300 hover:scale-105",
                    "data-[state=active]:shadow-sm",
                    isActive ? palette.color : palette.inactiveColor
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300",
                      isActive
                        ? cn(palette.bg, palette.border, palette.color)
                        : cn("bg-muted/50 border-border/40", palette.inactiveColor, "group-hover:border-border", `group-hover:${palette.color}`)
                    )}
                    style={isActive ? { boxShadow: palette.glow } : undefined}
                  >
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className={cn(
                    "text-[11px] font-medium transition-colors duration-300",
                    isActive ? palette.color : cn(palette.inactiveColor, `group-hover:${palette.color}`)
                  )}>
                    {tab.label}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

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
              <TabContabilidade cliente={cliente} formData={formData} onChange={handleChange} clienteId={clienteId} orgId={cliente?.org_id || ""} />
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
