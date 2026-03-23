import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Mic, MicOff, Brain, Sparkles, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskAIResult {
  titulo: string;
  descricao: string;
  prioridade: string;
  tipoOperacional: string;
  prazoSugerido?: string;
  tags?: string[];
}

interface TaskAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (task: TaskAIResult) => void;
}

export function TaskAIModal({ open, onOpenChange, onCreateTask }: TaskAIModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaskAIResult | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Seu navegador não suporta reconhecimento de voz");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-task-assistant", {
        body: { type: "create", prompt: prompt.trim() },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setResult(data.result);
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar tarefa com IA");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!result) return;
    onCreateTask(result);
    handleClose();
  };

  const handleClose = () => {
    setPrompt("");
    setResult(null);
    setLoading(false);
    onOpenChange(false);
  };

  const prioridadeColor = (p: string) => {
    switch (p) {
      case "urgente": return "bg-destructive text-destructive-foreground";
      case "alta": return "bg-warning text-warning-foreground";
      case "media": return "bg-info text-info-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Criar Tarefa com IA
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Descreva o que você precisa fazer</Label>
              <div className="relative mt-1.5">
                <Textarea
                  placeholder="Ex: Cobrar clientes em atraso, organizar fechamento do dia..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  className="min-h-[100px] pr-12"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                />
                <Button
                  type="button"
                  variant={listening ? "destructive" : "ghost"}
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8"
                  onClick={listening ? stopListening : startListening}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              {listening && (
                <p className="text-xs text-primary mt-1 animate-pulse">🎤 Ouvindo... fale agora</p>
              )}
            </div>
            <Button onClick={handleGenerate} disabled={!prompt.trim() || loading} className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Gerando..." : "Gerar Tarefa"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-accent/30 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs text-muted-foreground">Título</Label>
                  <Input value={result.titulo} onChange={e => setResult({ ...result, titulo: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Textarea value={result.descricao} onChange={e => setResult({ ...result, descricao: e.target.value })} className="mt-1" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={prioridadeColor(result.prioridade)}>
                  {result.prioridade}
                </Badge>
                <Badge variant="outline">{result.tipoOperacional}</Badge>
                {result.prazoSugerido && <Badge variant="outline">📅 {result.prazoSugerido}</Badge>}
                {result.tags?.map(tag => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">Você pode editar os campos acima antes de criar</p>
          </div>
        )}

        <DialogFooter>
          {result && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setResult(null)} className="flex-1">Refazer</Button>
              <Button onClick={handleCreate} className="flex-1 gap-1.5">
                <Send className="h-4 w-4" />Criar Tarefa
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
