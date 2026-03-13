import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, TrendingDown } from "lucide-react";
import { PlanoCatalogo } from "@/types/parametros";
import { cn } from "@/lib/utils";

interface Props {
  planos: PlanoCatalogo[];
  mensalidadeBase: number;
  implantacaoTotal: number;
  planoSelecionadoId: string;
  onSelectPlano: (id: string) => void;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PropostaComparador({ planos, mensalidadeBase, implantacaoTotal, planoSelecionadoId, onSelectPlano }: Props) {
  if (planos.length === 0 || mensalidadeBase <= 0) return null;

  const ativos = planos.filter(p => p.ativo).sort((a, b) => a.validadeMeses - b.validadeMeses);
  if (ativos.length <= 1) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-emerald-500" />
          Comparador de Cenários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ativos.map(plano => {
            const desconto = mensalidadeBase * (plano.descontoPercentual / 100);
            const mensalidadeFinal = mensalidadeBase - desconto;
            const totalPeriodo = mensalidadeFinal * plano.validadeMeses + implantacaoTotal;
            const totalSemDesconto = mensalidadeBase * plano.validadeMeses + implantacaoTotal;
            const economiaPeriodo = totalSemDesconto - totalPeriodo;
            const isSelected = plano.id === planoSelecionadoId;

            return (
              <button
                key={plano.id}
                onClick={() => onSelectPlano(plano.id)}
                className={cn(
                  "relative rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-md",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/60 bg-card hover:border-primary/30"
                )}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 rounded-full bg-primary p-1">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <p className="font-semibold text-sm">{plano.nomePlano}</p>
                <p className="text-xs text-muted-foreground">{plano.validadeMeses} {plano.validadeMeses === 1 ? "mês" : "meses"}</p>

                <div className="mt-3 space-y-1">
                  {plano.descontoPercentual > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground line-through">{fmt(mensalidadeBase)}</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">-{plano.descontoPercentual}%</Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Mensalidade</span>
                    <span className="font-semibold text-sm text-primary">{fmt(mensalidadeFinal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total no período</span>
                    <span>{fmt(totalPeriodo)}</span>
                  </div>
                  {economiaPeriodo > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Economia</span>
                      <span>{fmt(economiaPeriodo)}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
