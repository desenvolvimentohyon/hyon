import { useState, useCallback, useRef, useEffect } from "react";
import { useExecutiveBriefing } from "@/hooks/useExecutiveBriefing";
import { useJarvisVoice } from "@/hooks/useJarvisVoice";
import { useJarvisCommands } from "@/hooks/useJarvisCommands";
import { useGrowthRadar } from "@/hooks/useGrowthRadar";
import { useChurnAnalysis } from "@/hooks/useChurnAnalysis";
import { JarvisAvatar } from "@/components/ai/JarvisAvatar";
import { JarvisVoiceControls } from "@/components/ai/JarvisVoiceControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Gauge, Eye, EyeOff, DollarSign, TrendingUp, Users, ListTodo,
  Rocket, ShieldAlert, AlertTriangle, AlertCircle, Info,
  Send, Sparkles, CheckCircle2, RefreshCw, MessageSquare,
  FileText, Headphones, Zap, ChevronRight, Play,
} from "lucide-react";

/* ── KPI Mini Card ────────────────────────────────── */
function KpiPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg bg-card/60 backdrop-blur-sm border border-border/40 min-w-[90px]">
      <span className={cn("text-lg font-bold tabular-nums", color || "text-foreground")}>{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

/* ── Status badge ─────────────────────────────────── */
function StatusBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 text-xs">Saudável</Badge>;
  if (score >= 40) return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/20 text-xs">Atenção</Badge>;
  return <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-xs">Crítico</Badge>;
}

/* ── Cockpit Card wrapper ─────────────────────────── */
function CockpitCard({ title, icon: Icon, color, children, className, hidden }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode; className?: string; hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <Card className={cn("bg-card/80 backdrop-blur-sm border-border/30 shadow-sm hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className={cn("p-1.5 rounded-md", color)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
    </Card>
  );
}

/* ── Alert priority config ────────────────────────── */
const PRI_CFG = {
  alta: { icon: AlertTriangle, cls: "text-destructive" },
  media: { icon: AlertCircle, cls: "text-amber-500" },
  baixa: { icon: Info, cls: "text-primary" },
};

const CAT_ICONS: Record<string, React.ElementType> = {
  comercial: FileText, financeiro: DollarSign, clientes: Users, suporte: Headphones, renovacoes: RefreshCw,
};

/* ── Chat message type ────────────────────────────── */
interface ChatMsg { role: "user" | "assistant"; content: string; }

/* ══════════════════════════════════════════════════════
   COCKPIT PAGE
   ══════════════════════════════════════════════════════ */
export default function Cockpit() {
  const { briefing, context, isLoading, refetch } = useExecutiveBriefing();
  const growth = useGrowthRadar();
  const churn = useChurnAnalysis();
  const commands = useJarvisCommands();

  const [focusMode, setFocusMode] = useState(() => localStorage.getItem("cockpit_focus") === "1");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const welcomeRef = useRef(false);

  // Voice
  const handleSpeechResult = useCallback((text: string) => {
    setChatInput(text);
    setTimeout(() => handleChat(text), 100);
  }, []);

  const voice = useJarvisVoice({ onSpeechResult: handleSpeechResult });

  const jarvisState = voice.isSpeaking ? "speaking" as const
    : voice.isListening ? "listening" as const
    : (isLoading || chatLoading || commands.isProcessing) ? "processing" as const
    : "idle" as const;

  // Welcome
  useEffect(() => {
    if (briefing && voice.ttsSupported && voice.config.autoWelcome && !welcomeRef.current) {
      const played = sessionStorage.getItem("jarvis_cockpit_welcome");
      if (!played) {
        welcomeRef.current = true;
        sessionStorage.setItem("jarvis_cockpit_welcome", "1");
        setTimeout(() => voice.speak(briefing.saudacao + ". " + briefing.resumoDia), 600);
      }
    }
  }, [briefing, voice.ttsSupported, voice.config.autoWelcome]);

  // Focus toggle
  const toggleFocus = () => {
    setFocusMode(p => {
      const v = !p;
      localStorage.setItem("cockpit_focus", v ? "1" : "0");
      return v;
    });
  };

  // Chat scroll
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Chat handler
  const handleChat = async (overrideText?: string) => {
    const text = overrideText || chatInput.trim();
    if (!text) return;
    setChatInput("");

    setChatMessages(prev => [...prev, { role: "user", content: text }]);
    setChatLoading(true);

    try {
      // Try command first
      const cmd = await commands.interpretCommand(text);
      if (cmd && cmd.intent !== "unknown" && !cmd.fallback_chat) {
        setChatMessages(prev => [...prev, { role: "assistant", content: `🤖 ${cmd.spoken_response}` }]);
        commands.executeCommand(cmd, text);
        if (voice.config.voiceResponses) voice.speak(cmd.spoken_response);
        setChatLoading(false);
        return;
      }

      // Fall back to regular chat
      const { data, error } = await supabase.functions.invoke("ai-consultant", {
        body: { type: "executive_chat", message: text, context, briefing },
      });
      if (error) throw error;
      const reply = typeof data === "string" ? data : data?.response || data?.message || JSON.stringify(data);
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
      if (voice.config.voiceResponses) voice.speak(reply);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Desculpe, não consegui processar. Tente novamente." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Metrics
  const mrr = context?.mrr ?? 0;
  const clientesAtivos = context?.clientesAtivos ?? 0;
  const inadimplentes = context?.titulosVencidos ?? 0;
  const propostas = context?.propostasAbertas ?? 0;
  const tarefas = context?.tarefasPendentes ?? 0;
  const tickets = context?.ticketsAbertos ?? 0;

  // Health score (simplified)
  const healthScore = clientesAtivos > 0
    ? Math.max(0, Math.min(100, 100 - (inadimplentes * 5) - ((context?.clientesAtraso ?? 0) * 8)))
    : 50;

  // Quick commands
  const quickCommands = [
    { label: "Abrir Clientes", cmd: "abrir clientes" },
    { label: "Criar Proposta", cmd: "criar proposta" },
    { label: "Ver Financeiro", cmd: "abrir financeiro" },
    { label: "Clientes em Risco", cmd: "quais clientes estão em risco" },
    { label: "Criar Tarefa", cmd: "criar tarefa" },
    { label: "Propostas Abertas", cmd: "mostrar propostas abertas" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Modo Cockpit" icon={Gauge} iconColor="text-cyan-400" description="Central de Comando Inteligente">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleFocus} className="gap-1.5 text-xs">
            {focusMode ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {focusMode ? "Visão Completa" : "Modo Foco"}
          </Button>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
        </div>
      </PageHeader>

      {/* ── TOP: Greeting + KPIs ─────────────────────── */}
      <Card className="bg-gradient-to-r from-card via-card/95 to-card border-border/30">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <JarvisAvatar state={jarvisState} size="sm" />
              <div className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-5 w-64" />
                ) : (
                  <>
                    <p className="text-sm font-medium truncate">{briefing?.saudacao}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{briefing?.resumoDia}</p>
                  </>
                )}
              </div>
              <StatusBadge score={healthScore} />
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <KpiPill label="MRR" value={`R$ ${(mrr / 1000).toFixed(1)}k`} color="text-emerald-500" />
              <KpiPill label="Clientes" value={clientesAtivos} color="text-primary" />
              <KpiPill label="Inadimp." value={inadimplentes} color={inadimplentes > 0 ? "text-destructive" : "text-muted-foreground"} />
              <KpiPill label="Propostas" value={propostas} color="text-amber-500" />
              <KpiPill label="Tarefas" value={tarefas} color="text-violet-500" />
              {!focusMode && <KpiPill label="Tickets" value={tickets} color="text-orange-500" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── MAIN GRID ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LEFT + CENTER: cards (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Row 1: Financeiro + Comercial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CockpitCard title="Financeiro" icon={DollarSign} color="bg-emerald-500/10 text-emerald-500">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">MRR</span><span className="font-semibold text-emerald-500">R$ {mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Títulos Vencidos</span><span className="font-semibold">{inadimplentes}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor em Atraso</span><span className="font-semibold text-destructive">R$ {(context?.valorAtraso ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
              </div>
            </CockpitCard>

            <CockpitCard title="Comercial" icon={TrendingUp} color="bg-indigo-500/10 text-indigo-500">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Propostas Abertas</span><span className="font-semibold">{propostas}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Aceitas no Mês</span><span className="font-semibold text-emerald-500">{context?.propostasAceitasMes ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sem Visualização</span><span className="font-semibold text-amber-500">{context?.propostasSemView ?? 0}</span></div>
              </div>
            </CockpitCard>
          </div>

          {/* Row 2: Clientes + Tarefas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CockpitCard title="Clientes" icon={Users} color="bg-primary/10 text-primary">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Ativos</span><span className="font-semibold">{clientesAtivos}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Novos no Mês</span><span className="font-semibold text-emerald-500">{context?.clientesNovosMes ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Em Atraso</span><span className="font-semibold text-destructive">{context?.clientesAtraso ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cert. Vencendo</span><span className="font-semibold text-amber-500">{context?.certVencendo ?? 0}</span></div>
              </div>
            </CockpitCard>

            <CockpitCard title="Tarefas do Dia" icon={ListTodo} color="bg-violet-500/10 text-violet-500">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Pendentes</span><span className="font-semibold">{tarefas}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Urgentes</span><span className="font-semibold text-destructive">{context?.tarefasUrgentes ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Atrasadas</span><span className="font-semibold text-amber-500">{context?.tarefasAtrasadas ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tickets Abertos</span><span className="font-semibold">{tickets}</span></div>
              </div>
            </CockpitCard>
          </div>

          {/* Row 3: Growth + Churn (hidden in focus mode) */}
          {!focusMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CockpitCard title="Radar de Crescimento" icon={Rocket} color="bg-cyan-500/10 text-cyan-500">
                {growth.isLoading ? <Skeleton className="h-20" /> : growth.context ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Potencial Upsell</span><span className="font-semibold text-cyan-500">R$ {(growth.context.potencialUpsell / 1000).toFixed(1)}k</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Valor no Funil</span><span className="font-semibold">R$ {(growth.context.valorFunil / 1000).toFixed(1)}k</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Top Oportunidades</span><span className="font-semibold">{growth.context.topOportunidades?.length ?? 0}</span></div>
                  </div>
                ) : <p className="text-xs text-muted-foreground">Sem dados</p>}
              </CockpitCard>

              <CockpitCard title="Radar de Risco" icon={ShieldAlert} color="bg-destructive/10 text-destructive">
                {churn.isLoading ? <Skeleton className="h-20" /> : churn.clients.length > 0 ? (
                  <div className="space-y-1.5">
                    {churn.clients.slice(0, 3).map(c => (
                      <div key={c.id} className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[140px]">{c.nome}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">R$ {c.receitaMensal.toFixed(0)}</span>
                          <Badge variant="outline" className={cn("text-[10px]",
                            c.classificacao === "alto" ? "border-destructive/30 text-destructive" :
                            c.classificacao === "medio" ? "border-amber-500/30 text-amber-500" :
                            "border-primary/30 text-primary"
                          )}>
                            {c.scoreChurn}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">Nenhum cliente em risco</p>}
              </CockpitCard>
            </div>
          )}

          {/* ── ALERTS + ACTIONS ─────────────────────── */}
          {briefing?.alertas && briefing.alertas.length > 0 && (
            <CockpitCard title="Alertas & Ações Recomendadas" icon={AlertTriangle} color="bg-amber-500/10 text-amber-500">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {briefing.alertas.slice(0, focusMode ? 3 : 8).map((a, i) => {
                  const P = PRI_CFG[a.prioridade] || PRI_CFG.baixa;
                  const CatIcon = CAT_ICONS[a.categoria] || Info;
                  return (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                      <P.icon className={cn("h-4 w-4 mt-0.5 shrink-0", P.cls)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{a.titulo}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{a.descricao}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] shrink-0 gap-1"
                        onClick={() => handleChat(a.acao_sugerida)}>
                        <Zap className="h-3 w-3" /> Ação
                      </Button>
                    </div>
                  );
                })}
              </div>
              {briefing.sugestoes && briefing.sugestoes.length > 0 && !focusMode && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Sugestões da IA</p>
                  <div className="space-y-1.5">
                    {briefing.sugestoes.slice(0, 4).map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-primary/5 hover:bg-primary/10 transition-colors">
                        <span className="truncate">{s.titulo}</span>
                        <Button size="sm" variant="ghost" className="h-5 text-[10px] px-2"
                          onClick={() => handleChat(s.descricao)}>
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CockpitCard>
          )}
        </div>

        {/* RIGHT: Jarvis Panel (1/3) */}
        <div className="space-y-4">
          {/* Jarvis Header */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <JarvisAvatar state={jarvisState} size="md" />
                <div>
                  <h3 className="text-sm font-semibold">Jarvis</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {jarvisState === "speaking" ? "Falando..." :
                     jarvisState === "listening" ? "Ouvindo..." :
                     jarvisState === "processing" ? "Processando..." :
                     "Pronto para ajudar"}
                  </p>
                </div>
              </div>

              {/* Voice Controls */}
              <JarvisVoiceControls
                isSpeaking={voice.isSpeaking}
                isListening={voice.isListening}
                transcript={voice.transcript}
                ttsSupported={voice.ttsSupported}
                sttSupported={voice.sttSupported}
                voiceEnabled={voice.config.voiceEnabled}
                onToggleVoice={voice.toggleVoice}
                onReadBriefing={() => briefing && voice.speak(briefing.resumoDia)}
                onStartListening={voice.startListening}
                onStopListening={voice.stopListening}
                onStopSpeaking={voice.stop}
                onPauseSpeaking={voice.pause}
                onResumeSpeaking={voice.resume}
              />
            </CardContent>
          </Card>

          {/* Quick Commands */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/30">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Comandos Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
              <div className="flex flex-wrap gap-1.5">
                {quickCommands.map(q => (
                  <Button key={q.cmd} variant="outline" size="sm"
                    className="h-7 text-[11px] px-2.5 bg-muted/30 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                    onClick={() => handleChat(q.cmd)}>
                    {q.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/30 flex flex-col" style={{ minHeight: 320 }}>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary" /> Chat com Jarvis
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-2 mb-2 max-h-64 min-h-[120px]">
                {chatMessages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Diga algo ao Jarvis ou use os comandos rápidos acima.
                  </p>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} className={cn("text-xs p-2 rounded-lg max-w-[90%]",
                    m.role === "user" ? "ml-auto bg-primary/10 text-primary-foreground" : "bg-muted/50"
                  )}>
                    {m.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-1 p-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Confirmation dialog */}
              {commands.pendingConfirmation && (
                <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 mb-2">
                  <p className="text-xs font-medium mb-1.5">{commands.pendingConfirmation.command.confirmation_message || "Confirma esta ação?"}</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-6 text-[10px]" onClick={commands.confirmPending}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={commands.cancelPending}>Cancelar</Button>
                  </div>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleChat(); }} className="flex gap-1.5">
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Fale com o Jarvis..."
                  className="h-8 text-xs"
                  disabled={chatLoading}
                />
                <Button type="submit" size="sm" className="h-8 w-8 p-0 shrink-0" disabled={chatLoading || !chatInput.trim()}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
