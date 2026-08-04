import { useState, useRef, useEffect } from "react";
import { Bot, X, MessageSquare, Send, Sparkles } from "lucide-react";
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await iaService.ask(input);
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
        content: "Ocorreu um erro técnico. Por favor, tente novamente em instantes.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Qual o MRR atual?",
    "Previsão de inadimplência?",
    "Resumo de churn",
    "Quantas reuniões hoje?"
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
                        <div className="bg-primary/5 p-4 rounded-2xl inline-block">
                          <Sparkles className="h-8 w-8 text-primary mx-auto opacity-50" />
                        </div>
                        <h3 className="text-sm font-medium">Olá! Eu sou a inteligência da Hyon.</h3>
                        <p className="text-xs text-muted-foreground px-4">
                          Pergunte-me sobre vendas, inadimplência, MRR ou sua agenda.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center pt-2">
                          {suggestions.map(s => (
                            <Button 
                              key={s} 
                              variant="outline" 
                              size="sm" 
                              className="text-[10px] h-7 rounded-full bg-primary/5 border-primary/10 hover:bg-primary/10"
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
                          <div className="flex gap-1.5">
                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="p-4 bg-muted/30 border-t border-border/50">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2 w-full"
                >
                  <Input 
                    placeholder="Pergunte qualquer coisa..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-background/50 border-border/40 focus-visible:ring-primary/20"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isLoading || !input.trim()}
                    className="shrink-0 shadow-glow-primary"
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

