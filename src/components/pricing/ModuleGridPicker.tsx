import { cn, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Sparkles, Check } from "lucide-react";

export interface ModulePickerItem {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  bonus?: boolean;
  includedInPlan?: boolean;
}

interface ModuleGridPickerProps {
  modules: ModulePickerItem[];
  onChange: (id: string, quantity: number) => void;
  className?: string;
  /** Permite escolher quantidade > 1. Default: true. */
  allowQuantity?: boolean;
}

export function ModuleGridPicker({
  modules,
  onChange,
  className,
  allowQuantity = true,
}: ModuleGridPickerProps) {
  if (modules.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Nenhum módulo compatível.
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {modules.map((m) => {
        const active = m.quantity > 0 || m.includedInPlan;
        const total = m.bonus || m.includedInPlan ? 0 : m.unitPrice * m.quantity;

        return (
          <Card
            key={m.id}
            className={cn(
              "p-4 flex flex-col gap-3 transition-all border-2",
              active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-foreground">{m.name}</h4>
                  {m.includedInPlan && (
                    <Badge variant="outline" className="text-[10px] py-0">
                      <Check className="w-2.5 h-2.5 mr-0.5" />
                      Incluso
                    </Badge>
                  )}
                  {m.bonus && (
                    <Badge className="text-[10px] py-0 bg-primary/15 text-primary border-primary/30">
                      <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                      Bônus
                    </Badge>
                  )}
                </div>
                {m.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground tabular-nums">
                {formatCurrency(m.unitPrice)}
              </span>
              <span className="text-[10px] text-muted-foreground">/mês por unidade</span>
            </div>

            {m.includedInPlan ? (
              <div className="text-xs text-muted-foreground">Já contemplado no plano.</div>
            ) : (
              <>
                {allowQuantity ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => onChange(m.id, Math.max(0, m.quantity - 1))}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      value={m.quantity}
                      onChange={(e) => onChange(m.id, Math.max(0, Number(e.target.value) || 0))}
                      className="h-8 text-center tabular-nums"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => onChange(m.id, m.quantity + 1)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant={m.quantity > 0 ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => onChange(m.id, m.quantity > 0 ? 0 : 1)}
                  >
                    {m.quantity > 0 ? "Remover" : "Adicionar"}
                  </Button>
                )}

                {m.quantity > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatCurrency(total)}
                    </span>
                  </div>
                )}
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
