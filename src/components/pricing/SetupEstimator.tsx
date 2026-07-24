import { cn, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, Building2, Layers, Sparkles } from "lucide-react";
import type { QuoteSetupInput, SetupQuote, SystemSetupPricing } from "@/lib/pricing";

interface SetupEstimatorProps {
  value: QuoteSetupInput;
  onChange: (v: QuoteSetupInput) => void;
  quote: SetupQuote;
  className?: string;
  /** Lista opcional de sistemas com precificação de implantação. */
  systems?: SystemSetupPricing[];
  /** Sistema atualmente selecionado (id). */
  selectedSystemId?: string | null;
  onSystemChange?: (systemId: string | null) => void;
}

export function SetupEstimator({
  value,
  onChange,
  quote,
  className,
  systems,
  selectedSystemId,
  onSystemChange,
}: SetupEstimatorProps) {
  const update = (patch: Partial<QuoteSetupInput>) => onChange({ ...value, ...patch });
  const selectedSystem = systems?.find((s) => s.systemId === selectedSystemId) ?? null;
  const overrideActive = !!selectedSystem?.override;

  return (
    <Card className={cn("p-5 space-y-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Estimativa de implantação</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fórmula: (distância × custo/km) + região + (dias × diária) + taxa do sistema
          </p>
        </div>
        {overrideActive && (
          <Badge variant="secondary" className="gap-1 whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            Preço do sistema
          </Badge>
        )}
      </div>

      {systems && systems.length > 0 && onSystemChange && (
        <div>
          <Label className="text-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Sistema
          </Label>
          <Select
            value={selectedSystemId ?? "none"}
            onValueChange={(v) => onSystemChange(v === "none" ? null : v)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione um sistema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem sistema (usar padrões da empresa)</SelectItem>
              {systems.map((s) => (
                <SelectItem key={s.systemId} value={s.systemId}>
                  {s.systemName}
                  {s.override ? " • preço próprio" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
        <div>
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
        <div>
          <Label className="text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Taxa do sistema
          </Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={value.systemFee ?? ""}
            onChange={(e) => update({ systemFee: Number(e.target.value) || 0 })}
            className="mt-1"
            disabled={!overrideActive && !!selectedSystem}
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
        {quote.systemFee > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Taxa do sistema{quote.systemLabel ? ` (${quote.systemLabel})` : ""}</span>
            <span className="tabular-nums">{formatCurrency(quote.systemFee)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total setup</span>
          <span className="tabular-nums text-primary">{formatCurrency(quote.total)}</span>
        </div>
      </div>
    </Card>
  );
}
