import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, FileText, Calculator, DollarSign, TrendingDown, History, Receipt, Settings2, Boxes, Save, Wallet, AlertTriangle, RefreshCw, LucideIcon, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
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

import TabCobrancas from "./tabs/TabCobrancas";
import TabControle from "./tabs/TabControle";
import TabModulos from "./tabs/TabModulos";
import TabPagamentos from "./tabs/TabPagamentos";

interface Props {
  clienteId: string;
  onBack: () => void;
}

const TAB_COLORS: Record<string, { color: string; inactiveColor: string; bg: string; border: string; glow: string }> = {
  dados:          { color: "text-blue-500",   inactiveColor: "text-blue-500/50",   bg: "bg-blue-500/15",   border: "border-blue-500/30",   glow: "0 0 12px rgba(59,130,246,0.35)" },
  contabilidade:  { color: "text-emerald-500",inactiveColor: "text-emerald-500/50",bg: "bg-emerald-500/15",border: "border-emerald-500/30",glow: "0 0 12px rgba(16,185,129,0.35)" },
  mensalidade:    { color: "text-green-500",  inactiveColor: "text-green-500/50",  bg: "bg-green-500/15",  border: "border-green-500/30",  glow: "0 0 12px rgba(34,197,94,0.35)" },
  custo:          { color: "text-red-500",    inactiveColor: "text-red-500/50",    bg: "bg-red-500/15",    border: "border-red-500/30",    glow: "0 0 12px rgba(239,68,68,0.35)" },
  evolucao:       { color: "text-violet-500", inactiveColor: "text-violet-500/50", bg: "bg-violet-500/15", border: "border-violet-500/30", glow: "0 0 12px rgba(139,92,246,0.35)" },
  
  cobrancas:      { color: "text-orange-500", inactiveColor: "text-orange-500/50", bg: "bg-orange-500/15", border: "border-orange-500/30", glow: "0 0 12px rgba(249,115,22,0.35)" },
  controle:       { color: "text-slate-500",  inactiveColor: "text-slate-500/50",  bg: "bg-slate-500/15",  border: "border-slate-500/30",  glow: "0 0 12px rgba(100,116,139,0.35)" },
  modulos:        { color: "text-indigo-500", inactiveColor: "text-indigo-500/50", bg: "bg-indigo-500/15", border: "border-indigo-500/30", glow: "0 0 12px rgba(99,102,241,0.35)" },
  pagamentos:     { color: "text-teal-500",   inactiveColor: "text-teal-500/50",   bg: "bg-teal-500/15",   border: "border-teal-500/30",   glow: "0 0 12px rgba(20,184,166,0.35)" },
};

const TABS = [
  { value: "dados", label: "Dados", icon: FileText },
  { value: "contabilidade", label: "Contabilidade", icon: Calculator },
  { value: "mensalidade", label: "Mensalidade", icon: DollarSign },
  { value: "custo", label: "Custo", icon: TrendingDown },
  { value: "evolucao", label: "Evolução", icon: History },
  
  { value: "cobrancas", label: "Cobranças", icon: Receipt },
  { value: "controle", label: "Controle", icon: Settings2 },
  { value: "modulos", label: "Módulos", icon: Boxes },
  { value: "pagamentos", label: "Pagamentos", icon: Wallet },
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
  const [showInativarDialog, setShowInativarDialog] = useState(false);
  const [motivoInativacao, setMotivoInativacao] = useState("");
  const [inativando, setInativando] = useState(false);
  const [showReativarDialog, setShowReativarDialog] = useState(false);
  const [reativando, setReativando] = useState(false);

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
    // Move virtual fields into metadata JSONB
    const metaKeys = ['billing_plan', 'plan_start_date', 'plan_end_date'];
    const metaChanges: Record<string, any> = {};
    for (const k of metaKeys) {
      if (k in changes) { metaChanges[k] = (changes as any)[k]; delete (changes as any)[k]; }
    }
    if (Object.keys(metaChanges).length > 0 || changes.metadata) {
      changes.metadata = { ...(cliente?.metadata || {}), ...(changes.metadata as any || {}), ...metaChanges } as any;
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

          {cliente.status !== "inativo" && cliente.status !== "cancelado" && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 ml-auto"
              onClick={() => setShowInativarDialog(true)}
            >
              <Ban className="h-3.5 w-3.5" />
              Inativar
            </Button>
          )}
        </div>

        {/* Dialog de Inativação */}
        <AlertDialog open={showInativarDialog} onOpenChange={setShowInativarDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Inativar cliente</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação marcará o cliente como <strong>inativo</strong> e desativará a recorrência. Informe o motivo da inativação.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              placeholder="Motivo da inativação (obrigatório)"
              value={motivoInativacao}
              onChange={(e) => setMotivoInativacao(e.target.value)}
              className="min-h-[80px]"
            />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={inativando} onClick={() => { setMotivoInativacao(""); }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={!motivoInativacao.trim() || inativando}
                onClick={async (e) => {
                  e.preventDefault();
                  setInativando(true);
                  const ok = await updateCliente({
                    status: "inativo",
                    cancellation_reason: motivoInativacao.trim(),
                    cancelled_at: new Date().toISOString(),
                    recurrence_active: false,
                  } as any);
                  setInativando(false);
                  if (ok) {
                    setShowInativarDialog(false);
                    setMotivoInativacao("");
                    toast({ title: "Cliente inativado com sucesso" });
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {inativando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Confirmar Inativação
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
