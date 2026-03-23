import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleNavGrid } from "@/components/layout/ModuleNavGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Rocket, TrendingUp, TrendingDown, AlertTriangle, DollarSign,
  ChevronDown, Send, RefreshCw, Users, Target, Zap, BarChart3,
  ShieldAlert, ArrowUpRight, Loader2, MessageSquare, Percent,
} from "lucide-react";
import { useGrowthRadar } from "@/hooks/useGrowthRadar";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const prioridadeBadge = (p: string) => {
  switch (p) {
    case "alta": return "bg-destructive/10 text-destructive border-destructive/20";
    case "media": return "bg-warning/10 text-warning border-warning/20";
    default: return "bg-success/10 text-success border-success/20";
  }
};

const tipoBadge = (t: string) => {
  switch (t) {
    case "upsell": return { label: "Upsell", class: "bg-primary/10 text-primary" };
    case "plano_anual": return { label: "Plano Anual", class: "bg-success/10 text-success" };
    case "expansao": return { label: "Expansão", class: "bg-info/10 text-info" };
    case "reativacao": return { label: "Reativação", class: "bg-warning/10 text-warning" };
    case "inadimplencia": return { label: "Inadimplência", class: "bg-destructive/10 text-destructive" };
    case "margem_baixa": return { label: "Margem Baixa", class: "bg-warning/10 text-warning" };
    case "churn": return { label: "Churn", class: "bg-destructive/10 text-destructive" };
    case "desconto_excessivo": return { label: "Desconto Alto", class: "bg-warning/10 text-warning" };
    default: return { label: t, class: "bg-muted text-muted-foreground" };
  }
};

export default function RadarCrescimento() {
  const navigate = useNavigate();
  const { addTarefa } = useApp();
  const { context, diagnosis, isLoading, diagnosisLoading, refetch } = useGrowthRadar();
  const [openSections, setOpenSections] = useState({ diagnostico: true, oportunidades: true, perdas: true, projecoes: true, chat: false });
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const toggle = (key: keyof typeof openSections) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

  const handleCriarTarefa = (titulo: string) => {
    addTarefa({
      titulo, descricao: "Ação sugerida pelo Radar de Crescimento IA",
      clienteId: null, responsavelId: "", prioridade: "alta", status: "a_fazer",
      tags: ["radar-crescimento"], checklist: [], implantacaoId: undefined, anexosFake: [], comentarios: [],
      tipoOperacional: "comercial",
    });
    toast({ title: "Tarefa criada!", description: titulo });
  };

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user", content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-consultant", {
        body: {
          type: "growth_chat",
          context: context || {},
          messages: newMessages,
        },
      });
      if (error) throw error;
      setChatMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch {
      toast({ title: "Erro ao consultar IA", variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  const metricas = diagnosis?.metricas;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Radar de Crescimento"
        subtitle="Análise estratégica com IA para crescer mais rápido"
        icon={Rocket}
        iconClassName="text-success"
        actions={
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />Atualizar
          </Button>
        }
      />
      <ModuleNavGrid moduleId="dashboard" />

      {/* KPIs */}
      {isLoading && !metricas ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : metricas && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
          {[
            { label: "Crescimento", value: `${metricas.crescimento_mensal_pct?.toFixed(1) ?? 0}%`, icon: TrendingUp, color: "text-success" },
            { label: "Churn", value: `${metricas.churn_pct?.toFixed(1) ?? 0}%`, icon: TrendingDown, color: "text-destructive" },
            { label: "Retenção", value: `${metricas.retencao_pct?.toFixed(1) ?? 0}%`, icon: Users, color: "text-primary" },
            { label: "Ticket Médio", value: fmt(metricas.ticket_medio ?? 0), icon: DollarSign, color: "text-info" },
            { label: "Potencial Upsell", value: fmt(metricas.potencial_upsell_total ?? 0), icon: ArrowUpRight, color: "text-success" },
            { label: "Receita Perdida", value: fmt(metricas.receita_perdida_total ?? 0), icon: ShieldAlert, color: "text-destructive" },
          ].map(k => (
            <Card key={k.label} className="neon-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{k.label}</span>
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
                <p className="text-xl font-bold tracking-tight">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diagnóstico */}
      <Collapsible open={openSections.diagnostico} onOpenChange={() => toggle("diagnostico")}>
        <Card className="neon-border border-l-4 border-l-success">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-success" />Diagnóstico Estratégico
                <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${openSections.diagnostico ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {diagnosisLoading ? (
                <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-5/6" /></div>
              ) : diagnosis?.diagnostico ? (
                <div className="prose prose-sm max-w-none text-foreground text-sm whitespace-pre-line">{diagnosis.diagnostico}</div>
              ) : (
                <p className="text-sm text-muted-foreground">Aguardando análise...</p>
              )}
              {/* Alertas */}
              {diagnosis?.alertas && diagnosis.alertas.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Alertas Estratégicos</p>
                  {diagnosis.alertas.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/30">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${a.prioridade === "alta" ? "text-destructive" : a.prioridade === "media" ? "text-warning" : "text-info"}`} />
                      <div>
                        <p className="text-sm font-medium">{a.titulo}</p>
                        <p className="text-xs text-muted-foreground">{a.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Oportunidades */}
      <Collapsible open={openSections.oportunidades} onOpenChange={() => toggle("oportunidades")}>
        <Card className="neon-border border-l-4 border-l-primary">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />Top Oportunidades de Crescimento
                {diagnosis?.oportunidades && <Badge variant="outline" className="text-[10px]">{diagnosis.oportunidades.length}</Badge>}
                <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${openSections.oportunidades ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {diagnosisLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
              ) : diagnosis?.oportunidades && diagnosis.oportunidades.length > 0 ? (
                <div className="space-y-2">
                  {diagnosis.oportunidades.map((op, i) => {
                    const badge = tipoBadge(op.tipo);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium truncate">{op.cliente_nome}</span>
                            <Badge className={`text-[9px] ${badge.class}`}>{badge.label}</Badge>
                            <Badge className={`text-[9px] ${prioridadeBadge(op.prioridade)}`}>{op.prioridade}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{op.acao_sugerida}</p>
                          <p className="text-xs text-success font-medium mt-0.5">Potencial: +{fmt(op.potencial_adicional)}/mês</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => handleCriarTarefa(op.acao_sugerida)}>Criar tarefa</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem oportunidades identificadas no momento.</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Perdas / Riscos */}
      <Collapsible open={openSections.perdas} onOpenChange={() => toggle("perdas")}>
        <Card className="neon-border border-l-4 border-l-destructive">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />Perdas e Riscos Financeiros
                {diagnosis?.perdas && <Badge variant="outline" className="text-[10px]">{diagnosis.perdas.length}</Badge>}
                <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${openSections.perdas ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {diagnosisLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
              ) : diagnosis?.perdas && diagnosis.perdas.length > 0 ? (
                <div className="space-y-2">
                  {diagnosis.perdas.map((p, i) => {
                    const badge = tipoBadge(p.tipo);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium truncate">{p.cliente_nome}</span>
                            <Badge className={`text-[9px] ${badge.class}`}>{badge.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{p.descricao}</p>
                        </div>
                        <span className="text-sm font-bold text-destructive shrink-0">{fmt(p.valor_impacto)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem perdas significativas detectadas.</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Projeções */}
      <Collapsible open={openSections.projecoes} onOpenChange={() => toggle("projecoes")}>
        <Card className="neon-border border-l-4 border-l-info">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-info" />Cenários de Projeção
                <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${openSections.projecoes ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {diagnosisLoading ? (
                <div className="grid gap-3 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
              ) : diagnosis?.projecoes && diagnosis.projecoes.length > 0 ? (
                <div className="grid gap-3 lg:grid-cols-3">
                  {diagnosis.projecoes.map((p, i) => (
                    <Card key={i} className="bg-muted/30 border-border/50">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium mb-2">{p.cenario}</p>
                        <div className="space-y-1">
                          <p className="text-xs"><span className="text-muted-foreground">MRR:</span> <span className="text-success font-medium">{p.impacto_mrr}</span></p>
                          <p className="text-xs"><span className="text-muted-foreground">Margem:</span> <span className="text-info font-medium">{p.impacto_margem}</span></p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem projeções disponíveis.</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Chat */}
      <Collapsible open={openSections.chat} onOpenChange={() => toggle("chat")}>
        <Card className="neon-border">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />Chat Estratégico
                <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${openSections.chat ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto mb-3">
                {chatMessages.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Pergunte: "onde posso crescer mais rápido?" ou "qual minha maior oportunidade?"</p>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} className={`p-2.5 rounded-lg text-sm ${m.role === "user" ? "bg-primary/10 ml-8" : "bg-muted/50 mr-8"}`}>
                    <div className="prose prose-sm max-w-none text-foreground whitespace-pre-line">{m.content}</div>
                  </div>
                ))}
                {chatLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Analisando...</div>}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Pergunte sobre crescimento..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleChat()}
                  className="h-9"
                />
                <Button size="sm" onClick={handleChat} disabled={chatLoading || !chatInput.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
