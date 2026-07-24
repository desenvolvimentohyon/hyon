import { cn, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, TrendingDown, Package, Wrench } from "lucide-react";
import type { Quote } from "@/lib/pricing";

interface PricingSummaryProps {
  quote: Quote;
  className?: string;
  /** Mostrar setup (implantação) no resumo. */
  showSetup?: boolean;
  /** Ocultar linhas com total zero (bônus). */
  hideZeroLines?: boolean;
}

const cycleLabel = (c: Quote["cycle"]) =>
  c === "annual" ? "Anual" : c === "quarterly" ? "Trimestral" : "Mensal";

export function PricingSummary({
  quote,
  className,
  showSetup = true,
  hideZeroLines = false,
}: PricingSummaryProps) {
  const lines = hideZeroLines
    ? quote.lines.filter((l) => l.total > 0 || l.kind === "plan")
    : quote.lines;

  return (
    <Card className={cn("p-5 space-y-4 bg-card/80 backdrop-blur", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Resumo da proposta
        </h3>
        <Badge variant="outline" className="text-xs">
          {cycleLabel(quote.cycle)}
        </Badge>
      </div>

      <ul className="space-y-2 text-sm">
        {lines.length === 0 && (
          <li className="text-muted-foreground italic">
            Selecione um plano e módulos para ver o resumo.
          </li>
        )}
        {lines.map((l) => (
          <li key={l.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="truncate text-foreground">{l.label}</span>
                {l.kind === "module-bonus" && (
                  <Badge className="text-[10px] py-0 px-1.5 bg-primary/15 text-primary border-primary/30">
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                    Bônus
                  </Badge>
                )}
                {l.kind === "module-included" && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    Incluso
                  </Badge>
                )}
              </div>
              {l.quantity > 1 && (
                <span className="text-xs text-muted-foreground">
                  {l.quantity} × {formatCurrency(l.unitPrice)}
                </span>
              )}
              {l.note && l.kind !== "module-bonus" && l.kind !== "module-included" && (
                <span className="block text-xs text-muted-foreground">{l.note}</span>
              )}
            </div>
            <span
              className={cn(
                "tabular-nums text-sm font-medium",
                l.total === 0 && "text-muted-foreground line-through",
              )}
            >
              {formatCurrency(l.total)}
            </span>
          </li>
        ))}
      </ul>

      <Separator />

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(quote.subtotal)}</span>
        </div>
        {quote.applied.minValueApplied && (
          <div className="flex items-center justify-between text-primary text-xs">
            <span>Valor mínimo aplicado</span>
            <span className="tabular-nums">{formatCurrency(quote.monthlyBase)}</span>
          </div>
        )}
        {quote.applied.globalDiscountPct > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Desconto global ({quote.applied.globalDiscountPct}%)</span>
            <span className="tabular-nums">
              -{formatCurrency(quote.subtotal - quote.monthlyBase)}
            </span>
          </div>
        )}
        {quote.cycleDiscountPct > 0 && (
          <div className="flex items-center justify-between text-xs text-primary">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Desconto {cycleLabel(quote.cycle)} ({quote.cycleDiscountPct}%)
            </span>
            <span className="tabular-nums">
              -{formatCurrency(quote.monthlyBase - quote.monthlyAfterCycleDiscount)}
            </span>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Mensalidade</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatCurrency(quote.monthlyAfterCycleDiscount)}
            <span className="text-xs font-normal text-muted-foreground">/mês</span>
          </span>
        </div>
        {quote.cycleMultiplier > 1 && (
          <div className="flex items-baseline justify-between text-xs text-muted-foreground">
            <span>Cobrança {cycleLabel(quote.cycle).toLowerCase()}</span>
            <span className="tabular-nums">{formatCurrency(quote.cycleTotal)}</span>
          </div>
        )}
        {quote.savingsVsMonthly > 0 && (
          <div className="flex items-baseline justify-between text-xs text-primary">
            <span>Economia vs mensal</span>
            <span className="tabular-nums font-medium">
              {formatCurrency(quote.savingsVsMonthly)}
            </span>
          </div>
        )}
      </div>

      {showSetup && quote.setup.total > 0 && (
        <>
          <Separator />
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Wrench className="w-3.5 h-3.5" />
                Setup / Implantação
              </span>
              <span className="tabular-nums font-medium">
                {formatCurrency(quote.setup.total)}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs font-semibold text-foreground">
                Total no 1º pagamento
              </span>
              <span className="text-base font-bold text-primary tabular-nums">
                {formatCurrency(quote.firstChargeTotal)}
              </span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
