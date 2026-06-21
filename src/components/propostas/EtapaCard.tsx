import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, LucideIcon } from "lucide-react";

interface EtapaCardProps {
  numero: number;
  icone: LucideIcon;
  iconeCor?: string;
  titulo: string;
  descricao?: string;
  concluido?: boolean;
  obrigatorio?: boolean;
  children: React.ReactNode;
}

export function EtapaCard({
  numero,
  icone: Icon,
  iconeCor = "text-primary",
  titulo,
  descricao,
  concluido = false,
  obrigatorio = false,
  children,
}: EtapaCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        concluido
          ? "border-emerald-500/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.08)]"
          : "border-border/70 hover:border-primary/30"
      )}
    >
      {/* Barra lateral colorida */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 transition-colors",
          concluido ? "bg-emerald-500" : "bg-primary/30"
        )}
      />
      <CardHeader className="pb-2 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all",
                concluido
                  ? "bg-emerald-500 text-white"
                  : "bg-primary/10 text-primary border border-primary/20"
              )}
            >
              {concluido ? <Check className="h-4 w-4" /> : numero}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                <Icon className={cn("h-4 w-4 flex-shrink-0", iconeCor)} />
                <span className="truncate">{titulo}</span>
                {obrigatorio && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                    Obrigatório
                  </span>
                )}
              </CardTitle>
              {descricao && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {descricao}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-5 space-y-3">{children}</CardContent>
    </Card>
  );
}
