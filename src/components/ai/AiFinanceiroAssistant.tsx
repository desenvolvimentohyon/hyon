import { useState } from "react";
import { useFinancialDiagnosis, useFinancialContext } from "@/hooks/useFinancialDiagnosis";
import type { FinancialDiagnosisAlert, FinancialRecommendation, ClientProfitability, FinancialScenario } from "@/hooks/useFinancialDiagnosis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import {
  Brain, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, TrendingDown, Minus,
  DollarSign, Percent, BarChart3, Users, Send, X, Loader2, Sparkles,
  CheckCircle2, Eye, MessageSquare, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

const prioridadeConfig: Record<string, { color: string; bg: string; icon: typeof AlertTriangle }> = {
  alta: { color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", icon: AlertTriangle },
  media: { color: "text-warning", bg: "bg-warning/10 border-warning/20", icon: AlertTriangle },
  baixa: { color: "text-info", bg: "bg-info/10 border-info/20", icon: AlertTriangle },
};

const tendenciaConfig = {
  crescimento: { icon: TrendingUp, color: "text-success", label: "Crescimento" },
  estavel: { icon: Minus, color: "text-muted-foreground", label: "Estável" },
  queda: { icon: TrendingDown, color: "text-destructive", label: "Queda" },
};

const classificacaoConfig = {
  saudavel: { color: "bg-success/10 text-success border-success/20", label: "Saudável" },
  atencao: { color: "bg-warning/10 text-warning border-warning/20", label: "Atenção" },
  critico: { color: "bg-destructive/10 text-destructive border-destructive/20", label: "Crítico" },
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AiFinanceiroAssistant({ compact = false }: { compact?: boolean }) {
  const { data: diagnosis, isLoading, error, refetch } = useFinancialDiagnosis();
  const { data: financialCtx } = useFinancialContext();
  const [openSections, setOpenSections] = useState({ alertas: true, recomendacoes: true, lucratividade: false, cenarios: false, chat: false });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const toggle = (key: keyof typeof openSections) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const msgs: ChatMessage[] = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(msgs);
    setChatLoading(true);
    try {
      const res = await supabase.functions.invoke("ai-consultant", {
        body: {
          type: "financial_chat",
          context: financialCtx || {},
          messages: msgs,
        },
      });
      if (res.error) throw new Error(res.error.message);
      setChatMessages([...msgs, { role: "assistant", content: res.data?.content || "Sem resposta." }]);
    } catch {
      toast.error("Erro ao consultar IA financeira");
    } finally {
      setChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-success/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-success animate-pulse" />
            <Skeleton className="h-5 w-48" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !diagnosis) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-sm text-muted-foreground">Não foi possível carregar o diagnóstico financeiro.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }

  const TendIcon = tendenciaConfig[diagnosis.projecoes.tendencia]?.icon || Minus;
  const tendColor = tendenciaConfig[diagnosis.projecoes.tendencia]?.color || "text-muted-foreground";
  const tendLabel = tendenciaConfig[diagnosis.projecoes.tendencia]?.label || "—";

  const kpis = [
    { label: "MRR", value: fmt(diagnosis.projecoes.mrr_atual), icon: DollarSign, color: "text-success" },
    { label: "Ticket Médio", value: fmt(diagnosis.projecoes.ticket_medio), icon: BarChart3, color: "text-info" },
    { label: "Margem", value: fmtPct(diagnosis.projecoes.margem_pct), icon: Percent, color: diagnosis.projecoes.margem_pct >= 30 ? "text-success" : "text-warning" },
    { label: "Inadimplência", value: fmtPct(diagnosis.projecoes.inadimplencia_pct), icon: AlertTriangle, color: diagnosis.projecoes.inadimplencia_pct > 10 ? "text-destructive" : "text-warning" },
  ];

  if (compact) {
    return (
      <Card className="border-success/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-success" />
            Diagnóstico Financeiro IA
            <Badge variant="outline" className={`text-[10px] gap-1 ${tendColor}`}>
              <TendIcon className="h-3 w-3" />{tendLabel}
            </Badge>
            <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => refetch()}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {kpis.map(k => (
              <div key={k.label} className="p-2.5 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <k.icon className={`h-3 w-3 ${k.color}`} />
                  <span className="text-[10px] text-muted-foreground uppercase">{k.label}</span>
                </div>
                <p className="text-sm font-bold">{k.value}</p>
              </div>
            ))}
          </div>
          {diagnosis.alertas.filter(a => a.prioridade === "alta").slice(0, 3).map((a, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">{a.titulo}</p>
                <p className="text-[11px] text-muted-foreground">{a.descricao}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-success/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-5 w-5 text-success" />
          Diagnóstico Financeiro IA
          <Badge variant="outline" className={`text-[10px] gap-1 ${tendColor}`}>
            <TendIcon className="h-3 w-3" />{tendLabel}
          </Badge>
          <Button variant="ghost" size="sm" className="ml-auto h-7 px-2 gap-1" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{diagnosis.resumo}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map(k => (
            <div key={k.label} className="p-3 rounded-lg border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <k.icon className={`h-3.5 w-3.5 ${k.color}`} />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{k.label}</span>
              </div>
              <p className="text-lg font-bold">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Alertas */}
        <Collapsible open={openSections.alertas} onOpenChange={() => toggle("alertas")}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold flex-1">Alertas Inteligentes ({diagnosis.alertas.length})</span>
            {openSections.alertas ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {diagnosis.alertas.map((a, i) => {
              const key = `alert-${i}`;
              if (dismissed.has(key)) return null;
              const cfg = prioridadeConfig[a.prioridade] || prioridadeConfig.baixa;
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg}`}>
                  <cfg.icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold">{a.titulo}</span>
                      <Badge variant="outline" className="text-[9px]">{a.categoria}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{a.descricao}</p>
                    <p className="text-[11px] text-foreground/70 mt-1">💡 {a.acao_sugerida}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => setDismissed(s => new Set(s).add(key))}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Recomendações */}
        <Collapsible open={openSections.recomendacoes} onOpenChange={() => toggle("recomendacoes")}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold flex-1">Recomendações ({diagnosis.recomendacoes.length})</span>
            {openSections.recomendacoes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {diagnosis.recomendacoes.map((r, i) => {
              const key = `rec-${i}`;
              if (dismissed.has(key)) return null;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{r.titulo}</p>
                    <p className="text-[11px] text-muted-foreground">{r.descricao}</p>
                    {r.cliente_nome && <p className="text-[11px] text-foreground/70 mt-0.5">👤 {r.cliente_nome}</p>}
                    <p className="text-[11px] text-success mt-0.5">📈 {r.impacto}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => toast.success(`Ação "${r.titulo}" registrada`)}>
                      ✅ Criar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setDismissed(s => new Set(s).add(key))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Lucratividade por Cliente */}
        <Collapsible open={openSections.lucratividade} onOpenChange={() => toggle("lucratividade")}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1">
            <Users className="h-4 w-4 text-info" />
            <span className="text-sm font-semibold flex-1">Lucratividade por Cliente ({diagnosis.lucratividade_clientes.length})</span>
            {openSections.lucratividade ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-1.5">
              {diagnosis.lucratividade_clientes.map((c, i) => {
                const cfg = classificacaoConfig[c.classificacao] || classificacaoConfig.saudavel;
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{c.nome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Receita: {fmt(c.receita)} · Custo: {fmt(c.custo)} · Margem: {fmt(c.margem)}
                      </p>
                    </div>
                    <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Cenários */}
        <Collapsible open={openSections.cenarios} onOpenChange={() => toggle("cenarios")}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm font-semibold flex-1">Cenários de Crescimento ({diagnosis.cenarios.length})</span>
            {openSections.cenarios ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {diagnosis.cenarios.map((c, i) => (
              <div key={i} className="p-3 rounded-lg border border-success/20 bg-success/5">
                <p className="text-xs font-semibold">{c.descricao}</p>
                <div className="flex gap-4 mt-1.5">
                  <span className="text-[11px] text-muted-foreground">MRR: <strong className="text-success">{c.impacto_mrr}</strong></span>
                  <span className="text-[11px] text-muted-foreground">Margem: <strong className="text-success">{c.impacto_margem}</strong></span>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Chat Financeiro */}
        <Collapsible open={openSections.chat} onOpenChange={() => toggle("chat")}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold flex-1">Chat Financeiro</span>
            {openSections.chat ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="border border-border/50 rounded-lg overflow-hidden">
              {chatMessages.length > 0 && (
                <div className="max-h-60 overflow-y-auto p-3 space-y-2">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-2.5 rounded-lg text-xs ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p className="whitespace-pre-line">{m.content}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="p-2.5 rounded-lg bg-muted"><Loader2 className="h-4 w-4 animate-spin" /></div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 p-2 border-t border-border/50">
                <input
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 px-2"
                  placeholder="Qual sistema gera mais lucro?"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                />
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
