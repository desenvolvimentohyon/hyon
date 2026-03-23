import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Mic, MicOff, Send, Check, X, Pencil, ChevronDown, Lightbulb, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Cliente, Tecnico, Prioridade, TipoOperacional } from "@/types";
import { cn } from "@/lib/utils";

interface ParsedTask {
  titulo: string;
  descricao: string;
  clienteNome?: string;
  prioridade: Prioridade;
  tipoOperacional: TipoOperacional;
  prazoDataHora?: string;
  responsavelNome?: string;
}

interface Suggestion {
  titulo: string;
  descricao: string;
  clienteNome?: string;
  prioridade: Prioridade;
  tipoOperacional: TipoOperacional;
  motivo: string;
}

interface AiTaskAssistantProps {
  clientes: Cliente[];
  tecnicos: Tecnico[];
  addTarefa: (t: any) => void;
  tecnicoAtualId: string;
}

function fuzzyMatchCliente(name: string | undefined, clientes: Cliente[]): string | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  const exact = clientes.find(c => c.nome.toLowerCase() === lower);
  if (exact) return exact.id;
  const partial = clientes.find(c => c.nome.toLowerCase().includes(lower) || lower.includes(c.nome.toLowerCase()));
  return partial?.id || null;
}

function fuzzyMatchTecnico(name: string | undefined, tecnicos: Tecnico[]): string | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  const found = tecnicos.find(t => t.nome.toLowerCase().includes(lower) || lower.includes(t.nome.toLowerCase()));
  return found?.id || null;
}

const PRIORIDADE_COLORS: Record<string, string> = {
  urgente: "bg-destructive text-destructive-foreground",
  alta: "bg-warning text-warning-foreground",
  media: "bg-info text-info-foreground",
  baixa: "bg-muted text-muted-foreground",
};

const PRIORIDADE_LABELS: Record<string, string> = {
  urgente: "Urgente", alta: "Alta", media: "Média", baixa: "Baixa",
};

const TIPO_LABELS: Record<string, string> = {
  comercial: "Comercial", implantacao: "Implantação", suporte: "Suporte",
  treinamento: "Treinamento", financeiro: "Financeiro", interno: "Interno",
};

export function AiTaskAssistant({ clientes, tecnicos, addTarefa, tecnicoAtualId }: AiTaskAssistantProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const recognitionRef = useRef<any>(null);

  // Fetch suggestions
  const { data: suggestions, isLoading: sugLoading } = useQuery({
    queryKey: ["ai-task-suggestions"],
    queryFn: async () => {
      // Gather system data for suggestions
      const [overdue, certs] = await Promise.all([
        supabase.from("clients").select("name, email, monthly_value_final").not("status", "eq", "cancelado").limit(10),
        supabase.from("clients").select("name, cert_expires_at").not("cert_expires_at", "is", null).limit(20),
      ]);

      const overdueClients = overdue.data?.filter((c: any) => {
        const meta = (c as any).metadata;
        return meta?.statusFinanceiro === "2_mais_atrasos";
      }) || [];

      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiringCerts = certs.data?.filter((c: any) =>
        c.cert_expires_at && new Date(c.cert_expires_at) < thirtyDays && new Date(c.cert_expires_at) > now
      ) || [];

      const context = {
        clientesInadimplentes: overdueClients.map((c: any) => ({ nome: c.name, valor: c.monthly_value_final })),
        certificadosVencendo: expiringCerts.map((c: any) => ({ nome: c.name, vencimento: c.cert_expires_at })),
      };

      // Only call AI if there's data to suggest from
      if (context.clientesInadimplentes.length === 0 && context.certificadosVencendo.length === 0) {
        return [];
      }

      const { data, error } = await supabase.functions.invoke("ai-task-assistant", {
        body: { type: "suggest", context },
      });

      if (error) throw error;
      return (data?.result?.suggestions || []) as Suggestion[];
    },
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  const handleSubmit = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-task-assistant", {
        body: {
          type: "parse",
          text,
          context: {
            clientes: clientes.map(c => ({ id: c.id, nome: c.nome })),
            tecnicos: tecnicos.map(t => ({ id: t.id, nome: t.nome })),
          },
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erro da IA", description: data.error, variant: "destructive" });
        return;
      }

      setParsedTask(data.result as ParsedTask);
    } catch (err: any) {
      toast({ title: "Erro ao processar", description: err.message || "Tente novamente", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [inputText, clientes, tecnicos]);

  const handleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Navegador não suportado", description: "Use Chrome ou Edge para reconhecimento de voz.", variant: "destructive" });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast({ title: "Erro no microfone", description: "Verifique as permissões do navegador.", variant: "destructive" });
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      toast({ title: "Voz capturada!", description: transcript });
    };
    recognition.start();
  }, [isListening]);

  const handleCreate = useCallback(() => {
    if (!parsedTask) return;
    const clienteId = fuzzyMatchCliente(parsedTask.clienteNome, clientes);
    const responsavelId = fuzzyMatchTecnico(parsedTask.responsavelNome, tecnicos) || tecnicoAtualId;

    addTarefa({
      titulo: parsedTask.titulo,
      descricao: parsedTask.descricao,
      clienteId,
      responsavelId,
      prioridade: parsedTask.prioridade,
      status: "a_fazer",
      prazoDataHora: parsedTask.prazoDataHora,
      tags: [],
      checklist: [],
      anexosFake: [],
      comentarios: [],
      tipoOperacional: parsedTask.tipoOperacional,
    });

    toast({ title: "✅ Tarefa criada com sucesso!" });
    setParsedTask(null);
    setInputText("");
  }, [parsedTask, clientes, tecnicos, tecnicoAtualId, addTarefa]);

  const handleCreateSuggestion = useCallback((s: Suggestion) => {
    const clienteId = fuzzyMatchCliente(s.clienteNome, clientes);
    addTarefa({
      titulo: s.titulo,
      descricao: s.descricao,
      clienteId,
      responsavelId: tecnicoAtualId,
      prioridade: s.prioridade,
      status: "a_fazer",
      tags: [],
      checklist: [],
      anexosFake: [],
      comentarios: [],
      tipoOperacional: s.tipoOperacional,
    });
    toast({ title: "✅ Tarefa criada a partir da sugestão!" });
    setDismissedSuggestions(prev => new Set(prev).add(s.titulo));
  }, [clientes, tecnicoAtualId, addTarefa]);

  const visibleSuggestions = suggestions?.filter(s => !dismissedSuggestions.has(s.titulo)) || [];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-primary" />
          Assistente Inteligente de Tarefas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input area */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Descreva a tarefa... Ex: criar tarefa para instalar sistema no cliente João amanhã às 14h"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !isLoading && handleSubmit()}
              className="pr-10"
              disabled={isLoading}
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={handleVoice}
                  className={cn("shrink-0", isListening && "animate-pulse")}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isListening ? "Parar gravação" : "Criar por voz"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button onClick={handleSubmit} disabled={isLoading || !inputText.trim()} className="gap-1.5 shrink-0">
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Criar com IA
          </Button>
        </div>

        {/* Parsed task preview */}
        {parsedTask && (
          <Card className="border-primary/30 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <h4 className="font-semibold text-sm">{parsedTask.titulo}</h4>
                  <p className="text-xs text-muted-foreground">{parsedTask.descricao}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setParsedTask(null)} className="h-7 w-7 p-0">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge className={cn("text-[10px]", PRIORIDADE_COLORS[parsedTask.prioridade])}>
                  {PRIORIDADE_LABELS[parsedTask.prioridade]}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {TIPO_LABELS[parsedTask.tipoOperacional] || parsedTask.tipoOperacional}
                </Badge>
                {parsedTask.clienteNome && (
                  <Badge variant="secondary" className="text-[10px]">
                    👤 {parsedTask.clienteNome}
                    {fuzzyMatchCliente(parsedTask.clienteNome, clientes) ? " ✓" : " (não encontrado)"}
                  </Badge>
                )}
                {parsedTask.responsavelNome && (
                  <Badge variant="secondary" className="text-[10px]">🔧 {parsedTask.responsavelNome}</Badge>
                )}
                {parsedTask.prazoDataHora && (
                  <Badge variant="secondary" className="text-[10px]">
                    📅 {new Date(parsedTask.prazoDataHora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleCreate} className="gap-1 h-8">
                  <Check className="h-3.5 w-3.5" /> Criar Tarefa
                </Button>
                <Button size="sm" variant="outline" onClick={() => setParsedTask(null)} className="h-8">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggestions panel */}
        {(visibleSuggestions.length > 0 || sugLoading) && (
          <Collapsible open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full justify-start">
                <Lightbulb className="h-3.5 w-3.5 text-warning" />
                Sugestões da IA
                {visibleSuggestions.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] ml-1">{visibleSuggestions.length}</Badge>
                )}
                <ChevronDown className={cn("h-3.5 w-3.5 ml-auto transition-transform", suggestionsOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {sugLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                visibleSuggestions.map((s, i) => (
                  <Card key={i} className="border-warning/20 bg-warning/5">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1">
                          <p className="text-sm font-medium">{s.titulo}</p>
                          <p className="text-xs text-muted-foreground">{s.descricao}</p>
                        </div>
                        <Badge className={cn("text-[10px] shrink-0", PRIORIDADE_COLORS[s.prioridade])}>
                          {PRIORIDADE_LABELS[s.prioridade]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertTriangle className="h-3 w-3 text-warning" />
                        {s.motivo}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleCreateSuggestion(s)}>
                          <Check className="h-3 w-3" /> Criar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setDismissedSuggestions(prev => new Set(prev).add(s.titulo))}
                        >
                          Ignorar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
