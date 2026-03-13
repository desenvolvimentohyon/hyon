import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain, AlertTriangle, AlertCircle, Lightbulb, TrendingUp,
  Shield, Target, Sparkles, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";

interface ConsultoraProps {
  sistemaValor: number;
  modulosValor: number;
  modulosCount: number;
  modulosDisponiveis: number;
  mensalidadeBase: number;
  mensalidadeFinal: number;
  implantacaoTotal: number;
  descontoPercent: number;
  comissaoImpl: number;
  comissaoRecur: number;
  distanciaKm: number;
  dias: number;
  regiaoNome: string;
  parceiroNome: string;
  planoNome: string;
  sistemaName: string;
  fluxoImplantacao: string;
  parcelasImplantacao: number;
  planosDisponiveis: { nome: string; desconto: number; meses: number }[];
}

interface AIAnalysis {
  score_fechamento: number;
  classificacao: "baixa" | "media" | "alta";
  recomendacao_principal: string;
  alertas: { tipo: "risco" | "atencao" | "oportunidade"; mensagem: string }[];
  sugestao_plano?: string | null;
  sugestao_desconto?: string | null;
  sugestao_modulos?: string | null;
  sugestao_implantacao?: string | null;
  sugestao_upsell: string[];
  sugestao_retencao: string[];
  margem_avaliacao: "baixa" | "ideal" | "alta";
  cenario_recomendado: string;
}

function calcClientScore(props: ConsultoraProps): number {
  // Margem (40%) — margem = (mensalidade - custos) / mensalidade
  const totalComissao = props.comissaoImpl + props.comissaoRecur;
  const margemRatio = props.mensalidadeFinal > 0
    ? Math.max(0, (props.mensalidadeFinal - totalComissao) / props.mensalidadeFinal)
    : 0;
  const margemScore = Math.min(100, margemRatio * 120);

  // Plano (20%)
  const planoLower = (props.planoNome || "").toLowerCase();
  let planoScore = 40;
  if (planoLower.includes("anual") || planoLower.includes("12")) planoScore = 100;
  else if (planoLower.includes("semestral") || planoLower.includes("6")) planoScore = 85;
  else if (planoLower.includes("trimestral") || planoLower.includes("3")) planoScore = 70;

  // Desconto (15%)
  let descontoScore = 100;
  if (props.descontoPercent > 20) descontoScore = 40;
  else if (props.descontoPercent > 10) descontoScore = 70;

  // Comissão (15%)
  const totalProposta = props.mensalidadeFinal + props.implantacaoTotal;
  const comissaoPct = totalProposta > 0 ? (totalComissao / totalProposta) * 100 : 0;
  let comissaoScore = 100;
  if (comissaoPct > 25) comissaoScore = 30;
  else if (comissaoPct > 15) comissaoScore = 60;

  // Módulos (10%)
  const modulosPct = props.modulosDisponiveis > 0
    ? (props.modulosCount / props.modulosDisponiveis) * 100
    : 50;
  const modulosScore = Math.min(100, modulosPct * 1.2);

  return Math.round(
    margemScore * 0.4 + planoScore * 0.2 + descontoScore * 0.15 +
    comissaoScore * 0.15 + modulosScore * 0.1
  );
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

function getScoreBg(score: number) {
  if (score >= 70) return "bg-emerald-500/10 border-emerald-500/30";
  if (score >= 40) return "bg-amber-500/10 border-amber-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function getScoreLabel(score: number) {
  if (score >= 70) return "Alta chance";
  if (score >= 40) return "Média chance";
  return "Baixa chance";
}

function getAlertIcon(tipo: string) {
  if (tipo === "risco") return <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  if (tipo === "atencao") return <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  return <Lightbulb className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
}

function getAlertBg(tipo: string) {
  if (tipo === "risco") return "bg-red-500/5 border-red-500/20";
  if (tipo === "atencao") return "bg-amber-500/5 border-amber-500/20";
  return "bg-blue-500/5 border-blue-500/20";
}

// Client-side smart alerts
function getClientAlerts(props: ConsultoraProps): { tipo: "risco" | "atencao" | "oportunidade"; mensagem: string }[] {
  const alerts: { tipo: "risco" | "atencao" | "oportunidade"; mensagem: string }[] = [];

  if (props.descontoPercent > 20) {
    alerts.push({ tipo: "risco", mensagem: "Desconto acima de 20% pode comprometer a margem." });
  }

  const totalProposta = props.mensalidadeFinal + props.implantacaoTotal;
  const totalComissao = props.comissaoImpl + props.comissaoRecur;
  if (totalProposta > 0 && (totalComissao / totalProposta) > 0.25) {
    alerts.push({ tipo: "risco", mensagem: "Comissão do parceiro está acima de 25% do valor total." });
  }

  if (props.distanciaKm > 200) {
    alerts.push({ tipo: "atencao", mensagem: "Distância elevada — considere implantação remota ou híbrida." });
  }

  if (props.modulosDisponiveis > 0 && props.modulosCount < props.modulosDisponiveis * 0.5) {
    alerts.push({ tipo: "oportunidade", mensagem: "Menos da metade dos módulos selecionados — oportunidade de upsell." });
  }

  const planoLower = (props.planoNome || "").toLowerCase();
  if (!planoLower.includes("anual") && !planoLower.includes("12") && props.mensalidadeFinal > 200) {
    alerts.push({ tipo: "oportunidade", mensagem: "Plano anual pode aumentar retenção e previsibilidade de receita." });
  }

  if (props.implantacaoTotal > 0 && props.implantacaoTotal < 100) {
    alerts.push({ tipo: "atencao", mensagem: "Valor de implantação muito baixo — verifique se cobre os custos." });
  }

  return alerts;
}

export function ConsultoraComercialIA(props: ConsultoraProps) {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const clientScore = useMemo(() => calcClientScore(props), [props]);
  const clientAlerts = useMemo(() => getClientAlerts(props), [props]);

  const handleConsultar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-consultant", {
        body: {
          sistemaName: props.sistemaName,
          sistemaValor: props.sistemaValor,
          modulosCount: props.modulosCount,
          modulosValor: props.modulosValor,
          modulosDisponiveis: props.modulosDisponiveis,
          planoNome: props.planoNome,
          descontoPercent: props.descontoPercent,
          mensalidadeBase: props.mensalidadeBase,
          mensalidadeFinal: props.mensalidadeFinal,
          implantacaoTotal: props.implantacaoTotal,
          distanciaKm: props.distanciaKm,
          dias: props.dias,
          regiaoNome: props.regiaoNome,
          parceiroNome: props.parceiroNome,
          comissaoImpl: props.comissaoImpl,
          comissaoRecur: props.comissaoRecur,
          fluxoImplantacao: props.fluxoImplantacao,
          parcelasImplantacao: props.parcelasImplantacao,
          planosDisponiveis: props.planosDisponiveis,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setAiAnalysis(data as AIAnalysis);
    } catch (e: any) {
      console.error("AI consultant error:", e);
      toast.error("Erro ao consultar IA. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [props]);

  const displayAlerts = aiAnalysis?.alertas?.length ? aiAnalysis.alertas : clientAlerts;
  const displayScore = aiAnalysis?.score_fechamento ?? clientScore;

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Consultora Comercial IA
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3">
          {/* Score Gauge */}
          <div className={`rounded-lg border p-3 text-center ${getScoreBg(displayScore)}`}>
            <p className="text-xs text-muted-foreground mb-1">Score de Fechamento</p>
            <p className={`text-3xl font-bold ${getScoreColor(displayScore)}`}>{displayScore}</p>
            <Badge variant="outline" className={`mt-1 text-xs ${getScoreColor(displayScore)}`}>
              {aiAnalysis ? aiAnalysis.classificacao === "alta" ? "Alta chance" : aiAnalysis.classificacao === "media" ? "Média chance" : "Baixa chance" : getScoreLabel(displayScore)}
            </Badge>
          </div>

          {/* AI Recommendation */}
          {aiAnalysis?.recomendacao_principal && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
              <p className="text-xs font-medium text-primary flex items-center gap-1 mb-1">
                <Target className="h-3 w-3" /> Recomendação Principal
              </p>
              <p className="text-xs text-foreground">{aiAnalysis.recomendacao_principal}</p>
            </div>
          )}

          {/* Margin Assessment */}
          {aiAnalysis?.margem_avaliacao && (
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Margem:</span>
              <Badge variant="outline" className={`text-xs ${
                aiAnalysis.margem_avaliacao === "ideal" ? "text-emerald-500 border-emerald-500/30" :
                aiAnalysis.margem_avaliacao === "alta" ? "text-blue-500 border-blue-500/30" :
                "text-red-500 border-red-500/30"
              }`}>
                {aiAnalysis.margem_avaliacao === "ideal" ? "Ideal" : aiAnalysis.margem_avaliacao === "alta" ? "Alta" : "Baixa"}
              </Badge>
            </div>
          )}

          {/* Alerts */}
          {displayAlerts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Alertas</p>
              {displayAlerts.map((a, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-md border p-2 ${getAlertBg(a.tipo)}`}>
                  {getAlertIcon(a.tipo)}
                  <p className="text-xs text-foreground leading-relaxed">{a.mensagem}</p>
                </div>
              ))}
            </div>
          )}

          {/* AI Suggestions */}
          {aiAnalysis && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Sugestões da IA</p>
                {aiAnalysis.sugestao_plano && (
                  <SuggestionCard icon={<Target className="h-3 w-3 text-blue-500" />} title="Plano" text={aiAnalysis.sugestao_plano} />
                )}
                {aiAnalysis.sugestao_desconto && (
                  <SuggestionCard icon={<TrendingUp className="h-3 w-3 text-emerald-500" />} title="Desconto" text={aiAnalysis.sugestao_desconto} />
                )}
                {aiAnalysis.sugestao_modulos && (
                  <SuggestionCard icon={<Sparkles className="h-3 w-3 text-violet-500" />} title="Módulos" text={aiAnalysis.sugestao_modulos} />
                )}
                {aiAnalysis.sugestao_implantacao && (
                  <SuggestionCard icon={<Shield className="h-3 w-3 text-amber-500" />} title="Implantação" text={aiAnalysis.sugestao_implantacao} />
                )}
              </div>
            </>
          )}

          {/* Upsell */}
          {aiAnalysis?.sugestao_upsell?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Oportunidades de Upsell
              </p>
              {aiAnalysis.sugestao_upsell.map((s, i) => (
                <p key={i} className="text-xs text-muted-foreground pl-4">• {s}</p>
              ))}
            </div>
          )}

          {/* Retention */}
          {aiAnalysis?.sugestao_retencao?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Sugestões de Retenção
              </p>
              {aiAnalysis.sugestao_retencao.map((s, i) => (
                <p key={i} className="text-xs text-muted-foreground pl-4">• {s}</p>
              ))}
            </div>
          )}

          {/* Recommended Scenario */}
          {aiAnalysis?.cenario_recomendado && (
            <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-2.5">
              <p className="text-xs font-medium text-blue-600 flex items-center gap-1 mb-1">
                <Sparkles className="h-3 w-3" /> Cenário Recomendado
              </p>
              <p className="text-xs text-foreground">{aiAnalysis.cenario_recomendado}</p>
            </div>
          )}

          {/* CTA Button */}
          <Button
            onClick={handleConsultar}
            disabled={loading}
            size="sm"
            className="w-full gap-1.5"
            variant={aiAnalysis ? "outline" : "default"}
          >
            {loading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analisando...</>
            ) : (
              <><Brain className="h-3.5 w-3.5" /> {aiAnalysis ? "Consultar novamente" : "Consultar IA"}</>
            )}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

function SuggestionCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-md border border-border/60 p-2">
      <p className="text-xs font-medium flex items-center gap-1 mb-0.5">{icon} {title}</p>
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
