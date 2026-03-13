import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, MapPin, Package, Users } from "lucide-react";
import { PlanoCatalogo } from "@/types/parametros";

interface Props {
  planoSelecionado: PlanoCatalogo | null;
  planos: PlanoCatalogo[];
  mensalidadeBase: number;
  distanciaKm: number;
  modulosSelecionadosCount: number;
  parceiroSelecionado: boolean;
  comissaoImplantacao: number;
  comissaoRecorrente: number;
}

interface Sugestao {
  icon: React.ReactNode;
  texto: string;
  tipo: "info" | "economia" | "alerta";
}

export function PropostaSugestoes(props: Props) {
  const sugestoes: Sugestao[] = [];

  // Suggest annual plan
  if (props.planoSelecionado) {
    const melhoresPlanos = props.planos.filter(p => p.ativo && p.descontoPercentual > (props.planoSelecionado?.descontoPercentual || 0));
    if (melhoresPlanos.length > 0) {
      const melhor = melhoresPlanos.sort((a, b) => b.descontoPercentual - a.descontoPercentual)[0];
      const economia = props.mensalidadeBase * (melhor.descontoPercentual / 100) * melhor.validadeMeses;
      sugestoes.push({
        icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
        texto: `O plano "${melhor.nomePlano}" oferece ${melhor.descontoPercentual}% de desconto — economia de R$ ${economia.toFixed(2)} no período.`,
        tipo: "economia",
      });
    }
  }

  // Distance warning
  if (props.distanciaKm > 200) {
    sugestoes.push({
      icon: <MapPin className="h-4 w-4 text-amber-500" />,
      texto: `Distância de ${props.distanciaKm}km é elevada. Considere implantação remota ou híbrida para reduzir custos.`,
      tipo: "alerta",
    });
  }

  // Module package
  if (props.modulosSelecionadosCount >= 3) {
    sugestoes.push({
      icon: <Package className="h-4 w-4 text-blue-500" />,
      texto: `${props.modulosSelecionadosCount} módulos selecionados — considere oferecer um pacote com desconto especial.`,
      tipo: "info",
    });
  }

  // Partner commission info
  if (props.parceiroSelecionado && props.comissaoImplantacao > 0) {
    sugestoes.push({
      icon: <Users className="h-4 w-4 text-violet-500" />,
      texto: `Comissão do parceiro: R$ ${props.comissaoImplantacao.toFixed(2)} (implantação)${props.comissaoRecorrente > 0 ? ` + R$ ${props.comissaoRecorrente.toFixed(2)}/mês (recorrente)` : ""}.`,
      tipo: "info",
    });
  }

  // No plan selected
  if (!props.planoSelecionado && props.mensalidadeBase > 0) {
    sugestoes.push({
      icon: <Lightbulb className="h-4 w-4 text-amber-500" />,
      texto: "Selecione um plano para aplicar descontos automáticos na mensalidade.",
      tipo: "info",
    });
  }

  if (sugestoes.length === 0) return null;

  return (
    <Card className="border-amber-200/50 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Sugestões Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sugestoes.map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <div className="mt-0.5 shrink-0">{s.icon}</div>
            <p className="text-muted-foreground">{s.texto}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
