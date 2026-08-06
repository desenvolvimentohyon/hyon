import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Bot, X, MessageSquare, Send, Sparkles, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { iaService } from "../services/iaService";
import { logger } from "@/core/logger/logger";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function IAAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "pt-BR";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        logger.error("Speech Recognition Error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput("");
      setIsListening(true);
      recognitionRef.current?.start();
    }
  }, [isListening]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setRetryStatus(null);

    try {
      // O serviço iaService.ask agora implementa retry interno.
      // Poderíamos opcionalmente passar um callback de progresso se o serviço suportasse,
      // ou apenas confiar no indicador de loading global refinado.
      const response = await iaService.ask(input, 0, (msg) => setRetryStatus(msg), {
        currentPath: location.pathname,
        context: "Global Chat Assistant"
      });
      
      const assistantMsg: Message = { 
        role: "assistant", 
        content: response?.answer || "Desculpe, não consegui processar sua pergunta.", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      logger.error("IA Chat Error", err);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Não foi possível conectar ao serviço após várias tentativas. Verifique sua conexão.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
      setRetryStatus(null);
    }
  };

  const suggestions = [
    "Qual o MRR atual?",
    "Previsão de inadimplência?",
    "Resumo de churn",
    "Quantas reuniões hoje?",
    "Simular proposta para cliente novo",
    "Análise de saúde da base"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[380px] sm:w-[420px]"
          >
            <Card className="border-primary/20 shadow-2xl overflow-hidden glass-premium">
              <CardHeader className="bg-primary/10 border-b border-primary/10 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 p-1.5 rounded-lg">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Hyon IA</CardTitle>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online e processando dados
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0 h-[450px] flex flex-col">
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-8 space-y-4">
                        <div className="bg-primary/5 p-4 rounded-2xl inline-block relative">
                          <Sparkles className="h-8 w-8 text-primary mx-auto opacity-50" />
                          <div className="absolute -top-1 -right-1">
                            <span className="flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold tracking-tight">Olá! Eu sou a Hyon IA.</h3>
                        <p className="text-xs text-muted-foreground px-4 leading-relaxed">
                          Posso analisar seu MRR, prever churn, detalhar inadimplência ou organizar sua agenda.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center pt-4 px-2">
                          {suggestions.map(s => (
                            <Button 
                              key={s} 
                              variant="outline" 
                              size="sm" 
                              className="text-[10px] h-8 px-3 rounded-full bg-background/50 border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                              onClick={() => setInput(s)}
                            >
                              {s}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((m, idx) => (
                      <div key={idx} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                        <div className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                          m.role === "user" 
                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                            : "bg-muted text-foreground rounded-tl-none border border-border/50"
                        )}>
                          {m.content}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 px-1 opacity-50">
                          {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex items-start gap-2">
                        <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 border border-border/50">
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-1.5">
                              <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                            </div>
                            {retryStatus && (
                              <span className="text-[10px] text-primary animate-pulse font-medium">
                                {retryStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="p-4 bg-muted/30 border-t border-border/50 backdrop-blur-sm">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2 w-full"
                >
                  <div className="relative flex-1 group">
                    <Input 
                      placeholder={isListening ? "Ouvindo..." : "Fale com a inteligência..."}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className={cn(
                        "bg-background/50 border-border/40 focus-visible:ring-primary/20 pr-16 transition-all group-hover:border-primary/30",
                        isListening && "border-primary/50 ring-1 ring-primary/20"
                      )}
                      disabled={isLoading}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {input && !isListening && (
                        <button 
                          type="button"
                          onClick={() => setInput("")}
                          className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={toggleListening}
                        className={cn(
                          "p-1.5 rounded-md transition-all",
                          isListening 
                            ? "text-primary bg-primary/10 animate-pulse" 
                            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                        )}
                        disabled={isLoading}
                        title={isListening ? "Parar de ouvir" : "Comando de voz"}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isLoading || !input.trim() || isListening}
                    className="shrink-0 shadow-glow-primary transition-transform active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-glow-primary transition-all duration-300",
          isOpen ? "rotate-90 scale-0 opacity-0" : "scale-100 opacity-100"
        )}
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-6 w-6" />
      </Button>
    </div>
  );
}

