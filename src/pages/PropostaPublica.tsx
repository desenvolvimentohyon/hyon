import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { generateProposalPDF, PdfCompanyData } from "@/lib/pdfGenerator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  XCircle,
  FileText,
  MessageCircle,
  Download,
  Clock,
  Shield,
  Headphones,
  Monitor,
  Zap,
  GraduationCap,
  Package,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  PartyPopper,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProposalData {
  id: string;
  proposal_number: string;
  client_name_snapshot: string | null;
  system_name: string | null;
  plan_name: string | null;
  monthly_value: number;
  implementation_value: number;
  implementation_flow: string | null;
  implementation_installments: number | null;
  valid_days: number;
  valid_until: string | null;
  acceptance_status: string;
  view_status: string;
  additional_info: string | null;
  first_viewed_at: string | null;
  views_count: number;
  accepted_at: string | null;
  accepted_by_name: string | null;
  created_at: string;
  sent_at: string | null;
}

interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unit_value: number;
}

interface CompanyData {
  trade_name: string | null;
  legal_name: string | null;
  logo_path: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  footer_text: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  cnpj: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_uf: string | null;
  address_cep: string | null;
  institutional_text: string | null;
}

type PageState = "loading" | "loaded" | "not_found" | "expired" | "error" | "accepted_success";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  nao_enviado: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  enviado: { label: "Enviada", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  visualizado: { label: "Visualizada", className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300" },
};

const ACCEPTANCE_BADGES: Record<string, { label: string; className: string }> = {
  pendente: { label: "Em análise", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  aceitou: { label: "Aceita", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  recusou: { label: "Recusada", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function PropostaPublica() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>("loading");
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [acceptName, setAcceptName] = useState("");
  const [acceptChecked, setAcceptChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const fnUrl = `${supabaseUrl}/functions/v1/public-proposal`;

  const fetchProposal = useCallback(async () => {
    if (!token) { setState("not_found"); return; }
    setState("loading");
    try {
      const res = await fetch(`${fnUrl}?token=${encodeURIComponent(token)}&action=view`);
      if (res.status === 404) { setState("not_found"); return; }
      if (!res.ok) { setState("error"); return; }
      const data = await res.json();
      setProposal(data.proposal);
      setItems(data.items || []);
      setCompany(data.company);

      // Check expiration
      const d = daysUntil(data.proposal.valid_until);
      if (d !== null && d < 0 && data.proposal.acceptance_status === "pendente") {
        setState("expired");
      } else {
        setState("loaded");
      }
    } catch {
      setState("error");
    }
  }, [token, fnUrl]);

  useEffect(() => { fetchProposal(); }, [fetchProposal]);

  const trackEvent = async (field: string) => {
    try {
      await fetch(`${fnUrl}?token=${encodeURIComponent(token!)}&action=track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      });
    } catch { /* silent */ }
  };

  const handleAccept = async () => {
    if (!acceptChecked) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${fnUrl}?token=${encodeURIComponent(token!)}&action=accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: acceptName || null }),
      });
      if (res.ok) {
        setAcceptDialogOpen(false);
        setState("accepted_success");
      }
    } catch { /* silent */ }
    setSubmitting(false);
  };

  const whatsappUrl = company?.whatsapp
    ? `https://wa.me/${company.whatsapp.replace(/\D/g, "")}`
    : company?.phone
    ? `https://wa.me/${company.phone.replace(/\D/g, "")}`
    : null;

  const handleWhatsApp = () => {
    trackEvent("whatsapp_clicked_at");
    if (whatsappUrl) window.open(whatsappUrl, "_blank");
  };

  const handleDownloadPdf = () => {
    trackEvent("pdf_downloaded_at");
    if (!proposal) return;
    const logoUrl = company?.logo_path
      ? supabase.storage.from("company-logos").getPublicUrl(company.logo_path).data.publicUrl
      : null;
    const companyPdf: PdfCompanyData = {
      tradeName: company?.trade_name || null,
      legalName: company?.legal_name || null,
      cnpj: company?.cnpj || null,
      phone: company?.phone || null,
      email: company?.email || null,
      website: company?.website || null,
      whatsapp: company?.whatsapp || null,
      logoUrl,
      primaryColor: company?.primary_color || "#3b82f6",
      secondaryColor: company?.secondary_color || "#10b981",
      footerText: company?.footer_text || null,
      institutionalText: company?.institutional_text || null,
      addressStreet: company?.address_street || null,
      addressNumber: company?.address_number || null,
      addressNeighborhood: company?.address_neighborhood || null,
      addressCity: company?.address_city || null,
      addressUf: company?.address_uf || null,
      addressCep: company?.address_cep || null,
    };
    generateProposalPDF(
      {
        proposalNumber: proposal.proposal_number,
        clientName: proposal.client_name_snapshot || "",
        systemName: proposal.system_name || "",
        planName: proposal.plan_name || "",
        monthlyValue: proposal.monthly_value,
        implementationValue: proposal.implementation_value,
        implementationFlow: proposal.implementation_flow || "a_vista",
        implementationInstallments: proposal.implementation_installments,
        sentAt: proposal.sent_at,
        validUntil: proposal.valid_until,
        additionalInfo: proposal.additional_info,
        acceptedAt: proposal.accepted_at,
        acceptedByName: proposal.accepted_by_name,
        acceptanceStatus: proposal.acceptance_status,
        items: items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitValue: i.unit_value,
        })),
        createdAt: proposal.created_at || new Date().toISOString(),
        validityDays: proposal.valid_days || null,
      },
      companyPdf
    );
  };

  const primaryColor = company?.primary_color || "#3b82f6";
  const companyName = company?.trade_name || company?.legal_name || "Empresa";

  // ─── Loading ───
  if (state === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <Skeleton className="h-16 w-48 mx-auto rounded-xl" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Not Found ───
  if (state === "not_found") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4 animate-in fade-in duration-300">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Proposta não encontrada</h1>
          <p className="text-muted-foreground">
            O link pode estar incorreto ou a proposta foi removida. Entre em contato com a empresa para solicitar um novo link.
          </p>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (state === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4 animate-in fade-in duration-300">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Erro ao carregar</h1>
          <p className="text-muted-foreground">Não foi possível carregar a proposta. Tente novamente.</p>
          <Button onClick={fetchProposal} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // ─── Expired ───
  if (state === "expired" && proposal) {
    const msg = `Olá! A proposta ${proposal.proposal_number} expirou. Gostaria de solicitar uma nova proposta.`;
    const expWhatsapp = whatsappUrl ? `${whatsappUrl}?text=${encodeURIComponent(msg)}` : null;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4 animate-in fade-in duration-300">
          <div className="mx-auto w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Clock className="h-10 w-10 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold">Proposta expirada</h1>
          <p className="text-muted-foreground">
            A proposta <strong>{proposal.proposal_number}</strong> expirou em{" "}
            {new Date(proposal.valid_until!).toLocaleDateString("pt-BR")}.
          </p>
          {expWhatsapp && (
            <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <a href={expWhatsapp} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Solicitar nova proposta
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─── Accepted Success ───
  if (state === "accepted_success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-950 dark:to-cyan-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <PartyPopper className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
            Proposta aceita com sucesso!
          </h1>
          <p className="text-emerald-700 dark:text-emerald-300">
            Obrigado pela confiança. Nossa equipe entrará em contato para agendar a implantação.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {whatsappUrl && (
              <Button
                asChild
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => trackEvent("whatsapp_clicked_at")}
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                </a>
              </Button>
            )}
            <Button variant="outline" className="gap-2" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4" /> Baixar PDF
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Loaded State ───
  if (!proposal) return null;

  const daysLeft = daysUntil(proposal.valid_until);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
  const alreadyResponded = proposal.acceptance_status !== "pendente";
  const acceptBadge = ACCEPTANCE_BADGES[proposal.acceptance_status] || ACCEPTANCE_BADGES.pendente;
  const viewBadge = STATUS_BADGES[proposal.view_status] || STATUS_BADGES.enviado;

  const installmentValue =
    proposal.implementation_flow === "parcelado" && proposal.implementation_installments
      ? proposal.implementation_value / proposal.implementation_installments
      : null;

  const benefits = [
    { icon: Package, title: "Implantação assistida", desc: "Configuração completa do sistema pela nossa equipe" },
    { icon: GraduationCap, title: "Treinamento da equipe", desc: "Capacitação para uso eficiente do sistema" },
    { icon: Headphones, title: "Suporte dedicado", desc: "Atendimento rápido por WhatsApp e telefone" },
    { icon: Monitor, title: "Configuração de equipamentos", desc: "Integração com balança, impressora e periféricos" },
    { icon: Zap, title: "Atualizações contínuas", desc: "Novas funcionalidades e melhorias sem custo extra" },
    { icon: Shield, title: "Segurança dos dados", desc: "Backup automático e proteção avançada" },
  ];

  const steps = [
    { num: 1, title: "Aceite da proposta", desc: "Confirme o aceite clicando no botão abaixo" },
    { num: 2, title: "Agendamento", desc: "Nossa equipe entrará em contato para agendar a implantação" },
    { num: 3, title: "Início do uso", desc: "Treinamento e liberação do sistema para operação" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {company?.logo_path ? (
              <img
                src={`${supabaseUrl}/storage/v1/object/public/company-logos/${company.logo_path}`}
                alt={companyName}
                className="w-9 h-9 rounded-xl object-contain shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {companyName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{companyName}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                Proposta {proposal.proposal_number}
              </p>
            </div>
          </div>
          <Badge className={`${acceptBadge.className} text-xs shrink-0`}>
            {acceptBadge.label}
          </Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ─── Hero ─── */}
        <section className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Proposta para {proposal.client_name_snapshot || "Cliente"}
          </h1>
          {proposal.system_name && (
            <p className="text-muted-foreground">
              {proposal.system_name}
              {proposal.plan_name ? ` — Plano ${proposal.plan_name}` : ""}
            </p>
          )}
        </section>

        {/* ─── Pricing Card ─── */}
        <section className="rounded-2xl border bg-card shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="p-6 text-center space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Mensalidade
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold" style={{ color: primaryColor }}>
                {formatCurrency(proposal.monthly_value)}
              </p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
            <div className="p-6 text-center space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Implantação
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold">
                {formatCurrency(proposal.implementation_value)}
              </p>
              <p className="text-xs text-muted-foreground">
                {proposal.implementation_flow === "parcelado" && installmentValue
                  ? `${proposal.implementation_installments}x de ${formatCurrency(installmentValue)}`
                  : "À vista"}
              </p>
            </div>
          </div>

          {/* Validity bar */}
          {proposal.valid_until && (
            <div
              className={`px-6 py-3 text-center text-sm flex items-center justify-center gap-2 ${
                isExpiringSoon
                  ? "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              <Clock className="h-4 w-4" />
              Válida até {new Date(proposal.valid_until).toLocaleDateString("pt-BR")}
              {daysLeft !== null && daysLeft >= 0 && (
                <span className="font-semibold">
                  ({daysLeft === 0 ? "expira hoje" : `${daysLeft} dia${daysLeft > 1 ? "s" : ""} restante${daysLeft > 1 ? "s" : ""}`})
                </span>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="px-6 py-5 space-y-3">
            {!alreadyResponded ? (
              <>
                <Button
                  className="w-full h-12 text-base font-semibold gap-2 rounded-xl shadow-md"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => setAcceptDialogOpen(true)}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Aceitar Proposta
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  {whatsappUrl && (
                    <Button
                      variant="outline"
                      className="gap-2 rounded-xl h-10"
                      onClick={handleWhatsApp}
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="gap-2 rounded-xl h-10"
                    onClick={handleDownloadPdf}
                  >
                    <Download className="h-4 w-4" /> PDF
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-2">
                <Badge className={`${acceptBadge.className} text-sm px-5 py-1.5`}>
                  {proposal.acceptance_status === "aceitou" ? "✓ Proposta Aceita" : "✗ Proposta Recusada"}
                </Badge>
              </div>
            )}
          </div>
        </section>

        {/* ─── Items ─── */}
        {items.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Itens da proposta</h2>
            <div className="rounded-xl border bg-card overflow-hidden">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${
                    i < items.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{item.description}</span>
                  </div>
                  <span className="shrink-0 font-medium text-muted-foreground">
                    {item.quantity > 1 ? `${item.quantity}x ` : ""}
                    {formatCurrency(item.unit_value * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Benefits ─── */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">O que está incluso</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-3 p-4 rounded-xl border bg-card hover:shadow-md transition-shadow duration-200"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Details Accordion ─── */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Detalhes</h2>
          <Accordion type="multiple" className="rounded-xl border bg-card overflow-hidden">
            {proposal.additional_info && (
              <AccordionItem value="info" className="border-b last:border-b-0">
                <AccordionTrigger className="px-4 text-sm">
                  Informações adicionais
                </AccordionTrigger>
                <AccordionContent className="px-4 text-sm text-muted-foreground whitespace-pre-wrap">
                  {proposal.additional_info}
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="payment" className="border-b last:border-b-0">
              <AccordionTrigger className="px-4 text-sm">
                Condições de pagamento
              </AccordionTrigger>
              <AccordionContent className="px-4 text-sm text-muted-foreground">
                <ul className="space-y-1">
                  <li>• Mensalidade: {formatCurrency(proposal.monthly_value)}/mês</li>
                  <li>
                    • Implantação: {formatCurrency(proposal.implementation_value)}{" "}
                    {proposal.implementation_flow === "parcelado" && installmentValue
                      ? `(${proposal.implementation_installments}x de ${formatCurrency(installmentValue)})`
                      : "(à vista)"}
                  </li>
                  <li>• Vencimento conforme negociação</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="support" className="border-b last:border-b-0">
              <AccordionTrigger className="px-4 text-sm">
                Suporte técnico
              </AccordionTrigger>
              <AccordionContent className="px-4 text-sm text-muted-foreground">
                Suporte técnico ilimitado via WhatsApp, telefone e acesso remoto durante o horário comercial.
                Atendimento prioritário nos primeiros 30 dias após implantação.
              </AccordionContent>
            </AccordionItem>
            {company && (
              <AccordionItem value="company" className="border-b-0">
                <AccordionTrigger className="px-4 text-sm">
                  Sobre a empresa
                </AccordionTrigger>
                <AccordionContent className="px-4 text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-3">
                    {company.logo_path ? (
                      <img
                        src={`${supabaseUrl}/storage/v1/object/public/company-logos/${company.logo_path}`}
                        alt={companyName}
                        className="w-12 h-12 rounded-lg object-contain"
                      />
                    ) : null}
                    <div>
                      <p className="font-semibold text-foreground">{companyName}</p>
                      {company.legal_name && company.legal_name !== companyName && (
                        <p className="text-xs">{company.legal_name}</p>
                      )}
                    </div>
                  </div>
                  {company.cnpj && <p>CNPJ: {company.cnpj}</p>}
                  {(company.address_street || company.address_city) && (
                    <p>
                      {[company.address_street, company.address_number, company.address_neighborhood, company.address_city, company.address_uf].filter(Boolean).join(", ")}
                      {company.address_cep ? ` — CEP ${company.address_cep}` : ""}
                    </p>
                  )}
                  {company.phone && <p>Telefone: {company.phone}</p>}
                  {company.email && <p>Email: {company.email}</p>}
                  {company.website && (
                    <p>
                      Site:{" "}
                      <a
                        href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {company.website}
                      </a>
                    </p>
                  )}
                  {company.institutional_text && (
                    <p className="pt-1 whitespace-pre-wrap">{company.institutional_text}</p>
                  )}
                  {company.footer_text && <p className="pt-1 italic">{company.footer_text}</p>}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </section>

        {/* ─── Timeline ─── */}
        {!alreadyResponded && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Próximos passos</h2>
            <div className="rounded-xl border bg-card p-5">
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={step.num} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: i === 0 ? primaryColor : "#94a3b8" }}
                      >
                        {step.num}
                      </div>
                      {i < steps.length - 1 && (
                        <div className="w-px h-full bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Social Proof Pills ─── */}
        <section className="flex flex-wrap justify-center gap-2 py-2">
          {["⚡ Atendimento rápido", "🚀 Implantação assistida", "🛡️ Suporte contínuo"].map((t) => (
            <span
              key={t}
              className="px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium"
            >
              {t}
            </span>
          ))}
        </section>

        {/* ─── Footer ─── */}
        <footer className="text-center text-xs text-muted-foreground py-6 border-t space-y-1">
          <p>{company?.footer_text || `© ${new Date().getFullYear()} ${companyName}`}</p>
          {company?.website && (
            <a
              href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {company.website}
            </a>
          )}
        </footer>
      </main>

      {/* ─── Accept Dialog ─── */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar aceite</DialogTitle>
            <DialogDescription>
              Você está aceitando a proposta {proposal?.proposal_number} no valor de{" "}
              {formatCurrency(proposal?.monthly_value || 0)}/mês.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium">Seu nome (opcional)</label>
              <Input
                placeholder="Nome de quem está aceitando"
                value={acceptName}
                onChange={(e) => setAcceptName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="accept-terms"
                checked={acceptChecked}
                onCheckedChange={(v) => setAcceptChecked(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="accept-terms" className="text-sm text-muted-foreground cursor-pointer">
                Li e concordo com os termos da proposta apresentada
              </label>
            </div>
            <Button
              className="w-full gap-2 rounded-xl"
              style={{ backgroundColor: primaryColor }}
              disabled={!acceptChecked || submitting}
              onClick={handleAccept}
            >
              {submitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirmar aceite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
