import { cn, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Building2 } from "lucide-react";
import type { QuoteSetupInput, SetupQuote } from "@/lib/pricing";

interface SetupEstimatorProps {
  value: QuoteSetupInput;
  onChange: (v: QuoteSetupInput) => void;
  quote: SetupQuote;
  className?: string;
}

export function SetupEstimator({ value, onChange, quote, className }: SetupEstimatorProps) {
  const update = (patch: Partial<QuoteSetupInput>) => onChange({ ...value, ...patch });

  return (
    <Card className={cn("p-5 space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">Estimativa de implantação</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Fórmula: (distância × custo/km) + região + (dias × diária)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Distância (km)
          </Label>
          <Input
            type="number"
            min={0}
            value={value.distanceKm ?? ""}
            onChange={(e) => update({ distanceKm: Number(e.target.value) || 0 })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Custo por km</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={value.costPerKm ?? ""}
            onChange={(e) => update({ costPerKm: Number(e.target.value) || 0 })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Dias em campo
          </Label>
          <Input
            type="number"
            min={0}
            value={value.days ?? ""}
            onChange={(e) => update({ days: Number(e.target.value) || 0 })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Diária do técnico</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={value.dailyRate ?? ""}
            onChange={(e) => update({ dailyRate: Number(e.target.value) || 0 })}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Custo fixo da região
          </Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={value.regionBase ?? ""}
            onChange={(e) => update({ regionBase: Number(e.target.value) || 0 })}
            className="mt-1"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Deslocamento</span>
          <span className="tabular-nums">{formatCurrency(quote.distance)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Região</span>
          <span className="tabular-nums">{formatCurrency(quote.region)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Mão de obra</span>
          <span className="tabular-nums">{formatCurrency(quote.labor)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total setup</span>
          <span className="tabular-nums text-primary">{formatCurrency(quote.total)}</span>
        </div>
      </div>
    </Card>
  );
}
