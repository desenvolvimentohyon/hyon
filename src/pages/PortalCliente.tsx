import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, CheckCircle, Clock, Copy, ExternalLink, FileText, Shield, User,
  LayoutDashboard, CreditCard, Package, Headphones, Lightbulb, Users, UserCircle,
  Plus, Send, MessageSquare, ChevronRight, CalendarDays, DollarSign, Monitor, X,
} from "lucide-react";
import { toast } from "sonner";
import logoHyon from "@/assets/logo-hyon.png";
import { useIsMobile } from "@/hooks/use-mobile";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

interface TicketMessage {
  id: string;
  sender_type: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface PortalTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
}

interface PortalData {
  client: {
    name: string;
    document: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    system_name: string | null;
    status: string;
    monthly_value_final: number;
    contract_signed_at: string | null;
    contract_start_at: string | null;
    adjustment_base_date: string | null;
    adjustment_type: string | null;
    adjustment_percent: number;
    cert_expires_at: string | null;
    cert_issuer: string | null;
    cert_serial: string | null;
    onboarding_completed_steps: string[];
  };
  plan: { name: string; discount_percent: number } | null;
  titles: {
    id: string;
    description: string;
    value_original: number;
    value_final: number;
    due_at: string | null;
    status: string;
    competency: string | null;
    asaas_bank_slip_url: string | null;
    asaas_pix_payload: string | null;
    asaas_pix_qr_code: string | null;
    asaas_invoice_url: string | null;
  }[];
  org_name: string;
  modules: { id: string; name: string; description: string | null }[];
  tickets: PortalTicket[];
  suggestions: { id: string; title: string; description: string; status: string; created_at: string }[];
  referrals: { id: string; company_name: string; contact_name: string; phone: string; city: string; notes: string; status: string; created_at: string }[];
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  aberto: { label: "Pendente", variant: "outline" },
  pago: { label: "Pago", variant: "default" },
  vencido: { label: "Vencido", variant: "destructive" },
  parcial: { label: "Parcial", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "secondary" },
};

const TICKET_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  aberto: { label: "Aberto", variant: "outline" },
  em_analise: { label: "Em Análise", variant: "secondary" },
  respondido: { label: "Respondido", variant: "default" },
  finalizado: { label: "Finalizado", variant: "secondary" },
};

const ONBOARDING_STEPS = [
  { key: "conheca", label: "Conheça o sistema", desc: "Explore as funcionalidades disponíveis" },
  { key: "dados", label: "Acesse seus dados", desc: "Veja seu contrato e financeiro" },
  { key: "chamado", label: "Abra um chamado", desc: "Envie sua primeira solicitação" },
];

type Section = "dashboard" | "contrato" | "financeiro" | "modulos" | "suporte" | "sugestoes" | "indicacoes" | "perfil";

const NAV_ITEMS: { key: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "contrato", label: "Contrato", icon: FileText },
  { key: "financeiro", label: "Financeiro", icon: CreditCard },
  { key: "modulos", label: "Módulos", icon: Package },
  { key: "suporte", label: "Suporte", icon: Headphones },
  { key: "sugestoes", label: "Sugestões", icon: Lightbulb },
  { key: "indicacoes", label: "Indicações", icon: Users },
  { key: "perfil", label: "Perfil", icon: UserCircle },
];

export default function PortalCliente() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingSteps, setOnboardingSteps] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const baseUrl = `https://${projectId}.supabase.co/functions/v1`;

  const fetchData = useCallback(() => {
    if (!token) return;
    fetch(`${baseUrl}/portal-data?token=${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Token inválido");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setOnboardingSteps(d.client.onboarding_completed_steps || []);
        if (!d.client.onboarding_completed_steps || d.client.onboarding_completed_steps.length === 0) {
          setShowOnboarding(true);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, baseUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const portalAction = async (body: Record<string, unknown>) => {
    const res = await fetch(`${baseUrl}/portal-action?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erro" }));
      throw new Error(err.error || "Erro ao processar ação");
    }
    return res.json();
  };

  const completeStep = async (step: string) => {
    if (onboardingSteps.includes(step)) return;
    try {
      await portalAction({ action: "complete_onboarding_step", step });
      setOnboardingSteps(prev => [...prev, step]);
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-lg p-8">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-6 w-64 mx-auto" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Link inválido</h2>
            <p className="text-muted-foreground">Este link de acesso ao portal não é válido ou expirou.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { client, plan, titles, org_name, modules, tickets, suggestions, referrals } = data;

  const adjustmentTypeLabel: Record<string, string> = {
    percentual_fixo: "Percentual Fixo",
    ipca: "IPCA",
    igpm: "IGPM",
  };

  const handleCopyPix = (payload: string) => {
    navigator.clipboard.writeText(payload);
    toast.success("Código PIX copiado!");
  };

  // Days as client
  const diasComoCliente = client.contract_signed_at
    ? Math.ceil((Date.now() - new Date(client.contract_signed_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Next due date
  const proxVencimento = titles.find(t => t.status === "aberto" && t.due_at);

  // Certificate days remaining
  const certDaysRemaining = client.cert_expires_at
    ? Math.ceil((new Date(client.cert_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection client={client} plan={plan} diasComoCliente={diasComoCliente} proxVencimento={proxVencimento} />;
      case "contrato":
        return <ContratoSection client={client} plan={plan} adjustmentTypeLabel={adjustmentTypeLabel} />;
      case "financeiro":
        return <FinanceiroSection titles={titles} handleCopyPix={handleCopyPix} />;
      case "modulos":
        return <ModulosSection modules={modules} systemName={client.system_name} />;
      case "suporte":
        return <SuporteSection tickets={tickets} portalAction={portalAction} onRefresh={fetchData} onCompleteStep={() => completeStep("chamado")} />;
      case "sugestoes":
        return <SugestoesSection suggestions={suggestions} portalAction={portalAction} onRefresh={fetchData} />;
      case "indicacoes":
        return <IndicacoesSection referrals={referrals} portalAction={portalAction} onRefresh={fetchData} />;
      case "perfil":
        return <PerfilSection client={client} portalAction={portalAction} onRefresh={fetchData} certDaysRemaining={certDaysRemaining} />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoHyon} alt="Logo" className="h-8 w-auto" />
            <span className="text-sm font-semibold hidden md:inline">{org_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium">{client.name}</p>
              <p className="text-xs text-muted-foreground">Portal do Cliente</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-6xl mx-auto w-full">
        {/* Sidebar (desktop) */}
        {!isMobile && (
          <nav className="w-56 border-r bg-card p-3 space-y-1 shrink-0">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => { setActiveSection(item.key); if (item.key === "dashboard") completeStep("dados"); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === item.key
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>
        )}

        {/* Main */}
        <main className="flex-1 p-4 md:p-6 space-y-4 min-w-0 pb-20 md:pb-6">
          {renderContent()}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      {isMobile && (
        <nav className="fixed bottom-0 inset-x-0 bg-card border-t z-30 flex justify-around py-1.5 px-1">
          {NAV_ITEMS.slice(0, 5).map(item => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors ${
                activeSection === item.key ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setActiveSection(activeSection === "perfil" ? "dashboard" : "perfil")}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors ${
              ["sugestoes", "indicacoes", "perfil"].includes(activeSection) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <UserCircle className="h-4 w-4" />
            Mais
          </button>
        </nav>
      )}

      {/* Onboarding overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="relative">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setShowOnboarding(false)}>
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">Bem-vindo ao Portal! 🎉</CardTitle>
              <CardDescription>Complete os passos abaixo para começar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={(onboardingSteps.length / ONBOARDING_STEPS.length) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">{onboardingSteps.length} de {ONBOARDING_STEPS.length} concluídos</p>
              <div className="space-y-2">
                {ONBOARDING_STEPS.map(step => {
                  const done = onboardingSteps.includes(step.key);
                  return (
                    <div
                      key={step.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${done ? "bg-primary/5 border-primary/20" : "hover:bg-muted"}`}
                      onClick={() => {
                        if (step.key === "conheca") { completeStep("conheca"); setActiveSection("modulos"); setShowOnboarding(false); }
                        if (step.key === "dados") { completeStep("dados"); setActiveSection("contrato"); setShowOnboarding(false); }
                        if (step.key === "chamado") { setActiveSection("suporte"); setShowOnboarding(false); }
                      }}
                    >
                      {done ? <CheckCircle className="h-5 w-5 text-primary shrink-0" /> : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
              {onboardingSteps.length === ONBOARDING_STEPS.length && (
                <Button className="w-full" onClick={() => setShowOnboarding(false)}>Tudo pronto! Acessar o portal</Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <footer className="border-t py-3 mt-auto">
        <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {org_name} • Portal do Cliente</p>
      </footer>
    </div>
  );
}

// ─── Dashboard Section ───
function DashboardSection({ client, plan, diasComoCliente, proxVencimento }: {
  client: PortalData["client"]; plan: PortalData["plan"];
  diasComoCliente: number | null; proxVencimento: PortalData["titles"][0] | undefined;
}) {
  const kpis = [
    { label: "Sistema", value: client.system_name || "—", icon: Monitor },
    { label: "Plano", value: plan?.name || "—", icon: Package },
    { label: "Mensalidade", value: fmt(client.monthly_value_final), icon: DollarSign },
    { label: "Status", value: client.status === "ativo" ? "Ativo" : client.status, icon: CheckCircle },
    { label: "Próximo Vencimento", value: proxVencimento ? fmtDate(proxVencimento.due_at) : "—", icon: CalendarDays },
    { label: "Tempo como cliente", value: diasComoCliente ? `${diasComoCliente} dias` : "—", icon: Clock },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Visão Geral</h2>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {kpis.map(k => (
          <Card key={k.label} className="transition-all hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Contrato Section ───
function ContratoSection({ client, plan, adjustmentTypeLabel }: {
  client: PortalData["client"]; plan: PortalData["plan"]; adjustmentTypeLabel: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Dados do Contrato</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div><span className="text-sm text-muted-foreground">Data de Assinatura</span><p className="font-medium">{fmtDate(client.contract_signed_at)}</p></div>
            <div><span className="text-sm text-muted-foreground">Início do Contrato</span><p className="font-medium">{fmtDate(client.contract_start_at)}</p></div>
            <div><span className="text-sm text-muted-foreground">Sistema Contratado</span><p className="font-medium">{client.system_name || "—"}</p></div>
            <div><span className="text-sm text-muted-foreground">Plano</span><p className="font-medium">{plan?.name || "—"}{plan?.discount_percent ? ` (${plan.discount_percent}% desc.)` : ""}</p></div>
          </div>
          <div className="space-y-3">
            <div><span className="text-sm text-muted-foreground">Valor Mensal</span><p className="font-medium text-primary text-lg">{fmt(client.monthly_value_final)}</p></div>
            <div><span className="text-sm text-muted-foreground">Data Base de Reajuste</span><p className="font-medium">{fmtDate(client.adjustment_base_date)}</p></div>
            <div><span className="text-sm text-muted-foreground">Tipo de Reajuste</span><p className="font-medium">{client.adjustment_type ? `${adjustmentTypeLabel[client.adjustment_type] || client.adjustment_type} (${client.adjustment_percent}%)` : "Não definido"}</p></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Financeiro Section ───
function FinanceiroSection({ titles, handleCopyPix }: {
  titles: PortalData["titles"]; handleCopyPix: (p: string) => void;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" /> Mensalidades</CardTitle></CardHeader>
      <CardContent>
        {titles.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhuma mensalidade encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {titles.map((t) => {
                  const s = STATUS_MAP[t.status] || { label: t.status, variant: "outline" as const };
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{t.competency || "—"}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{t.description}</TableCell>
                      <TableCell className="text-sm">{fmtDate(t.due_at)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmt(t.value_final || t.value_original)}</TableCell>
                      <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {t.asaas_bank_slip_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={t.asaas_bank_slip_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> Boleto</a>
                            </Button>
                          )}
                          {t.asaas_pix_payload && (
                            <Button size="sm" variant="outline" onClick={() => handleCopyPix(t.asaas_pix_payload!)}><Copy className="h-3 w-3 mr-1" /> PIX</Button>
                          )}
                          {t.asaas_invoice_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={t.asaas_invoice_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> Fatura</a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Módulos Section ───
function ModulosSection({ modules, systemName }: { modules: PortalData["modules"]; systemName: string | null }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><Package className="h-5 w-5" /> Sistema Contratado</h2>
        {systemName && <p className="text-sm text-muted-foreground">{systemName}</p>}
      </div>
      {modules.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhum módulo cadastrado.</CardContent></Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {modules.map(m => (
            <Card key={m.id} className="transition-all hover:-translate-y-0.5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{m.name}</p>
                    {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Suporte Section ───
function SuporteSection({ tickets, portalAction, onRefresh, onCompleteStep }: {
  tickets: PortalTicket[];
  portalAction: (body: Record<string, unknown>) => Promise<unknown>;
  onRefresh: () => void;
  onCompleteStep: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<PortalTicket | null>(null);
  const [replyMsg, setReplyMsg] = useState("");
  const [replying, setReplying] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Informe o título"); return; }
    setSubmitting(true);
    try {
      await portalAction({ action: "create_ticket", title, description: desc });
      toast.success("Chamado aberto com sucesso!");
      setTitle(""); setDesc(""); setShowForm(false);
      onCompleteStep();
      onRefresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao abrir chamado");
    } finally { setSubmitting(false); }
  };

  const handleReply = async () => {
    if (!replyMsg.trim() || !selectedTicket) return;
    setReplying(true);
    try {
      await portalAction({ action: "add_ticket_message", ticket_id: selectedTicket.id, message: replyMsg });
      toast.success("Mensagem enviada!");
      setReplyMsg("");
      onRefresh();
    } catch { toast.error("Erro ao enviar mensagem"); }
    finally { setReplying(false); }
  };

  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>← Voltar</Button>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{selectedTicket.title}</CardTitle>
              <Badge variant={TICKET_STATUS[selectedTicket.status]?.variant || "outline"}>
                {TICKET_STATUS[selectedTicket.status]?.label || selectedTicket.status}
              </Badge>
            </div>
            <CardDescription>{fmtDate(selectedTicket.created_at)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedTicket.messages.map(m => (
                <div key={m.id} className={`p-3 rounded-lg text-sm ${m.sender_type === "client" ? "bg-primary/5 ml-4" : "bg-muted mr-4"}`}>
                  <p className="font-medium text-xs mb-1">{m.sender_name} <span className="text-muted-foreground">· {fmtDate(m.created_at)}</span></p>
                  <p className="whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
            </div>
            {selectedTicket.status !== "finalizado" && (
              <>
                <Separator />
                <div className="flex gap-2">
                  <Textarea value={replyMsg} onChange={e => setReplyMsg(e.target.value)} placeholder="Escreva sua mensagem..." className="min-h-[60px]" />
                  <Button onClick={handleReply} disabled={replying || !replyMsg.trim()} className="shrink-0"><Send className="h-4 w-4" /></Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2"><Headphones className="h-5 w-5" /> Suporte</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Novo Chamado</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Resumo do problema" maxLength={200} /></div>
            <div><Label>Descrição</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descreva o problema em detalhes" maxLength={2000} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleCreate} disabled={submitting}>{submitting ? "Enviando..." : "Abrir Chamado"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tickets.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhum chamado encontrado.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => (
            <Card key={t.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedTicket(t)}>
              <CardContent className="py-3 flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(t.created_at)} · {t.messages.length} mensagem(ns)</p>
                </div>
                <Badge variant={TICKET_STATUS[t.status]?.variant || "outline"} className="shrink-0">
                  {TICKET_STATUS[t.status]?.label || t.status}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sugestões Section ───
function SugestoesSection({ suggestions, portalAction, onRefresh }: {
  suggestions: PortalData["suggestions"];
  portalAction: (body: Record<string, unknown>) => Promise<unknown>;
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Informe o título"); return; }
    setSubmitting(true);
    try {
      await portalAction({ action: "create_suggestion", title, description: desc });
      toast.success("Sugestão enviada!");
      setTitle(""); setDesc(""); setShowForm(false);
      onRefresh();
    } catch { toast.error("Erro ao enviar sugestão"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2"><Lightbulb className="h-5 w-5" /> Sugestões</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Nova Sugestão</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da sugestão" maxLength={200} /></div>
            <div><Label>Descrição</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descreva sua sugestão" maxLength={2000} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleCreate} disabled={submitting}>{submitting ? "Enviando..." : "Enviar"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {suggestions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhuma sugestão enviada.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {suggestions.map(s => (
            <Card key={s.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{fmtDate(s.created_at)}</p>
                  </div>
                  <Badge variant="outline">{s.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Indicações Section ───
function IndicacoesSection({ referrals, portalAction, onRefresh }: {
  referrals: PortalData["referrals"];
  portalAction: (body: Record<string, unknown>) => Promise<unknown>;
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: "", contact_name: "", phone: "", city: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!form.company_name.trim()) { toast.error("Informe o nome da empresa"); return; }
    setSubmitting(true);
    try {
      await portalAction({ action: "create_referral", ...form });
      toast.success("Indicação enviada!");
      setForm({ company_name: "", contact_name: "", phone: "", city: "", notes: "" });
      setShowForm(false);
      onRefresh();
    } catch { toast.error("Erro ao enviar indicação"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5" /> Indique um Cliente</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Nova Indicação</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Nome da Empresa *</Label><Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} maxLength={200} /></div>
              <div><Label>Responsável</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} maxLength={200} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} maxLength={30} /></div>
              <div><Label>Cidade</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} maxLength={100} /></div>
            </div>
            <div><Label>Observação</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} maxLength={1000} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleCreate} disabled={submitting}>{submitting ? "Enviando..." : "Enviar Indicação"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {referrals.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhuma indicação realizada.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {referrals.map(r => (
            <Card key={r.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{r.company_name}</p>
                    <p className="text-xs text-muted-foreground">{[r.contact_name, r.city, r.phone].filter(Boolean).join(" · ")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(r.created_at)}</p>
                  </div>
                  <Badge variant={r.status === "pendente" ? "outline" : "default"}>{r.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Perfil Section ───
function PerfilSection({ client, portalAction, onRefresh, certDaysRemaining }: {
  client: PortalData["client"];
  portalAction: (body: Record<string, unknown>) => Promise<unknown>;
  onRefresh: () => void;
  certDaysRemaining: number | null;
}) {
  const [email, setEmail] = useState(client.email || "");
  const [phone, setPhone] = useState(client.phone || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await portalAction({ action: "update_profile", email, phone });
      toast.success("Dados atualizados!");
      onRefresh();
    } catch { toast.error("Erro ao atualizar"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><UserCircle className="h-5 w-5" /> Meu Perfil</h2>
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-muted-foreground">Empresa</Label><p className="font-medium">{client.name}</p></div>
            <div><Label className="text-muted-foreground">Documento</Label><p className="font-medium">{client.document || "—"}</p></div>
            <div><Label className="text-muted-foreground">Cidade</Label><p className="font-medium">{client.city || "—"}</p></div>
            <div><Label className="text-muted-foreground">Sistema</Label><p className="font-medium">{client.system_name || "—"}</p></div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar Alterações"}</Button>
        </CardContent>
      </Card>

      {/* Certificate info */}
      {client.cert_expires_at && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Certificado Digital</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><span className="text-sm text-muted-foreground">Emissor</span><p className="font-medium">{client.cert_issuer || "—"}</p></div>
              <div><span className="text-sm text-muted-foreground">Serial</span><p className="font-medium text-xs font-mono">{client.cert_serial || "—"}</p></div>
              <div><span className="text-sm text-muted-foreground">Validade</span><p className="font-medium">{fmtDate(client.cert_expires_at)}</p></div>
            </div>
            {certDaysRemaining !== null && (
              <div className={`rounded-lg p-3 mt-3 flex items-center gap-2 text-sm ${
                certDaysRemaining <= 0 ? "bg-destructive/10 text-destructive" :
                certDaysRemaining <= 15 ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" :
                "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              }`}>
                {certDaysRemaining <= 0 ? <><AlertTriangle className="h-4 w-4" /> Vencido há {Math.abs(certDaysRemaining)} dias</> :
                 <><CheckCircle className="h-4 w-4" /> {certDaysRemaining} dias restantes</>}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
