import { cn, formatCurrency } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import type { CycleDiscounts, QuoteCycle } from "@/lib/pricing";

interface CycleSelectorProps {
  value: QuoteCycle;
  onChange: (cycle: QuoteCycle) => void;
  /** Mensalidade base (sem desconto de ciclo). */
  monthlyBase: number;
  discounts: CycleDiscounts;
  className?: string;
}

const OPTIONS: Array<{ id: QuoteCycle; label: string; mult: number; discKey: keyof CycleDiscounts | null }> = [
  { id: "monthly", label: "Mensal", mult: 1, discKey: null },
  { id: "quarterly", label: "Trimestral", mult: 3, discKey: "quarterly" },
  { id: "annual", label: "Anual", mult: 12, discKey: "annual" },
];

export function CycleSelector({ value, onChange, monthlyBase, discounts, className }: CycleSelectorProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {OPTIONS.map((opt) => {
        const disc = opt.discKey ? discounts[opt.discKey] : 0;
        const monthly = monthlyBase * (1 - disc / 100);
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative rounded-xl border p-3 text-left transition-all",
              active
                ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]"
                : "border-border bg-card hover:border-primary/40 hover:bg-card/80",
            )}
          >
            {disc > 0 && (
              <span className="absolute -top-2 right-2 rounded-full bg-primary text-primary-foreground text-[10px] px-2 py-0.5 font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />-{disc}%
              </span>
            )}
            <div className="text-xs text-muted-foreground">{opt.label}</div>
            <div className="text-base font-bold text-foreground tabular-nums mt-0.5">
              {formatCurrency(monthly)}
              <span className="text-[10px] font-normal text-muted-foreground">/mês</span>
            </div>
            {opt.mult > 1 && (
              <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                {formatCurrency(monthly * opt.mult)} cobrança
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
