import { useState } from "react";
import { useChurnAnalysis } from "@/hooks/useChurnAnalysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldAlert, ChevronDown, ChevronUp, AlertTriangle, Users, TrendingDown,
  DollarSign, Send, Loader2, UserX, Undo2, MessageSquare, RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const prioridadeBadge: Record<string, string> = {
  alta: "bg-destructive text-destructive-foreground",
  media: "bg-warning text-warning-foreground",
  baixa: "bg-success text-success-foreground",
};

const classifBadge: Record<string, { label: string; cls: string }> = {
  alto: { label: "Alto Risco", cls: "bg-destructive text-destructive-foreground" },
  medio: { label: "Médio Risco", cls: "bg-warning text-warning-foreground" },
  baixo: { label: "Baixo Risco", cls: "bg-success text-success-foreground" },
};

interface Props {
  compact?: boolean;
}

export function AiRetencaoAssistant({ compact = false }: Props) {
  const { data, isLoading, error, refetch } = useChurnAnalysis();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ risco: true, recuperacao: false, chat: false });
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const toggle = (key: string) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const msgs = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(msgs);
    setChatLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("ai-consultant", {
        body: {
          type: "churn_chat",
          messages: msgs,
          context: {
            riscoAlto: data?.metricas?.total_risco_alto ?? 0,
            riscoMedio: data?.metricas?.total_risco_medio ?? 0,
            churnMes: data?.metricas?.churn_mes_atual ?? 0,
            retencaoPct: data?.metricas?.retencao_pct ?? 0,
            valorEmRisco: data?.metricas?.valor_em_risco ?? 0,
          },
        },
      });
      if (error) throw error;
      setChatMessages([...msgs, { role: "assistant", content: res.content }]);
    } catch {
      toast({ title: "Erro ao consultar IA", variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="neon-border border-destructive/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
          <Skeleton className="h-24 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="neon-border border-destructive/20">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          <ShieldAlert className="h-5 w-5 mx-auto mb-2 text-destructive" />
          Não foi possível carregar a análise de retenção.
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 mr-1" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const metricas = data.metricas;

  // Compact mode for dashboard
  if (compact) {
    const top3 = (data.clientes_risco || []).filter(c => c.classificacao === "alto").slice(0, 3);
    return (
      <Card className="neon-border border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            IA de Retenção
            {metricas.total_risco_alto > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-[10px]">{metricas.total_risco_alto} em risco</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="rounded-lg border p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground">Risco Alto</p>
              <p className="text-lg font-bold text-destructive">{metricas.total_risco_alto}</p>
            </div>
            <div className="rounded-lg border p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground">Churn/Mês</p>
              <p className="text-lg font-bold">{metricas.churn_mes_atual}</p>
            </div>
            <div className="rounded-lg border p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground">Retenção</p>
              <p className="text-lg font-bold text-primary">{metricas.retencao_pct?.toFixed(0)}%</p>
            </div>
            <div className="rounded-lg border p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground">Valor em Risco</p>
              <p className="text-sm font-bold text-destructive">{fmt(metricas.valor_em_risco)}</p>
            </div>
          </div>
          {top3.length > 0 && (
            <div className="space-y-1.5">
              {top3.map((c, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-destructive/20 bg-destructive/5">
                  <UserX className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <span className="text-xs font-medium flex-1 truncate">{c.nome}</span>
                  <Badge className="text-[9px] bg-destructive text-destructive-foreground">{c.score_churn}</Badge>
                  <span className="text-[10px] text-muted-foreground">{fmt(c.receita_mensal)}/mês</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full mode
  return (
    <Card className="neon-border border-destructive/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            IA de Retenção e Churn
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Risco Alto</p>
            <p className="text-xl font-bold text-destructive">{metricas.total_risco_alto}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Risco Médio</p>
            <p className="text-xl font-bold text-warning">{metricas.total_risco_medio}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Churn/Mês</p>
            <p className="text-xl font-bold">{metricas.churn_mes_atual}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Retenção</p>
            <p className="text-xl font-bold text-primary">{metricas.retencao_pct?.toFixed(0)}%</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Valor em Risco</p>
            <p className="text-lg font-bold text-destructive">{fmt(metricas.valor_em_risco)}</p>
          </div>
        </div>

        {/* Resumo */}
        {data.resumo && (
          <div className="rounded-lg border p-3 bg-muted/30 text-sm leading-relaxed whitespace-pre-line">
            {data.resumo}
          </div>
        )}

        {/* Alertas */}
        {data.alertas && data.alertas.length > 0 && (
          <div className="space-y-1.5">
            {data.alertas.map((a, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border">
                <AlertTriangle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${a.prioridade === "alta" ? "text-destructive" : a.prioridade === "media" ? "text-warning" : "text-success"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{a.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">{a.descricao}</p>
                </div>
                <Badge className={`text-[9px] shrink-0 ${prioridadeBadge[a.prioridade] || ""}`}>{a.prioridade}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Clientes em Risco */}
        <Collapsible open={openSections.risco} onOpenChange={() => toggle("risco")}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left text-sm font-medium py-1.5 hover:text-primary transition-colors">
            {openSections.risco ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <Users className="h-4 w-4 text-destructive" />
            Clientes em Risco ({(data.clientes_risco || []).length})
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 pt-2">
            {(data.clientes_risco || []).map((c, i) => {
              const info = classifBadge[c.classificacao] || classifBadge.baixo;
              return (
                <div key={i} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium flex-1 truncate">{c.nome}</span>
                    <Badge className={`text-[10px] ${info.cls}`}>{c.score_churn} — {info.label}</Badge>
                    <span className="text-xs text-muted-foreground">{fmt(c.receita_mensal)}/mês</span>
                  </div>
                  {c.motivos && c.motivos.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.motivos.map((m, j) => (
                        <Badge key={j} variant="outline" className="text-[9px]">{m}</Badge>
                      ))}
                    </div>
                  )}
                  {c.impacto_cancelamento && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Impacto: {c.impacto_cancelamento}
                    </p>
                  )}
                  {c.acoes_sugeridas && c.acoes_sugeridas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {c.acoes_sugeridas.map((a, j) => (
                        <Button key={j} variant="outline" size="sm" className="h-6 text-[10px] px-2">
                          {a.titulo}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Recuperação */}
        {data.recuperacao && data.recuperacao.length > 0 && (
          <Collapsible open={openSections.recuperacao} onOpenChange={() => toggle("recuperacao")}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left text-sm font-medium py-1.5 hover:text-primary transition-colors">
              {openSections.recuperacao ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <Undo2 className="h-4 w-4 text-primary" />
              Recuperação ({data.recuperacao.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1.5 pt-2">
              {data.recuperacao.map((r, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{r.nome}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Cancelado há {r.cancelado_ha_dias} dias · Receita anterior: {fmt(r.receita_anterior)}
                    </p>
                    <p className="text-[11px] text-primary mt-0.5">{r.sugestao}</p>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Chat */}
        <Collapsible open={openSections.chat} onOpenChange={() => toggle("chat")}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left text-sm font-medium py-1.5 hover:text-primary transition-colors">
            {openSections.chat ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <MessageSquare className="h-4 w-4 text-primary" />
            Chat de Retenção
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {chatMessages.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border p-2">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`text-xs p-2 rounded-lg ${m.role === "user" ? "bg-primary/10 text-foreground ml-8" : "bg-muted mr-8"}`}>
                    {m.content}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Quais clientes estão em risco?"
                className="h-8 text-xs"
                disabled={chatLoading}
              />
              <Button size="sm" className="h-8 px-3" onClick={sendChat} disabled={chatLoading}>
                {chatLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
