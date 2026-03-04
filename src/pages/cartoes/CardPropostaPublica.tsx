import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, FileText, MessageCircle, Clock, AlertTriangle, RefreshCw, PartyPopper, CreditCard } from "lucide-react";

type PageState = "loading" | "loaded" | "not_found" | "error" | "accepted_success" | "onboarding";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  enviada: "Enviada",
  visualizada: "Visualizada",
  aceita: "Aceita",
  recusada: "Recusada",
  expirada: "Expirada",
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${Number(v).toFixed(2)}%`;

export default function CardPropostaPublica() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<any>(null);
  const [acceptName, setAcceptName] = useState("");
  const [acceptChecked, setAcceptChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({ razao_social: "", cnpj: "", endereco: "", responsavel: "", whatsapp: "", dados_bancarios: "", observacoes: "" });

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const fnUrl = `https://${projectId}.supabase.co/functions/v1/card-public-proposal`;

  const fetchData = useCallback(async () => {
    if (!token) { setState("not_found"); return; }
    setState("loading");
    try {
      const res = await fetch(`${fnUrl}?token=${encodeURIComponent(token)}&action=view`);
      if (res.status === 404) { setState("not_found"); return; }
      if (!res.ok) { setState("error"); return; }
      const json = await res.json();
      setData(json);
      setState(json.proposal.status === "aceita" ? "onboarding" : "loaded");
    } catch { setState("error"); }
  }, [token, fnUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAccept = async () => {
    if (!acceptChecked) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${fnUrl}?token=${encodeURIComponent(token!)}&action=accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: acceptName || null }),
      });
      if (res.ok) setState("onboarding");
    } catch { /* silent */ }
    setSubmitting(false);
  };

  const handleOnboarding = async () => {
    setSubmitting(true);
    try {
      await fetch(`${fnUrl}?token=${encodeURIComponent(token!)}&action=onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: onboardingForm }),
      });
      setState("accepted_success");
    } catch { /* silent */ }
    setSubmitting(false);
  };

  const whatsappUrl = data?.company?.whatsapp ? `https://wa.me/${data.company.whatsapp.replace(/\D/g, "")}` : data?.company?.phone ? `https://wa.me/${data.company.phone.replace(/\D/g, "")}` : null;
  const companyName = data?.company?.trade_name || data?.company?.legal_name || "Empresa";
  const primaryColor = data?.company?.primary_color || "#3b82f6";

  // Loading
  if (state === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <Skeleton className="h-16 w-48 mx-auto rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Not found
  if (state === "not_found") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Proposta não encontrada</h1>
          <p className="text-muted-foreground">O link pode estar incorreto ou a proposta foi removida.</p>
        </div>
      </div>
    );
  }

  // Error
  if (state === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Erro ao carregar</h1>
          <Button onClick={fetchData} className="gap-2"><RefreshCw className="h-4 w-4" />Tentar novamente</Button>
        </div>
      </div>
    );
  }

  // Success
  if (state === "accepted_success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-950 dark:to-cyan-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <PartyPopper className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">Proposta aceita!</h1>
          <p className="text-emerald-700 dark:text-emerald-300">Seus dados foram enviados. Nossa equipe entrará em contato em breve.</p>
          {whatsappUrl && (
            <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Onboarding form
  if (state === "onboarding") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6 animate-in fade-in duration-300">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: primaryColor }}>
              <CreditCard className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold">Complete seus dados</h1>
            <p className="text-muted-foreground text-sm">Preencha as informações abaixo para finalizar o processo.</p>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-lg space-y-4">
            {[
              ["razao_social", "Razão Social / Nome"],
              ["cnpj", "CNPJ / CPF"],
              ["endereco", "Endereço completo"],
              ["responsavel", "Responsável"],
              ["whatsapp", "WhatsApp"],
              ["dados_bancarios", "Dados Bancários"],
            ].map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input value={(onboardingForm as any)[key]} onChange={e => setOnboardingForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={onboardingForm.observacoes} onChange={e => setOnboardingForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} />
            </div>
            <Button onClick={handleOnboarding} disabled={submitting} className="w-full" style={{ backgroundColor: primaryColor }}>
              {submitting ? "Enviando..." : "Enviar Dados"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main loaded
  const proposal = data.proposal;
  const feeProfile = data.feeProfile || proposal.fee_profile_snapshot;
  const alreadyAccepted = proposal.status === "aceita" || proposal.status === "recusada";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primaryColor }}>
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{companyName}</p>
              <p className="text-[11px] text-muted-foreground">Proposta de Maquininha</p>
            </div>
          </div>
          <Badge className="text-xs">{STATUS_LABELS[proposal.status] || proposal.status}</Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Hero */}
        <section className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {proposal.title || "Proposta de Máquina de Cartão"}
          </h1>
          <p className="text-muted-foreground">
            Para {data.client?.name || "Cliente"}
            {data.client?.company_name ? ` — ${data.client.company_name}` : ""}
          </p>
          <Badge className={proposal.machine_type === "fiscal" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}>
            {proposal.machine_type === "fiscal" ? "Máquina Fiscal" : "Máquina Não Fiscal"}
          </Badge>
        </section>

        {/* Fee table */}
        {feeProfile && (
          <section className="rounded-2xl border bg-card shadow-lg overflow-hidden">
            <div className="p-5 border-b" style={{ backgroundColor: `${primaryColor}10` }}>
              <h2 className="text-lg font-semibold">Taxas Negociadas</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["MDR Débito", feeProfile.mdr_debito_percent],
                  ["MDR Crédito 1x", feeProfile.mdr_credito_1x_percent],
                  ["MDR Crédito 2-6x", feeProfile.mdr_credito_2a6_percent],
                  ["MDR Crédito 7-12x", feeProfile.mdr_credito_7a12_percent],
                  ["Antecipação", feeProfile.antecipacao_percent],
                ].map(([label, value]) => (
                  <div key={label as string} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold">{fmtPct(value as number)}</p>
                  </div>
                ))}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Prazo Repasse</p>
                  <p className="text-lg font-bold">D+{feeProfile.prazo_repasse}</p>
                </div>
              </div>
              {feeProfile.aluguel_mensal && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Aluguel Mensal</p>
                  <p className="text-lg font-bold">{fmt(feeProfile.aluguel_mensal)}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Actions */}
        {!alreadyAccepted && (
          <section className="rounded-2xl border bg-card shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-center">Aceitar esta proposta?</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Seu nome (opcional)</Label>
                <Input value={acceptName} onChange={e => setAcceptName(e.target.value)} placeholder="Nome do responsável" />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox checked={acceptChecked} onCheckedChange={v => setAcceptChecked(!!v)} id="accept-terms" />
                <label htmlFor="accept-terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                  Confirmo que li e aceito os termos desta proposta.
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleAccept} disabled={!acceptChecked || submitting} className="flex-1 gap-2" style={{ backgroundColor: primaryColor }}>
                <CheckCircle2 className="h-4 w-4" /> {submitting ? "Processando..." : "Aceitar Proposta"}
              </Button>
              {whatsappUrl && (
                <Button variant="outline" asChild className="gap-2">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground/50 py-4">
          © {new Date().getFullYear()} {companyName}
        </footer>
      </main>
    </div>
  );
}
