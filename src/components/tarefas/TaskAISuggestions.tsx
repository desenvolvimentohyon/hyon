import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Sparkles, ChevronDown, ChevronUp, Plus, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SuggestionItem {
  titulo: string;
  descricao: string;
  prioridade: string;
  tipoOperacional: string;
  tags?: string[];
}

interface TaskAISuggestionsProps {
  compact?: boolean;
  onCreateTask?: (task: SuggestionItem) => void;
  onNavigate?: () => void;
}

export function TaskAISuggestions({ compact, onCreateTask, onNavigate }: TaskAISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Gather system context
      const [clientsRes, titlesRes] = await Promise.all([
        supabase.from("clients").select("id, name, status, monthly_value_final").eq("status", "ativo").limit(50),
        supabase.from("financial_titles").select("id, description, due_at, status, value_final, client_id").eq("status", "aberto").eq("type", "receber").limit(30),
      ]);

      const overdueTitles = (titlesRes.data || []).filter(t => t.due_at && new Date(t.due_at) < new Date());
      const upcomingTitles = (titlesRes.data || []).filter(t => {
        if (!t.due_at) return false;
        const d = new Date(t.due_at);
        const now = new Date();
        return d >= now && d <= new Date(now.getTime() + 3 * 86400000);
      });

      const context = {
        totalClientes: clientsRes.data?.length || 0,
        titulosVencidos: overdueTitles.length,
        valorTotalVencido: overdueTitles.reduce((s, t) => s + Number(t.value_final), 0),
        titulosVencendo3dias: upcomingTitles.length,
        valorVencendo: upcomingTitles.reduce((s, t) => s + Number(t.value_final), 0),
      };

      const { data, error } = await supabase.functions.invoke("ai-task-assistant", {
        body: { type: "suggest", context },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      setSuggestions(data.result?.suggestions || []);
      setLoaded(true);
    } catch (e: any) {
      toast.error(e.message || "Erro ao buscar sugestões");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded) fetchSuggestions();
  };

  const displayItems = compact ? suggestions.slice(0, 3) : suggestions;

  const prioridadeColor = (p: string) => {
    switch (p) {
      case "urgente": return "bg-destructive text-destructive-foreground";
      case "alta": return "bg-warning text-warning-foreground";
      case "media": return "bg-info text-info-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (compact) {
    return (
      <Card className="neon-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />Sugestões da IA
            </CardTitle>
            <div className="flex gap-1">
              {!loaded && (
                <Button variant="ghost" size="sm" className="text-[11px] h-7 gap-1" onClick={fetchSuggestions} disabled={loading}>
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  Carregar
                </Button>
              )}
              {onNavigate && <Button variant="ghost" size="sm" className="text-[11px] h-7" onClick={onNavigate}>Ver mais</Button>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!loaded && !loading && <p className="text-muted-foreground text-sm text-center py-4">Clique em "Carregar" para ver sugestões</p>}
          {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
          {loaded && displayItems.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Nenhuma sugestão no momento</p>}
          {displayItems.length > 0 && (
            <div className="space-y-1.5">
              {displayItems.map((s, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
                  <Badge className={`text-[9px] shrink-0 ${prioridadeColor(s.prioridade)}`}>{s.prioridade}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{s.titulo}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{s.descricao}</p>
                  </div>
                  {onCreateTask && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onCreateTask(s)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={handleToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Sugestões da IA
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {loading && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
        {loaded && suggestions.length === 0 && <p className="text-muted-foreground text-sm py-2">Nenhuma sugestão no momento</p>}
        {suggestions.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            {suggestions.map((s, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{s.titulo}</p>
                    <Badge className={`text-[9px] shrink-0 ${prioridadeColor(s.prioridade)}`}>{s.prioridade}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.descricao}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px]">{s.tipoOperacional}</Badge>
                    {onCreateTask && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => onCreateTask(s)}>
                        <Plus className="h-3 w-3" />Criar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
