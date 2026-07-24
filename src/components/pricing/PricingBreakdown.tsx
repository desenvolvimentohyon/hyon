import { cn, formatCurrency } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { Quote } from "@/lib/pricing";

interface PricingBreakdownProps {
  quote: Quote;
  className?: string;
}

const cycleLabel = (c: Quote["cycle"]) =>
  c === "annual" ? "Anual" : c === "quarterly" ? "Trimestral" : "Mensal";

export function PricingBreakdown({ quote, className }: PricingBreakdownProps) {
  return (
    <Accordion type="single" collapsible className={cn("w-full", className)}>
      <AccordionItem value="details" className="border rounded-lg px-4">
        <AccordionTrigger className="text-sm font-medium">
          Ver detalhamento do cálculo
        </AccordionTrigger>
        <AccordionContent className="space-y-3 text-sm pt-2">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Itens</h4>
            <ul className="space-y-1.5">
              {quote.lines.map((l) => (
                <li key={l.id} className="flex justify-between items-start gap-2">
                  <span className="flex items-center gap-2 flex-wrap">
                    {l.label}
                    {l.kind === "module-bonus" && (
                      <Badge className="text-[10px] py-0 bg-primary/15 text-primary border-primary/30">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                        Bônus
                      </Badge>
                    )}
                    {l.kind === "module-included" && (
                      <Badge variant="outline" className="text-[10px] py-0">
                        Incluso
                      </Badge>
                    )}
                    {l.quantity > 1 && (
                      <span className="text-xs text-muted-foreground">
                        ({l.quantity} × {formatCurrency(l.unitPrice)})
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "tabular-nums font-medium",
                      l.total === 0 && "text-muted-foreground line-through",
                    )}
                  >
                    {formatCurrency(l.total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-3 space-y-1.5">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal dos itens</span>
              <span className="tabular-nums">{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.applied.minValueApplied && (
              <div className="flex justify-between text-primary">
                <span>Valor mínimo do plano</span>
                <span className="tabular-nums">{formatCurrency(quote.monthlyBase)}</span>
              </div>
            )}
            {quote.applied.globalDiscountPct > 0 && (
              <div className="flex justify-between">
                <span>Desconto global ({quote.applied.globalDiscountPct}%)</span>
                <span className="tabular-nums">
                  -{formatCurrency(quote.subtotal - quote.monthlyBase)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span>Mensalidade base</span>
              <span className="tabular-nums">{formatCurrency(quote.monthlyBase)}</span>
            </div>
            {quote.cycleDiscountPct > 0 && (
              <div className="flex justify-between text-primary">
                <span>
                  Desconto {cycleLabel(quote.cycle).toLowerCase()} ({quote.cycleDiscountPct}%)
                </span>
                <span className="tabular-nums">
                  -{formatCurrency(quote.monthlyBase - quote.monthlyAfterCycleDiscount)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Mensalidade final</span>
              <span className="tabular-nums">
                {formatCurrency(quote.monthlyAfterCycleDiscount)}
              </span>
            </div>
            {quote.cycleMultiplier > 1 && (
              <div className="flex justify-between text-muted-foreground">
                <span>× {quote.cycleMultiplier} meses de cobrança</span>
                <span className="tabular-nums">{formatCurrency(quote.cycleTotal)}</span>
              </div>
            )}
          </div>

          {quote.setup.total > 0 && (
            <div className="border-t pt-3 space-y-1.5">
              <h4 className="font-semibold text-foreground">Implantação</h4>
              <div className="flex justify-between text-muted-foreground">
                <span>Deslocamento</span>
                <span className="tabular-nums">{formatCurrency(quote.setup.distance)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Região</span>
                <span className="tabular-nums">{formatCurrency(quote.setup.region)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Mão de obra</span>
                <span className="tabular-nums">{formatCurrency(quote.setup.labor)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total setup</span>
                <span className="tabular-nums">{formatCurrency(quote.setup.total)}</span>
              </div>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between font-bold text-base">
            <span>Total no 1º pagamento</span>
            <span className="tabular-nums text-primary">
              {formatCurrency(quote.firstChargeTotal)}
            </span>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
