import { useState, useRef, useCallback, useEffect } from "react";
import { useExecutiveBriefing, type BriefingAlerta, type BriefingSugestao } from "@/hooks/useExecutiveBriefing";
import { useJarvisVoice } from "@/hooks/useJarvisVoice";
import { JarvisVoiceControls } from "@/components/ai/JarvisVoiceControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { JarvisAvatar } from "@/components/ai/JarvisAvatar";
import {
  RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, AlertCircle, Info, CheckCircle2,
  Send, Sparkles, Users, DollarSign, Headphones,
  FileText, TrendingUp, MessageSquare, Lightbulb,
  Zap, Clock, X,
} from "lucide-react";

const PRIORIDADE_CONFIG = {
  alta: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle, label: "Alta" },
  media: { color: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle, label: "Média" },
  baixa: { color: "bg-primary/10 text-primary border-primary/20", icon: Info, label: "Baixa" },
};

const CATEGORIA_CONFIG: Record<string, { icon: any; label: string }> = {
  comercial: { icon: FileText, label: "Comercial" },
  financeiro: { icon: DollarSign, label: "Financeiro" },
  clientes: { icon: Users, label: "Clientes" },
  suporte: { icon: Headphones, label: "Suporte" },
  renovacoes: { icon: RefreshCw, label: "Renovações" },
};

const ACAO_CONFIG: Record<string, { label: string; icon: any }> = {
  tarefa: { label: "Criar Tarefa", icon: CheckCircle2 },
  contato: { label: "Entrar em Contato", icon: MessageSquare },
  proposta: { label: "Enviar Proposta", icon: FileText },
  cobranca: { label: "Cobrar", icon: DollarSign },
  renovacao: { label: "Renovar", icon: RefreshCw },
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const PLACEHOLDER_QUESTIONS = [
  "O que tenho para hoje?",
  "Quais clientes estão em risco?",
  "Como está meu financeiro?",
  "Quais propostas estão sem resposta?",
  "Resumo do mês comercial",
];

export function AiExecutiveAssistant() {
  const { briefing, context, isLoading, refetch } = useExecutiveBriefing();
  const [isOpen, setIsOpen] = useState(true);
  const [alertsOpen, setAlertsOpen] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [placeholderIdx] = useState(Math.floor(Math.random() * PLACEHOLDER_QUESTIONS.length));
  const welcomePlayedRef = useRef(false);

  // Voice: speech result goes to chat input and auto-sends
  const handleSpeechResult = useCallback((text: string) => {
    setChatInput(text);
    setChatOpen(true);
    // trigger send after state update
    setTimeout(() => {
      const btn = document.getElementById("jarvis-chat-send");
      if (btn) btn.click();
    }, 100);
  }, []);

  const voice = useJarvisVoice(handleSpeechResult);

  // Auto-welcome once per session
  useEffect(() => {
    if (
      !welcomePlayedRef.current &&
      briefing &&
      !isLoading &&
      voice.config.voiceEnabled &&
      voice.config.autoWelcome &&
      voice.ttsSupported
    ) {
      const alreadyPlayed = sessionStorage.getItem("jarvis_welcomed");
      if (!alreadyPlayed) {
        welcomePlayedRef.current = true;
        sessionStorage.setItem("jarvis_welcomed", "1");
        // small delay so page renders first
        setTimeout(() => {
          voice.speak(`${briefing.saudacao}. ${briefing.resumoDia}`);
        }, 1200);
      } else {
        welcomePlayedRef.current = true;
      }
    }
  }, [briefing, isLoading, voice.config.voiceEnabled, voice.config.autoWelcome, voice.ttsSupported]);

  const handleChat = useCallback(async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-consultant", {
        body: {
          type: "chat",
          context: context || {},
          messages: newMessages,
        },
      });
      if (error) throw error;
      const responseText = data.content;
      setChatMessages(prev => [...prev, { role: "assistant", content: responseText }]);
      // Speak response if enabled
      if (voice.config.voiceEnabled && voice.config.voiceResponses) {
        voice.speak(responseText);
      }
    } catch {
      toast.error("Erro ao processar sua pergunta.");
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [chatInput, chatLoading, chatMessages, context, voice]);

  const handleReadBriefing = useCallback(() => {
    if (briefing) {
      voice.speak(`${briefing.saudacao}. ${briefing.resumoDia}`);
    }
  }, [briefing, voice]);

  const dismissAlert = (idx: number) => setDismissedAlerts(prev => new Set(prev).add(String(idx)));
  const dismissSuggestion = (idx: number) => setDismissedSuggestions(prev => new Set(prev).add(String(idx)));

  const visibleAlerts = (briefing?.alertas || []).filter((_, i) => !dismissedAlerts.has(String(i)));
  const visibleSuggestions = (briefing?.sugestoes || []).filter((_, i) => !dismissedSuggestions.has(String(i)));

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <TooltipProvider>
      <Card className="neon-border border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.02]">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <JarvisAvatar
                  size="sm"
                  state={voice.isSpeaking ? "speaking" : voice.isListening ? "listening" : isLoading ? "processing" : "idle"}
                />
                Central de Inteligência IA
                <Badge variant="outline" className="text-[10px] font-normal">Assistente Executivo</Badge>
              </CardTitle>
              <div className="flex items-center gap-1">
                <JarvisVoiceControls
                  isSpeaking={voice.isSpeaking}
                  isListening={voice.isListening}
                  transcript={voice.transcript}
                  ttsSupported={voice.ttsSupported}
                  sttSupported={voice.sttSupported}
                  voiceEnabled={voice.config.voiceEnabled}
                  onToggleVoice={() => voice.updateConfig({ voiceEnabled: !voice.config.voiceEnabled })}
                  onReadBriefing={handleReadBriefing}
                  onStartListening={voice.startListening}
                  onStopListening={voice.stopListening}
                  onStopSpeaking={voice.stopSpeaking}
                  onPauseSpeaking={voice.pauseSpeaking}
                  onResumeSpeaking={voice.resumeSpeaking}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
                      <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Atualizar briefing</TooltipContent>
                </Tooltip>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* ── Saudação + Resumo ──────────────────────────── */}
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 pt-2">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                  </div>
                </div>
              ) : briefing ? (
                <>
                  <div>
                    <p className="text-base font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {briefing.saudacao}
                    </p>
                    <div className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {briefing.resumoDia}
                    </div>
                  </div>

                  {/* ── Métricas Rápidas ──────────────────────────── */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                      { label: "MRR", value: fmt(briefing.metricas.mrr), icon: TrendingUp, tip: "Receita recorrente mensal" },
                      { label: "Ativos", value: String(briefing.metricas.clientes_ativos), icon: Users, tip: "Clientes ativos" },
                      { label: "Inadimpl.", value: String(briefing.metricas.inadimplentes), icon: AlertTriangle, tip: "Clientes inadimplentes" },
                      { label: "Propostas", value: String(briefing.metricas.propostas_abertas), icon: FileText, tip: "Propostas em aberto" },
                      { label: "Tickets", value: String(briefing.metricas.tickets_abertos), icon: Headphones, tip: "Tickets abertos" },
                      { label: "Tarefas", value: String(briefing.metricas.tarefas_pendentes), icon: CheckCircle2, tip: "Tarefas pendentes" },
                    ].map(m => (
                      <Tooltip key={m.label}>
                        <TooltipTrigger asChild>
                          <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 text-center cursor-help hover:bg-muted/50 transition-colors">
                            <m.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                            <p className="text-sm font-bold leading-none">{m.value}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{m.tip}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Não foi possível gerar o briefing. Tente novamente.</p>
              )}

              {/* ── Alertas ──────────────────────────────────────── */}
              {visibleAlerts.length > 0 && (
                <Collapsible open={alertsOpen} onOpenChange={setAlertsOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-sm font-medium w-full hover:text-primary transition-colors">
                      <Zap className="h-3.5 w-3.5 text-warning" />
                      Alertas Inteligentes
                      <Badge variant="outline" className="text-[10px]">{visibleAlerts.length}</Badge>
                      {alertsOpen ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-1.5">
                    {visibleAlerts.map((alerta, i) => {
                      const prio = PRIORIDADE_CONFIG[alerta.prioridade] || PRIORIDADE_CONFIG.baixa;
                      const cat = CATEGORIA_CONFIG[alerta.categoria] || CATEGORIA_CONFIG.clientes;
                      const PrioIcon = prio.icon;
                      const CatIcon = cat.icon;
                      return (
                        <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${prio.color} transition-all duration-150`}>
                          <PrioIcon className="h-4 w-4 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <CatIcon className="h-3 w-3 opacity-60" />
                              <span className="text-xs font-semibold">{alerta.titulo}</span>
                            </div>
                            <p className="text-[11px] opacity-80">{alerta.descricao}</p>
                            <p className="text-[11px] mt-1 font-medium opacity-90">💡 {alerta.acao_sugerida}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100" onClick={() => dismissAlert(briefing!.alertas.indexOf(alerta))}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* ── Sugestões ────────────────────────────────────── */}
              {visibleSuggestions.length > 0 && (
                <Collapsible open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-sm font-medium w-full hover:text-primary transition-colors">
                      <Lightbulb className="h-3.5 w-3.5 text-primary" />
                      Sugestões de Ação
                      <Badge variant="outline" className="text-[10px]">{visibleSuggestions.length}</Badge>
                      {suggestionsOpen ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-1.5">
                    {visibleSuggestions.map((sug, i) => {
                      const acao = ACAO_CONFIG[sug.tipo_acao] || ACAO_CONFIG.tarefa;
                      const AcaoIcon = acao.icon;
                      return (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                          <AcaoIcon className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{sug.titulo}</p>
                            <p className="text-[11px] text-muted-foreground">{sug.descricao}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => {
                              toast.success(`Ação "${sug.titulo}" criada!`);
                              dismissSuggestion(briefing!.sugestoes.indexOf(sug));
                            }}>
                              ✅ {acao.label}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50" onClick={() => dismissSuggestion(briefing!.sugestoes.indexOf(sug))}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* ── Chat ─────────────────────────────────────────── */}
              <Collapsible open={chatOpen} onOpenChange={setChatOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 text-sm font-medium w-full hover:text-primary transition-colors">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    Pergunte à IA
                    {chatOpen ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  {chatMessages.length > 0 && (
                    <div className="max-h-60 overflow-y-auto space-y-2 mb-2 p-2 rounded-lg bg-muted/20 border border-border/30">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-lg px-3 py-1.5 text-xs ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted border border-border/50"
                          }`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted border border-border/50 rounded-lg px-3 py-1.5">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder={PLACEHOLDER_QUESTIONS[placeholderIdx]}
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleChat()}
                      disabled={chatLoading}
                      className="text-xs h-8"
                    />
                    <Button id="jarvis-chat-send" size="sm" className="h-8 px-3" onClick={handleChat} disabled={chatLoading || !chatInput.trim()}>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}
