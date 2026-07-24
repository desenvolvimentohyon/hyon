import { cn, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

export interface PlanCompareItem {
  id: string;
  name: string;
  basePrice: number;
  minValue?: number;
  bonusCount?: number;
  recommended?: boolean;
  /** Nomes dos módulos inclusos. */
  includedModules?: string[];
  description?: string;
  ctaLabel?: string;
}

interface PlanCompareTableProps {
  plans: PlanCompareItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export function PlanCompareTable({ plans, selectedId, onSelect, className }: PlanCompareTableProps) {
  if (!plans.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Nenhum plano disponível para este sistema.
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {plans.map((p) => {
        const selected = selectedId === p.id;
        const price = Math.max(p.basePrice, p.minValue ?? 0);
        return (
          <Card
            key={p.id}
            className={cn(
              "relative p-5 flex flex-col gap-4 transition-all border-2",
              selected
                ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                : p.recommended
                  ? "border-primary/40 hover:border-primary"
                  : "border-border hover:border-primary/40",
            )}
          >
            {p.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3 fill-current" />
                  Recomendado
                </Badge>
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
              {p.description && (
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
              )}
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground tabular-nums">
                  {formatCurrency(price)}
                </span>
                <span className="text-xs text-muted-foreground">/mês</span>
              </div>
              {p.minValue && p.minValue > p.basePrice && (
                <span className="text-[10px] text-muted-foreground">
                  Mínimo garantido
                </span>
              )}
            </div>

            {p.bonusCount && p.bonusCount > 0 ? (
              <div className="text-xs text-primary flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                {p.bonusCount} módulo{p.bonusCount > 1 ? "s" : ""} bônus incluído{p.bonusCount > 1 ? "s" : ""}
              </div>
            ) : null}

            {p.includedModules && p.includedModules.length > 0 && (
              <ul className="space-y-1.5 text-sm flex-1">
                {p.includedModules.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-foreground/90">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            )}

            <Button
              type="button"
              variant={selected ? "default" : p.recommended ? "default" : "outline"}
              className="w-full"
              onClick={() => onSelect?.(p.id)}
            >
              {selected ? "Selecionado" : (p.ctaLabel ?? "Escolher plano")}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
